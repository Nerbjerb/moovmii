import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Kiosk preferences table - stores row selections
export const kioskPreferences = pgTable("kiosk_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  kioskId: varchar("kiosk_id").notNull().default("default"),
  row: integer("row").notNull(), // 1 or 2
  stop: text("stop").notNull(),
  direction: text("direction").notNull(), // "Uptown" or "Downtown"
  line: text("line").notNull(),
});

export const insertKioskPreferenceSchema = createInsertSchema(kioskPreferences).omit({
  id: true,
});

export type InsertKioskPreference = z.infer<typeof insertKioskPreferenceSchema>;
export type KioskPreference = typeof kioskPreferences.$inferSelect;

// Row selection type used in frontend
export type RowSelection = {
  stop: string;
  direction: "Uptown" | "Downtown";
  line: string;
};

export type SubwayArrival = {
  direction: string;
  line: string;
  destination: string;
  subtitle: string;
  arrivalMinutes: number[];
  arrivalLines: string[];
};

export type WeatherData = {
  icon: string;
  temperature: string;
  description: string;
  time: string;
};
