import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Settings } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import type { SubwayArrival, KioskPreference, KioskSettings } from "@shared/schema";
import type { WeatherIconName } from "@shared/weatherIconMapper";
import { getStopId, getSameColorLines } from "@shared/stopMetadata";
import moovmiiLogoV2 from "@assets/moovmii logo v2 (White).png";

export default function Kiosk() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [, setLocation] = useLocation();

  const scaleMap: Record<string, number> = { '800x480': 1, '1024x600': 1.25, '1280x800': 1.6, '1920x1080': 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem('kioskResolution') || '800x480'] || 1);

  // Fetch preferences
  const { data: preferences } = useQuery<KioskPreference[]>({
    queryKey: ['/api/preferences'],
  });

  // Fetch service alerts with descriptions
  const { data: alertsData } = useQuery<{ alertsByRoute: Record<string, { hasAlert: boolean; descriptions: string[] }> }>({
    queryKey: ['/api/alerts'],
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  // Fetch settings
  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ['/api/settings'],
  });

  const transportRows = settings?.transportRows ?? 2;

  // Get preferences for each row
  const row1Pref = preferences?.find(p => p.row === 1);
  const row2Pref = preferences?.find(p => p.row === 2);
  const row3Pref = preferences?.find(p => p.row === 3);
  const row4Pref = preferences?.find(p => p.row === 4);

  // Build query parameters for dynamic arrivals (subway, PATH, or bus)
  const getArrivalsQueryKey = (pref: KioskPreference | undefined, rowNum: number) => {
    // Default fallback to Broadway-Astoria N/W
    const defaultStopId = "R05";
    const defaultDirection = rowNum === 1 ? "Uptown" : "Downtown";
    const defaultLines = "N,W";
    
    if (!pref) {
      return ['/api/subway/arrivals', { stopId: defaultStopId, direction: defaultDirection, lines: defaultLines, isPATH: false, isBus: false }];
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

  // Fetch real-time arrivals for row 1 (subway, PATH, or bus)
  const row1QueryKey = getArrivalsQueryKey(row1Pref, 1);
  const { data: row1Arrivals } = useQuery<SubwayArrival>({
    queryKey: row1QueryKey,
    queryFn: async () => {
      const params = row1QueryKey[1] as { stopId?: string; station?: string; direction?: string; lines?: string; line?: string; routeId?: string; isPATH?: boolean; isBus?: boolean };
      if (params.isBus) {
        return transformBusArrivals(params);
      } 
      let url: string;
      if (params.isPATH) {
        url = `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction || '')}&line=${params.line}`;
      } else {
        url = `/api/subway/arrivals?stopId=${params.stopId}&direction=${params.direction}&lines=${encodeURIComponent(params.lines || '')}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch arrivals');
      return res.json();
    },
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
    enabled: true,
  });

  // Fetch real-time arrivals for row 2 (subway, PATH, or bus)
  const row2QueryKey = getArrivalsQueryKey(row2Pref, 2);
  const { data: row2Arrivals } = useQuery<SubwayArrival>({
    queryKey: row2QueryKey,
    queryFn: async () => {
      const params = row2QueryKey[1] as { stopId?: string; station?: string; direction?: string; lines?: string; line?: string; routeId?: string; isPATH?: boolean; isBus?: boolean };
      if (params.isBus) return transformBusArrivals(params);
      const url = params.isPATH
        ? `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction || '')}&line=${params.line}`
        : `/api/subway/arrivals?stopId=${params.stopId}&direction=${params.direction}&lines=${encodeURIComponent(params.lines || '')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch arrivals');
      return res.json();
    },
    refetchInterval: 30 * 1000,
    enabled: true,
  });

  // Fetch real-time arrivals for row 3
  const row3QueryKey = getArrivalsQueryKey(row3Pref, 3);
  const { data: row3Arrivals } = useQuery<SubwayArrival>({
    queryKey: row3QueryKey,
    queryFn: async () => {
      const params = row3QueryKey[1] as { stopId?: string; station?: string; direction?: string; lines?: string; line?: string; routeId?: string; isPATH?: boolean; isBus?: boolean };
      if (params.isBus) return transformBusArrivals(params);
      const url = params.isPATH
        ? `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction || '')}&line=${params.line}`
        : `/api/subway/arrivals?stopId=${params.stopId}&direction=${params.direction}&lines=${encodeURIComponent(params.lines || '')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch arrivals');
      return res.json();
    },
    refetchInterval: 30 * 1000,
    enabled: transportRows >= 3,
  });

  // Fetch real-time arrivals for row 4
  const row4QueryKey = getArrivalsQueryKey(row4Pref, 4);
  const { data: row4Arrivals } = useQuery<SubwayArrival>({
    queryKey: row4QueryKey,
    queryFn: async () => {
      const params = row4QueryKey[1] as { stopId?: string; station?: string; direction?: string; lines?: string; line?: string; routeId?: string; isPATH?: boolean; isBus?: boolean };
      if (params.isBus) return transformBusArrivals(params);
      const url = params.isPATH
        ? `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction || '')}&line=${params.line}`
        : `/api/subway/arrivals?stopId=${params.stopId}&direction=${params.direction}&lines=${encodeURIComponent(params.lines || '')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch arrivals');
      return res.json();
    },
    refetchInterval: 30 * 1000,
    enabled: transportRows >= 4,
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
  const fallback = (direction: string, line: string): SubwayArrival => ({
    direction, line, destination: "Loading...", subtitle: "", arrivalMinutes: [], arrivalLines: [],
  });
  const subwayData: SubwayArrival[] = [
    row1Arrivals || fallback("Uptown", "N"),
    row2Arrivals || fallback("Downtown", "W"),
    ...(transportRows >= 3 ? [row3Arrivals || fallback("Uptown", "N")] : []),
    ...(transportRows >= 4 ? [row4Arrivals || fallback("Downtown", "W")] : []),
  ];

  // Row height: 4-row mode uses shorter rows to fit above the settings gear
  const rowHeight = transportRows === 4 ? 97 : undefined;

  // Fallback weather data while loading
  const defaultWeather = { icon: "day-sunny" as WeatherIconName, temperature: "--°", description: "Loading", rainToday: false };

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
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11 relative"
          style={{ width: '800px', height: '480px', overflow: 'visible' }}
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
            {subwayData.map((track, idx) => (
              <div
                key={idx}
                onClick={() => handleRowClick(idx)}
                className={`relative ${isEditMode ? 'cursor-pointer edit-mode-outline' : ''}`}
                data-testid={`track-row-${idx}`}
              >
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
                {isEditMode && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: 'rgba(255, 210, 0, 0.1)', borderRadius: '12px' }}
                  >
                    <div className="rounded-[6px] px-4 py-2" style={{ backgroundColor: '#ffd200' }}>
                      <span className="font-bold text-black" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}>
                        Edit Row {idx + 1}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        ) : (
          /* 2 row mode: original layout with clock and weather */
          <section className="flex flex-col gap-4 mb-6 items-start" data-testid="section-tracks">
            {subwayData.map((track, idx) => (
              <div
                key={idx}
                onClick={() => handleRowClick(idx)}
                className={`relative ${isEditMode ? 'cursor-pointer edit-mode-outline' : ''}`}
                data-testid={`track-row-${idx}`}
              >
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
                />
                {isEditMode && (
                  <div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ backgroundColor: 'rgba(255, 210, 0, 0.1)', borderRadius: '12px' }}
                  >
                    <div className="rounded-[6px] px-4 py-2" style={{ backgroundColor: '#ffd200' }}>
                      <span className="font-bold text-black" style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}>
                        Edit Row {idx + 1}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>
        )}

        {transportRows < 3 && <section className="relative flex-1">
          <div className="flex flex-col justify-center items-start h-full">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '25px', ...(isEditMode ? { width: '527px' } : {}) }}>
              <div
                className={`inline-flex items-center flex-shrink-0 ${isEditMode ? 'cursor-pointer' : ''}`}
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
              </div>
              {isEditMode && (
                <div
                  className="cursor-pointer"
                  style={{
                    flex: 1,
                    height: '85px',
                    borderRadius: '8px',
                    boxShadow: '0 0 0 3px #FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '25px',
                    marginRight: '25px',
                  }}
                  onClick={() => setLocation('/other-settings')}
                  data-testid="other-settings-edit-area"
                >
                  <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '19px', fontWeight: 600, color: '#FFFFFF', textAlign: 'center', lineHeight: 1.3 }}>
                    <div>Other</div>
                    <div>Settings</div>
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
                className={`flex items-center justify-center ${isEditMode ? 'cursor-pointer' : ''}`}
                style={{ width: '169px', height: '169px' }}
                onClick={() => isEditMode && setLocation('/weather-settings')}
                data-testid="weather-edit-area"
              >
                <WeatherTile
                  icon={displayWeather.icon}
                  temperature={displayWeather.temperature}
                  description={displayWeather.description}
                  rainToday={displayWeather.rainToday}
                  isEditMode={isEditMode}
                />
              </div>
            </div>
          </div>
        </section>}
        {!isEditMode && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <img src={moovmiiLogoV2} alt="moovmii" style={{ height: 18 }} />
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
