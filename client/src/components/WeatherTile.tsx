import sunIcon from "@assets/moovmii/Weather Icons/svg/wi-day-sunny.svg";
import rainIcon from "@assets/moovmii/Weather Icons/svg/wi-day-showers.svg";

interface WeatherTileProps {
  icon: "sun" | "rain";
  temperature: string;
  description: string;
  time: string;
}

const weatherIcons: Record<string, string> = {
  sun: sunIcon,
  rain: rainIcon,
};

export default function WeatherTile({ icon, temperature, description, time }: WeatherTileProps) {
  const iconSrc = weatherIcons[icon];

  return (
    <div className="bg-black rounded-lg p-2.5 px-3.5 text-white min-w-[200px] flex flex-col items-center" data-testid="weather-tile">
      <div className="text-sm mb-1.5" data-testid="text-weather-time">{time}</div>
      {iconSrc && (
        <img src={iconSrc} alt={description} className="w-16 h-16 object-contain" />
      )}
      <div className="font-bold mt-1.5" data-testid="text-temperature">{temperature}</div>
      <div className="text-sm" data-testid="text-description">{description}</div>
    </div>
  );
}
