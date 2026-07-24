import { useQuery } from "@tanstack/react-query";
import { Car, TriangleAlert } from "lucide-react";
import shieldNarrow from "@assets/interstate-shield.png";
import shieldWide from "@assets/interstate-shield-wide.png";
import type { DrivingSlot } from "@/pages/DrivingSettings";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

interface RouteData {
  durationSeconds: number;
  durationTrafficSeconds: number;
  mainRoute: string;
  isInterstate: boolean;
  interstateNumber: string | null;
  hasTrafficDelay: boolean;
  originCity: string;
  destCity: string;
}

interface DrivingRouteCardProps {
  slot: DrivingSlot;
  rowHeight: number;
}

function formatDuration(seconds: number): { hrs: number; mins: number; isOverHour: boolean } {
  const totalMins = Math.max(0, Math.round(seconds / 60));
  return { hrs: Math.floor(totalMins / 60), mins: totalMins % 60, isOverHour: totalMins >= 60 };
}

function InterstateBadge({ number }: { number: string }) {
  const isWide = number.length >= 3;
  const shield = isWide ? shieldWide : shieldNarrow;
  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <img src={shield} alt={`I-${number}`} style={{ height: "52px", objectFit: "contain" }} />
      <span style={{
        position: "absolute",
        ...font, fontWeight: 900, color: "#fff",
        fontSize: isWide ? "13px" : "15px",
        letterSpacing: isWide ? "-0.5px" : "0",
        textShadow: "0 1px 2px rgba(0,0,0,0.8)",
        marginTop: "6px",
      }}>{number}</span>
    </div>
  );
}

function SingleDrivingCard({ slot, rowHeight }: DrivingRouteCardProps) {
  const cardH = rowHeight;
  const { data, isLoading, isError } = useQuery<RouteData>({
    queryKey: ["/api/driving/route", slot.origin, slot.destination],
    queryFn: async () => {
      const res = await fetch(`/api/driving/route?origin=${encodeURIComponent(slot.origin)}&destination=${encodeURIComponent(slot.destination)}`);
      if (!res.ok) throw new Error("Route fetch failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,   // cache 5 min
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  const time = data ? formatDuration(data.durationTrafficSeconds) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      {/* City-to-city label */}
      <span style={{ ...font, fontSize: "13px", fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}>
        {data ? `${data.originCity} to ${data.destCity}` : `${slot.origin} → ${slot.destination}`}
      </span>

      {/* Card */}
      <div style={{
        width: "242px", height: `${cardH}px`, minHeight: "80px",
        backgroundColor: "#1e1e1e", borderRadius: "12px",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "10px 14px", gap: "4px",
        position: "relative", overflow: "hidden",
      }}>
        {isLoading && (
          <span style={{ ...font, fontSize: "13px", color: "#555" }}>Loading...</span>
        )}
        {isError && (
          <span style={{ ...font, fontSize: "12px", color: "#555" }}>API key required</span>
        )}
        {data && time && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Icon: interstate shield or car */}
            {data.isInterstate && data.interstateNumber ? (
              <InterstateBadge number={data.interstateNumber} />
            ) : (
              <div style={{ width: "46px", height: "46px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Car size={34} color="#ffffff" strokeWidth={1.8} />
              </div>
            )}

            {/* Route name + time */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, minWidth: 0 }}>
              <span style={{ ...font, fontSize: "11px", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Via {data.mainRoute}
              </span>
              {!time.isOverHour ? (
                <div style={{ display: "flex", alignItems: "baseline", gap: "3px" }}>
                  <span style={{ ...font, fontSize: "32px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{time.mins}</span>
                  <span style={{ ...font, fontSize: "14px", fontWeight: 600, color: "#aaa" }}>Mins</span>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                  <span style={{ ...font, fontSize: "28px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{time.hrs}</span>
                  <span style={{ ...font, fontSize: "13px", fontWeight: 600, color: "#aaa" }}>Hrs</span>
                  <span style={{ ...font, fontSize: "14px", fontWeight: 600, color: "#555" }}>+</span>
                  <span style={{ ...font, fontSize: "28px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{time.mins}</span>
                  <span style={{ ...font, fontSize: "13px", fontWeight: 600, color: "#aaa" }}>Mins</span>
                </div>
              )}

              {/* Traffic delay badge */}
              {data.hasTrafficDelay && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#dc2626", borderRadius: "999px", padding: "2px 9px", marginTop: "2px", alignSelf: "flex-start" }}>
                  <TriangleAlert size={11} color="#ffffff" />
                  <span style={{ ...font, fontSize: "11px", fontWeight: 700, color: "#ffffff" }}>Traffic</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DrivingRowProps {
  slots: (DrivingSlot | null)[];
  rowHeight: number;
}

export default function DrivingRouteCard({ slots, rowHeight }: DrivingRowProps) {
  const activeSlots = slots.filter(Boolean) as DrivingSlot[];
  if (activeSlots.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${rowHeight}px`, width: "760px", backgroundColor: "#1e1e1e", borderRadius: "12px" }}>
        <span style={{ ...font, fontSize: "14px", color: "#444" }}>No driving routes configured</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      {slots.map((slot, i) =>
        slot ? (
          <SingleDrivingCard key={i} slot={slot} rowHeight={rowHeight} />
        ) : null
      )}
    </div>
  );
}
