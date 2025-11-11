import { useState, useEffect } from "react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import KioskControls from "@/components/KioskControls";
import type { SubwayArrival, WeatherData } from "@shared/schema";

export default function Kiosk() {
  const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");

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

  const sampleWeather: WeatherData[] = [
    { icon: "sun", temperature: "70°F", description: "Sunny", time: "11:30AM" },
    { icon: "rain", temperature: "61°F", description: "Showers", time: "2:00PM" },
  ];

  const [tracks, setTracks] = useState(sampleTracks);

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
    <div className="min-h-screen bg-background flex flex-col items-center p-[18px]">
      <header className="w-full max-w-[1200px] flex justify-between items-center mb-2.5">
        <h1 className="text-3xl font-bold" data-testid="text-brand">moovmii</h1>
        <KioskControls
          timeFormat={timeFormat}
          onTimeFormatChange={setTimeFormat}
          onFullscreenToggle={handleFullscreenToggle}
        />
      </header>

      <main className="w-full max-w-[1200px] bg-[#0b0b0b] p-[22px] rounded-md shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
        <section className="flex flex-col gap-[18px]" data-testid="section-tracks">
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

        <section className="flex gap-5 items-center mt-[18px] pt-3">
          <div className="flex-1 p-2">
            <ClockDisplay format={timeFormat} />
          </div>

          <div className="w-80 flex flex-col gap-3 items-end" data-testid="section-weather">
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
        </section>
      </main>

      <footer className="mt-3 text-sm text-muted-foreground" data-testid="text-footer">
        Prototype — data mocked. Replace mocked fetch functions with MTA/OpenWeather calls.
      </footer>
    </div>
  );
}
