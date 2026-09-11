// Screen dim schedule: software dim overlay during quiet hours.
// (Hardware backlight control will ride the Android shell later; this module
// is the source of truth for the schedule either way.)

export type ScreenDimSettings = {
  enabled: boolean;
  start: string; // "HH:MM" 24h — when dimming begins
  end: string;   // "HH:MM" 24h — when full brightness returns
};

const KEY = "screenDimSettings";

export const DEFAULT_SCREEN_DIM: ScreenDimSettings = { enabled: false, start: "23:00", end: "07:00" };

export function getScreenDimSettings(): ScreenDimSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_SCREEN_DIM, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SCREEN_DIM;
}

export function saveScreenDimSettings(settings: ScreenDimSettings): void {
  localStorage.setItem(KEY, JSON.stringify(settings));
}

/** True when `now` falls inside the dim window (handles overnight wrap). */
export function isDimActive(settings: ScreenDimSettings, now: Date = new Date()): boolean {
  if (!settings.enabled || settings.start === settings.end) return false;
  const toMins = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const t = now.getHours() * 60 + now.getMinutes();
  const start = toMins(settings.start);
  const end = toMins(settings.end);
  return start < end ? t >= start && t < end : t >= start || t < end;
}

export function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

/** "00:00" through "23:30" in 30-minute steps. */
export const TIME_OPTIONS: string[] = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, "0");
  return `${h}:${i % 2 === 0 ? "00" : "30"}`;
});
