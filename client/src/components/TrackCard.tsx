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
    <div className="relative">
      {/* Third arrival card - furthest back */}
      {thirdArrival !== undefined && (
        <Card className="absolute top-2 left-2 right-0 h-[110px] rounded-[18px] border-0 bg-card opacity-60 z-10" />
      )}
      
      {/* Second arrival card - middle layer */}
      {secondArrival !== undefined && (
        <Card className="absolute top-1 left-1 right-0 h-[110px] rounded-[18px] border-0 bg-card opacity-80 z-20" />
      )}

      {/* Main card - front layer */}
      <Card className="relative flex items-start gap-0 p-0 rounded-[18px] overflow-visible border-0 bg-[#D9D9D9] z-30">
        <div className="w-10 bg-white flex items-center justify-center self-stretch rounded-l-[18px]">
          <div 
            className="text-sm font-medium tracking-[0.14em] uppercase whitespace-nowrap text-black text-center"
            style={{ 
              writingMode: 'vertical-rl',
              transform: 'rotate(180deg)'
            }}
            data-testid="text-direction"
          >
            {direction}
          </div>
        </div>

        <div className="flex-1 flex items-center gap-4 p-6 pr-6 min-h-[110px]">
          <div className="flex-shrink-0 w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-[#111]">
            {iconSrc ? (
              <img src={iconSrc} alt={`${line} train`} className="w-[72px] h-[72px] object-contain" />
            ) : (
              <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-3">
            <div className="text-[38px] font-bold leading-none text-black">
              {destination}
            </div>
            <div className="text-lg text-black/70">{subtitle}</div>
          </div>

          <div className="w-[140px] text-center">
            <div className="text-[92px] font-bold leading-[0.8] text-black">
              {firstArrival}
            </div>
            <div className="text-xl mt-1 text-black">Min</div>
          </div>

          {/* Secondary arrivals display within main card */}
          <div className="flex gap-3 items-center">
            {secondArrival !== undefined && (
              <div className="bg-[#C3C3C3] rounded-xl h-[70px] w-[70px] flex flex-col items-center justify-center gap-1">
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
              <div className="bg-[#ABABAB] rounded-xl h-[70px] w-[70px] flex flex-col items-center justify-center gap-1">
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
      </Card>
    </div>
  );
}
