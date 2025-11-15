import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import { useTrackAlignment } from "@/hooks/useTrackAlignment";
import type { SubwayArrival, WeatherData } from "@shared/schema";
import type { WeatherIconName } from "@shared/weatherIconMapper";

export default function Kiosk() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { containerRef, registerCard } = useTrackAlignment();

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
    },
    {
      direction: "Downtown",
      line: "W",
      destination: "Manhattan",
      subtitle: "Coney Island-Stillwell Ave",
      arrivalMinutes: [],
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

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <main 
          className="bg-[#0b0b0b] rounded-md shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11"
          style={{ width: '800px', height: '480px' }}
        >
        <section ref={containerRef} className="flex flex-col gap-4 mb-6 items-start" data-testid="section-tracks">
          {displaySubway.map((track, idx) => (
            <TrackCard
              key={idx}
              direction={track.direction}
              line={track.line}
              destination={track.destination}
              subtitle={track.subtitle}
              arrivalMinutes={track.arrivalMinutes}
              isDowntown={idx === 1}
              refs={registerCard(`track-${idx}`)}
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

      <footer className="mt-4 text-sm text-muted-foreground" data-testid="text-footer">
        Live data: OpenWeatherMap • MTA Real-time Subway Feed
      </footer>
    </div>
  );
}
