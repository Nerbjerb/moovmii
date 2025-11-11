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
    <div className="bg-[#0F0F0F] rounded-lg w-[120px] h-[88px] text-white flex flex-col items-center justify-center gap-1" data-testid="weather-tile">
      <div className="text-xs font-medium" data-testid="text-weather-time">{time}</div>
      {iconSrc && (
        <img src={iconSrc} alt={description} className="w-12 h-12 object-contain" />
      )}
      <div className="text-lg font-bold -mt-1" data-testid="text-temperature">{temperature}</div>
      <div className="text-xs -mt-1" data-testid="text-description">{description}</div>
    </div>
  );
}
