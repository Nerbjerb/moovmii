# Design Guidelines for moovmii Transit Kiosk

## Design Approach
**Reference-Based Approach**: Transit display systems (NYC MTA digital displays, Citymapper, Transit app) combined with modern kiosk interface patterns. Optimized for glanceable information at distance with high-contrast, large-scale typography.

## Core Design Principles
1. **Distance Readability**: All critical information must be readable from 10+ feet away
2. **High Contrast**: Dark background with light content cards for maximum visibility
3. **Instant Comprehension**: Users should grasp arrival times within 1 second of glancing
4. **Persistent Display**: Designed for always-on kiosk screens, not browsing sessions

## Typography System

**Font Stack**: System sans-serif (Helvetica Neue, Helvetica, Arial)

**Scale Hierarchy**:
- Clock Display: 160px (large screens), 100px (mobile) - Ultra bold
- Arrival Minutes: 72px bold - Primary attention point
- Destination Names: 44px (large), 32px (mobile) - Bold
- Subway Line Badges: 48px (large), 36px (mobile) - Bold
- Route Subtitles: 18px - Regular weight
- Weather Data: 14px labels, variable temps - Medium weight
- Direction Labels: 16px - Semibold
- Controls/Footer: 13px - Regular weight

## Layout System

**Spacing Units**: Tailwind spacing with primary values:
- Card padding: `p-[18px]` (22px for main container)
- Section gaps: `gap-[18px]` vertical tracks, `gap-5` controls
- Weather stack: `gap-3`
- Bottom row: `gap-5`
- Overlay elements: `gap-2.5`

**Container Structure**:
- Max width: 1200px centered
- Kiosk panel: Full width with 22px internal padding
- Track cards: Full width within kiosk container
- Weather stack: Fixed 320px width, right-aligned

**Responsive Breakpoints**:
- Desktop: Full scale at 900px+
- Mobile: Reduced typography and badge sizes below 900px

## Component Library

### Track Cards
- Light gray rounded cards (`#e6e6e6`, 18px border radius)
- Minimum height: 110px
- Horizontal layout with distinct zones:
  - Rotated direction label (positioned outside left edge)
  - Circular subway badge (110px diameter on desktop)
  - Route information (flex-grow)
  - Large minutes display (140px fixed width)
  - Mini overlay cards (additional arrivals)

### Subway Line Badges
- Circular yellow badges (`#ffd200`) 
- Desktop: 110px diameter (main), 56px (overlay)
- Center subway line icons/letters
- High contrast black text/icons on yellow

### Clock Panel
- Extra-large bold numerals in white
- Left-aligned within flex container
- 12/24 hour format toggle
- Updates every second

### Weather Tiles
- Black background tiles with white text
- 8px border radius
- Vertical stack layout
- 64px square weather icons
- Time labels above, temperature below icons
- 200px minimum width

### Mini Overlay Cards
- Light overlay background (`#d6d6d6`)
- 12px border radius
- Vertical layout: small badge + minutes label
- 90px minimum width
- Used for secondary arrival times

### Controls
- Small select dropdown for time format
- Fullscreen toggle button
- Grouped in header with 10px gap
- 13px font size labels

## Visual Design Elements

**Color Palette** (from existing implementation):
- Background: `#0b0b0b` (near black)
- Card Background: `#e6e6e6` (light gray)
- Card Overlay: `#d6d6d6` (medium gray)
- Accent: `#ffd200` (bright yellow)
- White: `#ffffff`
- Muted Text: `#bdbdbd`

**Shadows**:
- Main kiosk panel: `0 6px 20px rgba(0,0,0,0.25)`

**Border Radius**:
- Main container: 6px
- Track cards: 18px
- Circular badges: 50%
- Weather tiles: 8px
- Mini cards: 12px

## Images

**Subway Line Icons**:
- Location: `assets/` folder
- Format: PNG with transparency
- Usage: N train (`n.png`), W train (`w.png`)
- Display: Centered in circular badges at 80-90% badge size
- Fallback: Single letter if image missing

**Weather Icons**:
- Location: `assets/` folder
- Format: PNG
- Types: Sun (`sun.png`), Rain (`rain.png`)
- Display: 64px square in weather tiles
- Required for visual weather indication

**No Hero Image**: This is a functional kiosk display, not a marketing page

## Accessibility & Usability

- Fullscreen mode for kiosk deployment
- Auto-updating content (no user interaction required)
- High contrast ratios for visibility
- Large touch targets for format controls
- Responsive scaling maintains readability

## Animation Strategy

**Minimal, Functional Only**:
- Data updates should be instant (no fade transitions)
- Clock updates every second without animation
- Arrival times decrement smoothly every 5 seconds
- No decorative animations - focus on information clarity

## Key UX Patterns

1. **Information Hierarchy**: Minutes → Destination → Additional arrivals
2. **Persistent Display**: Always-on with auto-refresh, no page reloads
3. **Time-Sensitive Data**: Visual countdown timers show urgency
4. **Multi-Train View**: Parallel track cards for uptown/downtown simultaneously
5. **Contextual Weather**: Time-stamped forecasts for trip planning
6. **Glanceable Design**: All critical info visible without scrolling