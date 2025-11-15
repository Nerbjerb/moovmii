import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mapOWMCodeToIcon } from "@shared/weatherIconMapper";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

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

  // Subway API route - fetches real-time N/W train arrivals at Broadway-Astoria
  app.get("/api/subway", async (req, res) => {
    try {
      // Fetch GTFS-realtime feed for NQRW lines (no API key required)
      const response = await fetch(
        "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw"
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`MTA API error (${response.status}): ${errorText}`);
        return res.status(502).json({ 
          error: "Failed to fetch MTA data", 
          details: `Upstream returned ${response.status}` 
        });
      }

      // Decode Protocol Buffer data
      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

      // Broadway-Astoria stop IDs (R05N = Northbound, R05S = Southbound)
      const BROADWAY_ASTORIA_NORTH = "R05N";
      const BROADWAY_ASTORIA_SOUTH = "R05S";

      // Track arrivals by route and direction separately
      const arrivalsByRoute: Record<string, { 
        line: string; 
        minutes: number; 
        headsign: string;
        direction: 'north' | 'south';
      }[]> = {
        'N-north': [],
        'N-south': [],
        'W-north': [],
        'W-south': [],
      };

      const now = Math.floor(Date.now() / 1000); // Current time in seconds

      // Process each entity in the feed
      for (const entity of feed.entity) {
        if (!entity.tripUpdate) continue;

        const trip = entity.tripUpdate.trip;
        const routeId = trip?.routeId;

        // Filter for N and W trains only
        if (routeId !== "N" && routeId !== "W") continue;

        // Get trip headsign if available (accessing as any since types may vary)
        const tripHeadsign = (trip as any)?.tripHeadsign || '';

        // Process stop time updates
        for (const stopTimeUpdate of entity.tripUpdate.stopTimeUpdate || []) {
          const stopId = stopTimeUpdate.stopId;
          const arrival = stopTimeUpdate.arrival;

          if (!arrival?.time) continue;

          const arrivalTime = typeof arrival.time === 'number' 
            ? arrival.time 
            : Number(arrival.time);
          const minutesUntil = Math.floor((arrivalTime - now) / 60);

          // Include trains arriving now (0 minutes) and future arrivals
          if (minutesUntil < 0) continue;

          // Categorize by route and direction
          if (stopId === BROADWAY_ASTORIA_NORTH) {
            const key = `${routeId}-north`;
            arrivalsByRoute[key].push({ 
              line: routeId, 
              minutes: minutesUntil,
              headsign: tripHeadsign,
              direction: 'north'
            });
          } else if (stopId === BROADWAY_ASTORIA_SOUTH) {
            const key = `${routeId}-south`;
            arrivalsByRoute[key].push({ 
              line: routeId, 
              minutes: minutesUntil,
              headsign: tripHeadsign,
              direction: 'south'
            });
          }
        }
      }

      // Sort all arrays by arrival time
      Object.keys(arrivalsByRoute).forEach(key => {
        arrivalsByRoute[key].sort((a, b) => a.minutes - b.minutes);
      });

      // Determine which line to show for each direction (earliest arrival)
      const uptownNTimes = arrivalsByRoute['N-north'].slice(0, 3);
      const uptownWTimes = arrivalsByRoute['W-north'].slice(0, 3);
      const downtownNTimes = arrivalsByRoute['N-south'].slice(0, 3);
      const downtownWTimes = arrivalsByRoute['W-south'].slice(0, 3);

      // Pick the line with the soonest arrival for each direction
      const uptownLine = uptownNTimes[0]?.minutes <= (uptownWTimes[0]?.minutes ?? Infinity) ? 'N' : 'W';
      const downtownLine = downtownNTimes[0]?.minutes <= (downtownWTimes[0]?.minutes ?? Infinity) ? 'N' : 'W';

      const uptownData = uptownLine === 'N' ? uptownNTimes : uptownWTimes;
      const downtownData = downtownLine === 'N' ? downtownNTimes : downtownWTimes;

      // Helper to get destination from headsign or use default
      const getDestination = (data: typeof uptownData, defaultDest: string): string => {
        if (data.length > 0 && data[0].headsign) {
          return data[0].headsign;
        }
        return defaultDest;
      };

      // Format response matching SubwayArrival schema
      const subwayData = [
        {
          direction: "Uptown",
          line: uptownLine,
          destination: getDestination(uptownData, "Astoria - Ditmars Blvd"),
          subtitle: uptownLine === 'N' ? "via Broadway" : "via Broadway (weekdays)",
          arrivalMinutes: uptownData.map(a => a.minutes),
        },
        {
          direction: "Downtown",
          line: downtownLine,
          destination: getDestination(downtownData, "Coney Island - Stillwell Av"),
          subtitle: downtownLine === 'N' ? "via Broadway" : "via Broadway (weekdays)",
          arrivalMinutes: downtownData.map(a => a.minutes),
        },
      ];

      res.json(subwayData);
    } catch (error) {
      console.error("Error fetching subway data:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({ 
        error: "Failed to fetch subway data",
        details: errorMessage
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
