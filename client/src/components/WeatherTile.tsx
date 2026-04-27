import type { WeatherIconName } from "@shared/weatherIconMapper";

// Import all weather icons we might need
import daySunnyIcon from "@assets/moovmii/Weather Icons/svg/wi-day-sunny.svg";
import dayCloudyIcon from "@assets/moovmii/Weather Icons/svg/wi-day-cloudy.svg";
import dayRainIcon from "@assets/moovmii/Weather Icons/svg/wi-day-rain.svg";
import dayShowersIcon from "@assets/moovmii/Weather Icons/svg/wi-day-showers.svg";
import daySprinkleIcon from "@assets/moovmii/Weather Icons/svg/wi-day-sprinkle.svg";
import dayThunderstormIcon from "@assets/moovmii/Weather Icons/svg/wi-day-thunderstorm.svg";
import dayLightningIcon from "@assets/moovmii/Weather Icons/svg/wi-day-lightning.svg";
import daySnowIcon from "@assets/moovmii/Weather Icons/svg/wi-day-snow.svg";
import daySleetIcon from "@assets/moovmii/Weather Icons/svg/wi-day-sleet.svg";
import dayFogIcon from "@assets/moovmii/Weather Icons/svg/wi-day-fog.svg";
import dayHazeIcon from "@assets/moovmii/Weather Icons/svg/wi-day-haze.svg";
import dayRainMixIcon from "@assets/moovmii/Weather Icons/svg/wi-day-rain-mix.svg";
import dayStormShowersIcon from "@assets/moovmii/Weather Icons/svg/wi-day-storm-showers.svg";
import dayHailIcon from "@assets/moovmii/Weather Icons/svg/wi-day-hail.svg";
import nightClearIcon from "@assets/moovmii/Weather Icons/svg/wi-night-clear.svg";
import nightAltCloudyIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-cloudy.svg";
import nightAltPartlyCloudyIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-partly-cloudy.svg";
import nightAltRainIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-rain.svg";
import nightAltShowersIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-showers.svg";
import nightAltSprinkleIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-sprinkle.svg";
import nightAltThunderstormIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-thunderstorm.svg";
import nightAltLightningIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-lightning.svg";
import nightAltSnowIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-snow.svg";
import nightAltSleetIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-sleet.svg";
import nightFogIcon from "@assets/moovmii/Weather Icons/svg/wi-night-fog.svg";
import nightAltRainMixIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-rain-mix.svg";
import nightAltStormShowersIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-storm-showers.svg";
import nightAltHailIcon from "@assets/moovmii/Weather Icons/svg/wi-night-alt-hail.svg";
import cloudyIcon from "@assets/moovmii/Weather Icons/svg/wi-cloudy.svg";
import rainIcon from "@assets/moovmii/Weather Icons/svg/wi-rain.svg";
import showersIcon from "@assets/moovmii/Weather Icons/svg/wi-showers.svg";
import sprinkleIcon from "@assets/moovmii/Weather Icons/svg/wi-sprinkle.svg";
import thunderstormIcon from "@assets/moovmii/Weather Icons/svg/wi-thunderstorm.svg";
import lightningIcon from "@assets/moovmii/Weather Icons/svg/wi-lightning.svg";
import snowIcon from "@assets/moovmii/Weather Icons/svg/wi-snow.svg";
import sleetIcon from "@assets/moovmii/Weather Icons/svg/wi-sleet.svg";
import fogIcon from "@assets/moovmii/Weather Icons/svg/wi-fog.svg";
import smokeIcon from "@assets/moovmii/Weather Icons/svg/wi-smoke.svg";
import dustIcon from "@assets/moovmii/Weather Icons/svg/wi-dust.svg";
import tornadoIcon from "@assets/moovmii/Weather Icons/svg/wi-tornado.svg";
import hurricaneIcon from "@assets/moovmii/Weather Icons/svg/wi-hurricane.svg";
import windyIcon from "@assets/moovmii/Weather Icons/svg/wi-windy.svg";
import strongWindIcon from "@assets/moovmii/Weather Icons/svg/wi-strong-wind.svg";
import cloudyGustsIcon from "@assets/moovmii/Weather Icons/svg/wi-cloudy-gusts.svg";
import rainMixIcon from "@assets/moovmii/Weather Icons/svg/wi-rain-mix.svg";
import stormShowersIcon from "@assets/moovmii/Weather Icons/svg/wi-storm-showers.svg";
import hailIcon from "@assets/moovmii/Weather Icons/svg/wi-hail.svg";
import snowflakeColdIcon from "@assets/moovmii/Weather Icons/svg/wi-snowflake-cold.svg";
import hotIcon from "@assets/moovmii/Weather Icons/svg/wi-hot.svg";
import cloudIcon from "@assets/moovmii/Weather Icons/svg/wi-cloud.svg";

interface WeatherTileProps {
  icon: WeatherIconName;
  temperature: string;
  description: string;
  rainToday?: boolean;
  snowToday?: boolean;
  isEditMode?: boolean;
}

const weatherIcons: Record<WeatherIconName, string> = {
  'day-sunny': daySunnyIcon,
  'day-cloudy': dayCloudyIcon,
  'day-rain': dayRainIcon,
  'day-showers': dayShowersIcon,
  'day-sprinkle': daySprinkleIcon,
  'day-thunderstorm': dayThunderstormIcon,
  'day-lightning': dayLightningIcon,
  'day-snow': daySnowIcon,
  'day-sleet': daySleetIcon,
  'day-fog': dayFogIcon,
  'day-haze': dayHazeIcon,
  'day-rain-mix': dayRainMixIcon,
  'day-storm-showers': dayStormShowersIcon,
  'day-hail': dayHailIcon,
  'night-clear': nightClearIcon,
  'night-alt-cloudy': nightAltCloudyIcon,
  'night-alt-partly-cloudy': nightAltPartlyCloudyIcon,
  'night-alt-rain': nightAltRainIcon,
  'night-alt-showers': nightAltShowersIcon,
  'night-alt-sprinkle': nightAltSprinkleIcon,
  'night-alt-thunderstorm': nightAltThunderstormIcon,
  'night-alt-lightning': nightAltLightningIcon,
  'night-alt-snow': nightAltSnowIcon,
  'night-alt-sleet': nightAltSleetIcon,
  'night-fog': nightFogIcon,
  'night-alt-rain-mix': nightAltRainMixIcon,
  'night-alt-storm-showers': nightAltStormShowersIcon,
  'night-alt-hail': nightAltHailIcon,
  'cloudy': cloudyIcon,
  'rain': rainIcon,
  'showers': showersIcon,
  'sprinkle': sprinkleIcon,
  'thunderstorm': thunderstormIcon,
  'lightning': lightningIcon,
  'snow': snowIcon,
  'sleet': sleetIcon,
  'fog': fogIcon,
  'smoke': smokeIcon,
  'dust': dustIcon,
  'tornado': tornadoIcon,
  'hurricane': hurricaneIcon,
  'windy': windyIcon,
  'strong-wind': strongWindIcon,
  'cloudy-gusts': cloudyGustsIcon,
  'rain-mix': rainMixIcon,
  'storm-showers': stormShowersIcon,
  'hail': hailIcon,
  'snowflake-cold': snowflakeColdIcon,
  'hot': hotIcon,
  'cloud': cloudIcon,
};

export default function WeatherTile({ icon, temperature, description, rainToday, snowToday, isEditMode }: WeatherTileProps) {
  const iconSrc = weatherIcons[icon];

  return (
    <div className="text-white flex flex-col items-center justify-center gap-3" style={{ width: '169px', height: '169px' }} data-testid="weather-tile">
      <div className="flex items-center gap-3" style={{ transform: 'translateX(-30px) translateY(-5px)' }}>
        {iconSrc && (
          <img
            src={iconSrc}
            alt={description}
            className="object-contain"
            style={{ width: '112px', height: '112px', filter: 'brightness(0) invert(1)', transform: 'translateX(10px) translateY(-30px)' }}
          />
        )}
        <div className="flex flex-col items-center">
          <div style={{ transform: 'translateY(-20px)', ...(isEditMode ? { boxShadow: '0 0 0 3px #FFFFFF', borderRadius: '8px', padding: '4px 8px' } : {}) }}>
            <div className="font-bold" style={{ fontSize: '42px', lineHeight: 1, marginLeft: '6px' }} data-testid="text-temperature">{temperature}</div>
            <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '26px', color: '#ffffff', marginTop: '4px', marginLeft: '6px' }} data-testid="text-description">{description}</div>
          </div>
          {rainToday && (
            <div
              className="flex items-center gap-[6px]"
              style={{
                backgroundColor: '#C0392B',
                borderRadius: '9px',
                padding: '2px 9px 2px 3px',
                marginTop: '1px',
                transform: 'translateY(-15px)',
              }}
            >
              <img src={rainIcon} alt="rain" style={{ width: '40px', height: '40px', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
              <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '15px', fontWeight: 600, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span>Rain</span>
                <span>today</span>
              </div>
            </div>
          )}
          {snowToday && (
            <div
              className="flex items-center gap-[6px]"
              style={{
                backgroundColor: '#C0392B',
                borderRadius: '9px',
                padding: '2px 9px 2px 3px',
                marginTop: '1px',
                transform: 'translateY(-15px)',
              }}
            >
              <img src={snowIcon} alt="snow" style={{ width: '40px', height: '40px', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
              <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '15px', fontWeight: 600, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2 }}>
                <span>Snow</span>
                <span>today</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
