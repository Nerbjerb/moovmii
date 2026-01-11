import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";

// Import all subway line icons
import icon1 from "@assets/moovmii/MTA Icons/src/svg/1.svg";
import icon2 from "@assets/moovmii/MTA Icons/src/svg/2.svg";
import icon3 from "@assets/moovmii/MTA Icons/src/svg/3.svg";
import icon4 from "@assets/moovmii/MTA Icons/src/svg/4.svg";
import icon5 from "@assets/moovmii/MTA Icons/src/svg/5.svg";
import icon6 from "@assets/moovmii/MTA Icons/src/svg/6.svg";
import icon6d from "@assets/moovmii/MTA Icons/src/svg/6d.svg";
import icon7 from "@assets/moovmii/MTA Icons/src/svg/7.svg";
import icon7d from "@assets/moovmii/MTA Icons/src/svg/7d.svg";
import iconA from "@assets/moovmii/MTA Icons/src/svg/a.svg";
import iconB from "@assets/moovmii/MTA Icons/src/svg/b.svg";
import iconC from "@assets/moovmii/MTA Icons/src/svg/c.svg";
import iconD from "@assets/moovmii/MTA Icons/src/svg/d.svg";
import iconE from "@assets/moovmii/MTA Icons/src/svg/e.svg";
import iconF from "@assets/moovmii/MTA Icons/src/svg/f.svg";
import iconFd from "@assets/moovmii/MTA Icons/src/svg/fd.svg";
import iconG from "@assets/moovmii/MTA Icons/src/svg/g.svg";
import iconH from "@assets/moovmii/MTA Icons/src/svg/h.svg";
import iconJ from "@assets/moovmii/MTA Icons/src/svg/j.svg";
import iconL from "@assets/moovmii/MTA Icons/src/svg/l.svg";
import iconM from "@assets/moovmii/MTA Icons/src/svg/m.svg";
import iconN from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import iconQ from "@assets/moovmii/MTA Icons/src/svg/q.svg";
import iconR from "@assets/moovmii/MTA Icons/src/svg/r.svg";
import iconS from "@assets/moovmii/MTA Icons/src/svg/s.svg";
import iconSf from "@assets/moovmii/MTA Icons/src/svg/sf.svg";
import iconSir from "@assets/moovmii/MTA Icons/src/svg/sir.svg";
import iconSr from "@assets/moovmii/MTA Icons/src/svg/sr.svg";
import iconT from "@assets/moovmii/MTA Icons/src/svg/t.svg";
import iconW from "@assets/moovmii/MTA Icons/src/svg/w.svg";
import iconZ from "@assets/moovmii/MTA Icons/src/svg/z.svg";
import iconLirr from "@assets/moovmii/MTA Icons/src/svg/LIRR_logo_white.png";
import iconMnr from "@assets/moovmii/MTA Icons/src/svg/Metro-North_logo_white.png";
import iconPath from "@assets/moovmii/MTA Icons/src/svg/PATH_logo_no_bg.png";

interface TrackCardProps {
  direction: string;
  line: string;
  destination: string;
  subtitle: string;
  arrivalMinutes: number[];
  arrivalLines: string[];
  isDowntown?: boolean;
  hasAlert?: boolean;
  alertDescriptions?: string[];
  isBus?: boolean;
}

// Map all subway lines to their icons
const lineIcons: Record<string, string> = {
  "1": icon1,
  "2": icon2,
  "3": icon3,
  "4": icon4,
  "5": icon5,
  "6": icon6,
  "6d": icon6d,
  "6X": icon6d,
  "7": icon7,
  "7d": icon7d,
  "7X": icon7d,
  A: iconA,
  B: iconB,
  C: iconC,
  D: iconD,
  E: iconE,
  F: iconF,
  Fd: iconFd,
  FX: iconFd,
  G: iconG,
  H: iconH,
  J: iconJ,
  L: iconL,
  M: iconM,
  N: iconN,
  Q: iconQ,
  R: iconR,
  S: iconS,
  Sf: iconSf,
  FS: iconSf,
  SIR: iconSir,
  Sr: iconSr,
  GS: iconSr,
  T: iconT,
  W: iconW,
  Z: iconZ,
  // LIRR branches
  LIRR: iconLirr,
  "LIRR-1": iconLirr,
  "LIRR-2": iconLirr,
  "LIRR-3": iconLirr,
  "LIRR-4": iconLirr,
  "LIRR-5": iconLirr,
  "LIRR-6": iconLirr,
  "LIRR-7": iconLirr,
  "LIRR-8": iconLirr,
  "LIRR-9": iconLirr,
  "LIRR-10": iconLirr,
  // Metro-North lines
  MetroNorth: iconMnr,
  "MNR-1": iconMnr,
  "MNR-2": iconMnr,
  "MNR-3": iconMnr,
  "MNR-4": iconMnr,
  "MNR-5": iconMnr,
  "MNR-6": iconMnr,
};

export default function TrackCard({
  direction,
  line,
  destination,
  subtitle,
  arrivalMinutes,
  arrivalLines,
  isDowntown = false,
  hasAlert = false,
  alertDescriptions = [],
  isBus = false,
}: TrackCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const iconSrc = lineIcons[line];
  const [firstArrival, secondArrival, thirdArrival] = arrivalMinutes;
  const [firstLine, secondLine, thirdLine] = arrivalLines || [];
  
  const secondIconSrc = secondLine ? lineIcons[secondLine] : null;
  const thirdIconSrc = thirdLine ? lineIcons[thirdLine] : null;

  // Ref for auto-scrolling alert container
  const alertScrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect for service alerts
  useEffect(() => {
    if (!isExpanded || alertDescriptions.length === 0) return;
    
    const container = alertScrollRef.current;
    if (!container) return;
    
    let animationId: number;
    let scrollPosition = 0;
    let isPaused = true;
    let pauseTimeoutId: NodeJS.Timeout;
    const scrollSpeed = 0.167; // pixels per frame (~10px/sec at 60fps)
    const pauseDuration = 3000; // 3 second pause at top and bottom
    
    const animate = () => {
      if (!container) return;
      
      if (isPaused) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      const maxScroll = container.scrollHeight - container.clientHeight;
      
      if (maxScroll > 0) {
        scrollPosition += scrollSpeed;
        
        // Pause at bottom, then loop back to top
        if (scrollPosition >= maxScroll) {
          scrollPosition = maxScroll;
          container.scrollTop = scrollPosition;
          isPaused = true;
          pauseTimeoutId = setTimeout(() => {
            scrollPosition = 0;
            container.scrollTop = 0;
            // Pause at top before starting again
            pauseTimeoutId = setTimeout(() => {
              isPaused = false;
            }, pauseDuration);
          }, pauseDuration);
        } else {
          container.scrollTop = scrollPosition;
        }
      }
      
      animationId = requestAnimationFrame(animate);
    };
    
    // Start animation after 3 second pause at top
    const initialTimeoutId = setTimeout(() => {
      isPaused = false;
      animationId = requestAnimationFrame(animate);
    }, pauseDuration);
    
    return () => {
      clearTimeout(initialTimeoutId);
      clearTimeout(pauseTimeoutId);
      cancelAnimationFrame(animationId);
    };
  }, [isExpanded, alertDescriptions]);

  // Handle click on logo/alert icon area
  const handleLogoClick = () => {
    if (hasAlert && alertDescriptions.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  // Parse alert text and replace [X] patterns with inline icons
  const renderAlertText = (text: string) => {
    // Match patterns like [N], [W], [A], [1], [7], etc.
    const parts = text.split(/(\[[A-Z0-9]+\])/g);
    
    return parts.map((part, index) => {
      const match = part.match(/^\[([A-Z0-9]+)\]$/);
      if (match) {
        const lineName = match[1];
        const iconSrcForLine = lineIcons[lineName];
        if (iconSrcForLine) {
          return (
            <img 
              key={index}
              src={iconSrcForLine} 
              alt={`${lineName} train`}
              style={{ 
                width: '20px', 
                height: '20px', 
                display: 'inline-block',
                verticalAlign: 'middle',
                margin: '0 2px'
              }}
            />
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Handle click anywhere on expanded card to dismiss
  const handleCardClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    }
  };

  // Helper to display arrival time (show "1" for 0 minutes, "-" for 99+ minutes)
  const formatArrival = (mins: number | undefined): { value: string | number; unit: string } => {
    if (mins === undefined) return { value: '', unit: '' };
    if (mins === 0) return { value: 1, unit: 'Min' };
    if (mins >= 99) return { value: '-', unit: '' };
    return { value: mins, unit: 'Min' };
  };
  
  // Get formatted arrival data for each position
  const firstArrivalData = formatArrival(firstArrival);
  const secondArrivalData = formatArrival(secondArrival);
  const thirdArrivalData = formatArrival(thirdArrival);

  // Check if a line is LIRR (should show text instead of logo)
  const isLirrLine = (lineName: string) => lineName === 'LIRR' || lineName.startsWith('LIRR-');
  
  // Check if a line is Metro-North (should show text instead of logo)
  const isMnrLine = (lineName: string) => lineName === 'MetroNorth' || lineName.startsWith('MNR-');
  
  // Check if a line is PATH (should show text instead of logo)
  const isPathLine = (lineName: string) => lineName === 'PATH' || lineName.startsWith('PATH-');
  
  // Check if a line is a bus (should show route number badge)
  const isBusLine = (lineName: string) => 
    isBus || lineName.startsWith('MTA NYCT_') || lineName.startsWith('MTABC_') || lineName.startsWith('BUS-');
  
  // Extract bus route number from line ID (e.g., "MTA NYCT_M31" -> "M31")
  const getBusRouteNumber = (lineName: string): string => {
    if (lineName.startsWith('MTA NYCT_')) return lineName.replace('MTA NYCT_', '');
    if (lineName.startsWith('MTABC_')) return lineName.replace('MTABC_', '');
    if (lineName.startsWith('BUS-')) return lineName.replace('BUS-', '');
    return lineName;
  };

  // Get display direction - LIRR, MNR, 7, L, J, Z trains use Inbound/Outbound; PATH uses To NY/To NJ
  // LIRR: Inbound = towards Manhattan (Uptown), Outbound = away from Manhattan (Downtown)
  // MNR: Inbound = towards Grand Central (Downtown), Outbound = away from Grand Central (Uptown)
  // 7 train: Inbound = towards 34 St-Hudson Yards (Downtown), Outbound = towards Flushing-Main St (Uptown)
  // L train: Inbound = towards 8 Av (Downtown), Outbound = towards Canarsie (Uptown)
  // J/Z trains: Inbound = towards Broad St (Downtown), Outbound = towards Jamaica Center (Uptown)
  // PATH: To NY (Uptown), To NJ (Downtown)
  // Buses: Show empty direction (headsign shown in destination)
  const getDisplayDirection = () => {
    if (isBusLine(line)) {
      // For buses, show the destination in proper case (e.g., "Astoria", "Sunnyside")
      return busDestination || 'Bus';
    }
    if (isPathLine(line)) {
      if (direction === 'Uptown' || direction === 'To NY') return 'To NY';
      if (direction === 'Downtown' || direction === 'To NJ') return 'To NJ';
    }
    if (isLirrLine(line)) {
      if (direction === 'Uptown') return 'Inbound';
      if (direction === 'Downtown') return 'Outbound';
    }
    if (isMnrLine(line) || line === '7' || line === 'L' || line === 'J' || line === 'Z') {
      if (direction === 'Uptown') return 'Outbound';
      if (direction === 'Downtown') return 'Inbound';
    }
    return direction;
  };

  // Known abbreviations to preserve in uppercase
  const ABBREVIATIONS = ['LES', 'JFK', 'NYC', 'WTC', 'NJ', 'NY', 'SBS', 'LIRR', 'MNR', 'PATH', 'AV', 'ST', 'PL', 'BLVD', 'RD', 'DR', 'CT', 'HWY'];
  
  // Helper to proper case text while preserving abbreviations (ASTORIA -> Astoria, but LES stays LES)
  const toProperCase = (text: string): string => {
    return text.split(/\s+/).map(word => {
      const upper = word.toUpperCase();
      if (ABBREVIATIONS.includes(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };
  
  // Shorten "Select Bus" to "SBS"
  const shortenSelectBus = (text: string): string => {
    return text.replace(/Select Bus/gi, 'SBS');
  };

  // Extract text before dash for destination
  const displayDestination = destination.split('-')[0].trim();
  
  // For buses, use proper case destination with Select Bus shortened
  const busDestination = shortenSelectBus(toProperCase(displayDestination));
  
  // Calculate dynamic font size for bus text to prevent overlap with minutes
  const getBusDestinationStyle = () => {
    const fullText = `To: ${busDestination}`;
    const baseSize = 35;
    // Shrink text if longer than ~12 characters to prevent overlap
    if (fullText.length > 18) return { fontSize: '24px' };
    if (fullText.length > 14) return { fontSize: '28px' };
    if (fullText.length > 12) return { fontSize: '32px' };
    return { fontSize: `${baseSize}px` };
  };
  
  // Calculate subtitle top position - adjust if destination wraps to 2 lines
  const getSubtitleTop = () => {
    const baseTop = 58;
    
    if (isBusLine(line)) {
      const fullText = `To: ${busDestination}`;
      const fontSize = parseInt(getBusDestinationStyle().fontSize);
      // Estimate characters per line based on font size and 270px max width
      // Approximate: larger font = fewer chars per line
      const charsPerLine = Math.floor(270 / (fontSize * 0.6));
      
      // If text likely wraps to 2 lines, add extra space
      if (fullText.length > charsPerLine) {
        // Add roughly one line height worth of space
        return `${baseTop + fontSize * 1.05}px`;
      }
    }
    
    return `${baseTop}px`;
  };
  
  // Canonical direction labels that should never wrap - show on single line
  const CANONICAL_DIRECTIONS = ['Downtown', 'Uptown', 'Inbound', 'Outbound', 'To NY', 'To NJ'];
  
  // Calculate direction text style - different behavior for canonical vs other directions
  const getDirectionStyle = (): React.CSSProperties => {
    const dirText = getDisplayDirection();
    
    // For canonical directions: single line, no wrap, shrink to fit
    if (CANONICAL_DIRECTIONS.includes(dirText)) {
      return {
        fontSize: '13px',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
        overflow: 'hidden'
      };
    }
    
    // For other directions (bus destinations, etc.): allow 2-line wrap
    const len = dirText.length;
    // Shrink text more aggressively for longer strings
    let fontSize = '20px';
    if (len > 20) fontSize = '10px';
    else if (len > 18) fontSize = '11px';
    else if (len > 16) fontSize = '12px';
    else if (len > 14) fontSize = '13px';
    else if (len > 12) fontSize = '14px';
    else if (len > 10) fontSize = '16px';
    else if (len > 8) fontSize = '18px';
    
    return {
      fontSize,
      display: '-webkit-box',
      WebkitLineClamp: 2,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      wordBreak: 'break-word',
      textAlign: 'center'
    };
  };

  return (
    <div className="relative flex items-center gap-[9px]" onClick={handleCardClick}>
      {/* Main card - front layer with fixed positioning */}
      <Card 
        className={`relative rounded-[9px] overflow-visible border-0 bg-[#2D2C31] z-30 h-[115px] transition-all duration-300 ${
          isExpanded ? 'w-[752px]' : 'w-[510px]'
        }`}
      >
        {/* Direction label - left strip */}
        <div className="absolute left-0 top-0 w-10 h-full bg-[#2D2C31] rounded-l-[9px] overflow-hidden">
          {/* Inner wrapper: sized 115x40, rotated so it fits in the 40x115 strip */}
          <div
            style={{
              position: 'absolute',
              width: '115px',
              height: '41px',
              top: '0',
              left: '-0.5px',
              transform: 'rotate(-90deg) translateX(-115px)',
              transformOrigin: 'top left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <div 
              className="font-medium text-white text-center"
              style={{ 
                width: '105px',
                height: '31px',
                lineHeight: '1.15',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...getDirectionStyle()
              }}
              data-testid="text-direction"
            >
              {getDisplayDirection()}
            </div>
          </div>
        </div>

        {/* Train icon - absolute positioned, clickable when alert exists */}
        <div 
          className={`absolute w-24 h-24 rounded-full flex items-center justify-center ${
            hasAlert && alertDescriptions.length > 0 ? 'cursor-pointer' : ''
          }`}
          style={{ left: '67px', top: '18px' }}
          onClick={(e) => {
            if (hasAlert && alertDescriptions.length > 0) {
              e.stopPropagation();
              handleLogoClick();
            }
          }}
        >
          {isPathLine(line) ? (
            <div className="flex flex-col items-start" style={{ transform: 'translate(-35px, -10px)' }}>
              <img 
                src={iconPath} 
                alt="PATH" 
                className="object-contain"
                style={{ 
                  width: '65px',
                  height: 'auto',
                }}
              />
              {/* PATH line descriptor */}
              <div className="flex items-center gap-[5px] mt-[8px]">
                <div 
                  style={{ 
                    width: '2px', 
                    height: '12px', 
                    backgroundColor: line === 'PATH-NWK' ? '#D93A30' : 
                                     line === 'PATH-JSQ' ? '#F0A01E' : 
                                     line === 'PATH-HOB-WTC' ? '#4CAF50' : 
                                     line === 'PATH-HOB-33' ? '#0078D7' : '#FFFFFF'
                  }}
                />
                <span 
                  style={{ 
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    fontSize: '10px',
                    fontWeight: 500,
                    color: '#FFFFFF',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {line === 'PATH-NWK' ? 'Newark-WTC' : 
                   line === 'PATH-JSQ' ? 'JSQ-33 St' : 
                   line === 'PATH-HOB-WTC' ? 'Hoboken-WTC' : 
                   line === 'PATH-HOB-33' ? 'Hoboken-33 St' : 'PATH'}
                </span>
              </div>
            </div>
          ) : isLirrLine(line) ? (
            <span 
              className="font-bold text-white"
              style={{ 
                fontSize: '28px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                transform: 'translate(-35px, -10px)'
              }}
            >
              LIRR
            </span>
          ) : isMnrLine(line) ? (
            <div 
              className="font-bold text-white text-left"
              style={{ 
                fontSize: '22px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                transform: 'translate(-35px, -10px)',
                lineHeight: '1.1'
              }}
            >
              <div>Metro-</div>
              <div>North</div>
            </div>
          ) : isBusLine(line) ? (
            <div 
              className="flex items-center justify-center"
              style={{ 
                transform: 'translate(-35px, -10px)',
                minWidth: '50px',
                height: '50px',
                backgroundColor: '#1C7ED6',
                borderRadius: '8px',
                padding: '4px 10px'
              }}
            >
              <span 
                style={{ 
                  fontFamily: 'Helvetica, Arial, sans-serif',
                  fontSize: getBusRouteNumber(line).length > 3 ? '20px' : '26px',
                  fontWeight: 700,
                  color: '#FFFFFF',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.02em'
                }}
              >
                {getBusRouteNumber(line)}
              </span>
            </div>
          ) : iconSrc ? (
            <img 
              src={iconSrc} 
              alt={`${line} train`} 
              className="w-[69.7px] h-[69.7px] object-contain"
              style={{ transform: 'translate(-35px, -10px)' }}
            />
          ) : (
            <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
          )}
          
          {/* Alert indicator - triangle with exclamation mark */}
          {hasAlert && (
            <div 
              className="absolute"
              style={{ 
                right: '45px', 
                bottom: '17px',
                width: '25px',
                height: '25px',
              }}
              data-testid="alert-indicator"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: '25px', height: '25px' }}
              >
                <path 
                  d="M12 2L1 21h22L12 2z" 
                  fill="#FFD200"
                  stroke="#000000"
                  strokeWidth="1"
                />
                <text 
                  x="12" 
                  y="18" 
                  textAnchor="middle" 
                  fontSize="12" 
                  fontWeight="bold" 
                  fill="#000000"
                  fontFamily="Helvetica, Arial, sans-serif"
                >
                  !
                </text>
              </svg>
            </div>
          )}
        </div>

        {/* Destination - absolute positioned (hidden when expanded) */}
        {!isExpanded && (
          <div 
            className="absolute font-bold text-white" 
            style={{ 
              left: '130px',
              top: '18px',
              lineHeight: '1.1',
              fontSize: isBusLine(line) ? getBusDestinationStyle().fontSize : '35px',
              maxWidth: '270px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {isBusLine(line) ? `To: ${busDestination}` : displayDestination}
          </div>
        )}

        {/* Subtitle - absolute positioned (hidden when expanded) */}
        {!isExpanded && (
          <div 
            className="absolute text-[20px] text-white" 
            style={{ 
              left: '130px',
              top: getSubtitleTop(),
              lineHeight: '1.2',
              maxWidth: '270px',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {isBusLine(line) ? `Stop: ${shortenSelectBus(toProperCase(subtitle))}` : subtitle}
          </div>
        )}

        {/* Arrival time - absolute positioned (hidden when expanded) */}
        {!isExpanded && (
          <div 
            className="absolute w-[140px] text-center flex flex-col" 
            style={{ right: '4px', top: '18px', transform: 'translateY(-10px)' }}
          >
            <div className="text-[85px] font-bold leading-[0.8] text-white">
              {firstArrivalData.value}
            </div>
            <div className="text-xl mt-1 text-white">{firstArrivalData.unit}</div>
          </div>
        )}

        {/* Alert text - shown when expanded */}
        {isExpanded && alertDescriptions.length > 0 && (
          <div 
            ref={alertScrollRef}
            className="absolute [&::-webkit-scrollbar]:hidden"
            style={{ 
              left: '135px',
              top: '10px',
              right: '20px',
              bottom: '10px',
              maxHeight: '95px',
              overflowY: 'auto',
              overflowX: 'hidden',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            <div 
              className="text-white pr-1"
              style={{ 
                fontFamily: 'Helvetica, Arial, sans-serif',
                fontSize: '20px',
                lineHeight: '1.4'
              }}
            >
              {alertDescriptions.map((desc, i) => (
                <div key={i} style={{ marginBottom: i < alertDescriptions.length - 1 ? '8px' : '0' }}>
                  {renderAlertText(desc)}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Secondary arrivals positioned outside main card (hidden when expanded) */}
      {!isExpanded && (
        <div className="flex gap-[9px] items-center z-40">
          {secondArrival !== undefined && (
          <div className="bg-[#2D2C31] rounded-[6px] h-[115px] w-[113px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {secondLine && isPathLine(secondLine) ? (
                <img 
                  src={iconPath} 
                  alt="PATH" 
                  className="object-contain"
                  style={{ 
                    width: '38px',
                    height: 'auto',
                    transform: 'translate(-32px, 45px)'
                  }}
                />
              ) : secondLine && isLirrLine(secondLine) ? (
                <span 
                  className="font-bold text-white"
                  style={{ 
                    fontSize: '14px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    transform: 'translate(-32px, 45px)'
                  }}
                >
                  LIRR
                </span>
              ) : secondLine && isMnrLine(secondLine) ? (
                <div 
                  className="font-bold text-white text-left"
                  style={{ 
                    fontSize: '11px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    transform: 'translate(-32px, 45px)',
                    lineHeight: '1.1'
                  }}
                >
                  <div>Metro-</div>
                  <div>North</div>
                </div>
              ) : secondLine && isBusLine(secondLine) ? (
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    transform: 'translate(-32px, 45px)',
                    minWidth: '30px',
                    height: '30px',
                    backgroundColor: '#1C7ED6',
                    borderRadius: '5px',
                    padding: '2px 6px'
                  }}
                >
                  <span 
                    style={{ 
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      fontSize: getBusRouteNumber(secondLine).length > 3 ? '12px' : '14px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {getBusRouteNumber(secondLine)}
                  </span>
                </div>
              ) : secondIconSrc ? (
                <img
                  src={secondIconSrc}
                  alt={`${secondLine} train`}
                  className="w-[38.6px] h-[38.6px] object-contain"
                  style={{ transform: 'translate(-32px, 45px)' }}
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">{secondLine}</span>
              )}
            </div>
            <div className="text-[50px] font-medium text-white" style={{ transform: 'translate(23px, -25px)' }}>
              {secondArrivalData.value}
            </div>
            <div className="text-xs -mt-1 text-white" style={{ transform: 'translate(23px, -25px)' }}>{secondArrivalData.unit}</div>
          </div>
        )}

        {thirdArrival !== undefined && (
          <div className="bg-[#2D2C31] rounded-[6px] h-[115px] w-[113px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {thirdLine && isPathLine(thirdLine) ? (
                <img 
                  src={iconPath} 
                  alt="PATH" 
                  className="object-contain"
                  style={{ 
                    width: '38px',
                    height: 'auto',
                    transform: 'translate(-32px, 45px)'
                  }}
                />
              ) : thirdLine && isLirrLine(thirdLine) ? (
                <span 
                  className="font-bold text-white"
                  style={{ 
                    fontSize: '14px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    transform: 'translate(-32px, 45px)'
                  }}
                >
                  LIRR
                </span>
              ) : thirdLine && isMnrLine(thirdLine) ? (
                <div 
                  className="font-bold text-white text-left"
                  style={{ 
                    fontSize: '11px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    transform: 'translate(-32px, 45px)',
                    lineHeight: '1.1'
                  }}
                >
                  <div>Metro-</div>
                  <div>North</div>
                </div>
              ) : thirdLine && isBusLine(thirdLine) ? (
                <div 
                  className="flex items-center justify-center"
                  style={{ 
                    transform: 'translate(-32px, 45px)',
                    minWidth: '30px',
                    height: '30px',
                    backgroundColor: '#1C7ED6',
                    borderRadius: '5px',
                    padding: '2px 6px'
                  }}
                >
                  <span 
                    style={{ 
                      fontFamily: 'Helvetica, Arial, sans-serif',
                      fontSize: getBusRouteNumber(thirdLine).length > 3 ? '12px' : '14px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {getBusRouteNumber(thirdLine)}
                  </span>
                </div>
              ) : thirdIconSrc ? (
                <img
                  src={thirdIconSrc}
                  alt={`${thirdLine} train`}
                  className="w-[38.6px] h-[38.6px] object-contain"
                  style={{ transform: 'translate(-32px, 45px)' }}
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">{thirdLine}</span>
              )}
            </div>
            <div className="text-[50px] font-medium text-white" style={{ transform: 'translate(23px, -25px)' }}>
              {thirdArrivalData.value}
            </div>
            <div className="text-xs -mt-1 text-white" style={{ transform: 'translate(23px, -25px)' }}>{thirdArrivalData.unit}</div>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
