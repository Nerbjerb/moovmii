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
      {/* Main card - front layer with fixed positioning */}
      <Card className="relative rounded-[9px] overflow-visible border-0 bg-[#2D2C31] z-30 w-[570px] h-[115px]">
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
            {direction}
          </div>
        </div>

        {/* Train icon - absolute positioned */}
        <div 
          className="absolute w-24 h-24 rounded-full flex items-center justify-center" 
          style={{ left: '24px', top: '18px' }}
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

        {/* Destination - absolute positioned */}
        <div 
          className="absolute text-[35px] font-bold text-white whitespace-nowrap" 
          style={{ 
            left: '120px',
            top: '98px',
            lineHeight: '1.1',
            transform: 'translate(-30px, -90px)'
          }}
        >
          {displayDestination}
        </div>

        {/* Subtitle - absolute positioned */}
        <div 
          className="absolute text-[20px] text-white overflow-hidden" 
          style={{ 
            left: '120px',
            top: '178px',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1',
            transform: isDowntown ? 'translate(-30px, -165px)' : 'translate(-29px, -95px)'
          }}
        >
          {subtitle}
        </div>

        {/* Arrival time - absolute positioned */}
        <div 
          className="absolute w-[140px] text-center flex flex-col" 
          style={{ right: '24px', top: '18px', transform: 'translate(-30px, -10px)' }}
        >
          <div className="text-[85px] font-bold leading-[0.8] text-white">
            {formatMinutes(firstArrival)}
          </div>
          <div className="text-xl mt-1 text-white">Min</div>
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
