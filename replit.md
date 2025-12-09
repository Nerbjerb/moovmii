# moovmii Transit Kiosk

## Overview

moovmii is a real-time NYC subway transit display kiosk application designed for always-on screens. It provides glanceable information about subway arrivals, weather forecasts, and time display, optimized for readability from a distance. The application uses a reference-based design approach inspired by NYC MTA digital displays, Citymapper, and Transit app, combined with modern kiosk interface patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for component-based UI development
- **Vite** as the build tool and development server with hot module replacement
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **TanStack Query** for data fetching and state management (currently unused but scaffolded)

**UI Component Library**
- **Radix UI** primitives for accessible, unstyled UI components
- **shadcn/ui** component system built on Radix UI with Tailwind CSS styling
- Custom kiosk-specific components: `TrackCard`, `ClockDisplay`, `WeatherTile`, `KioskControls`

**Styling System**
- **Tailwind CSS** with custom configuration for kiosk-optimized design
- Custom CSS variables for light mode theming
- Typography system optimized for distance readability (160px clock display, 72px arrival minutes, 44px destination names)
- High contrast dark backgrounds with light content cards
- Spacing units: 18px card padding, consistent gap spacing throughout

**Design Principles**
- Distance readability: Critical information readable from 10+ feet away
- High contrast: Dark background (#0b0b0b) with dark gray train cards (#2D2C31) and white text
- Instant comprehension: Users should grasp arrival times within 1 second
- Persistent display: Designed for always-on kiosk screens, not browsing sessions

### Backend Architecture

**Server Framework**
- **Express.js** server with TypeScript
- Vite middleware integration for development with HMR
- Static file serving for production builds

**Data Layer**
- **Drizzle ORM** configured for PostgreSQL database interaction
- Schema defined in `shared/schema.ts` with types for `SubwayArrival` and `WeatherData`
- Currently using in-memory storage (`MemStorage` class) as a placeholder
- User authentication scaffolding present but not actively used

**API Structure**
- RESTful API routes prefixed with `/api`
- Request/response logging middleware
- Currently minimal routes implemented (scaffolded in `server/routes.ts`)

**Data Models**
- `SubwayArrival`: direction, line, destination, subtitle, arrivalMinutes array, arrivalLines array
- `WeatherData`: icon, temperature, description, time
- `User`: id, username, password (scaffolded for future authentication)

### External Dependencies

**Third-party Assets**
- **MTA Subway Bullets**: SVG icons for NYC subway lines (N, W trains currently used)
  - Located in `attached_assets/moovmii/MTA Icons/`
  - Provides optimized SVG and PNG formats for all subway lines
  - Custom build process using SVGO for optimization

- **Weather Icons**: SVG icons for weather conditions
  - Located in `attached_assets/moovmii/Weather Icons/`
  - Supports 222 weather-themed icons
  - Currently using: sun, rain, showers, cloudy, snow, thunderstorm, fog, windy

**Database**
- **Neon Serverless PostgreSQL** (via `@neondatabase/serverless` package)
- Database URL expected in `DATABASE_URL` environment variable
- Drizzle migrations stored in `./migrations` directory

**Development Tools**
- **Replit-specific plugins**: cartographer, dev-banner, runtime-error-modal for enhanced development experience
- **ESBuild** for server-side code bundling in production

**External APIs**
- **OpenWeatherMap API**: Live weather data for NYC (Broadway, Astoria coordinates: 40.7614, -73.9176)
  - 5-day/3-hour forecast endpoint with imperial units
  - Automatic 10-minute refresh interval on frontend
  - Weather icon mapping system supporting 50+ conditions with day/night variants
  - Comprehensive condition code mapping in `shared/weatherIconMapper.ts`
- **MTA GTFS Real-time Feed**: Live subway arrival data for N/W trains at Broadway-Astoria
  - GTFS-realtime Protocol Buffer format from `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-nqrw`
  - No API key required (publicly accessible as of 2025)
  - Stop IDs: R05N (Northbound/Uptown), R05S (Southbound/Downtown)
  - Chronological arrival display: N and W train arrivals merged and sorted by time for each direction
  - Mixed line sequence: 2nd and 3rd cards show next consecutive trains regardless of line (e.g., N, W, N)
  - Headsign extraction: Uses actual trip headsigns from GTFS feed with fallback to defaults
  - Zero-minute arrivals: Trains arriving now (0 minutes) display "1 Min" instead of "0 Min"
  - Automatic 30-second refresh interval on frontend
  - Uses `gtfs-realtime-bindings` package to decode Protocol Buffer data
- **LIRR Real-time Feed**: Live LIRR train arrivals
  - Feed URL: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/lirr%2Fgtfs-lirr`
  - No API key required
  - 10 branches supported: Babylon, Hempstead, Oyster Bay, Ronkonkoma, Montauk, Long Beach, Far Rockaway, West Hempstead, Port Washington, Port Jefferson
  - Each branch is treated separately (no merging between branches)
  - Stop IDs are numeric (no N/S suffix like subway)
  - Branch IDs mapped: LIRR-1 through LIRR-10
- **Metro-North Real-time Feed**: Live Metro-North train arrivals
  - Feed URL: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/mnr%2Fgtfs-mnr`
  - No API key required
  - 6 lines supported: Hudson, Harlem, New Haven, New Canaan, Danbury, Waterbury
  - Each line treated separately (no merging between lines)
  - Stop IDs are numeric (no N/S suffix like subway)
  - Line IDs mapped: MNR-1 through MNR-6
- All external APIs accessed server-side via `/api` endpoints

### Key Architectural Decisions

**Monorepo Structure**
- Shared types and schemas in `shared/` directory accessible to both client and server
- Path aliases configured (`@/`, `@shared/`, `@assets/`) for clean imports
- TypeScript configuration enables type safety across the entire stack

**Static Asset Management**
- Assets stored in `attached_assets/` directory
- Vite alias configuration (`@assets`) for clean asset imports
- SVG icons imported directly into React components for better bundling

**Kiosk Display Mode**
- Clean 800x480 pixel kiosk display without navigation or controls
- Removed moovmii logo, grid rulers, and time format toggle
- Clock fixed to 12-hour format for consistent kiosk display

**Real-time Updates**
- Clock always displays in 12-hour format (AM/PM)
- Weather data fetched every 10 minutes from OpenWeatherMap API
- Weather forecast shows next round hour in NYC time + 3 hours ahead
- Subway arrival data fetched every 30 seconds from MTA GTFS real-time feed
- Live N/W train arrivals at Broadway-Astoria station (R05) displayed with up to 3 upcoming trains per direction
- Mixed chronological sequence: All three arrival cards (main, 2nd, 3rd) show the next trains in time order regardless of line (e.g., N, W, N)
- Each card displays the appropriate train line icon (N or W) based on which train is arriving
- Zero-minute arrivals display "1 Min" to indicate trains arriving imminently

**NYC Timezone Handling**
- All weather times displayed in NYC Eastern Time (America/New_York)
- Uses `Intl.DateTimeFormat` with `formatToParts` for DST-safe timezone conversion
- Finds first future forecast at a round NYC hour (minute = 0)
- Works correctly on any server timezone (not dependent on UTC environment)
- Automatically handles DST transitions (EST ↔ EDT)
- Day/night icon selection based on NYC hour (6 AM - 6 PM = day)

**Fixed Element Positioning**
- TrackCard uses fixed absolute positioning for all elements (icon, destination, subtitle, arrival minutes)
- Card dimensions: 570px width × 115px height
- Icon positioned at left: 24px, top: 18px with transform: translate(-35px, -10px)
- Destination text positioned at left: 120px with transform: translate(-30px, -90px)
- Subtitle text positioned at left: 120px with transform: translate(-30px/-29px, -165px)
- Arrival minutes positioned at right: 24px with transform: translate(-30px, -10px)
- Static positioning ensures elements don't shift when content changes
- Both cards (Uptown/Downtown) use identical fixed positioning for visual consistency

**Performance Optimizations**
- React Query configured with disabled refetching (staleTime: Infinity)
- Component examples isolated in `client/src/components/examples/` for development
- Minimal re-renders through proper React patterns
- Fixed positioning eliminates dynamic layout recalculations

**Settings Page - Station Selection**
- Located at `/settings` route
- Hierarchical navigation: Line groups → Individual lines → Station stops
- Selection workflow: Click station → Choose direction (Uptown/Downtown) → Assign to Row 1 or Row 2
- Selection state stores `{stop, direction, line}` for each row assignment
- Universal favorite selection: Selecting a station on one line automatically shows flag on same-color lines
  - Color groups: NQRW (yellow), ACE (blue), 123 (red), 456 (green), BDFM (orange), JZ (brown), 7 (purple), L (gray), G (light green)
  - Regional services (SIR, LIRR, MetroNorth, PATH, NJT) are isolated and don't cross-propagate
  - Example: Selecting Broadway on N train shows flag when viewing W train (both yellow)
- MTA-style flag indicators with CSS clip-path polygon shapes
- Station list includes all NYC subway lines with scrollable interface

**Dynamic Arrivals Integration**
- Settings selections are saved to database via `/api/preferences` endpoint
- Kiosk loads preferences on mount and fetches arrivals for each row dynamically
- Same-color line merging: Selecting a station shows arrivals from ALL same-color lines chronologically
  - Example: 59 St-Columbus Circle Downtown on A train shows both A and C train arrivals merged
  - Arrivals sorted by time, so 2nd and 3rd cards may show different lines (A, C, A)
- Fallback: If no preferences set, defaults to Broadway-Astoria N/W trains
- Stop metadata in `shared/stopMetadata.ts` maps station names to GTFS stop IDs
- Feed URL mapping fetches correct MTA GTFS feeds for each line group