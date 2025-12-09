import { type User, type InsertUser, type KioskPreference, type InsertKioskPreference, type RowSelection } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Kiosk preferences
  getKioskPreferences(kioskId?: string): Promise<KioskPreference[]>;
  setKioskPreference(pref: InsertKioskPreference): Promise<KioskPreference>;
  deleteKioskPreference(kioskId: string, row: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private preferences: Map<string, KioskPreference>;

  constructor() {
    this.users = new Map();
    this.preferences = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getKioskPreferences(kioskId: string = "default"): Promise<KioskPreference[]> {
    return Array.from(this.preferences.values()).filter(p => p.kioskId === kioskId);
  }

  async setKioskPreference(pref: InsertKioskPreference): Promise<KioskPreference> {
    const kioskId = pref.kioskId || "default";
    const key = `${kioskId}-${pref.row}`;
    const existing = this.preferences.get(key);
    const id = existing?.id || randomUUID();
    const newPref: KioskPreference = { 
      id,
      kioskId,
      row: pref.row,
      stop: pref.stop,
      direction: pref.direction,
      line: pref.line,
    };
    this.preferences.set(key, newPref);
    return newPref;
  }

  async deleteKioskPreference(kioskId: string, row: number): Promise<void> {
    const key = `${kioskId}-${row}`;
    this.preferences.delete(key);
  }
}

export const storage = new MemStorage();
