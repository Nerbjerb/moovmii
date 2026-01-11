import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { mapOWMCodeToIcon } from "@shared/weatherIconMapper";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { feedUrls, lineToFeedGroup, getSameColorLines, getStopId, getFeedUrlsForLines } from "@shared/stopMetadata";
import { insertKioskPreferenceSchema, insertKioskSettingsSchema } from "@shared/schema";

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

      // Terminal info for N/W trains at Broadway-Astoria
      const getTerminalInfo = (data: typeof uptownData, direction: "Uptown" | "Downtown") => {
        const line = data[0]?.line || "N";
        if (direction === "Uptown") {
          return { borough: "Queens", station: "Astoria-Ditmars Blvd" };
        } else {
          // Downtown - N goes to Coney Island (Brooklyn), W goes to Whitehall (Manhattan)
          if (line === "W") {
            return { borough: "Manhattan", station: "Whitehall St-South Ferry" };
          }
          return { borough: "Brooklyn", station: "Coney Island-Stillwell Av" };
        }
      };

      // Format response matching SubwayArrival schema
      // Use the first train's line for the main display
      const uptownTerminal = getTerminalInfo(uptownData, "Uptown");
      const downtownTerminal = getTerminalInfo(downtownData, "Downtown");
      
      const subwayData = [
        {
          direction: "Uptown",
          line: uptownData[0]?.line || "N",
          destination: uptownTerminal.borough,
          subtitle: uptownTerminal.station,
          arrivalMinutes: uptownData.map(a => a.minutes),
          arrivalLines: uptownData.map(a => a.line),
        },
        {
          direction: "Downtown",
          line: downtownData[0]?.line || "N",
          destination: downtownTerminal.borough,
          subtitle: downtownTerminal.station,
          arrivalMinutes: downtownData.map(a => a.minutes),
          arrivalLines: downtownData.map(a => a.line),
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

  // Settings API - Get kiosk settings
  app.get("/api/settings", async (req, res) => {
    try {
      const kioskId = (req.query.kioskId as string) || "default";
      const settings = await storage.getKioskSettings(kioskId);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  // Settings API - Update kiosk settings
  app.post("/api/settings", async (req, res) => {
    try {
      const parsed = insertKioskSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid settings data", details: parsed.error });
      }
      const settings = await storage.setKioskSettings(parsed.data);
      res.json(settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      res.status(500).json({ error: "Failed to save settings" });
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
      
      // Check if this is a commuter rail (LIRR or Metro-North)
      const isLIRR = lineList.some(l => l.startsWith("LIRR"));
      const isMNR = lineList.some(l => l.startsWith("MNR"));
      const isCommuterRail = isLIRR || isMNR;
      
      // LIRR and Metro-North don't use N/S suffixes
      let fullStopId: string;
      if (isCommuterRail) {
        fullStopId = stopId as string;
      } else {
        const directionSuffix = direction === "Uptown" ? "N" : "S";
        fullStopId = `${stopId}${directionSuffix}`;
      }

      // Get all same-color lines for merging (don't merge LIRR/MNR branches)
      const allLines = new Set<string>();
      for (const line of lineList) {
        if (isCommuterRail) {
          // Don't merge LIRR/MNR branches - each is separate
          allLines.add(line);
        } else {
          const sameColorLines = getSameColorLines(line);
          sameColorLines.forEach(l => allLines.add(l));
        }
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

      // Map internal branch IDs to GTFS route IDs for LIRR/MNR
      const branchToGtfsRoute: Record<string, string> = {
        "LIRR-1": "1", "LIRR-2": "2", "LIRR-3": "3", "LIRR-4": "4", "LIRR-5": "5",
        "LIRR-6": "6", "LIRR-7": "7", "LIRR-8": "8", "LIRR-9": "9", "LIRR-10": "10",
        "MNR-1": "1", "MNR-2": "2", "MNR-3": "3", "MNR-4": "4", "MNR-5": "5", "MNR-6": "6",
      };

      for (const feed of feeds) {
        if (!feed) continue;
        
        for (const entity of feed.entity) {
          if (!entity.tripUpdate) continue;

          const trip = entity.tripUpdate.trip;
          const routeId = trip?.routeId;

          if (!routeId) continue;

          // For commuter rail, map our branch IDs to GTFS route IDs
          let matchesLine = false;
          let matchedLine = "";
          
          if (isCommuterRail) {
            // Check if any of our branches match this route
            for (const line of linesToFetch) {
              const gtfsRouteId = branchToGtfsRoute[line];
              if (gtfsRouteId && routeId === gtfsRouteId) {
                matchesLine = true;
                matchedLine = line; // Keep our internal ID (LIRR-1, MNR-1, etc.)
                break;
              }
            }
          } else {
            // Subway - direct match (SIR uses "SI" in GTFS)
            if (routeId === "SI" && linesToFetch.includes("SIR")) {
              matchesLine = true;
              matchedLine = "SIR";
            } else {
              matchesLine = linesToFetch.includes(routeId);
              matchedLine = routeId;
            }
          }

          if (!matchesLine) continue;

          const tripHeadsign = (trip as any)?.tripHeadsign || '';
          
          // For LIRR/MNR, filter by direction using GTFS direction_id
          // direction_id: 0 = Outbound (away from Manhattan), 1 = Inbound (to Manhattan)
          // UI mapping: Uptown = East = Inbound (1), Downtown = West = Outbound (0)
          if (isCommuterRail) {
            const tripDirectionId = (trip as any)?.directionId;
            const requestedDirectionId = direction === "Uptown" ? 1 : 0;
            if (tripDirectionId !== undefined && tripDirectionId !== requestedDirectionId) {
              continue;
            }
          }

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
              line: matchedLine, 
              minutes: minutesUntil,
              headsign: tripHeadsign,
            });
          }
        }
      }

      // Sort by arrival time and take first 3
      arrivals.sort((a, b) => a.minutes - b.minutes);
      const topArrivals = arrivals.slice(0, 3);

      // Terminal station names with their boroughs
      const terminalStations: Record<string, Record<string, { station: string; borough: string }>> = {
        "Uptown": {
          "A": { station: "Inwood-207 St", borough: "Manhattan" },
          "C": { station: "168 St", borough: "Manhattan" },
          "E": { station: "Jamaica Center", borough: "Queens" },
          "1": { station: "Van Cortlandt Park-242 St", borough: "Bronx" },
          "2": { station: "Wakefield-241 St", borough: "Bronx" },
          "3": { station: "Harlem-148 St", borough: "Manhattan" },
          "4": { station: "Woodlawn", borough: "Bronx" },
          "5": { station: "Eastchester-Dyre Av", borough: "Bronx" },
          "6": { station: "Pelham Bay Park", borough: "Bronx" },
          "7": { station: "Flushing-Main St", borough: "Queens" },
          "N": { station: "Astoria-Ditmars Blvd", borough: "Queens" },
          "Q": { station: "96 St", borough: "Manhattan" },
          "R": { station: "Forest Hills-71 Av", borough: "Queens" },
          "W": { station: "Astoria-Ditmars Blvd", borough: "Queens" },
          "B": { station: "145 St", borough: "Manhattan" },
          "D": { station: "Norwood-205 St", borough: "Bronx" },
          "F": { station: "Jamaica-179 St", borough: "Queens" },
          "M": { station: "Forest Hills-71 Av", borough: "Queens" },
          "G": { station: "Court Sq", borough: "Queens" },
          "J": { station: "Jamaica Center", borough: "Queens" },
          "Z": { station: "Jamaica Center", borough: "Queens" },
          "L": { station: "8 Av", borough: "Manhattan" },
          // LIRR Branches - Eastbound/Outbound
          "LIRR-1": { station: "Babylon", borough: "Long Island" },
          "LIRR-2": { station: "Hempstead", borough: "Long Island" },
          "LIRR-3": { station: "Oyster Bay", borough: "Long Island" },
          "LIRR-4": { station: "Ronkonkoma", borough: "Long Island" },
          "LIRR-5": { station: "Montauk", borough: "Long Island" },
          "LIRR-6": { station: "Long Beach", borough: "Long Island" },
          "LIRR-7": { station: "Far Rockaway", borough: "Queens" },
          "LIRR-8": { station: "West Hempstead", borough: "Long Island" },
          "LIRR-9": { station: "Port Washington", borough: "Long Island" },
          "LIRR-10": { station: "Port Jefferson", borough: "Long Island" },
          // Metro-North Lines - Northbound
          "MNR-1": { station: "Poughkeepsie", borough: "Hudson Valley" },
          "MNR-2": { station: "Wassaic", borough: "Hudson Valley" },
          "MNR-3": { station: "New Haven", borough: "Connecticut" },
          "MNR-4": { station: "New Canaan", borough: "Connecticut" },
          "MNR-5": { station: "Danbury", borough: "Connecticut" },
          "MNR-6": { station: "Waterbury", borough: "Connecticut" },
          // Staten Island Railway
          "SIR": { station: "St George", borough: "Manhattan" },
        },
        "Downtown": {
          "A": { station: "Far Rockaway", borough: "Queens" },
          "C": { station: "Euclid Av", borough: "Brooklyn" },
          "E": { station: "World Trade Center", borough: "Manhattan" },
          "1": { station: "South Ferry", borough: "Manhattan" },
          "2": { station: "Flatbush Av-Brooklyn College", borough: "Brooklyn" },
          "3": { station: "New Lots Av", borough: "Brooklyn" },
          "4": { station: "Crown Hts-Utica Av", borough: "Brooklyn" },
          "5": { station: "Flatbush Av-Brooklyn College", borough: "Brooklyn" },
          "6": { station: "Brooklyn Bridge-City Hall", borough: "Manhattan" },
          "7": { station: "34 St-Hudson Yards", borough: "Manhattan" },
          "N": { station: "Coney Island-Stillwell Av", borough: "Brooklyn" },
          "Q": { station: "Coney Island-Stillwell Av", borough: "Brooklyn" },
          "R": { station: "Bay Ridge-95 St", borough: "Brooklyn" },
          "W": { station: "Whitehall St-South Ferry", borough: "Manhattan" },
          "B": { station: "Brighton Beach", borough: "Brooklyn" },
          "D": { station: "Coney Island-Stillwell Av", borough: "Brooklyn" },
          "F": { station: "Coney Island-Stillwell Av", borough: "Brooklyn" },
          "M": { station: "Middle Village-Metropolitan Av", borough: "Queens" },
          "G": { station: "Church Av", borough: "Brooklyn" },
          "J": { station: "Broad St", borough: "Manhattan" },
          "Z": { station: "Broad St", borough: "Manhattan" },
          "L": { station: "Canarsie-Rockaway Pkwy", borough: "Brooklyn" },
          // LIRR Branches - Westbound/Inbound (to Penn Station)
          "LIRR-1": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-2": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-3": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-4": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-5": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-6": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-7": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-8": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-9": { station: "Penn Station", borough: "Manhattan" },
          "LIRR-10": { station: "Penn Station", borough: "Manhattan" },
          // Metro-North Lines - Southbound (to Grand Central)
          "MNR-1": { station: "Grand Central", borough: "Manhattan" },
          "MNR-2": { station: "Grand Central", borough: "Manhattan" },
          "MNR-3": { station: "Grand Central", borough: "Manhattan" },
          "MNR-4": { station: "Grand Central", borough: "Manhattan" },
          "MNR-5": { station: "Grand Central", borough: "Manhattan" },
          "MNR-6": { station: "Grand Central", borough: "Manhattan" },
          // Staten Island Railway
          "SIR": { station: "Tottenville", borough: "South Shore" },
        },
      };

      // Helper to parse headsign into station and borough
      const parseHeadsign = (headsign: string, dir: string, line: string): { station: string; borough: string } => {
        // Borough mapping for common terminal keywords
        const boroughKeywords: Record<string, string> = {
          "Inwood": "Manhattan",
          "207 St": "Manhattan",
          "168 St": "Manhattan",
          "Jamaica": "Queens",
          "Van Cortlandt": "Bronx",
          "242 St": "Bronx",
          "Wakefield": "Bronx",
          "241 St": "Bronx",
          "Harlem": "Manhattan",
          "148 St": "Manhattan",
          "Woodlawn": "Bronx",
          "Eastchester": "Bronx",
          "Dyre": "Bronx",
          "Pelham Bay": "Bronx",
          "Flushing": "Queens",
          "Main St": "Queens",
          "Astoria": "Queens",
          "Ditmars": "Queens",
          "96 St": "Manhattan",
          "Forest Hills": "Queens",
          "71 Av": "Queens",
          "145 St": "Manhattan",
          "Norwood": "Bronx",
          "205 St": "Bronx",
          "179 St": "Queens",
          "Court Sq": "Queens",
          "8 Av": "Manhattan",
          "Far Rockaway": "Queens",
          "Rockaway": "Queens",
          "Ozone Park": "Queens",
          "Lefferts": "Queens",
          "Euclid": "Brooklyn",
          "World Trade": "Manhattan",
          "WTC": "Manhattan",
          "South Ferry": "Manhattan",
          "Flatbush": "Brooklyn",
          "Brooklyn College": "Brooklyn",
          "New Lots": "Brooklyn",
          "Crown Hts": "Brooklyn",
          "Utica": "Brooklyn",
          "Brooklyn Bridge": "Manhattan",
          "City Hall": "Manhattan",
          "Hudson Yards": "Manhattan",
          "34 St": "Manhattan",
          "Coney Island": "Brooklyn",
          "Stillwell": "Brooklyn",
          "Bay Ridge": "Brooklyn",
          "95 St": "Brooklyn",
          "Whitehall": "Manhattan",
          "Brighton Beach": "Brooklyn",
          "Middle Village": "Queens",
          "Metropolitan": "Queens",
          "Church Av": "Brooklyn",
          "Broad St": "Manhattan",
          "Canarsie": "Brooklyn",
        };

        // Try to find borough from headsign
        let borough = "";
        for (const [keyword, boro] of Object.entries(boroughKeywords)) {
          if (headsign.includes(keyword)) {
            borough = boro;
            break;
          }
        }

        // Extract station name (take first part before dash if present, or whole headsign)
        let station = headsign;
        
        // If we found a borough, use the headsign as station
        if (borough) {
          return { station, borough };
        }

        // Fall back to defaults
        const defaultInfo = terminalStations[dir]?.[line];
        if (defaultInfo) {
          return defaultInfo;
        }

        return { station: headsign || "Unknown", borough: "New York" };
      };

      // Get terminal info for the first arriving train
      const firstLine = topArrivals[0]?.line || lineList[0];
      const firstHeadsign = topArrivals[0]?.headsign || "";
      
      const terminalInfo = firstHeadsign 
        ? parseHeadsign(firstHeadsign, direction as string, firstLine)
        : terminalStations[direction as string]?.[firstLine] || { station: "Unknown", borough: "New York" };

      const subwayData = {
        direction: direction as string,
        line: firstLine,
        destination: terminalInfo.borough,
        subtitle: terminalInfo.station,
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

  // PATH arrivals API - fetches real-time arrivals from official PANYNJ API
  app.get("/api/path/arrivals", async (req, res) => {
    try {
      const { station, direction, line } = req.query;
      
      if (!station || !direction || !line) {
        return res.status(400).json({ 
          error: "Missing required parameters: station, direction, line" 
        });
      }

      // Map GTFS stop IDs to PANYNJ API station codes
      const gtfsToApiStation: Record<string, string> = {
        "26733": "NWK",  // Newark
        "26729": "HAR",  // Harrison
        "26731": "JSQ",  // Journal Square
        "26728": "GRV",  // Grove Street
        "26727": "NEW",  // Newport
        "26726": "EXP",  // Exchange Place
        "26730": "HOB",  // Hoboken
        "26734": "WTC",  // World Trade Center
        "26732": "CHR",  // Christopher Street
        "26725": "09S",  // 9th Street
        "26723": "14S",  // 14th Street
        "26722": "23S",  // 23rd Street
        "26724": "33S",  // 33rd Street
      };

      const apiStationCode = gtfsToApiStation[station as string];
      if (!apiStationCode) {
        return res.status(400).json({ 
          error: "Unknown station ID",
          details: `Station ${station} not found in PATH system`
        });
      }

      // Fetch from official PANYNJ API
      const response = await fetch("https://www.panynj.gov/bin/portauthority/ridepath.json");

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`PATH API error (${response.status}): ${errorText}`);
        return res.status(502).json({ 
          error: "Failed to fetch PATH data", 
          details: `Upstream returned ${response.status}` 
        });
      }

      const data = await response.json() as {
        results: Array<{
          consideredStation: string;
          destinations: Array<{
            label: string;
            messages: Array<{
              target: string;
              secondsToArrival: string;
              arrivalTimeMessage: string;
              lineColor: string;
              headSign: string;
              lastUpdated: string;
            }>;
          }>;
        }>;
      };

      // Find the station in API response
      const stationData = data.results.find(r => r.consideredStation === apiStationCode);
      
      if (!stationData) {
        return res.json({
          direction: direction as string,
          line: line as string,
          destination: direction === "To NY" ? "Manhattan" : "New Jersey",
          subtitle: "No Data",
          arrivalMinutes: [],
          arrivalLines: [],
        });
      }

      // Map direction to API label
      const apiLabel = direction === "To NY" ? "ToNY" : "ToNJ";
      const destinationData = stationData.destinations.find(d => d.label === apiLabel);

      if (!destinationData || !destinationData.messages.length) {
        return res.json({
          direction: direction as string,
          line: line as string,
          destination: direction === "To NY" ? "Manhattan" : "New Jersey",
          subtitle: "No Trains",
          arrivalMinutes: [],
          arrivalLines: [],
        });
      }

      // Extract arrivals from messages
      const arrivals = destinationData.messages
        .map(msg => ({
          minutes: Math.round(parseInt(msg.secondsToArrival, 10) / 60),
          headsign: msg.headSign,
          target: msg.target,
        }))
        .filter(a => a.minutes >= 0)
        .sort((a, b) => a.minutes - b.minutes)
        .slice(0, 3);

      // Determine terminal info from first arrival's headsign
      const firstHeadsign = arrivals[0]?.headsign || "";
      
      const pathData = {
        direction: direction as string,
        line: line as string,
        destination: direction === "To NY" ? "Manhattan" : "New Jersey",
        subtitle: firstHeadsign || (direction === "To NY" ? "World Trade Center" : "Newark"),
        arrivalMinutes: arrivals.map(a => a.minutes === 0 ? 1 : a.minutes),
        arrivalLines: arrivals.map(() => line as string),
      };

      res.json(pathData);
    } catch (error) {
      console.error("Error fetching PATH data:", error);
      
      const fallbackDirection = req.query.direction as string;
      const fallbackLine = req.query.line as string;
      
      // Fallback data when API is unavailable
      const pathRouteInfo: Record<string, Record<string, { station: string; borough: string }>> = {
        "To NY": {
          "PATH-NWK": { station: "World Trade Center", borough: "Manhattan" },
          "PATH-JSQ": { station: "33rd Street", borough: "Manhattan" },
          "PATH-HOB-WTC": { station: "World Trade Center", borough: "Manhattan" },
          "PATH-HOB-33": { station: "33rd Street", borough: "Manhattan" },
        },
        "To NJ": {
          "PATH-NWK": { station: "Newark", borough: "New Jersey" },
          "PATH-JSQ": { station: "Journal Square", borough: "New Jersey" },
          "PATH-HOB-WTC": { station: "Hoboken", borough: "New Jersey" },
          "PATH-HOB-33": { station: "Hoboken", borough: "New Jersey" },
        },
      };
      
      const terminalInfo = pathRouteInfo[fallbackDirection]?.[fallbackLine] || 
        { station: "Unknown", borough: fallbackDirection === "To NY" ? "Manhattan" : "New Jersey" };
      
      // Generate simulated arrival times when feed is unavailable
      const now = new Date();
      const minuteOfHour = now.getMinutes();
      const baseMinutes = (minuteOfHour % 10) + 2;
      const simulatedArrivals = [
        baseMinutes,
        baseMinutes + 8 + (minuteOfHour % 5),
        baseMinutes + 18 + (minuteOfHour % 7),
      ];
      
      const fallbackData = {
        direction: fallbackDirection,
        line: fallbackLine,
        destination: terminalInfo.borough,
        subtitle: terminalInfo.station,
        arrivalMinutes: simulatedArrivals,
        arrivalLines: [fallbackLine, fallbackLine, fallbackLine],
      };
      
      res.json(fallbackData);
    }
  });

  // Service Alerts API - fetches MTA subway service alerts with descriptions
  app.get("/api/alerts", async (req, res) => {
    try {
      // Fetch protobuf endpoint (URL-encoded path works without API key)
      const response = await fetch(
        "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts"
      );
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn("MTA Alerts API returned 403 - API key may be required or invalid");
        } else {
          console.error(`MTA Alerts API error (${response.status})`);
        }
        return res.json({ alertsByRoute: {} }); // Return empty alerts on failure
      }

      // Decode Protocol Buffer data
      const buffer = await response.arrayBuffer();
      const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(buffer)
      );

      // Extract alerts by route with descriptions
      const alertsByRoute: Record<string, { hasAlert: boolean; descriptions: string[] }> = {};

      for (const entity of feed.entity) {
        if (!entity.alert) continue;

        const alert = entity.alert;
        
        // Extract alert header text (plain text version, not HTML)
        let alertText = "";
        if (alert.headerText?.translation) {
          // Prefer plain English text over HTML version
          const plainText = alert.headerText.translation.find(
            (t) => t.language === "en"
          );
          const htmlText = alert.headerText.translation.find(
            (t) => t.language === "en-html"
          );
          alertText = plainText?.text || htmlText?.text || "";
          
          // Strip HTML tags if we got HTML version
          if (alertText && htmlText && !plainText) {
            alertText = alertText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          }
        }
        
        // Check informed entities for affected routes
        for (const informed of alert.informedEntity || []) {
          const routeId = informed.routeId;
          if (routeId && alertText) {
            if (!alertsByRoute[routeId]) {
              alertsByRoute[routeId] = { hasAlert: true, descriptions: [] };
            }
            // Avoid duplicate descriptions
            if (!alertsByRoute[routeId].descriptions.includes(alertText)) {
              alertsByRoute[routeId].descriptions.push(alertText);
            }
          } else if (routeId) {
            // Route has alert but no description available
            if (!alertsByRoute[routeId]) {
              alertsByRoute[routeId] = { hasAlert: true, descriptions: [] };
            }
          }
        }
      }

      res.json({ alertsByRoute });
    } catch (error) {
      console.error("Error fetching service alerts:", error);
      res.json({ alertsByRoute: {} }); // Return empty alerts on failure
    }
  });

  // Bus Routes API - fetches MTA bus routes filtered by borough
  // Supports both /api/bus/routes/:borough and /api/bus/routes?borough=xxx
  app.get("/api/bus/routes/:borough?", async (req, res) => {
    try {
      const apiKey = process.env.MTA_BUS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MTA Bus API key not configured" });
      }

      // Support both path param and query param
      const borough = req.params.borough || (req.query.borough as string);
      if (!borough) {
        return res.status(400).json({ error: "Borough parameter required" });
      }

      // Borough to route prefix mapping
      const boroughPrefixes: Record<string, string[]> = {
        'manhattan': ['M'],
        'brooklyn': ['B'],
        'bronx': ['Bx'],
        'queens': ['Q'],
        'staten_island': ['S'],
      };

      const prefixes = boroughPrefixes[borough];
      if (!prefixes) {
        return res.status(400).json({ error: "Invalid borough" });
      }

      // Fetch all routes from MTA Bus Time API
      const response = await fetch(
        `https://bustime.mta.info/api/where/routes-for-agency/MTA%20NYCT.json?key=${apiKey}`
      );

      if (!response.ok) {
        console.error(`MTA Bus API error (${response.status}): ${await response.text()}`);
        return res.status(500).json({ error: "Failed to fetch bus routes" });
      }

      const data = await response.json();

      // Filter routes by borough prefix
      const routes = data.data?.list || [];
      const filteredRoutes = routes
        .filter((route: any) => {
          const shortName = route.shortName || '';
          return prefixes.some(prefix => shortName.startsWith(prefix));
        })
        .map((route: any) => ({
          id: route.id,
          shortName: route.shortName,
          longName: route.longName || route.description || '',
          description: route.description || '',
        }))
        .sort((a: any, b: any) => {
          // Sort routes numerically, handling SBS suffix
          const getNumber = (name: string) => {
            const match = name.match(/\d+/);
            return match ? parseInt(match[0]) : 999;
          };
          return getNumber(a.shortName) - getNumber(b.shortName);
        });

      res.json({ routes: filteredRoutes });
    } catch (error) {
      console.error("Error fetching bus routes:", error);
      res.status(500).json({ error: "Failed to fetch bus routes" });
    }
  });

  // Bus Stops API - fetches stops for a specific bus route
  // Supports both /api/bus/stops/:routeId and /api/bus/stops?routeId=xxx
  app.get("/api/bus/stops/:routeId?", async (req, res) => {
    try {
      const apiKey = process.env.MTA_BUS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MTA Bus API key not configured" });
      }

      // Support both path param and query param (URL decode since route IDs have spaces/special chars)
      const routeId = req.params.routeId ? decodeURIComponent(req.params.routeId) : (req.query.routeId as string);
      if (!routeId) {
        return res.status(400).json({ error: "routeId parameter required" });
      }

      // Fetch stops for the route
      const response = await fetch(
        `https://bustime.mta.info/api/where/stops-for-route/${encodeURIComponent(routeId)}.json?key=${apiKey}&includePolylines=false&version=2`
      );

      if (!response.ok) {
        console.error(`MTA Bus Stops API error (${response.status}): ${await response.text()}`);
        return res.status(500).json({ error: "Failed to fetch bus stops" });
      }

      const data = await response.json();

      // Extract stops from the response - organized by direction
      const stopGroupings = data.data?.entry?.stopGroupings || [];
      const stopsById: Record<string, any> = {};
      
      // Build stops lookup
      for (const stop of data.data?.references?.stops || []) {
        stopsById[stop.id] = stop;
      }

      // Organize stops by direction
      const directions: any[] = [];
      
      for (const grouping of stopGroupings) {
        if (grouping.type === 'direction') {
          for (const group of grouping.stopGroups || []) {
            const directionName = group.name?.name || group.id || 'Unknown';
            const stopIds = group.stopIds || [];
            const stops = stopIds
              .map((id: string) => stopsById[id])
              .filter((s: any) => s)
              .map((s: any) => ({
                id: s.id,
                name: s.name,
                code: s.code,
                lat: s.lat,
                lon: s.lon,
              }));
            
            directions.push({
              directionId: group.id,
              directionName,
              headsign: directionName,
              stops,
            });
          }
        }
      }

      res.json({ directions });
    } catch (error) {
      console.error("Error fetching bus stops:", error);
      res.status(500).json({ error: "Failed to fetch bus stops" });
    }
  });

  // Bus Arrivals API - fetches real-time arrivals for a stop
  app.get("/api/bus/arrivals", async (req, res) => {
    try {
      const apiKey = process.env.MTA_BUS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "MTA Bus API key not configured" });
      }

      const stopId = req.query.stopId as string;
      const routeId = req.query.routeId as string; // Optional: filter by specific route (e.g., "MTA NYCT_M31")
      if (!stopId) {
        return res.status(400).json({ error: "stopId parameter required" });
      }

      // Extract short name from routeId for matching (e.g., "M31" from "MTA NYCT_M31")
      const routeShortNameFilter = routeId ? routeId.split('_').pop() : null;

      // Fetch real-time arrivals using SIRI stop monitoring
      const response = await fetch(
        `https://bustime.mta.info/api/siri/stop-monitoring.json?key=${apiKey}&MonitoringRef=${encodeURIComponent(stopId)}&MaximumStopVisits=10`
      );

      if (!response.ok) {
        console.error(`MTA Bus Arrivals API error (${response.status}): ${await response.text()}`);
        return res.status(500).json({ error: "Failed to fetch bus arrivals" });
      }

      const data = await response.json();

      // Extract arrivals from SIRI response
      const deliveries = data.Siri?.ServiceDelivery?.StopMonitoringDelivery || [];
      const arrivals: any[] = [];
      let stopName = '';

      for (const delivery of deliveries) {
        for (const visit of delivery.MonitoredStopVisit || []) {
          const mvj = visit.MonitoredVehicleJourney;
          if (!mvj) continue;
          
          // Get the stop name from the first visit
          if (!stopName) {
            stopName = mvj.MonitoredCall?.StopPointName?.[0] || '';
          }

          const routeShortName = mvj.PublishedLineName?.[0] || mvj.LineRef || '';
          
          // Filter by route if specified (match against short name or full LineRef)
          if (routeShortNameFilter && routeShortName !== routeShortNameFilter) {
            // Also check if LineRef contains the filter (e.g., "MTA NYCT_M31" contains "M31")
            const lineRef = mvj.LineRef || '';
            if (!lineRef.includes(routeShortNameFilter)) {
              continue; // Skip arrivals from other routes
            }
          }
          
          const destinationName = mvj.DestinationName?.[0] || '';
          
          // Calculate minutes until arrival
          let arrivalMinutes = null;
          const expectedArrival = mvj.MonitoredCall?.ExpectedArrivalTime;
          const expectedDeparture = mvj.MonitoredCall?.ExpectedDepartureTime;
          const arrivalTime = expectedArrival || expectedDeparture;
          
          if (arrivalTime) {
            const arrivalDate = new Date(arrivalTime);
            const now = new Date();
            arrivalMinutes = Math.max(0, Math.round((arrivalDate.getTime() - now.getTime()) / 60000));
          }

          // Get distance info
          const distanceFromStop = mvj.MonitoredCall?.DistanceFromStop;
          const stopsAway = mvj.MonitoredCall?.NumberOfStopsAway;
          const presentableDistance = mvj.MonitoredCall?.Extensions?.Distances?.PresentableDistance;

          arrivals.push({
            routeId: mvj.LineRef,
            routeShortName,
            destinationName,
            arrivalMinutes,
            stopsAway,
            distanceFromStop,
            presentableDistance,
            vehicleRef: mvj.VehicleRef,
          });
        }
      }

      // Sort by arrival time
      arrivals.sort((a, b) => {
        if (a.arrivalMinutes === null) return 1;
        if (b.arrivalMinutes === null) return -1;
        return a.arrivalMinutes - b.arrivalMinutes;
      });

      res.json({ arrivals: arrivals.slice(0, 6), stopName });
    } catch (error) {
      console.error("Error fetching bus arrivals:", error);
      res.status(500).json({ error: "Failed to fetch bus arrivals" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
