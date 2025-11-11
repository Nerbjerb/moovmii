import sunnyIcon from "@assets/moovmii/Weather Icons/svg/wi-day-sunny.svg";
import showersIcon from "@assets/moovmii/Weather Icons/svg/wi-day-showers.svg";
import rainIcon from "@assets/moovmii/Weather Icons/svg/wi-day-rain.svg";
import cloudyIcon from "@assets/moovmii/Weather Icons/svg/wi-day-cloudy.svg";
import snowIcon from "@assets/moovmii/Weather Icons/svg/wi-day-snow.svg";
import thunderstormIcon from "@assets/moovmii/Weather Icons/svg/wi-day-storm-showers.svg";
import fogIcon from "@assets/moovmii/Weather Icons/svg/wi-day-fog.svg";
import windyIcon from "@assets/moovmii/Weather Icons/svg/wi-day-cloudy-windy.svg";

interface WeatherTileProps {
  icon: "sun" | "rain" | "showers" | "cloudy" | "snow" | "thunderstorm" | "fog" | "windy";
  temperature: string;
  description: string;
  time: string;
}

const weatherIcons: Record<string, string> = {
  sun: sunnyIcon,
  rain: rainIcon,
  showers: showersIcon,
  cloudy: cloudyIcon,
  snow: snowIcon,
  thunderstorm: thunderstormIcon,
  fog: fogIcon,
  windy: windyIcon,
};

export default function WeatherTile({ icon, temperature, description, time }: WeatherTileProps) {
  const iconSrc = weatherIcons[icon];

  return (
    <div className="bg-[#0F0F0F] rounded-lg w-[120px] h-[88px] text-white flex flex-col items-center justify-center gap-1" data-testid="weather-tile">
      <div className="text-xs font-medium" data-testid="text-weather-time">{time}</div>
      {iconSrc && (
        <img 
          src={iconSrc} 
          alt={description} 
          className="w-12 h-12 object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      )}
      <div className="text-lg font-bold -mt-1" data-testid="text-temperature">{temperature}</div>
      <div className="text-xs -mt-1" data-testid="text-description">{description}</div>
    </div>
  );
}
