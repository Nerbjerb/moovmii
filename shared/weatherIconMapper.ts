// Maps OpenWeatherMap condition codes to weather icon names
// Based on the official OWM mapping in attached_assets/moovmii/Weather Icons/less/mappings/wi-owm.less

export type WeatherIconName = 
  | 'day-sunny' | 'day-cloudy' | 'day-rain' | 'day-showers' | 'day-sprinkle'
  | 'day-thunderstorm' | 'day-lightning' | 'day-snow' | 'day-sleet' | 'day-fog'
  | 'day-haze' | 'day-rain-mix' | 'day-storm-showers' | 'day-hail'
  | 'night-clear' | 'night-alt-cloudy' | 'night-alt-partly-cloudy' | 'night-alt-rain'
  | 'night-alt-showers' | 'night-alt-sprinkle' | 'night-alt-thunderstorm'
  | 'night-alt-lightning' | 'night-alt-snow' | 'night-alt-sleet' | 'night-fog'
  | 'night-alt-rain-mix' | 'night-alt-storm-showers' | 'night-alt-hail'
  | 'cloudy' | 'rain' | 'showers' | 'sprinkle' | 'thunderstorm' | 'lightning'
  | 'snow' | 'sleet' | 'fog' | 'smoke' | 'dust' | 'tornado' | 'hurricane'
  | 'windy' | 'strong-wind' | 'cloudy-gusts' | 'rain-mix' | 'storm-showers'
  | 'hail' | 'snowflake-cold' | 'hot' | 'cloud';

// Map OWM condition codes to icon names
const owmToIcon: Record<number, WeatherIconName> = {
  // Thunderstorm (200-232)
  200: 'thunderstorm', 201: 'thunderstorm', 202: 'thunderstorm',
  210: 'lightning', 211: 'lightning', 212: 'lightning', 221: 'lightning',
  230: 'thunderstorm', 231: 'thunderstorm', 232: 'thunderstorm',
  
  // Drizzle (300-321)
  300: 'sprinkle', 301: 'sprinkle', 302: 'rain',
  310: 'rain-mix', 311: 'rain', 312: 'rain', 313: 'showers', 314: 'rain',
  321: 'sprinkle',
  
  // Rain (500-531)
  500: 'sprinkle', 501: 'rain', 502: 'rain', 503: 'rain', 504: 'rain',
  511: 'rain-mix',
  520: 'showers', 521: 'showers', 522: 'showers', 531: 'storm-showers',
  
  // Snow (600-622)
  600: 'snow', 601: 'snow', 602: 'sleet',
  611: 'rain-mix', 612: 'rain-mix', 615: 'rain-mix', 616: 'rain-mix',
  620: 'rain-mix', 621: 'snow', 622: 'snow',
  
  // Atmosphere (701-781)
  701: 'fog', 711: 'smoke', 721: 'day-haze', 731: 'dust', 741: 'fog',
  761: 'dust', 762: 'dust', 771: 'cloudy-gusts', 781: 'tornado',
  
  // Clear (800)
  800: 'day-sunny',
  
  // Clouds (801-804)
  801: 'cloud', 802: 'cloud', 803: 'cloudy', 804: 'cloudy',
  
  // Extreme (900-906, 957)
  900: 'tornado', 901: 'storm-showers', 902: 'hurricane',
  903: 'snowflake-cold', 904: 'hot', 905: 'windy', 906: 'hail',
  957: 'strong-wind',
};

const owmToDayIcon: Record<number, WeatherIconName> = {
  // Thunderstorm
  200: 'day-thunderstorm', 201: 'day-thunderstorm', 202: 'day-thunderstorm',
  210: 'day-lightning', 211: 'day-lightning', 212: 'day-lightning', 221: 'day-lightning',
  230: 'day-thunderstorm', 231: 'day-thunderstorm', 232: 'day-thunderstorm',
  
  // Drizzle
  300: 'day-sprinkle', 301: 'day-sprinkle', 302: 'day-rain',
  310: 'day-rain', 311: 'day-rain', 312: 'day-rain', 313: 'day-rain', 314: 'day-rain',
  321: 'day-sprinkle',
  
  // Rain
  500: 'day-sprinkle', 501: 'day-rain', 502: 'day-rain', 503: 'day-rain', 504: 'day-rain',
  511: 'day-rain-mix',
  520: 'day-showers', 521: 'day-showers', 522: 'day-showers', 531: 'day-storm-showers',
  
  // Snow
  600: 'day-snow', 601: 'day-sleet', 602: 'day-snow',
  611: 'day-rain-mix', 612: 'day-rain-mix', 615: 'day-rain-mix', 616: 'day-rain-mix',
  620: 'day-rain-mix', 621: 'day-snow', 622: 'day-snow',
  
  // Atmosphere
  701: 'day-fog', 711: 'smoke', 721: 'day-haze', 731: 'dust', 741: 'day-fog',
  761: 'dust', 762: 'dust', 781: 'tornado',
  
  // Clear
  800: 'day-sunny',
  
  // Clouds
  801: 'day-cloudy', 802: 'day-cloudy', 803: 'cloudy', 804: 'cloudy',
  
  // Extreme
  900: 'tornado', 902: 'hurricane', 903: 'snowflake-cold', 904: 'hot',
  906: 'day-hail', 957: 'strong-wind',
};

const owmToNightIcon: Record<number, WeatherIconName> = {
  // Thunderstorm
  200: 'night-alt-thunderstorm', 201: 'night-alt-thunderstorm', 202: 'night-alt-thunderstorm',
  210: 'night-alt-lightning', 211: 'night-alt-lightning', 212: 'night-alt-lightning', 221: 'night-alt-lightning',
  230: 'night-alt-thunderstorm', 231: 'night-alt-thunderstorm', 232: 'night-alt-thunderstorm',
  
  // Drizzle
  300: 'night-alt-sprinkle', 301: 'night-alt-sprinkle', 302: 'night-alt-rain',
  310: 'night-alt-rain', 311: 'night-alt-rain', 312: 'night-alt-rain', 313: 'night-alt-rain', 314: 'night-alt-rain',
  321: 'night-alt-sprinkle',
  
  // Rain
  500: 'night-alt-sprinkle', 501: 'night-alt-rain', 502: 'night-alt-rain', 503: 'night-alt-rain', 504: 'night-alt-rain',
  511: 'night-alt-rain-mix',
  520: 'night-alt-showers', 521: 'night-alt-showers', 522: 'night-alt-showers', 531: 'night-alt-storm-showers',
  
  // Snow
  600: 'night-alt-snow', 601: 'night-alt-sleet', 602: 'night-alt-snow',
  611: 'night-alt-rain-mix', 612: 'night-alt-rain-mix', 615: 'night-alt-rain-mix', 616: 'night-alt-rain-mix',
  620: 'night-alt-rain-mix', 621: 'night-alt-snow', 622: 'night-alt-snow',
  
  // Atmosphere
  701: 'night-fog', 711: 'smoke', 721: 'day-haze', 731: 'dust', 741: 'night-fog',
  761: 'dust', 762: 'dust', 781: 'tornado',
  
  // Clear
  800: 'night-clear',
  
  // Clouds
  801: 'night-alt-partly-cloudy', 802: 'night-alt-cloudy', 803: 'cloudy', 804: 'cloudy',
  
  // Extreme
  900: 'tornado', 902: 'hurricane', 903: 'snowflake-cold', 904: 'hot',
  906: 'night-alt-hail', 957: 'strong-wind',
};

export function mapOWMCodeToIcon(code: number, isDay: boolean = true): WeatherIconName {
  if (isDay) {
    return owmToDayIcon[code] || owmToIcon[code] || 'day-sunny';
  } else {
    return owmToNightIcon[code] || owmToIcon[code] || 'night-clear';
  }
}
