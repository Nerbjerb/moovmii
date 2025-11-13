import { useState, useEffect } from "react";
import TrackCard from "@/components/TrackCard";
import ClockDisplay from "@/components/ClockDisplay";
import WeatherTile from "@/components/WeatherTile";
import KioskControls from "@/components/KioskControls";
import { useTrackAlignment } from "@/hooks/useTrackAlignment";
import type { SubwayArrival, WeatherData } from "@shared/schema";

export default function Kiosk() {
  const [timeFormat, setTimeFormat] = useState<"12" | "24">("12");
  const [currentTime, setCurrentTime] = useState(new Date());
  const { containerRef, registerCard } = useTrackAlignment();

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
    { icon: "sun", temperature: "70°", description: "Sunny", time: getCurrentWeatherTime() },
    { icon: "rain", temperature: "61°", description: "Showers", time: getFutureWeatherTime() },
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

      <div className="relative">
        {/* Top ruler */}
        <div className="absolute -top-6 left-0 w-[800px] h-5 flex items-center justify-between text-xs text-gray-600 font-mono">
          {[0, 100, 200, 300, 400, 500, 600, 700, 800].map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <div className="w-px h-2 bg-gray-400"></div>
              <span className="text-[10px]">{mark}</span>
            </div>
          ))}
        </div>
        
        {/* Left ruler */}
        <div className="absolute -left-6 top-0 w-5 h-[480px] flex flex-col items-center justify-between text-xs text-gray-600 font-mono">
          {[0, 100, 200, 300, 400, 480].map((mark) => (
            <div key={mark} className="flex items-center">
              <span className="text-[10px] mr-1">{mark}</span>
              <div className="h-px w-2 bg-gray-400"></div>
            </div>
          ))}
        </div>
        
        {/* Right ruler */}
        <div className="absolute -right-6 top-0 w-5 h-[480px] flex flex-col items-center justify-between text-xs text-gray-600 font-mono">
          {[0, 100, 200, 300, 400, 480].map((mark) => (
            <div key={mark} className="flex items-center">
              <div className="h-px w-2 bg-gray-400"></div>
              <span className="text-[10px] ml-1">{mark}</span>
            </div>
          ))}
        </div>
        
        {/* Bottom ruler */}
        <div className="absolute -bottom-6 left-0 w-[800px] h-5 flex items-center justify-between text-xs text-gray-600 font-mono">
          {[0, 100, 200, 300, 400, 500, 600, 700, 800].map((mark) => (
            <div key={mark} className="flex flex-col items-center">
              <span className="text-[10px]">{mark}</span>
              <div className="w-px h-2 bg-gray-400"></div>
            </div>
          ))}
        </div>

        <main 
          className="bg-[#0b0b0b] rounded-md shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col -z-11"
          style={{ width: '800px', height: '480px' }}
        >
        <section ref={containerRef} className="flex flex-col gap-4 mb-6 items-start" data-testid="section-tracks">
          {tracks.map((track, idx) => (
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
            <ClockDisplay format={timeFormat} />
          </div>

          <div data-testid="section-weather">
            <div className="absolute" style={{ left: '490px', top: '50%', transform: 'translateY(calc(-50% + 5px))' }}>
              <WeatherTile
                icon={sampleWeather[0].icon as "sun" | "rain"}
                temperature={sampleWeather[0].temperature}
                description={sampleWeather[0].description}
                time={sampleWeather[0].time}
              />
            </div>
            <div className="absolute" style={{ left: '606px', top: '50%', transform: 'translateY(calc(-50% + 5px))' }}>
              <WeatherTile
                icon={sampleWeather[1].icon as "sun" | "rain"}
                temperature={sampleWeather[1].temperature}
                description={sampleWeather[1].description}
                time={sampleWeather[1].time}
              />
            </div>
          </div>
        </section>
        </main>
      </div>

      <footer className="mt-4 text-sm text-muted-foreground" data-testid="text-footer">
        Prototype — data mocked. Replace mocked fetch functions with MTA/OpenWeather calls.
      </footer>
    </div>
  );
}
