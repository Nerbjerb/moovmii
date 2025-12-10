import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Settings } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import GridOverlay from "@/components/GridOverlay";
import type { SubwayArrival, WeatherData, KioskPreference } from "@shared/schema";
import type { WeatherIconName } from "@shared/weatherIconMapper";
import { getStopId, getSameColorLines } from "@shared/stopMetadata";

export default function Kiosk() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Double-tap detection with improved reliability
  const lastTapTimeRef = useRef<number>(0);
  const lastTapPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isTogglingRef = useRef<boolean>(false);
  const doubleTapDelay = 450; // Increased from 300ms for touch screen latency
  const maxTapDistance = 50; // Maximum pixels between taps to count as double-tap

  const toggleFullscreen = useCallback(() => {
    // Debounce: prevent rapid re-triggering
    if (isTogglingRef.current) return;
    isTogglingRef.current = true;
    
    // Reset debounce after 500ms
    setTimeout(() => {
      isTogglingRef.current = false;
    }, 500);

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.log('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.log('Exit fullscreen failed:', err);
      });
    }
  }, []);

  // Calculate distance between two points
  const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Handle touch start - track when finger first touches
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;

    const now = Date.now();
    const currentPosition = { x: touch.clientX, y: touch.clientY };

    // Check if this is a double-tap
    if (lastTapPositionRef.current && now - lastTapTimeRef.current < doubleTapDelay) {
      const distance = getDistance(
        lastTapPositionRef.current.x,
        lastTapPositionRef.current.y,
        currentPosition.x,
        currentPosition.y
      );

      // Only trigger if taps are close enough together
      if (distance <= maxTapDistance) {
        e.preventDefault();
        e.stopPropagation();
        toggleFullscreen();
        // Reset after successful double-tap
        lastTapTimeRef.current = 0;
        lastTapPositionRef.current = null;
        return;
      }
    }

    // Store this tap for potential double-tap detection
    lastTapTimeRef.current = now;
    lastTapPositionRef.current = currentPosition;
  }, [toggleFullscreen]);

  // Handle touch end - prevent default behaviors
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Prevent ghost clicks and other default behaviors
    e.preventDefault();
  }, []);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFullscreen();
  }, [toggleFullscreen]);

  // Fetch preferences
  const { data: preferences } = useQuery<KioskPreference[]>({
    queryKey: ['/api/preferences'],
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

  const displayWeather = weatherData || defaultWeather;

  useEffect(() => {
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11 relative cursor-pointer select-none"
          style={{ width: '800px', height: '480px', touchAction: 'manipulation' }}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="kiosk-main"
        >
        {/* Settings icon - bottom right corner */}
        <div className="absolute bottom-[5px] right-[5px]">
          <Link href="/settings" className="block p-4" data-testid="link-settings">
            <Settings className="w-6 h-6 text-white cursor-pointer" data-testid="button-settings" />
          </Link>
        </div>

        <section className="flex flex-col gap-4 mb-6 items-start" data-testid="section-tracks">
          {subwayData.map((track, idx) => (
            <TrackCard
              key={idx}
              direction={track.direction}
              line={track.line}
              destination={track.destination}
              subtitle={track.subtitle}
              arrivalMinutes={track.arrivalMinutes}
              arrivalLines={track.arrivalLines}
              isDowntown={idx === 1}
            />
          ))}
        </section>

        <section className="relative flex-1">
          <div className="flex flex-col justify-center items-start h-full">
            <ClockDisplay format="12" />
          </div>

          <div data-testid="section-weather">
            <div className="absolute" style={{ left: '490px', top: '50%', transform: 'translateY(calc(-50% - 3px))' }}>
              <WeatherTile
                icon={displayWeather[0].icon}
                temperature={displayWeather[0].temperature}
                description={displayWeather[0].description}
                time={displayWeather[0].time}
              />
            </div>
            <div className="absolute" style={{ left: '606px', top: '50%', transform: 'translateY(calc(-50% - 3px))' }}>
              <WeatherTile
                icon={displayWeather[1].icon}
                temperature={displayWeather[1].temperature}
                description={displayWeather[1].description}
                time={displayWeather[1].time}
              />
            </div>
          </div>
        </section>
        </main>
      </div>
    </div>
  );
}
