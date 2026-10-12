import { getDeviceId } from "./deviceId";

// Device config sync (tablet side). When this device is paired, its config is
// the server's. We mirror the server config into the SAME localStorage keys the
// kiosk already reads, so the kiosk needs no changes and localStorage doubles as
// the offline cache. Unpaired tablets (no device token) keep using localStorage
// as before — zero change for the existing beta units.
const TOKEN_KEY = "moovmii_device_token";
const SYNCED_VERSION_KEY = "moovmii_synced_config_version";

export function getDeviceToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

// Returns true if local config changed (so the caller can refresh the kiosk).
export async function syncDeviceConfig(): Promise<boolean> {
  const token = getDeviceToken();
  if (!token) return false; // not a paired tablet
  try {
    const stateRes = await fetch("/api/device/state", { headers: { "x-device-token": token } });
    if (!stateRes.ok) return false;
    const state = await stateRes.json();
    if (!state?.paired) return false;

    const synced = Number(localStorage.getItem(SYNCED_VERSION_KEY) ?? "-1");
    if (state.configVersion === synced) return false; // already up to date

    const cfgRes = await fetch("/api/device/config", { headers: { "x-device-token": token } });
    if (!cfgRes.ok) return false;
    const cfg = await cfgRes.json();
    const id = getDeviceId();

    if (cfg.settings) {
      localStorage.setItem(`kiosk_settings_${id}`, JSON.stringify({
        id: "local", kioskId: id,
        temperatureUnit: cfg.settings.temperatureUnit,
        clockFormat: cfg.settings.clockFormat,
        transportRows: cfg.settings.transportRows,
      }));
    }
    const prefs = (cfg.preferences ?? []).map((p: any) => ({
      id: `${id}-${p.row}`, kioskId: id, row: p.row, stop: p.stop, direction: p.direction, line: p.line,
    }));
    localStorage.setItem(`kiosk_preferences_${id}`, JSON.stringify(prefs));
    const favs = (cfg.favorites ?? []).map((f: any, i: number) => ({
      id: `${id}-fav-${i}`, kioskId: id, line: f.line, stop: f.stop, direction: f.direction,
    }));
    localStorage.setItem(`kiosk_favorites_${id}`, JSON.stringify(favs));

    localStorage.setItem(SYNCED_VERSION_KEY, String(state.configVersion));
    return true;
  } catch {
    return false; // offline / server down → keep the cached localStorage config
  }
}
