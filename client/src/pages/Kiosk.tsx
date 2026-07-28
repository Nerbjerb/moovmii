import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { usePressScroll } from "@/hooks/use-press-scroll";
import { Settings, Star } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import CitibikeDockRow from "@/components/CitibikeDockRow";
import type { CitibikeStation } from "@/components/CitibikeDockRow";
import DrivingRouteCard from "@/components/DrivingRouteCard";
import type { DrivingSlot } from "@/pages/DrivingSettings";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import type { SubwayArrival, KioskPreference, KioskSettings, KioskFavorite } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { WeatherIconName } from "@shared/weatherIconMapper";
import { getStopId, getSameColorLines } from "@shared/stopMetadata";
import moovmiiLogoV2 from "@assets/moovmii logo v2 (White).png";
import { getDeviceId } from "@/lib/deviceId";
import { savePreference } from "@/lib/localStorageDB";
import { getCitibikeShowParking } from "@/pages/CitibikePreferences";
import { FERRY_LINE_MAP, getFerryRoutesForStop } from "@/lib/ferryConfig";

function EditOverlay({ label, borderRadius = "12px", style }: { label: string; borderRadius?: string; style?: React.CSSProperties }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.55)", borderRadius, zIndex: 50, ...style }}
    >
      <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>
        {label}
      </span>
    </div>
  );
}

// What kind of thing this row shows, for the "Favorite this ___" label
function favoriteWord(line?: string): string {
  if (!line) return "Subway";
  if (line.startsWith("FERRY-")) return "Ferry";
  if (line.startsWith("LIRR-") || line.startsWith("MNR-") || line.startsWith("NJT-") || line.startsWith("PATH-")) return "Train";
  if (line.startsWith("MTA NYCT_") || line.startsWith("MTABC_") || line.startsWith("BUS-")) return "Bus";
  return "Subway";
}

function FavoriteBox({ favorited, word, onClick }: { favorited: boolean; word: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer"
      style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#2D2C31", borderRadius: "6px", padding: "3px 10px", marginLeft: "10px" }}
      data-testid="favorite-box"
    >
      <Star size={14} color={favorited ? "#FFD200" : "#ffffff"} fill={favorited ? "#FFD200" : "none"} />
      <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "13px", fontWeight: 600, color: "#ffffff", whiteSpace: "nowrap" }}>
        Favorite this {word}
      </span>
    </div>
  );
}

export default function Kiosk() {
  const [isEditMode, setIsEditMode] = useState(false);
  const showParking = getCitibikeShowParking();
  const [, setLocation] = useLocation();

  // ?reset escape hatch — clears stored resolution and reloads at default scale
  if (typeof window !== "undefined" && window.location.search.includes("reset")) {
    localStorage.removeItem("kioskResolution");
    window.location.replace("/");
  }
  const mainRef = useRef<HTMLDivElement>(null);
  usePressScroll(mainRef);

  const scaleMap: Record<string, number> = { '800x480': 1, '1024x600': 1.25, '1280x800': 1.6, '1920x1080': 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem('kioskResolution') || '800x480'] || 1);
  const deviceId = getDeviceId();

  // Fetch preferences
  const { data: preferences } = useQuery<KioskPreference[]>({
    queryKey: ['/api/preferences', deviceId],
  });

  // Fetch favorites pool (saved row configs) — used for the star boxes and swipe cycling
  const { data: favorites } = useQuery<KioskFavorite[]>({
    queryKey: [`/api/favorites?kioskId=${deviceId}`],
  });

  // Fetch service alerts with descriptions
  const { data: alertsData } = useQuery<{ alertsByRoute: Record<string, { hasAlert: boolean; descriptions: string[] }> }>({
    queryKey: ['/api/alerts'],
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  // Fetch settings
  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ['/api/settings', deviceId],
  });

  const transportRows = settings?.transportRows ?? 2;

  // Read commute time to station — 0 means N/A (no filtering)
  const [commuteMinutes] = useState(() => {
    const stored = localStorage.getItem("commuteTimeToStation");
    return stored !== null ? parseInt(stored, 10) : 0;
  });

  // Filter out arrivals that depart sooner than the user's commute time
  const applyCommuteFilter = (arrival: SubwayArrival): SubwayArrival => {
    if (commuteMinutes === 0) return arrival;
    const filtered = arrival.arrivalMinutes
      .map((mins, i) => ({ mins, line: arrival.arrivalLines[i] }))
      .filter(({ mins }) => mins >= commuteMinutes);
    return {
      ...arrival,
      arrivalMinutes: filtered.map(f => f.mins),
      arrivalLines: filtered.map(f => f.line),
    };
  };

  // Get preferences for each row
  const row1Pref = preferences?.find(p => p.row === 1);
  const row2Pref = preferences?.find(p => p.row === 2);
  const row3Pref = preferences?.find(p => p.row === 3);
  const row4Pref = preferences?.find(p => p.row === 4);
  const rowPrefs = [row1Pref, row2Pref, row3Pref, row4Pref];

  // --- Favorites: config snapshots + swipe cycling ---
  type RowConfig = { line: string; stop: string; direction: string };

  const isSwappableRow = (pref: KioskPreference | undefined) =>
    !(pref && (pref.line === 'CITIBIKE' || pref.line === 'DRIVING'));

  // Default rows (no saved pref) show Broadway N/W
  const effectiveRowConfig = (rowIdx: number): RowConfig => {
    const pref = rowPrefs[rowIdx];
    if (pref) return { line: pref.line, stop: pref.stop, direction: pref.direction };
    return { line: 'N', stop: 'Broadway', direction: rowIdx % 2 === 0 ? 'Uptown' : 'Downtown' };
  };

  const configMatches = (a: RowConfig, b: RowConfig) =>
    a.line === b.line && a.stop === b.stop && a.direction === b.direction;

  const isRowFavorited = (rowIdx: number) =>
    !!favorites?.some((f) => configMatches(f, effectiveRowConfig(rowIdx)));

  const toggleFavorite = async (rowIdx: number) => {
    await apiRequest("POST", "/api/favorites/toggle", { kioskId: deviceId, ...effectiveRowConfig(rowIdx) });
    queryClient.invalidateQueries({ queryKey: [`/api/favorites?kioskId=${deviceId}`] });
  };

  // Favorites not currently displayed on any visible row
  const getUnshownFavorites = (): KioskFavorite[] => {
    if (!favorites || favorites.length === 0) return [];
    const displayedConfigs = Array.from({ length: transportRows }, (_, i) => i)
      .filter((i) => isSwappableRow(rowPrefs[i]))
      .map((i) => effectiveRowConfig(i));
    return favorites.filter((f) => !displayedConfigs.some((d) => configMatches(f, d)));
  };

  // Swipe a row to cycle through favorites not currently displayed on any row
  const cycleFavorite = (rowIdx: number, dir: 1 | -1) => {
    if (!favorites || !isSwappableRow(rowPrefs[rowIdx])) return;
    const unshown = getUnshownFavorites();
    if (unshown.length === 0) return;

    const cur = effectiveRowConfig(rowIdx);
    const curIdx = favorites.findIndex((f) => configMatches(f, cur));
    let target: KioskFavorite | undefined;
    if (curIdx === -1) {
      target = dir === 1 ? unshown[0] : unshown[unshown.length - 1];
    } else {
      const n = favorites.length;
      for (let step = 1; step <= n; step++) {
        const cand = favorites[(((curIdx + dir * step) % n) + n) % n];
        if (unshown.some((u) => u.id === cand.id)) { target = cand; break; }
      }
    }
    if (!target) return;

    savePreference({ row: rowIdx + 1, stop: target.stop, direction: target.direction, line: target.line }, deviceId);
    queryClient.invalidateQueries({ queryKey: ['/api/preferences', deviceId] });
  };

  // --- Drag-to-swipe with carousel animation ---
  // The whole row (label + cards) follows the finger; on release past the
  // threshold, it slides out and the next favorite slides in from the other side.
  const COMMIT_THRESHOLD = 80;

  const dragRef = useRef<{ row: number; startX: number; startY: number; active: boolean } | null>(null);
  const dragBusy = useRef(false); // true while the out/in animation plays
  const [drag, setDrag] = useState<{ row: number; dx: number } | null>(null);
  // Committed animations run as CSS keyframes (deterministic start/end positions,
  // no dependence on React paint timing). dir 1 = swiped left, -1 = swiped right.
  const [anim, setAnim] = useState<{ row: number; phase: "exit" | "enter" | "return"; dir: 1 | -1; fromDx: number } | null>(null);

  const onRowPointerDown = (rowIdx: number) => (e: React.PointerEvent) => {
    if (isEditMode || dragBusy.current || !isSwappableRow(rowPrefs[rowIdx])) return;
    dragRef.current = { row: rowIdx, startX: e.clientX, startY: e.clientY, active: false };
  };

  const onRowPointerMove = (rowIdx: number) => (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.row !== rowIdx) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.active) {
      if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx)) { dragRef.current = null; return; } // vertical → press-scroll's gesture
      if (Math.abs(dx) < 12 || Math.abs(dx) <= Math.abs(dy)) return; // not horizontal enough yet
      if (getUnshownFavorites().length === 0) { dragRef.current = null; return; } // nothing to cycle to
      d.active = true;
      try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    }
    setDrag({ row: rowIdx, dx });
  };

  const onRowPointerUp = (rowIdx: number) => (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d || !d.active) return;
    const dx = e.clientX - d.startX;
    setDrag(null);
    if (Math.abs(dx) >= COMMIT_THRESHOLD) {
      commitSwipe(rowIdx, dx);
    } else {
      // Spring back from the released finger position
      setAnim({ row: rowIdx, phase: "return", dir: 1, fromDx: dx });
      setTimeout(() => setAnim(null), 220);
    }
  };

  const commitSwipe = (rowIdx: number, dx: number) => {
    dragBusy.current = true;
    const dir: 1 | -1 = dx < 0 ? 1 : -1;
    // Old row slides out in the swipe direction, continuing from the finger position...
    setAnim({ row: rowIdx, phase: "exit", dir, fromDx: dx });
    setTimeout(() => {
      cycleFavorite(rowIdx, dir);
      // ...new row slides in from the opposite side
      setAnim({ row: rowIdx, phase: "enter", dir, fromDx: 0 });
      setTimeout(() => { setAnim(null); dragBusy.current = false; }, 270);
    }, 190);
  };

  const rowDragStyle = (rowIdx: number): React.CSSProperties => {
    if (drag?.row === rowIdx) return { transform: `translateX(${drag.dx}px)` };
    if (anim?.row === rowIdx) {
      if (anim.phase === "exit") {
        return {
          ["--drag-x" as any]: `${anim.fromDx}px`,
          animation: `${anim.dir === 1 ? "row-exit-left" : "row-exit-right"} 0.18s ease-in both`,
        };
      }
      if (anim.phase === "enter") {
        // Swiped left → new row enters from the right, and vice versa
        return { animation: `${anim.dir === 1 ? "row-enter-right" : "row-enter-left"} 0.25s ease-out both` };
      }
      return {
        ["--drag-x" as any]: `${anim.fromDx}px`,
        animation: "row-return 0.2s ease-out both",
      };
    }
    return {};
  };

  // Fetch citibike station data when any row is configured as citibike
  const hasCitibikeRow = rowPrefs.some(p => p?.line === 'CITIBIKE');
  const { data: citibikeStations = [] } = useQuery<CitibikeStation[]>({
    queryKey: ['/api/citibike/stations'],
    refetchInterval: 30 * 1000,
    enabled: hasCitibikeRow,
  });

  // Build query parameters for dynamic arrivals (subway, PATH, or bus)
  const getArrivalsQueryKey = (pref: KioskPreference | undefined, rowNum: number) => {
    // Default fallback to Broadway-Astoria N/W
    const defaultStopId = "R05";
    const defaultDirection = rowNum === 1 ? "Uptown" : "Downtown";
    const defaultLines = "N,W";
    
    if (!pref) {
      return ['/api/subway/arrivals', { stopId: defaultStopId, direction: defaultDirection, lines: defaultLines, isPATH: false, isBus: false }];
    }

    if (pref.line === 'CITIBIKE') {
      return ['/api/citibike/noop', { isCitibike: true }];
    }

    if (pref.line === 'DRIVING') {
      return ['/api/citibike/noop', { isDriving: true }];
    }

    // Check if this is a Ferry line
    if (pref.line.startsWith('FERRY-')) {
      const routeIds = getFerryRoutesForStop(pref.stop).join(',') || pref.line.replace('FERRY-', '');
      return ['/api/ferry/arrivals', { routeIds, stopId: pref.stop, direction: pref.direction || 'Inbound', isFerry: true }];
    }

    // Check if this is an NJT line
    if (pref.line.startsWith('NJT-')) {
      return ['/api/njt/arrivals', { stop: pref.stop, direction: pref.direction, line: pref.line, isNJT: true }];
    }

    // Check if this is a PATH line
    const isPATH = pref.line.startsWith('PATH-');

    // Check if this is a bus line (bus lines start with "MTA NYCT_" or "MTABC_")
    const isBus = pref.line.startsWith('MTA NYCT_') || pref.line.startsWith('MTABC_') || pref.line.startsWith('BUS-');

    if (isBus) {
      // For buses, the stop ID is stored directly in pref.stop
      return ['/api/bus/arrivals', { stopId: pref.stop, routeId: pref.line, isBus: true }];
    }
    
    const stopId = getStopId(pref.stop, pref.line);
    const sameColorLines = getSameColorLines(pref.line);
    
    // If stop ID not found in metadata, fall back to defaults
    if (!stopId) {
      console.warn(`Stop ID not found for ${pref.stop} on ${pref.line}, using default`);
      return ['/api/subway/arrivals', { stopId: defaultStopId, direction: defaultDirection, lines: defaultLines, isPATH: false, isBus: false }];
    }
    
    // For PATH, convert direction: Uptown -> "To NY", Downtown -> "To NJ"
    const pathDirection = pref.direction === 'Uptown' ? 'To NY' : 'To NJ';
    
    if (isPATH) {
      return ['/api/path/arrivals', { station: stopId, direction: pathDirection, line: pref.line, isPATH: true, isBus: false }];
    }
    
    return ['/api/subway/arrivals', { stopId, direction: pref.direction, lines: sameColorLines.join(','), isPATH: false, isBus: false }];
  };

  // Fetch real weather data from OpenWeatherMap
  const { data: weatherData } = useQuery<{
    icon: WeatherIconName;
    temperature: string;
    description: string;
    rainToday: boolean;
    snowToday: boolean;
  }>({
    queryKey: ['/api/weather'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  // Helper function to transform bus arrivals to SubwayArrival format
  const transformBusArrivals = async (params: { stopId?: string; routeId?: string }): Promise<SubwayArrival> => {
    // Pass routeId to backend for filtering to only show selected route's arrivals
    const url = `/api/bus/arrivals?stopId=${encodeURIComponent(params.stopId || '')}&routeId=${encodeURIComponent(params.routeId || '')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch bus arrivals');
    const data = await res.json();
    const arrivals = data.arrivals || [];
    const mainArrival = arrivals[0];
    const secondArrival = arrivals[1];
    const thirdArrival = arrivals[2];
    // Use the stored route ID (e.g., "MTA NYCT_M31") for stable identification
    // TrackCard will extract the short name (e.g., "M31") for display using getBusRouteNumber
    const savedRouteId = params.routeId || '';
    // Use the API's short name if available, otherwise extract from saved route ID
    const getDisplayLine = (arrival: any) => arrival?.routeShortName || savedRouteId.split('_')[1] || 'Bus';
    return {
      direction: 'Bus',
      line: savedRouteId || mainArrival?.routeShortName || 'Bus',
      destination: mainArrival?.destinationName || 'Bus Service',
      subtitle: data.stopName || '',
      arrivalMinutes: [mainArrival?.arrivalMinutes ?? 99, secondArrival?.arrivalMinutes ?? 99, thirdArrival?.arrivalMinutes ?? 99],
      arrivalLines: [getDisplayLine(mainArrival), getDisplayLine(secondArrival), getDisplayLine(thirdArrival)],
      isBus: true,
    };
  };

  const makeArrivalQueryFn = (queryKey: any[]) => async () => {
    const params = queryKey[1] as { stopId?: string; stop?: string; station?: string; direction?: string; lines?: string; line?: string; routeId?: string; routeIds?: string; isPATH?: boolean; isBus?: boolean; isCitibike?: boolean; isFerry?: boolean; isNJT?: boolean };
    if (params.isCitibike) return null as unknown as SubwayArrival;
    if (params.isBus) return transformBusArrivals(params);
    if (params.isFerry) {
      const url = `/api/ferry/arrivals?routeIds=${encodeURIComponent(params.routeIds || '')}&stopId=${encodeURIComponent(params.stopId || '')}&direction=${encodeURIComponent(params.direction || 'Inbound')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch ferry arrivals');
      return res.json();
    }
    if (params.isNJT) {
      const url = `/api/njt/arrivals?stop=${encodeURIComponent(params.stop || '')}&direction=${encodeURIComponent(params.direction || '')}&line=${encodeURIComponent(params.line || '')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch NJT arrivals');
      return res.json();
    }
    const url = params.isPATH
      ? `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction || '')}&line=${params.line}`
      : `/api/subway/arrivals?stopId=${params.stopId}&direction=${params.direction}&lines=${encodeURIComponent(params.lines || '')}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch arrivals');
    return res.json();
  };

  const isNonFetchableRow = (line?: string) => !line || line === 'CITIBIKE' || line === 'DRIVING';

  // Fetch real-time arrivals for row 1 (subway, PATH, bus, or ferry)
  const row1QueryKey = getArrivalsQueryKey(row1Pref, 1);
  const { data: row1Arrivals } = useQuery<SubwayArrival>({
    queryKey: row1QueryKey,
    queryFn: makeArrivalQueryFn(row1QueryKey),
    refetchInterval: 30 * 1000,
    enabled: !isNonFetchableRow(row1Pref?.line),
  });

  // Fetch real-time arrivals for row 2 (subway, PATH, bus, or ferry)
  const row2QueryKey = getArrivalsQueryKey(row2Pref, 2);
  const { data: row2Arrivals } = useQuery<SubwayArrival>({
    queryKey: row2QueryKey,
    queryFn: makeArrivalQueryFn(row2QueryKey),
    refetchInterval: 30 * 1000,
    enabled: !isNonFetchableRow(row2Pref?.line),
  });

  // Fetch real-time arrivals for row 3
  const row3QueryKey = getArrivalsQueryKey(row3Pref, 3);
  const { data: row3Arrivals } = useQuery<SubwayArrival>({
    queryKey: row3QueryKey,
    queryFn: makeArrivalQueryFn(row3QueryKey),
    refetchInterval: 30 * 1000,
    enabled: transportRows >= 3 && !isNonFetchableRow(row3Pref?.line),
  });

  // Fetch real-time arrivals for row 4
  const row4QueryKey = getArrivalsQueryKey(row4Pref, 4);
  const { data: row4Arrivals } = useQuery<SubwayArrival>({
    queryKey: row4QueryKey,
    queryFn: makeArrivalQueryFn(row4QueryKey),
    refetchInterval: 30 * 1000,
    enabled: transportRows >= 4 && !isNonFetchableRow(row4Pref?.line),
  });

  // Check if any line in the same-color group has an alert
  const hasAlertForLine = (line: string): boolean => {
    if (!alertsData?.alertsByRoute) return false;
    
    // For PATH, LIRR, MNR - check specific line
    if (line.startsWith('PATH-') || line.startsWith('LIRR-') || line.startsWith('MNR-')) {
      return !!alertsData.alertsByRoute[line]?.hasAlert;
    }
    
    // For subway, check all same-color lines
    const sameColorLines = getSameColorLines(line);
    return sameColorLines.some(l => alertsData.alertsByRoute[l]?.hasAlert);
  };

  // Get all alert descriptions for a line and same-color group
  const getAlertDescriptions = (line: string): string[] => {
    if (!alertsData?.alertsByRoute) return [];
    
    const allDescriptions: string[] = [];
    
    // For PATH, LIRR, MNR - get specific line alerts only
    if (line.startsWith('PATH-') || line.startsWith('LIRR-') || line.startsWith('MNR-')) {
      const alert = alertsData.alertsByRoute[line];
      if (alert?.descriptions) {
        allDescriptions.push(...alert.descriptions);
      }
      return allDescriptions;
    }
    
    // For subway, collect alerts from all same-color lines
    const sameColorLines = getSameColorLines(line);
    for (const l of sameColorLines) {
      const alert = alertsData.alertsByRoute[l];
      if (alert?.descriptions) {
        allDescriptions.push(...alert.descriptions);
      }
    }
    
    // Remove duplicates
    return Array.from(new Set(allDescriptions));
  };

  // Combine arrivals for display
  const fallback = (pref: typeof rowPrefs[0], defaultLine: string): SubwayArrival => ({
    direction: "Loading",
    line: pref?.line ?? defaultLine,
    destination: "Loading...",
    subtitle: "",
    arrivalMinutes: [],
    arrivalLines: [],
  });
  const subwayData: SubwayArrival[] = [
    applyCommuteFilter(row1Arrivals || fallback(row1Pref, "N")),
    applyCommuteFilter(row2Arrivals || fallback(row2Pref, "W")),
    ...(transportRows >= 3 ? [applyCommuteFilter(row3Arrivals || fallback(row3Pref, "N"))] : []),
    ...(transportRows >= 4 ? [applyCommuteFilter(row4Arrivals || fallback(row4Pref, "W"))] : []),
  ];

  // Heights account for the station label rendered above each card
  const labelHeight = transportRows === 4 ? 16 : 20;
  const labelOverhead = labelHeight + 3; // font height + gap below label
  const rowHeight = transportRows >= 3
    ? Math.floor((400 - (transportRows - 1) * 9 - transportRows * labelOverhead) / transportRows)
    : 115 - labelOverhead;

  const getStationLabel = (pref: typeof rowPrefs[0], track: SubwayArrival): string | null => {
    if (!pref || pref.line === 'CITIBIKE' || pref.line === 'DRIVING') return null;
    if (track.isBus) return track.subtitle || null;
    if (pref.line.startsWith('FERRY-')) {
      const routeId = pref.line.replace('FERRY-', '');
      const stop = FERRY_LINE_MAP[routeId]?.stops.find(s => s.id === pref.stop);
      return stop?.name ?? pref.stop ?? null;
    }
    return pref.stop || null;
  };

  // Fallback weather data while loading
  const defaultWeather = { icon: "day-sunny" as WeatherIconName, temperature: "--°", description: "Loading", rainToday: false, snowToday: false };

  // Convert temperature based on settings
  const convertTemperature = (tempStr: string): string => {
    if (!settings || settings.temperatureUnit === "fahrenheit") {
      return tempStr;
    }
    const match = tempStr.match(/(-?\d+)/);
    if (match) {
      const fahrenheit = parseInt(match[1], 10);
      const celsius = Math.round((fahrenheit - 32) * 5 / 9);
      return `${celsius}°`;
    }
    return tempStr;
  };

  const w = weatherData || defaultWeather;
  const displayWeather = { ...w, temperature: convertTemperature(w.temperature) };


  const handleRowClick = (rowIndex: number) => {
    if (isEditMode) {
      // Navigate to settings with edit context
      // Row 1 is index 0, Row 2 is index 1
      const rowNumber = rowIndex + 1;
      setLocation(`/settings?editRow=${rowNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: 'center center' }}>
        <main
          ref={mainRef}
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11 relative"
          style={{ width: '800px', height: '480px', overflow: 'auto' }}
          data-testid="kiosk-main"
        >
        {/* Settings/Edit mode toggle - bottom right corner */}
        <div className="absolute bottom-[-5px] right-[-1px] z-20">
          {isEditMode ? (
            <button
              onClick={() => setIsEditMode(false)}
              className="block p-4 cursor-pointer"
              data-testid="button-cancel-edit"
            >
              <div
                className="rounded-[6px] flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ width: '28px', height: '28px', backgroundColor: '#2D2C31' }}
              >
                <Settings className="w-5 h-5 text-white" />
              </div>
            </button>
          ) : (
            <button
              onClick={() => setIsEditMode(true)}
              className="block p-4 cursor-pointer"
              data-testid="button-enter-edit"
            >
              <Settings className="w-6 h-6 text-white" data-testid="button-settings" />
            </button>
          )}
        </div>

        {transportRows >= 3 ? (
          /* 3 or 4 row mode: fill entire content area, no clock/weather */
          <section
            className="flex flex-col items-start justify-center"
            style={{ gap: '9px', height: '400px' }}
            data-testid="section-tracks"
          >
            {subwayData.map((track, idx) => {
              const pref = rowPrefs[idx];
              const isCitibikeRow = pref?.line === 'CITIBIKE';
              const isDrivingRow = pref?.line === 'DRIVING';
              const citibikeSlots = isCitibikeRow ? (() => { try { return JSON.parse(pref!.stop).slots; } catch { return [null, null, null]; } })() : null;
              const drivingSlots: (DrivingSlot | null)[] = isDrivingRow ? (() => { try { return JSON.parse(pref!.stop).slots; } catch { return [null, null, null]; } })() : [null, null, null];
              const stationLabel = getStationLabel(pref, track);
              return (
              <div
                key={idx}
                onPointerDown={onRowPointerDown(idx)}
                onPointerMove={onRowPointerMove(idx)}
                onPointerUp={onRowPointerUp(idx)}
                onPointerCancel={onRowPointerUp(idx)}
                style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginLeft: idx === 2 ? '250px' : '0', touchAction: 'pan-y', ...rowDragStyle(idx) }}
              >
                {stationLabel && !isDrivingRow && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: `${labelHeight}px`, fontWeight: 700, color: '#ffffff' }}>
                      {stationLabel}
                    </span>
                    {isEditMode && !isCitibikeRow && (
                      <FavoriteBox
                        favorited={isRowFavorited(idx)}
                        word={favoriteWord(pref?.line)}
                        onClick={() => toggleFavorite(idx)}
                      />
                    )}
                  </div>
                )}
                <div
                  onClick={() => handleRowClick(idx)}
                  className={`relative ${isEditMode ? 'cursor-pointer edit-mode-outline' : ''}`}
                  data-testid={`track-row-${idx}`}
                >
                  {isCitibikeRow ? (
                    <CitibikeDockRow slots={citibikeSlots} stations={citibikeStations} rowHeight={rowHeight} labelHeight={labelHeight} showParking={showParking} />
                  ) : isDrivingRow ? (
                    <DrivingRouteCard slots={drivingSlots} rowHeight={rowHeight} labelHeight={labelHeight} />
                  ) : (
                    <TrackCard
                      direction={track.direction}
                      line={track.line}
                      destination={track.destination}
                      subtitle={track.subtitle}
                      arrivalMinutes={track.arrivalMinutes}
                      arrivalLines={track.arrivalLines}
                      isDowntown={idx % 2 === 1}
                      hasAlert={hasAlertForLine(track.line)}
                      alertDescriptions={getAlertDescriptions(track.line)}
                      isBus={track.isBus}
                      rowHeight={rowHeight}
                    />
                  )}
                  {isEditMode && <EditOverlay label={`Edit Row ${idx + 1}`} />}
                </div>
              </div>
              );
            })}
          </section>
        ) : (
          /* 2 row mode: original layout with clock and weather */
          <section className="flex flex-col gap-4 mb-6 items-start" data-testid="section-tracks">
            {subwayData.map((track, idx) => {
              const pref = rowPrefs[idx];
              const isCitibikeRow = pref?.line === 'CITIBIKE';
              const isDrivingRow = pref?.line === 'DRIVING';
              const citibikeSlots = isCitibikeRow ? (() => { try { return JSON.parse(pref!.stop).slots; } catch { return [null, null, null]; } })() : null;
              const drivingSlots: (DrivingSlot | null)[] = isDrivingRow ? (() => { try { return JSON.parse(pref!.stop).slots; } catch { return [null, null, null]; } })() : [null, null, null];
              const stationLabel = getStationLabel(pref, track);
              return (
              <div
                key={idx}
                onPointerDown={onRowPointerDown(idx)}
                onPointerMove={onRowPointerMove(idx)}
                onPointerUp={onRowPointerUp(idx)}
                onPointerCancel={onRowPointerUp(idx)}
                style={{ display: 'flex', flexDirection: 'column', gap: '3px', touchAction: 'pan-y', ...rowDragStyle(idx) }}
              >
                {stationLabel && !isDrivingRow && (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: `${labelHeight}px`, fontWeight: 700, color: '#ffffff' }}>
                      {stationLabel}
                    </span>
                    {isEditMode && !isCitibikeRow && (
                      <FavoriteBox
                        favorited={isRowFavorited(idx)}
                        word={favoriteWord(pref?.line)}
                        onClick={() => toggleFavorite(idx)}
                      />
                    )}
                  </div>
                )}
                <div
                  onClick={() => handleRowClick(idx)}
                  className={`relative ${isEditMode ? 'cursor-pointer edit-mode-outline' : ''}`}
                  data-testid={`track-row-${idx}`}
                >
                  {isCitibikeRow ? (
                    <CitibikeDockRow slots={citibikeSlots} stations={citibikeStations} rowHeight={rowHeight} labelHeight={labelHeight} showParking={showParking} />
                  ) : isDrivingRow ? (
                    <DrivingRouteCard slots={drivingSlots} rowHeight={rowHeight} labelHeight={labelHeight} />
                  ) : (
                    <TrackCard
                      direction={track.direction}
                      line={track.line}
                      destination={track.destination}
                      subtitle={track.subtitle}
                      arrivalMinutes={track.arrivalMinutes}
                      arrivalLines={track.arrivalLines}
                      isDowntown={idx === 1}
                      hasAlert={hasAlertForLine(track.line)}
                      alertDescriptions={getAlertDescriptions(track.line)}
                      isBus={track.isBus}
                      rowHeight={rowHeight}
                    />
                  )}
                  {isEditMode && <EditOverlay label={`Edit Row ${idx + 1}`} />}
                </div>
              </div>
              );
            })}
          </section>
        )}

        {transportRows < 3 && <section className="relative flex-1">
          <div className="flex flex-col justify-center items-start h-full">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '25px', ...(isEditMode ? { width: '537px' } : {}) }}>
              <div
                className={`relative inline-flex items-center flex-shrink-0 ${isEditMode ? 'cursor-pointer' : ''}`}
                style={{
                  transform: 'translateY(-2px)',
                  padding: '8px 12px',
                  height: '169px',
                  borderRadius: '12px',
                  ...(isEditMode ? { boxShadow: '0 0 0 3px #FFFFFF' } : {})
                }}
                onClick={() => isEditMode && setLocation('/clock-settings')}
                data-testid="clock-edit-area"
              >
                <ClockDisplay
                  format={settings?.clockFormat === "24hr" ? "24" : "12"}
                  hideAmPm={isEditMode}
                />
                {isEditMode && <EditOverlay label="Edit Clock" />}
              </div>
              {isEditMode && (
                <div
                  className="cursor-pointer"
                  style={{
                    flex: 1,
                    height: '30px',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 3px #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 20px',
                    transform: 'translateX(20px) translateY(-2px)',
                    position: 'relative',
                    zIndex: 50,
                  }}
                  onClick={() => setLocation('/settings-menu')}
                  data-testid="other-settings-edit-area"
                >
                  <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '19px', fontWeight: 600, color: '#FFFFFF', whiteSpace: 'nowrap' }}>
                    Other Settings
                  </div>
                </div>
              )}
            </div>
          </div>

          <div data-testid="section-weather">
            <div
              className="absolute"
              style={{
                left: '562px',
                top: '50%',
                transform: 'translateY(calc(-50% - 3px))'
              }}
            >
              <div
                className={`relative flex items-center justify-center ${isEditMode ? 'cursor-pointer' : ''}`}
                style={{ width: '169px', height: '169px' }}
                onClick={() => isEditMode && setLocation('/weather-settings')}
                data-testid="weather-edit-area"
              >
                <WeatherTile
                  icon={displayWeather.icon}
                  temperature={displayWeather.temperature}
                  description={displayWeather.description}
                  rainToday={isEditMode ? false : displayWeather.rainToday}
                  snowToday={isEditMode ? false : displayWeather.snowToday}
                />
                {isEditMode && <EditOverlay label="Edit Weather" style={{ left: '-24px', bottom: '66px', boxShadow: '0 0 0 3px #FFFFFF' }} />}
              </div>
            </div>
          </div>
        </section>}
        {!isEditMode && (
          <div className="absolute bottom-[1px] left-1/2 -translate-x-1/2 pointer-events-none">
            <img src={moovmiiLogoV2} alt="moovmii" style={{ height: 18 }} />
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
