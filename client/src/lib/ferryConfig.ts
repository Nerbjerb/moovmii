export interface FerryLine {
  routeId: string;
  name: string;
  abbr: string;
  color: string;
}

export const FERRY_LINES: FerryLine[] = [
  { routeId: "ER",  name: "East River",       abbr: "ER",  color: "#228B9D" },
  { routeId: "RW",  name: "Rockaway",          abbr: "RW",  color: "#AD1AAC" },
  { routeId: "SB",  name: "South Brooklyn",    abbr: "SB",  color: "#FFD100" },
  { routeId: "AST", name: "Astoria",           abbr: "AST", color: "#FE5000" },
  { routeId: "SV",  name: "Soundview",         abbr: "SV",  color: "#4E008E" },
  { routeId: "SG",  name: "St. George",        abbr: "SG",  color: "#D0006F" },
  { routeId: "GI",  name: "Gov's Island",      abbr: "GI",  color: "#9893A0" },
];

export const FERRY_LINE_MAP: Record<string, FerryLine> = Object.fromEntries(
  FERRY_LINES.map((l) => [l.routeId, l])
);

// Returns the ferry line config for a TrackCard line prop like "FERRY-ER"
export function getFerryLine(line: string): FerryLine | null {
  if (!line.startsWith("FERRY-")) return null;
  return FERRY_LINE_MAP[line.replace("FERRY-", "")] ?? null;
}
