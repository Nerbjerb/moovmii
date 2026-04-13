import { type User, type InsertUser, type KioskPreference, type InsertKioskPreference, type RowSelection, type KioskSettings, type InsertKioskSettings } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Kiosk preferences
  getKioskPreferences(kioskId?: string): Promise<KioskPreference[]>;
  setKioskPreference(pref: InsertKioskPreference): Promise<KioskPreference>;
  deleteKioskPreference(kioskId: string, row: number): Promise<void>;

  // Kiosk settings
  getKioskSettings(kioskId?: string): Promise<KioskSettings>;
  setKioskSettings(settings: InsertKioskSettings): Promise<KioskSettings>;
}

interface PersistedData {
  users: Record<string, User>;
  preferences: Record<string, KioskPreference>;
  settings: Record<string, KioskSettings>;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "kiosk-data.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readData(): PersistedData {
  ensureDataDir();
  if (!fs.existsSync(DATA_FILE)) {
    return { users: {}, preferences: {}, settings: {} };
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")) as PersistedData;
  } catch {
    return { users: {}, preferences: {}, settings: {} };
  }
}

function writeData(data: PersistedData): void {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export class FileStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    return readData().users[id];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Object.values(readData().users).find((u) => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const data = readData();
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    data.users[id] = user;
    writeData(data);
    return user;
  }

  async getKioskPreferences(kioskId: string = "default"): Promise<KioskPreference[]> {
    return Object.values(readData().preferences).filter((p) => p.kioskId === kioskId);
  }

  async setKioskPreference(pref: InsertKioskPreference): Promise<KioskPreference> {
    const data = readData();
    const kioskId = pref.kioskId || "default";
    const key = `${kioskId}-${pref.row}`;
    const existing = data.preferences[key];
    const id = existing?.id || randomUUID();
    const newPref: KioskPreference = {
      id,
      kioskId,
      row: pref.row,
      stop: pref.stop,
      direction: pref.direction,
      line: pref.line,
    };
    data.preferences[key] = newPref;
    writeData(data);
    return newPref;
  }

  async deleteKioskPreference(kioskId: string, row: number): Promise<void> {
    const data = readData();
    delete data.preferences[`${kioskId}-${row}`];
    writeData(data);
  }

  async getKioskSettings(kioskId: string = "default"): Promise<KioskSettings> {
    const existing = readData().settings[kioskId];
    if (existing) return existing;
    return {
      id: randomUUID(),
      kioskId,
      temperatureUnit: "fahrenheit",
      clockFormat: "12hr",
      transportRows: 2,
    };
  }

  async setKioskSettings(settings: InsertKioskSettings): Promise<KioskSettings> {
    const data = readData();
    const kioskId = settings.kioskId || "default";
    const existing = data.settings[kioskId];
    const id = existing?.id || randomUUID();
    const newSettings: KioskSettings = {
      id,
      kioskId,
      temperatureUnit: settings.temperatureUnit || "fahrenheit",
      clockFormat: settings.clockFormat || "12hr",
      transportRows: settings.transportRows ?? 2,
    };
    data.settings[kioskId] = newSettings;
    writeData(data);
    return newSettings;
  }
}

export const storage = new FileStorage();
