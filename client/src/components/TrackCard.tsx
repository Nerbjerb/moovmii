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
  const [firstArrival, ...remainingArrivals] = arrivalMinutes;

  return (
    <Card className="relative flex items-start gap-0 p-0 rounded-[18px] overflow-hidden border-0 bg-card">
      <div className="w-10 h-full bg-[#111111] flex items-center justify-center py-6">
        <div 
          className="text-sm font-medium tracking-[0.14em] uppercase whitespace-nowrap"
          style={{ 
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)'
          }}
        >
          {direction}
        </div>
      </div>

      <div className="flex-1 flex items-center gap-4 p-6 pr-0">
        <div className="flex-shrink-0 w-24 h-24 rounded-full bg-primary flex items-center justify-center border-4 border-[#111]">
          {iconSrc ? (
            <img src={iconSrc} alt={`${line} train`} className="w-[72px] h-[72px] object-contain" />
          ) : (
            <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="text-[38px] font-bold leading-none">
            {destination}
          </div>
          <div className="text-lg text-card-foreground/70">{subtitle}</div>
        </div>

        <div className="w-[140px] text-center pr-6">
          <div className="text-[92px] font-bold leading-[0.8]">
            {firstArrival}
          </div>
          <div className="text-xl mt-1">Min</div>
        </div>
      </div>

      {remainingArrivals.length > 0 && (
        <div className="absolute bottom-4 right-6 flex gap-3">
          {remainingArrivals.map((mins, idx) => (
            <div
              key={idx}
              className="bg-[#1D1D1D] rounded-xl h-[70px] w-[70px] flex flex-col items-center justify-center gap-1"
            >
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
              <div className="text-base font-medium">{mins}</div>
              <div className="text-xs -mt-1">Min</div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
