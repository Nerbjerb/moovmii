import { useState, useEffect } from "react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import KioskControls from "@/components/KioskControls";
import type { SubwayArrival, WeatherData } from "@shared/schema";

export default function Kiosk() {
  const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");
  const [currentTime, setCurrentTime] = useState(new Date());

  const sampleTracks: SubwayArrival[] = [
    {
      direction: "Uptown",
      line: "N",
      destination: "Queens",
      subtitle: "Astoria-Ditmars Blvd",
      arrivalMinutes: [12, 15, 20],
    },
    {
      direction: "Downtown",
      line: "W",
      destination: "Manhattan",
      subtitle: "Coney Island-Stillwell Ave",
      arrivalMinutes: [2, 8, 14],
    },
  ];

  // Calculate weather times dynamically
  const getCurrentWeatherTime = () => {
    return "Current";
  };

  const getFutureWeatherTime = () => {
    const futureTime = new Date(currentTime.getTime() + 9 * 60 * 60 * 1000); // 9 hours later
    const hours = futureTime.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:00${ampm}`;
  };

  const sampleWeather: WeatherData[] = [
    { icon: "sun", temperature: "70°F", description: "Sunny", time: getCurrentWeatherTime() },
    { icon: "rain", temperature: "61°F", description: "Showers", time: getFutureWeatherTime() },
  ];

  const [tracks, setTracks] = useState(sampleTracks);

  useEffect(() => {
    // Update current time every minute
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTracks((prevTracks) =>
        prevTracks.map((track) => {
          const updatedMinutes = track.arrivalMinutes.map((min) => Math.max(1, min - 1));
          if (updatedMinutes[0] <= 0) {
            updatedMinutes.push(updatedMinutes.shift()! + 6);
          }
          return { ...track, arrivalMinutes: updatedMinutes };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleFullscreenToggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <header className="w-full max-w-[1400px] flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold" data-testid="text-brand">moovmii</h1>
        <KioskControls
          timeFormat={timeFormat}
          onTimeFormatChange={setTimeFormat}
          onFullscreenToggle={handleFullscreenToggle}
        />
      </header>

      <main 
        className="bg-[#0b0b0b] rounded-md shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col"
        style={{ width: '800px', height: '480px' }}
      >
        <section className="flex flex-col gap-4 mb-6" data-testid="section-tracks">
          {tracks.map((track, idx) => (
            <TrackCard
              key={idx}
              direction={track.direction}
              line={track.line}
              destination={track.destination}
              subtitle={track.subtitle}
              arrivalMinutes={track.arrivalMinutes}
            />
          ))}
        </section>

        <section className="grid grid-cols-[1fr_auto] gap-8 items-start flex-1">
          <div className="flex flex-col justify-center">
            <ClockDisplay format={timeFormat} />
          </div>

          <div className="flex flex-col gap-2" data-testid="section-weather">
            <h2 className="text-white text-lg font-medium">Forecast</h2>
            <div className="flex gap-3">
              {sampleWeather.map((weather, idx) => (
                <WeatherTile
                  key={idx}
                  icon={weather.icon as "sun" | "rain"}
                  temperature={weather.temperature}
                  description={weather.description}
                  time={weather.time}
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-4 text-sm text-muted-foreground" data-testid="text-footer">
        Prototype — data mocked. Replace mocked fetch functions with MTA/OpenWeather calls.
      </footer>
    </div>
  );
}
