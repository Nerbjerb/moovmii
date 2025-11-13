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
- High contrast: Dark background (#000000) with light content cards (#e6e6e6)
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
- `SubwayArrival`: direction, line, destination, subtitle, arrivalMinutes array
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
- **MTA Real-time Subway Data**: Not yet implemented (currently using mock data)
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

**Fullscreen Kiosk Mode**
- Fullscreen API integration for dedicated kiosk display
- 12/24 hour time format toggle for user preference
- Responsive design with breakpoint at 900px for mobile vs. desktop layouts

**Real-time Updates**
- Clock updates every second via `setInterval`
- Weather data fetched every 10 minutes from OpenWeatherMap API
- Weather forecast shows next round hour in NYC time + 3 hours ahead
- Subway arrival data currently static but structured for future real-time updates

**NYC Timezone Handling**
- All weather times displayed in NYC Eastern Time (America/New_York)
- Uses `Intl.DateTimeFormat` with `formatToParts` for DST-safe timezone conversion
- Finds first future forecast at a round NYC hour (minute = 0)
- Works correctly on any server timezone (not dependent on UTC environment)
- Automatically handles DST transitions (EST ↔ EDT)
- Day/night icon selection based on NYC hour (6 AM - 6 PM = day)

**Cross-Card Element Alignment**
- Custom hook `useTrackAlignment` synchronizes element heights across both train cards
- Uses ResizeObserver to measure actual rendered heights of badge, destination, subtitle, and arrivals
- Measurements batched via requestAnimationFrame to prevent infinite render loops
- Writes CSS custom properties directly to DOM (avoids React state re-renders)
- TrackCard grid templates consume CSS variables like `var(--track-badge-height, 96px)`
- Ensures paired elements (icons, destinations, subtitles, arrivals) align perfectly across cards
- Adapts dynamically to content variations (long destination names, wrapping text, etc.)

**Performance Optimizations**
- React Query configured with disabled refetching (staleTime: Infinity)
- Component examples isolated in `client/src/components/examples/` for development
- Minimal re-renders through proper React patterns
- Cross-card alignment uses DOM mutations instead of React state to avoid render cascades