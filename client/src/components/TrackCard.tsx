import { Card } from "@/components/ui/card";
import nTrainIcon from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import wTrainIcon from "@assets/moovmii/MTA Icons/src/svg/w.svg";

interface TrackCardProps {
  direction: string;
  line: string;
  destination: string;
  subtitle: string;
  arrivalMinutes: number[];
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
}: TrackCardProps) {
  const iconSrc = lineIcons[line];
  const [firstArrival, secondArrival, thirdArrival] = arrivalMinutes;

  return (
    <div className="relative flex items-center gap-3">
      {/* Main card - front layer */}
      <Card className="relative flex items-start gap-0 p-0 rounded-[18px] overflow-visible border-0 bg-[#D9D9D9] z-30 w-[580px]">
        <div className="w-10 bg-[#D9D9D9] flex items-center justify-center self-stretch rounded-l-[18px]">
          <div 
            className="text-xs font-medium tracking-[0.14em] whitespace-nowrap text-black text-center"
            style={{ 
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)'
            }}
            data-testid="text-direction"
          >
            {direction}
          </div>
        </div>

        <div className="flex items-center gap-4 p-6 pr-6 h-[115px] flex-1">
          <div className="flex-shrink-0 w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-[#111]">
            {iconSrc ? (
              <img src={iconSrc} alt={`${line} train`} className="w-[72px] h-[72px] object-contain" />
            ) : (
              <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3 min-w-0">
            <div className="text-[38px] font-bold leading-none text-black">
              {destination}
            </div>
            <div className="text-lg text-black/70">{subtitle}</div>
          </div>

          <div className="w-[140px] text-center flex-shrink-0">
            <div className="text-[92px] font-bold leading-[0.8] text-black">
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
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-[#111]">
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
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-[#111]">
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
