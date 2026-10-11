// Accounts, devices, and pairing routes (phone + tablet).
// Phone requests use requireAuth (Supabase user token, Authorization: Bearer).
// Tablet requests use requireDevice (device token, X-Device-Token header).
import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "./db";
import { requireAuth } from "./auth";
import {
  devices, pairingCodes,
  deviceSettings, deviceOnboarding, deviceFavorites, devicePreferences,
} from "@shared/authSchema";

// Full config for a device (by internal uuid). Shape mirrors the kiosk's needs.
async function loadDeviceConfig(deviceUuid: string) {
  const [dev] = await db.select().from(devices).where(eq(devices.id, deviceUuid)).limit(1);
  if (!dev) return null;
  const [settings] = await db.select().from(deviceSettings).where(eq(deviceSettings.deviceId, deviceUuid)).limit(1);
  const [onboarding] = await db.select().from(deviceOnboarding).where(eq(deviceOnboarding.deviceId, deviceUuid)).limit(1);
  const favorites = await db
    .select({ line: deviceFavorites.line, stop: deviceFavorites.stop, direction: deviceFavorites.direction, position: deviceFavorites.position })
    .from(deviceFavorites).where(eq(deviceFavorites.deviceId, deviceUuid)).orderBy(deviceFavorites.position);
  const preferences = await db
    .select({ row: devicePreferences.row, line: devicePreferences.line, stop: devicePreferences.stop, direction: devicePreferences.direction })
    .from(devicePreferences).where(eq(devicePreferences.deviceId, deviceUuid)).orderBy(devicePreferences.row);
  return {
    device: { id: dev.id, deviceId: dev.deviceId, name: dev.name, pairedAt: dev.pairedAt },
    configVersion: dev.configVersion,
    settings: settings
      ? { temperatureUnit: settings.temperatureUnit, clockFormat: settings.clockFormat, transportRows: settings.transportRows }
      : null,
    onboarding: onboarding
      ? { locationType: onboarding.locationType, otherLabel: onboarding.otherLabel, address: onboarding.address, lat: onboarding.lat, lon: onboarding.lon, modes: onboarding.modes, completedAt: onboarding.completedAt }
      : null,
    favorites,
    preferences,
  };
}

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

// Pairing codes: 6-digit numeric (easy to read/type), single-use, 10-min TTL.
const genCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
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

  // Poll ownership + config version (device-token auth). The tablet waits here
  // until it's claimed, then re-fetches config whenever configVersion changes.
  app.get("/api/device/state", requireDevice, (req, res) => {
    res.json({
      deviceId: req.device!.deviceId,
      name: req.device!.name,
      paired: !!req.device!.accountId,
      configVersion: req.device!.configVersion,
    });
  });

  // Tablet reads its own full config (device-token auth).
  app.get("/api/device/config", requireDevice, async (req, res) => {
    res.json(await loadDeviceConfig(req.device!.id));
  });

  // ---- Config read/write for a device the signed-in user owns ----

  // Resolve a device the account owns, else 404 (don't leak existence).
  const ownedDevice = async (req: Request, res: Response) => {
    const [dev] = await db.select().from(devices).where(eq(devices.id, req.params.id)).limit(1);
    if (!dev || dev.accountId !== req.account!.id) {
      res.status(404).json({ error: "Device not found" });
      return null;
    }
    return dev;
  };

  app.get("/api/devices/:id/config", requireAuth, async (req, res) => {
    const dev = await ownedDevice(req, res);
    if (!dev) return;
    res.json(await loadDeviceConfig(dev.id));
  });

  // Partial write: any of { name, settings, onboarding, favorites, preferences }.
  // settings/onboarding merge (only provided fields change); favorites/preferences
  // replace the whole list. Bumps configVersion so the tablet re-fetches.
  app.put("/api/devices/:id/config", requireAuth, async (req, res) => {
    const dev = await ownedDevice(req, res);
    if (!dev) return;
    const { name, settings, onboarding, favorites, preferences } = req.body || {};
    try {
      await db.transaction(async (tx) => {
        if (name !== undefined) {
          await tx.update(devices).set({ name: String(name).trim() || null }).where(eq(devices.id, dev.id));
        }
        if (settings && typeof settings === "object") {
          const set: Record<string, any> = {};
          for (const k of ["temperatureUnit", "clockFormat", "transportRows"] as const) {
            if (settings[k] !== undefined) set[k] = settings[k];
          }
          if (Object.keys(set).length) {
            await tx.insert(deviceSettings).values({ deviceId: dev.id, ...set })
              .onConflictDoUpdate({ target: deviceSettings.deviceId, set: { ...set, updatedAt: new Date() } });
          }
        }
        if (onboarding && typeof onboarding === "object") {
          const set: Record<string, any> = {};
          for (const k of ["locationType", "otherLabel", "address", "lat", "lon", "modes"] as const) {
            if (onboarding[k] !== undefined) set[k] = onboarding[k];
          }
          if (onboarding.completedAt !== undefined) set.completedAt = onboarding.completedAt ? new Date(onboarding.completedAt) : null;
          if (Object.keys(set).length) {
            await tx.insert(deviceOnboarding).values({ deviceId: dev.id, ...set })
              .onConflictDoUpdate({ target: deviceOnboarding.deviceId, set: { ...set, updatedAt: new Date() } });
          }
        }
        if (Array.isArray(favorites)) {
          await tx.delete(deviceFavorites).where(eq(deviceFavorites.deviceId, dev.id));
          if (favorites.length) {
            await tx.insert(deviceFavorites).values(favorites.map((f: any, i: number) => ({
              deviceId: dev.id, line: f.line, stop: f.stop, direction: f.direction, position: f.position ?? i,
            })));
          }
        }
        if (Array.isArray(preferences)) {
          await tx.delete(devicePreferences).where(eq(devicePreferences.deviceId, dev.id));
          if (preferences.length) {
            await tx.insert(devicePreferences).values(preferences.map((p: any) => ({
              deviceId: dev.id, row: p.row, line: p.line, stop: p.stop, direction: p.direction,
            })));
          }
        }
        await tx.update(devices).set({ configVersion: sql`${devices.configVersion} + 1` }).where(eq(devices.id, dev.id));
      });
      res.json(await loadDeviceConfig(dev.id));
    } catch (e) {
      console.error("[config put] error:", e);
      res.status(500).json({ error: "Save failed" });
    }
  });
}
