import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Home } from "lucide-react";
import { getDeviceId } from "@/lib/deviceId";
import { savePreference } from "@/lib/localStorageDB";
import { queryClient } from "@/lib/queryClient";
import { FERRY_LINES, type FerryLine } from "@/lib/ferryConfig";
import ferryIconSrc from "@assets/NYC_Ferry_Icon_Black.png";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

type View = "line" | "stop" | "direction";

function FerryBadge({ line, size = 64 }: { line: FerryLine; size?: number }) {
  const { r, g, b } = hexToRgb(line.color);
  const rN = r / 255, gN = g / 255, bN = b / 255;
  const filterId = `ferry-badge-${line.routeId}`;
  const matrix = `0 0 0 0 ${rN}  0 0 0 0 ${gN}  0 0 0 0 ${bN}  -0.333 -0.333 -0.333 0 1`;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <filter id={filterId} colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values={matrix} />
          </filter>
        </defs>
      </svg>
      <img
        src={ferryIconSrc}
        alt={line.abbr}
        style={{ width: size, height: size, filter: `url(#${filterId})` }}
      />
      <span style={{ ...font, fontSize: 15, fontWeight: 700, color: line.color }}>
        {line.abbr}
      </span>
    </div>
  );
}

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
}

export default function FerrySettings() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const editRow = parseInt(new URLSearchParams(searchString).get("editRow") || "1", 10);
  const deviceId = getDeviceId();
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);

  const [view, setView] = useState<View>("line");
  const [selectedLine, setSelectedLine] = useState<FerryLine | null>(null);
  const [selectedStop, setSelectedStop] = useState<{ id: string; name: string } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<"Inbound" | "Outbound">("Inbound");

  const { data: stopsData, isLoading: stopsLoading } = useQuery<{ routeId: string; stops: { id: string; name: string }[] }[]>({
    queryKey: ["/api/ferry/stops"],
    enabled: view === "stop" && !!selectedLine,
  });

  const stopsForLine = stopsData?.find((r) => r.routeId === selectedLine?.routeId)?.stops ?? [];

  const handleSave = () => {
    if (!selectedLine || !selectedStop) return;
    const pref = savePreference(
      { row: editRow, line: `FERRY-${selectedLine.routeId}`, stop: selectedStop.id, direction: selectedDirection },
      deviceId
    );
    const current = (queryClient.getQueryData(["/api/preferences", deviceId]) as any[]) || [];
    queryClient.setQueryData(["/api/preferences", deviceId], [
      ...current.filter((p: any) => p.row !== editRow),
      pref,
    ]);
    setLocation("/");
  };

  const goBack = () => {
    if (view === "stop") setView("line");
    else if (view === "direction") setView("stop");
    else setLocation("/settings");
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: "800px", height: "480px", padding: "15px 20px 55px 20px", overflow: "hidden" }}
        >
          {/* Back */}
          <div className="absolute top-[5px] left-[5px]">
            <button className="block p-4" onClick={goBack}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Title */}
          <div className="flex items-center justify-center pt-2 pb-4">
            <span style={{ ...font, fontSize: 22, fontWeight: 700, color: "#ffffff" }}>
              {view === "line" ? "Select Ferry Line" : view === "stop" ? `${selectedLine?.name} — Select Stop` : `${selectedLine?.name} — Direction`}
            </span>
          </div>

          {/* LINE PICKER */}
          {view === "line" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, flex: 1, alignContent: "center" }}>
              {FERRY_LINES.map((line) => (
                <button
                  key={line.routeId}
                  onClick={() => { setSelectedLine(line); setView("stop"); }}
                  className="flex flex-col items-center justify-center gap-2 rounded-[10px] hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "#2D2C31", border: "none", cursor: "pointer", padding: "16px 8px" }}
                >
                  <FerryBadge line={line} size={52} />
                </button>
              ))}
            </div>
          )}

          {/* STOP PICKER */}
          {view === "stop" && (
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {stopsLoading && (
                <div className="flex items-center justify-center flex-1">
                  <span style={{ ...font, fontSize: 16, color: "#aaa" }}>Loading stops…</span>
                </div>
              )}
              {!stopsLoading && stopsForLine.length === 0 && (
                <div className="flex items-center justify-center flex-1">
                  <span style={{ ...font, fontSize: 16, color: "#aaa" }}>No stops found</span>
                </div>
              )}
              {stopsForLine.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => { setSelectedStop(stop); setView("direction"); }}
                  className="flex items-center rounded-[8px] hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "#2D2C31", border: "none", cursor: "pointer", padding: "0 20px", height: 52, flexShrink: 0 }}
                >
                  <span style={{ ...font, fontSize: 16, fontWeight: 600, color: "#ffffff" }}>{stop.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* DIRECTION PICKER */}
          {view === "direction" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
              <div style={{ display: "flex", gap: 12 }}>
                {(["Inbound", "Outbound"] as const).map((dir) => (
                  <button
                    key={dir}
                    onClick={() => setSelectedDirection(dir)}
                    className="flex-1 flex items-center justify-center rounded-[8px] hover:opacity-80 transition-opacity"
                    style={{ height: 64, backgroundColor: selectedDirection === dir ? "#ffffff" : "#2D2C31", border: "none", cursor: "pointer" }}
                  >
                    <span style={{ ...font, fontSize: 18, fontWeight: 700, color: selectedDirection === dir ? "#000000" : "#ffffff" }}>
                      {dir}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ ...font, fontSize: 13, color: "#888", textAlign: "center" }}>
                Inbound = toward Manhattan (Wall St/Pier 11) · Outbound = away from Manhattan
              </div>
              <button
                onClick={handleSave}
                className="flex items-center justify-center rounded-[8px] hover:opacity-80 transition-opacity"
                style={{ height: 56, backgroundColor: selectedLine?.color || "#FFD200", border: "none", cursor: "pointer" }}
              >
                <span style={{ ...font, fontSize: 18, fontWeight: 700, color: "#ffffff" }}>Save</span>
              </button>
            </div>
          )}

          {/* Home */}
          <div className="absolute bottom-[5px] right-[5px]">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
