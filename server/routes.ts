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

      // Get current time rounded up to next hour
      const now = new Date();
      const nextHour = new Date(now);
      nextHour.setHours(now.getHours() + 1);
      nextHour.setMinutes(0, 0, 0);

      // Find forecast closest to next hour (current weather)
      const currentForecast = data.list[0];
      
      // Find forecast closest to 3 hours from next hour
      const threeHoursLater = new Date(nextHour.getTime() + 3 * 60 * 60 * 1000);
      const futureForecast = data.list.find((item: any) => {
        const itemTime = new Date(item.dt * 1000);
        return itemTime >= threeHoursLater;
      }) || data.list[1];

      // Helper to determine if it's day time (6 AM - 6 PM)
      const isDayTime = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const hour = date.getHours();
        return hour >= 6 && hour < 18;
      };

      // Format weather data for frontend
      const weatherData = [
        {
          icon: mapOWMCodeToIcon(currentForecast.weather[0].id, isDayTime(currentForecast.dt)),
          temperature: `${Math.round(currentForecast.main.temp)}°`,
          description: currentForecast.weather[0].main,
          time: formatTime(nextHour),
        },
        {
          icon: mapOWMCodeToIcon(futureForecast.weather[0].id, isDayTime(futureForecast.dt)),
          temperature: `${Math.round(futureForecast.main.temp)}°`,
          description: futureForecast.weather[0].main,
          time: formatTime(new Date(futureForecast.dt * 1000)),
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

function formatTime(date: Date): string {
  const hours = date.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:00${ampm}`;
}
