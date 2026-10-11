import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, real, jsonb, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Accounts & devices schema for the mobile setup experience.
// Supabase proves identity (SSO); this schema (in Neon) holds all app data.
// Additive — the existing kiosk tables in schema.ts are untouched, and the
// current localStorage kiosk keeps running until a later phase flips it over.

// A moovmii user account. Identity is proven by SSO (see `identities`); this
// row owns devices and their config.
export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // The Supabase user id (UUID). Supabase owns identity + provider linking
  // (Google/Apple → one Supabase user); this is our stable link to it.
  supabaseUserId: text("supabase_user_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// One row per SSO login linked to an account. A user who signs in with both
// Google and Apple has two identities pointing at the same account.
// Keyed by (provider, subject) — the OIDC `sub`, stable forever (never email).
export const identities = pgTable("identities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  accountId: varchar("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),   // "google" | "apple"
  subject: text("subject").notNull(),     // OIDC sub
  email: text("email"),                   // for display/linking only
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  providerSubjectUnique: uniqueIndex("identities_provider_subject_unique").on(t.provider, t.subject),
}));

// A physical tablet. Authenticates to the API as a *device* via deviceToken
// (never a user login), and reads only its own config. owner is null until
// the tablet is paired to an account.
export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: text("device_id").notNull().unique(),          // stable tablet id (== kioskId today)
  accountId: varchar("account_id").references(() => accounts.id, { onDelete: "set null" }),
  name: text("name"),                                      // user label, e.g. "Front Counter"
  deviceToken: text("device_token").notNull().unique(),    // secret, revocable on loss/transfer
  configVersion: integer("config_version").notNull().default(0), // bumped on any config write; tablet polls this
  pairedAt: timestamp("paired_at", { withTimezone: true }),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Short-lived pairing codes shown on the tablet (and encoded in its QR),
// claimed by the signed-in phone to bind the device to an account.
export const pairingCodes = pgTable("pairing_codes", {
  code: varchar("code").primaryKey(),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// --- Per-device config (mirrors today's kiosk localStorage shapes) ---

export const deviceSettings = pgTable("device_settings", {
  deviceId: varchar("device_id").primaryKey().references(() => devices.id, { onDelete: "cascade" }),
  temperatureUnit: text("temperature_unit").notNull().default("fahrenheit"),
  clockFormat: text("clock_format").notNull().default("12hr"),
  transportRows: integer("transport_rows").notNull().default(2),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const deviceOnboarding = pgTable("device_onboarding", {
  deviceId: varchar("device_id").primaryKey().references(() => devices.id, { onDelete: "cascade" }),
  locationType: text("location_type"),
  otherLabel: text("other_label"),
  address: text("address"),
  lat: real("lat"),
  lon: real("lon"),
  modes: jsonb("modes").$type<string[]>(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Favorites pool per device; `position` preserves the order the user picked.
export const deviceFavorites = pgTable("device_favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  line: text("line").notNull(),
  stop: text("stop").notNull(),
  direction: text("direction").notNull(),
  position: integer("position").notNull().default(0),
}, (t) => ({
  deviceFavUnique: uniqueIndex("device_favorites_unique").on(t.deviceId, t.line, t.stop, t.direction),
}));

// The rows actually displayed on the kiosk (one per row slot).
export const devicePreferences = pgTable("device_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  row: integer("row").notNull(),
  line: text("line").notNull(),
  stop: text("stop").notNull(),
  direction: text("direction").notNull(),
}, (t) => ({
  devicePrefRowUnique: uniqueIndex("device_preferences_row_unique").on(t.deviceId, t.row),
}));

// Convenience row types
export type Account = typeof accounts.$inferSelect;
export type Identity = typeof identities.$inferSelect;
export type Device = typeof devices.$inferSelect;
export type PairingCode = typeof pairingCodes.$inferSelect;
export type DeviceSettings = typeof deviceSettings.$inferSelect;
export type DeviceOnboarding = typeof deviceOnboarding.$inferSelect;
export type DeviceFavorite = typeof deviceFavorites.$inferSelect;
export type DevicePreference = typeof devicePreferences.$inferSelect;
