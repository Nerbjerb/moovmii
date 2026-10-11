// Neon (Postgres) connection for the accounts/devices data.
// Uses the WebSocket pool so multi-statement transactions work (e.g. pairing).
// Not yet wired into the running app — the kiosk still uses FileStorage/localStorage
// until a later phase flips config reads over to this.
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as kioskSchema from "@shared/schema";
import * as authSchema from "@shared/authSchema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — the Neon database must be provisioned");
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema: { ...kioskSchema, ...authSchema } });
