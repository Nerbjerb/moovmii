// PATH equivalent of subwaySuggest: nearest-station suggestions, routes-at-stop,
// stations-per-route, and terminal-aware To NY / To NJ directions. Mirrors the
// subway helpers so the phone Setup flow can reuse the same config UI.
import {
  stopIdMap,
  pathStationCoords,
  pathRouteOrder,
  pathTerminalsNY,
  pathTerminalsNJ,
} from "@shared/stopMetadata";
import type { SuggestedPlatform } from "./subwaySuggest";

// PATH direction is stored as the canonical Uptown/Downtown and shown as To NY / To NJ.
export const pathDirLabel = (dir: "Uptown" | "Downtown") => (dir === "Uptown" ? "To NY" : "To NJ");

// Route-lines (PATH-NWK, …) that actually serve a given station.
export function getPathRoutesAtStop(station: string): string[] {
  return pathRouteOrder.filter((rk) => stopIdMap[rk] && station in stopIdMap[rk]);
}

// Stations on a route, in timetable order.
export function getPathRouteStations(routeKey: string): string[] {
  return Object.keys(stopIdMap[routeKey] || {});
}

// Allowed directions at a station: pure NY-end terminals only run To NJ, pure
// NJ-end terminals only run To NY, everything else runs both.
export function getPathStopDirections(station: string): ("Uptown" | "Downtown")[] {
  if (pathTerminalsNY.includes(station)) return ["Downtown"]; // To NJ only
  if (pathTerminalsNJ.includes(station)) return ["Uptown"];   // To NY only
  return ["Uptown", "Downtown"];
}

function haversine(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat), dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Nearest PATH platforms to a coordinate, as suggestion cards (one per station ×
// allowed direction). `lines` = all routes serving that station; the stations
// screen lets the rider narrow to specific routes. Capped at `limit` cards.
export function getNearestPathPlatforms(lat: number, lon: number, limit = 8): SuggestedPlatform[] {
  const stations = Object.entries(pathStationCoords)
    .map(([name, [slat, slon]]) => ({ name, dist: haversine(lat, lon, slat, slon) }))
    .sort((a, b) => a.dist - b.dist);

  const cards: SuggestedPlatform[] = [];
  for (const s of stations) {
    const lines = getPathRoutesAtStop(s.name);
    if (!lines.length) continue;
    for (const direction of getPathStopDirections(s.name)) {
      cards.push({
        key: `${s.name}|path|${direction}`,
        station: s.name,
        direction,
        directionLabel: pathDirLabel(direction),
        lines,
        saveConfigs: [],
      });
    }
    if (cards.length >= limit) break;
  }
  return cards.slice(0, limit);
}
