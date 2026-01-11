# moovmii Transit Kiosk

## Overview
moovmii is a real-time NYC subway transit display kiosk application designed for always-on screens. It provides glanceable information about subway arrivals, weather forecasts, and time display. The application is optimized for readability from a distance, drawing inspiration from NYC MTA digital displays, Citymapper, and Transit app, combined with modern kiosk interface patterns. It aims to offer instant comprehension of transit information, designed for persistent display in public spaces.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** and **TypeScript**, using **Vite** for building and development. **Wouter** handles client-side routing. UI components leverage **Radix UI** primitives and **shadcn/ui** for accessible, styled components, with custom components for kiosk-specific displays. **Tailwind CSS** is used for styling, optimized for distance readability with high-contrast dark backgrounds and large typography. The design prioritizes distance readability, high contrast, and instant comprehension for always-on kiosk displays.

### Backend Architecture
The backend uses an **Express.js** server with **TypeScript**. It integrates with Vite for development and serves static files in production. The data layer utilizes **Drizzle ORM** for PostgreSQL interaction, with in-memory storage used as a placeholder. The API is RESTful, with routes prefixed by `/api`. Data models include `SubwayArrival`, `WeatherData`, and a scaffolded `User` model.

### Key Architectural Decisions
- **Monorepo Structure**: Shared types and schemas are organized in a `shared/` directory, accessible to both client and server, with path aliases for clean imports.
- **Static Asset Management**: Assets are stored in `attached_assets/` and integrated via Vite aliases.
- **Kiosk Display Mode**: Designed for an 800x480 pixel display, with a fixed 12-hour clock format and no navigation controls.
- **Real-time Updates**: Data is continuously refreshed: clock (always 12-hour), weather every 10 minutes, and subway arrivals every 30 seconds.
- **NYC Timezone Handling**: All times are displayed in NYC Eastern Time, using `Intl.DateTimeFormat` for DST-safe conversion.
- **Fixed Element Positioning**: UI elements within `TrackCard` use fixed absolute positioning to prevent shifting during content updates.
- **Performance Optimizations**: React Query is configured with disabled refetching (`staleTime: Infinity`) and minimal re-renders.
- **Settings Page - Station Selection**: A dedicated `/settings` route allows users to hierarchically select and assign transit stations and directions to display rows. The UI dynamically adjusts direction terminology (e.g., Uptown/Downtown, Inbound/Outbound) and uses MTA-style flag indicators.
- **Edit Mode**: A dedicated edit mode allows modification of displayed routes, saving selections to the database, and redirecting back to the kiosk view.
- **Dynamic Arrivals Integration**: Kiosk loads user preferences to fetch dynamic arrival data. Arrivals from same-color lines are merged and displayed chronologically. Default preferences are used if none are set.

## External Dependencies

- **Database**: **Neon Serverless PostgreSQL** via `@neondatabase/serverless`.
- **Third-party Assets**:
  - **MTA Subway Bullets**: SVG icons for NYC subway lines from `attached_assets/moovmii/MTA Icons/`.
  - **Weather Icons**: SVG icons for various weather conditions from `attached_assets/moovmii/Weather Icons/`.
- **External APIs**:
  - **OpenWeatherMap API**: Live weather data for NYC, refreshed every 10 minutes.
  - **MTA GTFS Real-time Feed**: Live subway arrival data for N/W trains at Broadway-Astoria, refreshed every 30 seconds. Uses `gtfs-realtime-bindings`.
  - **LIRR Real-time Feed**: Live LIRR train arrivals.
  - **Metro-North Real-time Feed**: Live Metro-North train arrivals.
  - **PATH Real-time API**: Live PATH train arrivals from `www.panynj.gov`, refreshed every 30 seconds.
  - **MTA Service Alerts API**: Service disruption alerts for subway lines, refreshed every 60 seconds, with an expandable alert view.
  - **MTA Bus Time API**: Live bus arrival data for NYC bus routes, requiring an API key, refreshed every 30 seconds.
- **Development Tools**: Replit-specific plugins, **ESBuild** for server-side bundling.