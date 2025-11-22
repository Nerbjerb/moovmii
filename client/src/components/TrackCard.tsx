import { Card } from "@/components/ui/card";
import nTrainIcon from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import wTrainIcon from "@assets/moovmii/MTA Icons/src/svg/w.svg";

interface TrackCardProps {
  direction: string;
  line: string;
  destination: string;
  subtitle: string;
  arrivalMinutes: number[];
  arrivalLines: string[];
  isDowntown?: boolean;
  refs?: {
    badgeRef?: (el: HTMLDivElement | null) => void;
    destinationRef?: (el: HTMLDivElement | null) => void;
    subtitleRef?: (el: HTMLDivElement | null) => void;
    arrivalsRef?: (el: HTMLDivElement | null) => void;
  };
}

const lineIcons: Record<string, string> = {
  N: nTrainIcon,
  W: wTrainIcon,
};

export default function TrackCard({
  direction,
  line,
  destination,
  subtitle,
  arrivalMinutes,
  arrivalLines,
  isDowntown = false,
  refs,
}: TrackCardProps) {
  const iconSrc = lineIcons[line];
  const [firstArrival, secondArrival, thirdArrival] = arrivalMinutes;
  const [firstLine, secondLine, thirdLine] = arrivalLines || [];
  
  const secondIconSrc = secondLine ? lineIcons[secondLine] : null;
  const thirdIconSrc = thirdLine ? lineIcons[thirdLine] : null;

  // Helper to display arrival time (show "1" for 0 minutes)
  const formatMinutes = (mins: number | undefined): string | number => {
    if (mins === undefined) return '';
    return mins === 0 ? 1 : mins;
  };

  // Extract text before dash for destination
  const displayDestination = destination.split('-')[0].trim();

  return (
    <div className="relative flex items-center gap-3">
      {/* Main card - front layer */}
      <Card className="relative flex items-start gap-0 p-0 rounded-[9px] overflow-visible border-0 bg-[#2D2C31] z-30 w-[570px]">
        <div className="w-10 bg-[#2D2C31] flex items-center justify-center self-stretch rounded-l-[9px]">
          <div 
            className="text-[17px] font-medium tracking-[0.14em] whitespace-nowrap text-white text-center"
            style={{ 
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)'
            }}
            data-testid="text-direction"
          >
            {direction}
          </div>
        </div>

        <div 
          className="grid h-[115px] flex-1" 
          style={{ 
            paddingLeft: '24px', 
            paddingRight: '24px',
            gridTemplateColumns: '96px 1fr 140px',
            gridTemplateRows: `18px var(--track-badge-height, 96px) var(--track-destination-height, 110px) 14px var(--track-subtitle-height, 20px) 1fr`
          }}
        >
          {/* Train icon - badge row */}
          <div 
            ref={refs?.badgeRef}
            className="w-24 h-24 rounded-full flex items-center justify-center" 
            style={{ gridRow: '2', gridColumn: '1' }}
          >
            {iconSrc ? (
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

          {/* Destination - single line, no truncation */}
          <div 
            ref={refs?.destinationRef}
            className="text-[35px] font-bold text-white whitespace-nowrap" 
            style={{ 
              gridRow: '3', 
              gridColumn: '2', 
              alignSelf: 'start',
              lineHeight: '1.1',
              transform: 'translate(-30px, -90px)'
            }}
          >
            {displayDestination}
          </div>

          {/* Subtitle - with line clamp */}
          <div 
            ref={refs?.subtitleRef}
            className="text-[20px] text-white overflow-hidden" 
            style={{ 
              gridRow: '5', 
              gridColumn: '2', 
              alignSelf: 'start',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1',
              transform: isDowntown ? 'translate(-30px, -165px)' : 'translate(-29px, -165px)'
            }}
          >
            {subtitle}
          </div>

          {/* Arrival time */}
          <div 
            ref={refs?.arrivalsRef}
            className="w-[140px] text-center flex flex-col" 
            style={{ gridRow: '1 / 7', gridColumn: '3', alignSelf: 'start', paddingTop: '18px', transform: 'translate(-30px, -10px)' }}
          >
            <div className="text-[85px] font-bold leading-[0.8] text-white">
              {formatMinutes(firstArrival)}
            </div>
            <div className="text-xl mt-1 text-white">Min</div>
          </div>
        </div>
      </Card>

      {/* Secondary arrivals positioned outside main card */}
      <div className="flex gap-3 items-center z-40">
        {secondArrival !== undefined && (
          <div className="bg-[#2D2C31] rounded-[6px] h-[115px] w-[78.5px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {secondIconSrc ? (
                <img
                  src={secondIconSrc}
                  alt={`${secondLine} train`}
                  className="w-[33.6px] h-[33.6px] object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">{secondLine}</span>
              )}
            </div>
            <div className="text-[22px] font-medium text-white">
              {formatMinutes(secondArrival)}
            </div>
            <div className="text-xs -mt-1 text-white">Min</div>
          </div>
        )}

        {thirdArrival !== undefined && (
          <div className="bg-[#2D2C31] rounded-[6px] h-[115px] w-[78.5px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {thirdIconSrc ? (
                <img
                  src={thirdIconSrc}
                  alt={`${thirdLine} train`}
                  className="w-[33.6px] h-[33.6px] object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">{thirdLine}</span>
              )}
            </div>
            <div className="text-[22px] font-medium text-white">
              {formatMinutes(thirdArrival)}
            </div>
            <div className="text-xs -mt-1 text-white">Min</div>
          </div>
        )}
      </div>
    </div>
  );
}
