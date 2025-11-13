import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mapOWMCodeToIcon } from "@shared/weatherIconMapper";

export async function registerRoutes(app: Express): Promise<Server> {
  // Weather API route - fetches current and 3-hour forecast for NYC
  app.get("/api/weather", async (req, res) => {
    try {
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OpenWeatherMap API key not configured" });
      }

      // NYC coordinates (Broadway, Astoria area)
      const lat = 40.7614;
      const lon = -73.9176;

      // Fetch 5-day/3-hour forecast from OpenWeatherMap
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenWeatherMap API error (${response.status}): ${errorText}`);
        throw new Error(`OpenWeatherMap API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Helper to get all NYC date/time parts from UTC timestamp
      const getNYCParts = (utcTimestamp: number) => {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/New_York",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const parts = formatter.formatToParts(new Date(utcTimestamp));
        const partsMap: Record<string, string> = {};
        parts.forEach(p => {
          if (p.type !== 'literal') partsMap[p.type] = p.value;
        });
        return {
          year: parseInt(partsMap.year),
          month: parseInt(partsMap.month),
          day: parseInt(partsMap.day),
          hour: parseInt(partsMap.hour),
          minute: parseInt(partsMap.minute),
        };
      };

      // Helper to determine if it's day time in NYC (6 AM - 6 PM)
      const isDayTime = (utcTimestamp: number): boolean => {
        const parts = getNYCParts(utcTimestamp * 1000);
        return parts.hour >= 6 && parts.hour < 18;
      };

      // Helper to format time in NYC timezone
      const formatNYCTime = (utcTimestamp: number): string => {
        const parts = getNYCParts(utcTimestamp * 1000);
        const hour12 = parts.hour % 12 || 12;
        const ampm = parts.hour >= 12 ? "PM" : "AM";
        return `${hour12} ${ampm}`;
      };

      // Get current time in UTC
      const nowUTC = Date.now();

      // Find the first forecast that is (1) in the future, and (2) at a round hour in NYC time
      let currentForecast = data.list[0];

      for (const item of data.list) {
        const forecastTime = item.dt * 1000; // Convert to milliseconds
        const forecastNYC = getNYCParts(forecastTime);
        
        // Check if this forecast is in the future and at a round hour (minute = 0)
        const isFuture = forecastTime > nowUTC;
        const isRoundHour = forecastNYC.minute === 0;
        
        if (isFuture && isRoundHour) {
          currentForecast = item;
          break; // Take the first matching forecast (earliest in the future)
        }
      }

      // Find forecast 3 hours after the current forecast (using UTC timestamps directly)
      const threeHoursLater = currentForecast.dt + (3 * 60 * 60);
      let futureForecast = data.list[1];
      let minFutureDiff = Math.abs(data.list[1].dt - threeHoursLater);

      for (const item of data.list) {
        const diff = Math.abs(item.dt - threeHoursLater);
        if (diff < minFutureDiff) {
          minFutureDiff = diff;
          futureForecast = item;
        }
      }

      // Format weather data for frontend
      const weatherData = [
        {
          icon: mapOWMCodeToIcon(currentForecast.weather[0].id, isDayTime(currentForecast.dt)),
          temperature: `${Math.round(currentForecast.main.temp)}°`,
          description: currentForecast.weather[0].main,
          time: formatNYCTime(currentForecast.dt),
        },
        {
          icon: mapOWMCodeToIcon(futureForecast.weather[0].id, isDayTime(futureForecast.dt)),
          temperature: `${Math.round(futureForecast.main.temp)}°`,
          description: futureForecast.weather[0].main,
          time: formatNYCTime(futureForecast.dt),
        },
      ];

      res.json(weatherData);
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
