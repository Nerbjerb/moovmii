import type { KioskPreference, KioskSettings, KioskFavorite } from "@shared/schema";
import { getDeviceId } from "./deviceId";

const DEFAULT_SETTINGS = {
  temperatureUnit: "fahrenheit",
  clockFormat: "12hr",
  transportRows: 2,
};

export function getSettings(deviceId?: string): KioskSettings {
  const id = deviceId || getDeviceId();
  const stored = localStorage.getItem(`kiosk_settings_${id}`);
  if (stored) {
    try {
      return JSON.parse(stored) as KioskSettings;
    } catch {}
  }
  return { id: "local", kioskId: id, ...DEFAULT_SETTINGS } as KioskSettings;
}

export function saveSettings(
  patch: Partial<Pick<KioskSettings, "temperatureUnit" | "clockFormat" | "transportRows">>,
  deviceId?: string
): KioskSettings {
  const id = deviceId || getDeviceId();
  const current = getSettings(id);
  const updated = { ...current, ...patch };
  localStorage.setItem(`kiosk_settings_${id}`, JSON.stringify(updated));
  return updated;
}

export function getPreferences(deviceId?: string): KioskPreference[] {
  const id = deviceId || getDeviceId();
  const stored = localStorage.getItem(`kiosk_preferences_${id}`);
  if (stored) {
    try {
      return JSON.parse(stored) as KioskPreference[];
    } catch {}
  }
  return [];
}

export function savePreference(
  pref: { row: number; stop: string; direction: string; line: string },
  deviceId?: string
): KioskPreference {
  const id = deviceId || getDeviceId();
  const prefs = getPreferences(id);
  const record: KioskPreference = {
    id: `${id}-${pref.row}`,
    kioskId: id,
    row: pref.row,
    stop: pref.stop,
    direction: pref.direction,
    line: pref.line,
  };
  const idx = prefs.findIndex((p) => p.row === pref.row);
  if (idx >= 0) {
    prefs[idx] = record;
  } else {
    prefs.push(record);
  }
  localStorage.setItem(`kiosk_preferences_${id}`, JSON.stringify(prefs));
  return record;
}

// Favorites pool (starred row configs) — stored on-device so deploys can't
// wipe it (the server's disk on Render is ephemeral)
export function getFavorites(deviceId?: string): KioskFavorite[] {
  const id = deviceId || getDeviceId();
  const stored = localStorage.getItem(`kiosk_favorites_${id}`);
  if (stored) {
    try {
      return JSON.parse(stored) as KioskFavorite[];
    } catch {}
  }
  return [];
}

export function toggleFavorite(
  config: { line: string; stop: string; direction: string },
  deviceId?: string
): KioskFavorite[] {
  const id = deviceId || getDeviceId();
  const favs = getFavorites(id);
  const idx = favs.findIndex(
    (f) => f.line === config.line && f.stop === config.stop && f.direction === config.direction
  );
  if (idx >= 0) favs.splice(idx, 1);
  else favs.push({ id: `${id}-${Date.now()}`, kioskId: id, ...config });
  localStorage.setItem(`kiosk_favorites_${id}`, JSON.stringify(favs));
  return favs;
}
