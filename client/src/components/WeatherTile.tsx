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
  dayLabel?: string;
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

export default function WeatherTile({ icon, temperature, description, time, dayLabel }: WeatherTileProps) {
  const iconSrc = weatherIcons[icon];

  return (
    <div className="w-[180px] h-[132px] text-white flex flex-col items-center justify-center gap-1" data-testid="weather-tile">
      {dayLabel && (
        <div className="text-xs" data-testid="text-weather-day-label">{dayLabel}</div>
      )}
      <div className="text-lg font-medium" data-testid="text-weather-time">{time}</div>
      {iconSrc && (
        <img 
          src={iconSrc} 
          alt={description} 
          className="w-[72px] h-[72px] object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
      )}
      <div className="text-[27px] font-bold -mt-1" data-testid="text-temperature">{temperature}</div>
      <div className="text-lg -mt-1" data-testid="text-description">{description}</div>
    </div>
  );
}
