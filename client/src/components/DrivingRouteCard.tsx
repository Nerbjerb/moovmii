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
  labelHeight: number;
}

// Insert soft hyphens into long words so mid-word line breaks show a hyphen;
// browsers skip proper nouns (road names) when auto-hyphenating
function softHyphenate(text: string): string {
  return text
    .split(" ")
    .map((w) => (w.length > 7 ? w.split("").join("\u00AD") : w))
    .join(" ");
}

function formatDuration(seconds: number): { hrs: number; mins: number; isOverHour: boolean } {
  const totalMins = Math.max(0, Math.round(seconds / 60));
  return { hrs: Math.floor(totalMins / 60), mins: totalMins % 60, isOverHour: totalMins >= 60 };
}

const shieldFont = { fontFamily: "'Overpass', 'Highway Gothic', Helvetica, Arial, sans-serif" };

function InterstateBadge({ number }: { number: string }) {
  const isWide = number.length >= 3;
  const shield = isWide ? shieldWide : shieldNarrow;
  return (
    <div style={{ position: "relative", width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={shield} alt={`I-${number}`} style={{ height: "41px", objectFit: "contain" }} />
      <span style={{
        position: "absolute",
        ...shieldFont, fontWeight: 800, color: "#fff",
        fontSize: isWide ? "17px" : "21px",
        letterSpacing: isWide ? "-1px" : "0",
        marginTop: isWide ? "5px" : "6px",
      }}>{number}</span>
    </div>
  );
}

function TimeStack({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ ...font, fontSize: "30px", fontWeight: 900, color: "#ffffff", lineHeight: 1 }}>{value}</span>
      <span style={{ ...font, fontSize: "12px", fontWeight: 700, color: "#ffffff", marginTop: "2px" }}>{label}</span>
    </div>
  );
}

function SingleDrivingCard({ slot, rowHeight, labelHeight }: DrivingRouteCardProps) {
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
      <span style={{ ...font, fontSize: `${labelHeight}px`, fontWeight: 700, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}>
        {data ? `${data.originCity} to ${data.destCity}` : `${slot.origin} → ${slot.destination}`}
      </span>

      {/* Card */}
      <div style={{
        width: "242px", height: `${cardH}px`, minHeight: "80px",
        backgroundColor: "#2D2C31", borderRadius: "12px",
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
          <div style={{ display: "flex", alignItems: "stretch", gap: "10px", height: "100%" }}>
            {/* Zone 1: interstate shield or car icon — narrow, vertically centered */}
            <div style={{ width: "54px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {data.isInterstate && data.interstateNumber ? (
                <InterstateBadge number={data.interstateNumber} />
              ) : (
                <Car size={40} color="#ffffff" strokeWidth={1.8} style={{ marginLeft: "-5px" }} />
              )}
            </div>

            {/* Zone 2: route name — full height, vertically centered, wraps */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", marginRight: "-8px" }}>
              <span lang="en" style={{ ...font, fontSize: "18px", fontWeight: 500, color: "#ffffff", lineHeight: 1.2, overflowWrap: "break-word", hyphens: "auto", minWidth: 0 }}>
                Via {softHyphenate(data.mainRoute)}
              </span>
            </div>

            {/* Zone 3: time (numbers over labels), pill below when delayed */}
            <div style={{ width: "88px", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "7px" }}>
              {!time.isOverHour ? (
                <TimeStack value={time.mins} label="Mins" />
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: "5px" }}>
                  <TimeStack value={time.hrs} label="Hrs" />
                  <span style={{ ...font, fontSize: "16px", fontWeight: 700, color: "#ffffff", lineHeight: 1, marginTop: "8px" }}>+</span>
                  <TimeStack value={time.mins} label="Mins" />
                </div>
              )}

              {/* Traffic delay badge */}
              {data.hasTrafficDelay && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", backgroundColor: "#dc2626", borderRadius: "999px", padding: "2px 9px" }}>
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
  labelHeight?: number;
}

export default function DrivingRouteCard({ slots, rowHeight, labelHeight = 20 }: DrivingRowProps) {
  const activeSlots = slots.filter(Boolean) as DrivingSlot[];
  if (activeSlots.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: `${rowHeight}px`, width: "760px", backgroundColor: "#2D2C31", borderRadius: "12px" }}>
        <span style={{ ...font, fontSize: "14px", color: "#444" }}>No driving routes configured</span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      {slots.map((slot, i) =>
        slot ? (
          <SingleDrivingCard key={i} slot={slot} rowHeight={rowHeight} labelHeight={labelHeight} />
        ) : null
      )}
    </div>
  );
}
