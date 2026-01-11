import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Settings, Pencil } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import GridOverlay from "@/components/GridOverlay";
import type { SubwayArrival, WeatherData, KioskPreference, KioskSettings } from "@shared/schema";
import type { WeatherIconName } from "@shared/weatherIconMapper";
import { getStopId, getSameColorLines } from "@shared/stopMetadata";

export default function Kiosk() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditMode, setIsEditMode] = useState(false);
  const [, setLocation] = useLocation();

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

  // Get preferences for each row
  const row1Pref = preferences?.find(p => p.row === 1);
  const row2Pref = preferences?.find(p => p.row === 2);

  // Build query parameters for dynamic arrivals (subway or PATH)
  const getArrivalsQueryKey = (pref: KioskPreference | undefined, rowNum: number) => {
    // Default fallback to Broadway-Astoria N/W
    const defaultStopId = "R05";
    const defaultDirection = rowNum === 1 ? "Uptown" : "Downtown";
    const defaultLines = "N,W";
    
    if (!pref) {
      return ['/api/subway/arrivals', { stopId: defaultStopId, direction: defaultDirection, lines: defaultLines, isPATH: false }];
    }
    
    // Check if this is a PATH line
    const isPATH = pref.line.startsWith('PATH-');
    
    const stopId = getStopId(pref.stop, pref.line);
    const sameColorLines = getSameColorLines(pref.line);
    
    // If stop ID not found in metadata, fall back to defaults
    if (!stopId) {
      console.warn(`Stop ID not found for ${pref.stop} on ${pref.line}, using default`);
      return ['/api/subway/arrivals', { stopId: defaultStopId, direction: defaultDirection, lines: defaultLines, isPATH: false }];
    }
    
    // For PATH, convert direction: Uptown -> "To NY", Downtown -> "To NJ"
    const pathDirection = pref.direction === 'Uptown' ? 'To NY' : 'To NJ';
    
    if (isPATH) {
      return ['/api/path/arrivals', { station: stopId, direction: pathDirection, line: pref.line, isPATH: true }];
    }
    
    return ['/api/subway/arrivals', { stopId, direction: pref.direction, lines: sameColorLines.join(','), isPATH: false }];
  };

  // Fetch real weather data from OpenWeatherMap
  const { data: weatherData, isLoading: isWeatherLoading } = useQuery<Array<{
    icon: WeatherIconName;
    temperature: string;
    description: string;
    time: string;
  }>>({
    queryKey: ['/api/weather'],
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  // Fetch real-time arrivals for row 1 (subway or PATH)
  const row1QueryKey = getArrivalsQueryKey(row1Pref, 1);
  const { data: row1Arrivals, isLoading: isRow1Loading } = useQuery<SubwayArrival>({
    queryKey: row1QueryKey,
    queryFn: async () => {
      const params = row1QueryKey[1] as { stopId?: string; station?: string; direction: string; lines?: string; line?: string; isPATH: boolean };
      let url: string;
      if (params.isPATH) {
        url = `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction)}&line=${params.line}`;
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

  // Fetch real-time arrivals for row 2 (subway or PATH)
  const row2QueryKey = getArrivalsQueryKey(row2Pref, 2);
  const { data: row2Arrivals, isLoading: isRow2Loading } = useQuery<SubwayArrival>({
    queryKey: row2QueryKey,
    queryFn: async () => {
      const params = row2QueryKey[1] as { stopId?: string; station?: string; direction: string; lines?: string; line?: string; isPATH: boolean };
      let url: string;
      if (params.isPATH) {
        url = `/api/path/arrivals?station=${params.station}&direction=${encodeURIComponent(params.direction)}&line=${params.line}`;
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
  const subwayData: SubwayArrival[] = [
    row1Arrivals || {
      direction: "Uptown",
      line: "N",
      destination: "Loading...",
      subtitle: "",
      arrivalMinutes: [],
      arrivalLines: [],
    },
    row2Arrivals || {
      direction: "Downtown",
      line: "W",
      destination: "Loading...",
      subtitle: "",
      arrivalMinutes: [],
      arrivalLines: [],
    },
  ];

  // Fallback weather data while loading
  const defaultWeather: Array<{
    icon: WeatherIconName;
    temperature: string;
    description: string;
    time: string;
  }> = [
    { icon: "day-sunny", temperature: "--°", description: "Loading", time: "..." },
    { icon: "day-cloudy", temperature: "--°", description: "Loading", time: "..." },
  ];

  // Convert temperature based on settings
  const convertTemperature = (tempStr: string): string => {
    if (!settings || settings.temperatureUnit === "fahrenheit") {
      return tempStr; // Already in Fahrenheit from API
    }
    // Convert from Fahrenheit to Celsius
    const match = tempStr.match(/(-?\d+)/);
    if (match) {
      const fahrenheit = parseInt(match[1], 10);
      const celsius = Math.round((fahrenheit - 32) * 5 / 9);
      return `${celsius}°`;
    }
    return tempStr;
  };

  const displayWeather = (weatherData || defaultWeather).map(w => ({
    ...w,
    temperature: convertTemperature(w.temperature),
  }));

  useEffect(() => {
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const handleRowClick = (rowIndex: number) => {
    if (isEditMode) {
      // Navigate to settings with edit context
      // Row 1 is index 0, Row 2 is index 1
      const rowNumber = rowIndex + 1;
      setLocation(`/settings?editRow=${rowNumber}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11 relative overflow-hidden"
          style={{ width: '800px', height: '480px' }}
          data-testid="kiosk-main"
        >
        {/* Bottom left corner - Edit mode toggle */}
        <div className="absolute bottom-[-5px] left-[2px] z-20">
          {isEditMode ? (
            <button 
              onClick={() => setIsEditMode(false)}
              className="block p-4 cursor-pointer"
              data-testid="button-cancel-edit"
            >
              <div 
                className="rounded-[6px] flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ 
                  width: '70px', 
                  height: '28px', 
                  backgroundColor: '#2D2C31'
                }}
              >
                <span 
                  className="font-bold"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '14px', color: '#FFFFFF' }}
                >
                  Cancel
                </span>
              </div>
            </button>
          ) : (
            <button 
              onClick={() => setIsEditMode(true)}
              className="block p-4 cursor-pointer"
              data-testid="button-enter-edit"
            >
              <Pencil className="w-6 h-6 text-white" data-testid="icon-pencil" />
            </button>
          )}
        </div>


        {/* Settings icon - bottom right corner */}
        <div className="absolute bottom-[-5px] right-[2px]">
          <Link href="/settings" className="block p-4" data-testid="link-settings">
            <Settings className="w-6 h-6 text-white cursor-pointer" data-testid="button-settings" />
          </Link>
        </div>

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
              />
              {isEditMode && (
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ 
                    backgroundColor: 'rgba(255, 210, 0, 0.1)',
                    borderRadius: '12px'
                  }}
                >
                  <div 
                    className="rounded-[6px] px-4 py-2"
                    style={{ backgroundColor: '#ffd200' }}
                  >
                    <span 
                      className="font-bold text-black"
                      style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}
                    >
                      Edit Row {idx + 1}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="relative flex-1">
          <div className="flex flex-col justify-center items-start h-full">
            <div 
              className="inline-block"
              style={isEditMode ? { 
                boxShadow: '0 0 0 3px #FFFFFF',
                borderRadius: '12px',
                padding: '8px 12px'
              } : {}}
            >
              <ClockDisplay format={settings?.clockFormat === "24hr" ? "24" : "12"} />
            </div>
          </div>

          <div data-testid="section-weather">
            <div 
              className="absolute" 
              style={{ 
                left: '490px', 
                top: '50%', 
                transform: 'translateY(calc(-50% - 3px))'
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: '105px',
                  height: '164px',
                  ...(isEditMode ? { boxShadow: '0 0 0 3px #FFFFFF', borderRadius: '8px' } : {})
                }}
              >
                <WeatherTile
                  icon={displayWeather[0].icon}
                  temperature={displayWeather[0].temperature}
                  description={displayWeather[0].description}
                  time={displayWeather[0].time}
                />
              </div>
            </div>
            <div 
              className="absolute" 
              style={{ 
                left: '606px', 
                top: '50%', 
                transform: 'translateY(calc(-50% - 3px))'
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: '105px',
                  height: '164px',
                  ...(isEditMode ? { boxShadow: '0 0 0 3px #FFFFFF', borderRadius: '8px' } : {})
                }}
              >
                <WeatherTile
                  icon={displayWeather[1].icon}
                  temperature={displayWeather[1].temperature}
                  description={displayWeather[1].description}
                  time={displayWeather[1].time}
                />
              </div>
            </div>
          </div>
        </section>
        </main>
      </div>
    </div>
  );
}
