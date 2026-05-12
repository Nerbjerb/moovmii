export interface FerryStop {
  id: string;
  name: string;
}

export interface FerryLine {
  routeId: string;
  name: string;
  abbr: string;
  color: string;
  stops: FerryStop[];
}

export const FERRY_LINES: FerryLine[] = [
  {
    routeId: "ER", name: "East River", abbr: "ER", color: "#228B9D",
    stops: [
      { id: "87",  name: "Wall St/Pier 11" },
      { id: "20",  name: "Dumbo/Fulton Ferry" },
      { id: "8",   name: "South Williamsburg" },
      { id: "19",  name: "North Williamsburg" },
      { id: "18",  name: "Greenpoint" },
      { id: "4",   name: "Hunters Point South" },
      { id: "17",  name: "East 34th Street" },
    ],
  },
  {
    routeId: "RW", name: "Rockaway", abbr: "RW", color: "#AD1AAC",
    stops: [],
  },
  {
    routeId: "SB", name: "South Brooklyn", abbr: "SB", color: "#FFD100",
    stops: [
      { id: "17",  name: "East 34th Street" },
      { id: "115", name: "Corlears Hook" },
      { id: "87",  name: "Wall St/Pier 11" },
      { id: "11",  name: "Atlantic Ave/BBP Pier 6" },
      { id: "24",  name: "Red Hook/Atlantic Basin" },
      { id: "111", name: "Gov. Island/Yankee Pier" },
    ],
  },
  {
    routeId: "AS", name: "Astoria", abbr: "AST", color: "#FE5000",
    stops: [
      { id: "87",  name: "Wall St/Pier 11" },
      { id: "120", name: "Brooklyn Navy Yard" },
      { id: "17",  name: "East 34th Street" },
      { id: "90",  name: "Long Island City" },
      { id: "25",  name: "Roosevelt Island" },
      { id: "89",  name: "Astoria" },
      { id: "113", name: "East 90th St" },
    ],
  },
  {
    routeId: "RS", name: "Soundview", abbr: "SV", color: "#4E008E",
    stops: [
      { id: "88",  name: "Rockaway" },
      { id: "118", name: "Sunset Park/BAT" },
      { id: "87",  name: "Wall St/Pier 11" },
      { id: "114", name: "Stuyvesant Cove" },
      { id: "17",  name: "East 34th Street" },
      { id: "113", name: "East 90th St" },
      { id: "112", name: "Soundview" },
      { id: "141", name: "Ferry Point Park" },
    ],
  },
  {
    routeId: "SG", name: "St. George", abbr: "SG", color: "#D0006F",
    stops: [
      { id: "138", name: "Midtown West/W 39th St-Pier 79" },
      { id: "136", name: "Battery Park City/Vesey St." },
      { id: "137", name: "St. George" },
      { id: "23",  name: "Bay Ridge" },
      { id: "11",  name: "Atlantic Ave/BBP Pier 6" },
      { id: "87",  name: "Wall St/Pier 11" },
    ],
  },
  {
    routeId: "GI", name: "Gov's Island", abbr: "GI", color: "#9893A0",
    stops: [],
  },
];

export const FERRY_LINE_MAP: Record<string, FerryLine> = Object.fromEntries(
  FERRY_LINES.map((l) => [l.routeId, l])
);

// Returns the ferry line config for a TrackCard line prop like "FERRY-ER"
export function getFerryLine(line: string): FerryLine | null {
  if (!line.startsWith("FERRY-")) return null;
  return FERRY_LINE_MAP[line.replace("FERRY-", "")] ?? null;
}

// Returns all routeIds that serve a given stop ID
export function getFerryRoutesForStop(stopId: string): string[] {
  return FERRY_LINES
    .filter(l => l.stops.some(s => s.id === stopId))
    .map(l => l.routeId);
}
