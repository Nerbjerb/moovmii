import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mapOWMCodeToIcon } from "@shared/weatherIconMapper";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { feedUrls, lineToFeedGroup, getSameColorLines, getStopId, getFeedUrlsForLines } from "@shared/stopMetadata";
import { insertKioskPreferenceSchema } from "@shared/schema";

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

      // Track arrivals by direction (merge N and W trains)
      const northboundArrivals: { 
        line: string; 
        minutes: number; 
        headsign: string;
      }[] = [];
      const southboundArrivals: { 
        line: string; 
        minutes: number; 
        headsign: string;
      }[] = [];

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

          // Categorize by direction, mixing N and W trains
          if (stopId === BROADWAY_ASTORIA_NORTH) {
            northboundArrivals.push({ 
              line: routeId, 
              minutes: minutesUntil,
              headsign: tripHeadsign,
            });
          } else if (stopId === BROADWAY_ASTORIA_SOUTH) {
            southboundArrivals.push({ 
              line: routeId, 
              minutes: minutesUntil,
              headsign: tripHeadsign,
            });
          }
        }
      }

      // Sort by arrival time and take first 3 trains per direction
      northboundArrivals.sort((a, b) => a.minutes - b.minutes);
      southboundArrivals.sort((a, b) => a.minutes - b.minutes);

      const uptownData = northboundArrivals.slice(0, 3);
      const downtownData = southboundArrivals.slice(0, 3);

      // Helper to get destination from headsign or use default
      const getDestination = (data: typeof uptownData, defaultDest: string): string => {
        if (data.length > 0 && data[0].headsign) {
          return data[0].headsign;
        }
        return defaultDest;
      };

      // Format response matching SubwayArrival schema
      // Use the first train's line for the main display
      const subwayData = [
        {
          direction: "Uptown",
          line: uptownData[0]?.line || "N",
          destination: getDestination(uptownData, "Astoria - Ditmars Blvd"),
          subtitle: uptownData[0]?.line === 'N' ? "via Broadway" : "via Broadway (weekdays)",
          arrivalMinutes: uptownData.map(a => a.minutes),
          arrivalLines: uptownData.map(a => a.line), // Include line info for each arrival
        },
        {
          direction: "Downtown",
          line: downtownData[0]?.line || "N",
          destination: getDestination(downtownData, "Coney Island - Stillwell Av"),
          subtitle: downtownData[0]?.line === 'N' ? "via Broadway" : "via Broadway (weekdays)",
          arrivalMinutes: downtownData.map(a => a.minutes),
          arrivalLines: downtownData.map(a => a.line), // Include line info for each arrival
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

  // Preferences API - Get all preferences for a kiosk
  app.get("/api/preferences", async (req, res) => {
    try {
      const kioskId = (req.query.kioskId as string) || "default";
      const preferences = await storage.getKioskPreferences(kioskId);
      res.json(preferences);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // Preferences API - Set a row preference
  app.post("/api/preferences", async (req, res) => {
    try {
      const parsed = insertKioskPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid preference data", details: parsed.error });
      }
      const preference = await storage.setKioskPreference(parsed.data);
      res.json(preference);
    } catch (error) {
      console.error("Error saving preference:", error);
      res.status(500).json({ error: "Failed to save preference" });
    }
  });

  // Preferences API - Delete a row preference
  app.delete("/api/preferences/:row", async (req, res) => {
    try {
      const kioskId = (req.query.kioskId as string) || "default";
      const row = parseInt(req.params.row, 10);
      await storage.deleteKioskPreference(kioskId, row);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting preference:", error);
      res.status(500).json({ error: "Failed to delete preference" });
    }
  });

  // Dynamic subway arrivals API - fetches arrivals for any station
  app.get("/api/subway/arrivals", async (req, res) => {
    try {
      const { stopId, direction, lines } = req.query;
      
      if (!stopId || !direction || !lines) {
        return res.status(400).json({ 
          error: "Missing required parameters: stopId, direction, lines" 
        });
      }

      const lineList = (lines as string).split(",");
      const directionSuffix = direction === "Uptown" ? "N" : "S";
      const fullStopId = `${stopId}${directionSuffix}`;

      // Get all same-color lines for merging
      const allLines = new Set<string>();
      for (const line of lineList) {
        const sameColorLines = getSameColorLines(line);
        sameColorLines.forEach(l => allLines.add(l));
      }
      const linesToFetch = Array.from(allLines);

      // Determine which feeds to fetch
      const feedUrlsToFetch = getFeedUrlsForLines(linesToFetch);
      
      if (feedUrlsToFetch.length === 0) {
        return res.status(400).json({ error: "No feeds available for the specified lines" });
      }

      // Fetch all feeds in parallel
      const feedPromises = feedUrlsToFetch.map(async (url) => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            console.warn(`Failed to fetch feed ${url}: ${response.status}`);
            return null;
          }
          const buffer = await response.arrayBuffer();
          return GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
            new Uint8Array(buffer)
          );
        } catch (err) {
          console.warn(`Error fetching feed ${url}:`, err);
          return null;
        }
      });

      const feeds = (await Promise.all(feedPromises)).filter(Boolean);

      if (feeds.length === 0) {
        return res.status(502).json({ error: "Failed to fetch any MTA feeds" });
      }

      // Collect arrivals from all feeds
      const arrivals: { 
        line: string; 
        minutes: number; 
        headsign: string;
      }[] = [];

      const now = Math.floor(Date.now() / 1000);

      for (const feed of feeds) {
        if (!feed) continue;
        
        for (const entity of feed.entity) {
          if (!entity.tripUpdate) continue;

          const trip = entity.tripUpdate.trip;
          const routeId = trip?.routeId;

          // Only include lines from our color group
          if (!routeId || !linesToFetch.includes(routeId)) continue;

          const tripHeadsign = (trip as any)?.tripHeadsign || '';

          for (const stopTimeUpdate of entity.tripUpdate.stopTimeUpdate || []) {
            const stopIdFromFeed = stopTimeUpdate.stopId;
            const arrival = stopTimeUpdate.arrival;

            if (!arrival?.time) continue;

            // Check if this stop matches our target
            if (stopIdFromFeed !== fullStopId) continue;

            const arrivalTime = typeof arrival.time === 'number' 
              ? arrival.time 
              : Number(arrival.time);
            const minutesUntil = Math.floor((arrivalTime - now) / 60);

            if (minutesUntil < 0) continue;

            arrivals.push({ 
              line: routeId, 
              minutes: minutesUntil,
              headsign: tripHeadsign,
            });
          }
        }
      }

      // Sort by arrival time and take first 3
      arrivals.sort((a, b) => a.minutes - b.minutes);
      const topArrivals = arrivals.slice(0, 3);

      // Get destination from first arrival's headsign
      const getDefaultDestination = (dir: string, line: string): string => {
        const destinations: Record<string, Record<string, string>> = {
          "Uptown": {
            "A": "Inwood-207 St",
            "C": "168 St",
            "E": "Jamaica Center",
            "1": "Van Cortlandt Park-242 St",
            "2": "Wakefield-241 St",
            "3": "Harlem-148 St",
            "4": "Woodlawn",
            "5": "Eastchester-Dyre Av",
            "6": "Pelham Bay Park",
            "7": "Flushing-Main St",
            "N": "Astoria-Ditmars Blvd",
            "Q": "96 St",
            "R": "Forest Hills-71 Av",
            "W": "Astoria-Ditmars Blvd",
            "B": "145 St",
            "D": "Norwood-205 St",
            "F": "Jamaica-179 St",
            "M": "Forest Hills-71 Av",
            "G": "Court Sq",
            "J": "Jamaica Center",
            "Z": "Jamaica Center",
            "L": "8 Av",
          },
          "Downtown": {
            "A": "Far Rockaway / Ozone Park-Lefferts Blvd",
            "C": "Euclid Av",
            "E": "World Trade Center",
            "1": "South Ferry",
            "2": "Flatbush Av-Brooklyn College",
            "3": "New Lots Av",
            "4": "Crown Hts-Utica Av",
            "5": "Flatbush Av-Brooklyn College",
            "6": "Brooklyn Bridge-City Hall",
            "7": "34 St-Hudson Yards",
            "N": "Coney Island-Stillwell Av",
            "Q": "Coney Island-Stillwell Av",
            "R": "Bay Ridge-95 St",
            "W": "Whitehall St-South Ferry",
            "B": "Brighton Beach",
            "D": "Coney Island-Stillwell Av",
            "F": "Coney Island-Stillwell Av",
            "M": "Middle Village-Metropolitan Av",
            "G": "Church Av",
            "J": "Broad St",
            "Z": "Broad St",
            "L": "Canarsie-Rockaway Pkwy",
          },
        };
        return destinations[dir]?.[line] || "Unknown";
      };

      const destination = topArrivals[0]?.headsign || 
        getDefaultDestination(direction as string, topArrivals[0]?.line || lineList[0]);

      const subwayData = {
        direction: direction as string,
        line: topArrivals[0]?.line || lineList[0],
        destination,
        subtitle: "", // Can be customized based on service type
        arrivalMinutes: topArrivals.map(a => a.minutes),
        arrivalLines: topArrivals.map(a => a.line),
      };

      res.json(subwayData);
    } catch (error) {
      console.error("Error fetching dynamic subway data:", error);
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
