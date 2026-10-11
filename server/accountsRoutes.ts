// Accounts, devices, and pairing routes (phone + tablet).
// Phone requests use requireAuth (Supabase user token, Authorization: Bearer).
// Tablet requests use requireDevice (device token, X-Device-Token header).
import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "./db";
import { requireAuth } from "./auth";
import { devices, pairingCodes } from "@shared/authSchema";

// --- tablet auth: a device presents its token ---
export async function requireDevice(req: Request, res: Response, next: NextFunction) {
  try {
    const token = (req.header("x-device-token") || "").trim();
    if (!token) return res.status(401).json({ error: "Missing device token" });
    const rows = await db.select().from(devices).where(eq(devices.deviceToken, token)).limit(1);
    if (!rows[0]) return res.status(401).json({ error: "Unknown device" });
    req.device = rows[0];
    // best-effort last-seen touch
    db.update(devices).set({ lastSeenAt: new Date() }).where(eq(devices.id, rows[0].id)).catch(() => {});
    next();
  } catch (e) {
    console.error("[device-auth] error:", e);
    res.status(500).json({ error: "Device auth failed" });
  }
}

// Pairing codes: short, unambiguous (no 0/O/1/I/L), single-use, 10-min TTL.
const PAIR_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const genCode = (n = 6) =>
  Array.from({ length: n }, () => PAIR_ALPHABET[crypto.randomInt(PAIR_ALPHABET.length)]).join("");
const genDeviceToken = () => crypto.randomBytes(32).toString("base64url");
const PAIR_TTL_MS = 10 * 60 * 1000;

export function registerAccountRoutes(app: Express) {
  // ---- Phone (Supabase-authenticated) ----

  // Who am I (creates the account on first sign-in).
  app.get("/api/me", requireAuth, (req, res) => res.json({ account: req.account }));

  // My paired devices.
  app.get("/api/me/devices", requireAuth, async (req, res) => {
    const rows = await db
      .select({
        id: devices.id, deviceId: devices.deviceId, name: devices.name,
        pairedAt: devices.pairedAt, lastSeenAt: devices.lastSeenAt,
      })
      .from(devices)
      .where(eq(devices.accountId, req.account!.id));
    res.json({ devices: rows });
  });

  // Claim a pairing code shown on a tablet → bind that device to my account.
  app.post("/api/pair", requireAuth, async (req, res) => {
    const code = String(req.body?.code || "").trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "code required" });
    const name = String(req.body?.name || "").trim() || null;
    try {
      const result = await db.transaction(async (tx) => {
        // Atomically consume the code only if valid (unused + unexpired).
        const claimed = await tx
          .update(pairingCodes)
          .set({ consumedAt: new Date() })
          .where(and(eq(pairingCodes.code, code), isNull(pairingCodes.consumedAt), gt(pairingCodes.expiresAt, new Date())))
          .returning({ deviceId: pairingCodes.deviceId });
        if (!claimed[0]) return { ok: false as const };
        const [device] = await tx
          .update(devices)
          .set({ accountId: req.account!.id, name: name ?? undefined, pairedAt: new Date() })
          .where(eq(devices.id, claimed[0].deviceId))
          .returning({ id: devices.id, deviceId: devices.deviceId, name: devices.name });
        return { ok: true as const, device };
      });
      if (!result.ok) return res.status(400).json({ error: "Invalid, expired, or already-used code" });
      res.json({ paired: true, device: result.device });
    } catch (e) {
      console.error("[pair] error:", e);
      res.status(500).json({ error: "Pairing failed" });
    }
  });

  // ---- Tablet ----

  // Register on first boot. Idempotent: issues a device token only on creation
  // (re-registering an existing deviceId does not re-expose the token).
  app.post("/api/devices/register", async (req, res) => {
    const deviceId = String(req.body?.deviceId || "").trim();
    if (!deviceId) return res.status(400).json({ error: "deviceId required" });
    const existing = await db.select().from(devices).where(eq(devices.deviceId, deviceId)).limit(1);
    if (existing[0]) {
      return res.json({ deviceId, registered: true, paired: !!existing[0].accountId });
    }
    const deviceToken = genDeviceToken();
    await db.insert(devices).values({ deviceId, deviceToken });
    res.json({ deviceId, deviceToken, registered: true, paired: false });
  });

  // Request a fresh pairing code to display (device-token auth). One active code
  // per device — old codes are cleared first.
  app.post("/api/devices/pairing-code", requireDevice, async (req, res) => {
    await db.delete(pairingCodes).where(eq(pairingCodes.deviceId, req.device!.id));
    let code = genCode();
    for (let i = 0; i < 5; i++) {
      const clash = await db.select().from(pairingCodes).where(eq(pairingCodes.code, code)).limit(1);
      if (!clash[0]) break;
      code = genCode();
    }
    const expiresAt = new Date(Date.now() + PAIR_TTL_MS);
    await db.insert(pairingCodes).values({ code, deviceId: req.device!.id, expiresAt });
    res.json({ code, expiresAt });
  });

  // Poll ownership state (device-token auth) — the tablet waits here until a
  // phone claims it, then advances past the pairing screen.
  app.get("/api/device/state", requireDevice, (req, res) => {
    res.json({ deviceId: req.device!.deviceId, name: req.device!.name, paired: !!req.device!.accountId });
  });
}
