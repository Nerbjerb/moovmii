// User auth for the phone (mobile web). The phone sends the Supabase access
// token as `Authorization: Bearer <token>`. We verify it with Supabase, then
// resolve (or create) the matching moovmii account in Neon and attach it to the
// request. The tablet does NOT use this — it authenticates with a device token
// (added in Phase 3).
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { supabase } from "./supabase";
import { accounts, type Account } from "@shared/authSchema";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      account?: Account;
    }
  }
}

// Resolve the moovmii account for a verified Supabase user, creating it on first
// sign-in. Keyed by the Supabase user id (Supabase handles Google/Apple linking).
export async function resolveAccount(supabaseUser: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, any>;
}): Promise<Account> {
  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.supabaseUserId, supabaseUser.id))
    .limit(1);
  if (existing[0]) return existing[0];

  const name =
    supabaseUser.user_metadata?.full_name ??
    supabaseUser.user_metadata?.name ??
    null;
  const [created] = await db
    .insert(accounts)
    .values({ supabaseUserId: supabaseUser.id, email: supabaseUser.email ?? null, name })
    .returning();
  return created;
}

// Express middleware: require a valid Supabase user token; attach req.account.
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return res.status(401).json({ error: "Missing bearer token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid or expired token" });

    req.account = await resolveAccount(data.user as any);
    next();
  } catch (e) {
    console.error("[auth] error:", e);
    res.status(500).json({ error: "Auth check failed" });
  }
}
