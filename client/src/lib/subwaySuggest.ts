import { stopIdMap, getSameColorLines } from "@shared/stopMetadata";
import { subwayStopCoords } from "@shared/subwayStopCoords";

// Geospatial subway suggester: nearest station platforms to an address, built
// from the app's existing station↔line metadata + committed GTFS coordinates.
// Straight-line (haversine) ranking. No AI, no runtime GTFS fetch.
//
// Keyed by GTFS stop_id (per-complex, per-trunk), NOT station name — so distinct
// stations that share a name (the several "23 St", or the LIRR "Broadway" vs the
// Astoria subway "Broadway") never merge. Only subway lines are considered.
//
// One card per COLOR GROUP per direction: same-color lines stay together
// (Broadway → N W on one card), different colors split. Mirrors the kiosk row
// model (one row = one color group).

export type SaveConfig = { stop: string; direction: string; line: string };
export type SuggestedPlatform = {
  key: string;
  station: string;
  direction: "Uptown" | "Downtown";
  directionLabel: string;
  lines: string[];
  saveConfigs: SaveConfig[];
};

const LINE_SORT = "1234567ABCDEFGHJLMNQRSWZ";
const sortLines = (lines: string[]) =>
  [...lines].sort((a, b) => (LINE_SORT.indexOf(a[0]) - LINE_SORT.indexOf(b[0])) || a.localeCompare(b));

const INOUT = new Set(["7", "L", "J", "Z"]);
const dirLabel = (dir: "Uptown" | "Downtown", primaryLine: string) =>
  INOUT.has(primaryLine)
    ? (dir === "Uptown" ? "Outbound Platform" : "Inbound Platform")
    : (dir === "Uptown" ? "Uptown Platform" : "Downtown Platform");

// Subway lines only — exclude LIRR/MNR/PATH/NJT/Ferry (dash-prefixed or named)
// and SIR (its own onboarding mode)
const SUBWAY_LINES = Object.keys(stopIdMap).filter(
  (k) => !k.includes("-") && k !== "SIR" && k !== "MetroNorth" && k !== "LIRR" &&
         !k.startsWith("LIRR") && !k.startsWith("MNR") && !k.startsWith("PATH") && !k.startsWith("NJT") && !k.startsWith("FERRY")
);

type LineAt = { line: string; isFirst: boolean; isLast: boolean };
type StopInfo = { stopId: string; name: string; coord: [number, number]; linesAt: LineAt[] };

// Build the stop index once, keyed by stop_id
const STOPS: StopInfo[] = (() => {
  const acc = new Map<string, { name: string; lines: Map<string, LineAt> }>();
  for (const line of SUBWAY_LINES) {
    const entries = Object.entries(stopIdMap[line]);
    entries.forEach(([name, stopId], i) => {
      let e = acc.get(stopId);
      if (!e) { e = { name, lines: new Map() }; acc.set(stopId, e); }
      if (!e.lines.has(line)) e.lines.set(line, { line, isFirst: i === 0, isLast: i === entries.length - 1 });
    });
  }
  const out: StopInfo[] = [];
  for (const [stopId, e] of acc) {
    const coord = subwayStopCoords[stopId];
    if (!coord) continue; // non-subway / unknown stop ids drop out here
    out.push({ stopId, name: e.name, coord, linesAt: [...e.lines.values()] });
  }
  return out;
})();

function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function platformsFor(stop: StopInfo): SuggestedPlatform[] {
  const groups = new Map<string, LineAt[]>();
  for (const la of stop.linesAt) {
    const colorKey = getSameColorLines(la.line).slice().sort().join(",");
    const g = groups.get(colorKey);
    if (g) g.push(la); else groups.set(colorKey, [la]);
  }
  const cards: SuggestedPlatform[] = [];
  for (const [colorKey, las] of groups) {
    const lines = sortLines(las.map((l: LineAt) => l.line));
    const primary = lines[0];
    const uptownTerminal = las.every((l: LineAt) => l.isFirst);
    const downtownTerminal = las.every((l: LineAt) => l.isLast);
    const dirs: ("Uptown" | "Downtown")[] =
      uptownTerminal ? ["Downtown"] : downtownTerminal ? ["Uptown"] : ["Uptown", "Downtown"];
    for (const direction of dirs) {
      cards.push({
        key: `${stop.stopId}|${colorKey}|${direction}`,
        station: stop.name,
        direction,
        directionLabel: dirLabel(direction, primary),
        lines,
        saveConfigs: [{ stop: stop.name, direction, line: primary }],
      });
    }
  }
  return cards;
}

// All platforms (station × color group × direction) served by the given lines,
// for the manual "add platforms" drill-down. Ordered by station name.
export function getPlatformsForLines(lines: string[]): SuggestedPlatform[] {
  const lineSet = new Set(lines);
  const out: SuggestedPlatform[] = [];
  const seen = new Set<string>();
  for (const s of STOPS) {
    for (const c of platformsFor(s)) {
      if (c.lines.some((l) => lineSet.has(l)) && !seen.has(c.key)) { seen.add(c.key); out.push(c); }
    }
  }
  return out.sort((a, b) => a.station.localeCompare(b.station) || a.direction.localeCompare(b.direction));
}

export function getNearestSubwayPlatforms(lat: number, lon: number, limit = 9): SuggestedPlatform[] {
  const ranked = STOPS
    .map((s) => ({ s, d: haversine(lat, lon, s.coord[0], s.coord[1]) }))
    .sort((a, b) => a.d - b.d);

  const cards: SuggestedPlatform[] = [];
  for (const { s } of ranked) {
    for (const p of platformsFor(s)) {
      cards.push(p);
      if (cards.length >= limit) return cards;
    }
  }
  return cards;
}
