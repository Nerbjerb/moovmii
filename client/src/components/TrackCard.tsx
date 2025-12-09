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

interface TrackCardProps {
  direction: string;
  line: string;
  destination: string;
  subtitle: string;
  arrivalMinutes: number[];
  arrivalLines: string[];
  isDowntown?: boolean;
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
}: TrackCardProps) {
  const iconSrc = lineIcons[line];
  const [firstArrival, secondArrival, thirdArrival] = arrivalMinutes;
  const [firstLine, secondLine, thirdLine] = arrivalLines || [];
  
  const secondIconSrc = secondLine ? lineIcons[secondLine] : null;
  const thirdIconSrc = thirdLine ? lineIcons[thirdLine] : null;

  // Helper to display arrival time (show "1" for 0 minutes, hours for 120+ minutes)
  const formatArrival = (mins: number | undefined): { value: string | number; unit: string } => {
    if (mins === undefined) return { value: '', unit: 'Min' };
    if (mins === 0) return { value: 1, unit: 'Min' };
    if (mins >= 120) {
      const hours = Math.floor(mins / 60);
      return { value: hours, unit: 'Hour' };
    }
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

  // Get display direction - LIRR, MNR, 7, L, J, Z trains use Inbound/Outbound
  // LIRR: Inbound = towards Manhattan (Uptown), Outbound = away from Manhattan (Downtown)
  // MNR: Inbound = towards Grand Central (Downtown), Outbound = away from Grand Central (Uptown)
  // 7 train: Inbound = towards 34 St-Hudson Yards (Downtown), Outbound = towards Flushing-Main St (Uptown)
  // L train: Inbound = towards 8 Av (Downtown), Outbound = towards Canarsie (Uptown)
  // J/Z trains: Inbound = towards Broad St (Downtown), Outbound = towards Jamaica Center (Uptown)
  const getDisplayDirection = () => {
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

  // Extract text before dash for destination
  const displayDestination = destination.split('-')[0].trim();

  return (
    <div className="relative flex items-center gap-[9px]">
      {/* Main card - front layer with fixed positioning */}
      <Card className="relative rounded-[9px] overflow-visible border-0 bg-[#2D2C31] z-30 w-[510px] h-[115px]">
        {/* Direction label - left strip */}
        <div className="absolute left-0 top-0 w-10 h-full bg-[#2D2C31] flex items-center justify-center rounded-l-[9px]">
          <div 
            className="text-[17px] font-medium tracking-[0.14em] whitespace-nowrap text-white text-center"
            style={{ 
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)'
            }}
            data-testid="text-direction"
          >
            {getDisplayDirection()}
          </div>
        </div>

        {/* Train icon - absolute positioned */}
        <div 
          className="absolute w-24 h-24 rounded-full flex items-center justify-center" 
          style={{ left: '67px', top: '18px' }}
        >
          {isLirrLine(line) ? (
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
              className="font-bold text-white text-center"
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
        </div>

        {/* Destination - absolute positioned */}
        <div 
          className="absolute text-[35px] font-bold text-white whitespace-nowrap" 
          style={{ 
            left: '160px',
            top: '98px',
            lineHeight: '1.3',
            transform: 'translate(-30px, -80px)'
          }}
        >
          {displayDestination}
        </div>

        {/* Subtitle - absolute positioned */}
        <div 
          className="absolute text-[20px] text-white" 
          style={{ 
            left: '160px',
            top: '178px',
            lineHeight: '1.3',
            transform: isDowntown ? 'translate(-30px, -110px)' : 'translate(-29px, -110px)'
          }}
        >
          {subtitle}
        </div>

        {/* Arrival time - absolute positioned */}
        <div 
          className="absolute w-[140px] text-center flex flex-col" 
          style={{ right: '4px', top: '18px', transform: 'translateY(-10px)' }}
        >
          <div className="text-[85px] font-bold leading-[0.8] text-white">
            {firstArrivalData.value}
          </div>
          <div className="text-xl mt-1 text-white">{firstArrivalData.unit}</div>
        </div>
      </Card>

      {/* Secondary arrivals positioned outside main card */}
      <div className="flex gap-[9px] items-center z-40">
        {secondArrival !== undefined && (
          <div className="bg-[#2D2C31] rounded-[6px] h-[115px] w-[113px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {secondLine && isLirrLine(secondLine) ? (
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
                  className="font-bold text-white text-center"
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
              {thirdLine && isLirrLine(thirdLine) ? (
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
                  className="font-bold text-white text-center"
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
    </div>
  );
}
