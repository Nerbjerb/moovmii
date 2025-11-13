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
              transform: isDowntown ? 'rotate(180deg) translateX(-5px)' : 'rotate(180deg)'
            }}
            data-testid="text-direction"
          >
            {direction}
          </div>
        </div>

        <div className="flex items-start gap-4 h-[115px] flex-1 pt-[18px]" style={{ paddingLeft: isDowntown ? '29px' : '24px', paddingRight: '24px' }}>
          {/* Train icon column */}
          <div className="w-24 h-24 rounded-full flex items-center justify-center flex-shrink-0">
            {iconSrc ? (
              <img src={iconSrc} alt={`${line} train`} className="w-[72px] h-[72px] object-contain" />
            ) : (
              <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
            )}
          </div>

          {/* Text column with grid for vertical alignment */}
          <div className="flex-1 grid" style={{ gridTemplateRows: '8px 50px 14px 20px 1fr', height: '97px' }}>
            <div></div>
            {/* Destination */}
            <div className="text-[50px] font-bold leading-none text-black overflow-hidden whitespace-nowrap" style={{ textOverflow: 'ellipsis', alignSelf: 'start' }}>
              {destination}
            </div>
            <div></div>
            {/* Subtitle */}
            <div className="text-[20px] leading-none text-black/70 overflow-hidden whitespace-nowrap" style={{ textOverflow: 'ellipsis', alignSelf: 'start' }}>
              {subtitle}
            </div>
            <div></div>
          </div>

          {/* Arrival time column */}
          <div className="w-[140px] text-center flex flex-col flex-shrink-0">
            <div className="text-[85px] font-bold leading-[0.8] text-black">
              {firstArrival}
            </div>
            <div className="text-xl mt-1 text-black">Min</div>
          </div>
        </div>
      </Card>

      {/* Secondary arrivals positioned outside main card */}
      <div className="flex gap-3 items-center">
        {secondArrival !== undefined && (
          <div className="bg-[#C3C3C3] rounded-xl h-[115px] w-[70px] flex flex-col items-center justify-center gap-1">
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
          <div className="bg-[#ABABAB] rounded-xl h-[115px] w-[70px] flex flex-col items-center justify-center gap-1">
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
