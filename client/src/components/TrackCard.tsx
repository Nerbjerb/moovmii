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
    <div className="relative">
      <div className="absolute -left-12 top-6 origin-top-left -rotate-90 font-semibold text-foreground text-base whitespace-nowrap">
        {direction}
      </div>
      <Card className="flex items-center gap-[18px] p-[18px] min-h-[110px] rounded-[18px] overflow-visible border-0">
        <div className="flex-shrink-0 w-[110px] h-[110px] rounded-full bg-primary flex items-center justify-center">
          {iconSrc ? (
            <img src={iconSrc} alt={`${line} train`} className="w-[90%] h-[90%] object-contain" />
          ) : (
            <span className="text-[48px] font-bold text-primary-foreground">{line}</span>
          )}
        </div>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="text-[44px] font-bold leading-none max-md:text-[32px]">
            {destination}
          </div>
          <div className="text-lg text-card-foreground/70">{subtitle}</div>
        </div>

        <div className="w-[140px] text-center ml-3">
          <div className="text-[72px] font-bold leading-none max-md:text-[48px]">
            {firstArrival}
          </div>
          <div className="text-lg">Min</div>
        </div>

        {remainingArrivals.length > 0 && (
          <div className="flex gap-2.5 items-center pl-3.5 ml-3.5">
            {remainingArrivals.map((mins, idx) => (
              <div
                key={idx}
                className="bg-card-foreground/10 rounded-xl p-2.5 px-3 flex flex-col items-center justify-center min-w-[90px]"
              >
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center mb-1">
                  {iconSrc ? (
                    <img
                      src={iconSrc}
                      alt={`${line} train`}
                      className="w-[80%] h-[80%] object-contain"
                    />
                  ) : (
                    <span className="text-xl font-bold text-primary-foreground">{line}</span>
                  )}
                </div>
                <div className="text-lg">{mins} Min</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
