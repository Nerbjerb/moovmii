import { Card } from "@/components/ui/card";
import nTrainIcon from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import wTrainIcon from "@assets/moovmii/MTA Icons/src/svg/w.svg";

interface TrackCardProps {
  direction: string;
  line: string;
  destination: string;
  subtitle: string;
  arrivalMinutes: number[];
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
  isDowntown = false,
  refs,
}: TrackCardProps) {
  const iconSrc = lineIcons[line];
  const [firstArrival, secondArrival, thirdArrival] = arrivalMinutes;

  return (
    <div className="relative flex items-center gap-3">
      {/* Main card - front layer */}
      <Card className="relative flex items-start gap-0 p-0 rounded-[18px] overflow-visible border-0 bg-[#D9D9D9] z-30 w-[580px]">
        <div className="w-10 bg-[#D9D9D9] flex items-center justify-center self-stretch rounded-l-[18px]">
          <div 
            className="text-[17px] font-medium tracking-[0.14em] whitespace-nowrap text-black text-center"
            style={{ 
              writingMode: 'vertical-rl',
              transform: isDowntown ? 'rotate(180deg) translateX(-5px)' : 'rotate(180deg) translateX(1px)'
            }}
            data-testid="text-direction"
          >
            {direction}
          </div>
        </div>

        <div 
          className="grid h-[115px] flex-1" 
          style={{ 
            paddingLeft: isDowntown ? '29px' : '24px', 
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
              <img src={iconSrc} alt={`${line} train`} className="w-[72px] h-[72px] object-contain" />
            ) : (
              <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
            )}
          </div>

          {/* Destination - with line clamp */}
          <div 
            ref={refs?.destinationRef}
            className="text-[50px] font-bold text-black overflow-hidden" 
            style={{ 
              gridRow: '3', 
              gridColumn: '2', 
              alignSelf: 'start',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1.1',
              transform: isDowntown ? 'translateY(-100px)' : 'translateY(-100px)'
            }}
          >
            {destination}
          </div>

          {/* Subtitle - with line clamp */}
          <div 
            ref={refs?.subtitleRef}
            className="text-[20px] text-black/70 overflow-hidden" 
            style={{ 
              gridRow: '5', 
              gridColumn: '2', 
              alignSelf: 'start',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              lineHeight: '1',
              transform: 'translateY(-165px)'
            }}
          >
            {subtitle}
          </div>

          {/* Arrival time */}
          <div 
            ref={refs?.arrivalsRef}
            className="w-[140px] text-center flex flex-col" 
            style={{ gridRow: '1 / 7', gridColumn: '3', alignSelf: 'start', paddingTop: '18px' }}
          >
            <div className="text-[85px] font-bold leading-[0.8] text-black">
              {firstArrival}
            </div>
            <div className="text-xl mt-1 text-black">Min</div>
          </div>
        </div>
      </Card>

      {/* Secondary arrivals positioned outside main card */}
      <div className="flex gap-3 items-center z-40">
        {secondArrival !== undefined && (
          <div className="bg-[#C3C3C3] rounded-xl h-[115px] w-[70px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt={`${line} train`}
                  className="w-[28px] h-[28px] object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">{line}</span>
              )}
            </div>
            <div className="text-base font-medium text-black">{secondArrival}</div>
            <div className="text-xs -mt-1 text-black">Min</div>
          </div>
        )}

        {thirdArrival !== undefined && (
          <div className="bg-[#ABABAB] rounded-xl h-[115px] w-[70px] flex flex-col items-center justify-center gap-1 z-40">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt={`${line} train`}
                  className="w-[28px] h-[28px] object-contain"
                />
              ) : (
                <span className="text-sm font-bold text-primary-foreground">{line}</span>
              )}
            </div>
            <div className="text-base font-medium text-black">{thirdArrival}</div>
            <div className="text-xs -mt-1 text-black">Min</div>
          </div>
        )}
      </div>
    </div>
  );
}
