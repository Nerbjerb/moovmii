import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Settings } from "lucide-react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import GridOverlay from "@/components/GridOverlay";
import type { SubwayArrival, WeatherData } from "@shared/schema";
import type { WeatherIconName } from "@shared/weatherIconMapper";

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

  // Fetch real-time subway data from MTA
  const { data: subwayData, isLoading: isSubwayLoading } = useQuery<SubwayArrival[]>({
    queryKey: ['/api/subway'],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds for real-time updates
  });

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

  // Fallback subway data while loading
  const defaultSubway: SubwayArrival[] = [
    {
      direction: "Uptown",
      line: "N",
      destination: "Queens",
      subtitle: "Astoria-Ditmars Blvd",
      arrivalMinutes: [],
      arrivalLines: [],
    },
    {
      direction: "Downtown",
      line: "W",
      destination: "Manhattan",
      subtitle: "Coney Island-Stillwell Ave",
      arrivalMinutes: [],
      arrivalLines: [],
    },
  ];

  const displayWeather = weatherData || defaultWeather;
  const displaySubway = subwayData || defaultSubway;

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
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11 relative cursor-pointer select-none"
          style={{ width: '800px', height: '480px', touchAction: 'manipulation' }}
          onDoubleClick={handleDoubleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          data-testid="kiosk-main"
        >
        {/* Settings icon - bottom right corner */}
        <div className="absolute bottom-[10px] right-[10px]">
          <Link href="/settings" data-testid="link-settings">
            <Settings className="w-5 h-5 text-white cursor-pointer" data-testid="button-settings" />
          </Link>
        </div>

        <section className="flex flex-col gap-4 mb-6 items-start" data-testid="section-tracks">
          {displaySubway.map((track, idx) => (
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
