import { useState, useEffect, useCallback, useRef } from "react";
import { usePressScroll } from "@/hooks/use-press-scroll";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, Wifi, Monitor, Train, Bus, Ship, Car, Bike, Square, Home } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getDeviceId } from "@/lib/deviceId";
import { saveSettings } from "@/lib/localStorageDB";
import type { KioskSettings } from "@shared/schema";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

type View = "home" | "general" | "display" | "transportation";

const transportModes = [
  { label: "Train",    icon: Train, path: "/train-settings"   },
  { label: "Bus",      icon: Bus,   path: "/bus-settings"     },
  { label: "Ferry",    icon: Ship,  path: "/ferry-settings"   },
  { label: "Driving",  icon: Car,   path: "/driving-settings" },
  { label: "Citibike", icon: Bike,  path: "/citibike-settings"},
];

export default function SettingsMenu() {
  const [, setLocation] = useLocation();
  const mainRef = useRef<HTMLDivElement>(null);
  usePressScroll(mainRef);
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);
  const deviceId = getDeviceId();

  const [view, setView] = useState<View>("home");
  const [transportRows, setTransportRows] = useState<2 | 3 | 4>(2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(() => localStorage.getItem("kioskResolution") || "800x480");

  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ["/api/settings", deviceId],
  });

  useEffect(() => {
    if (settings) {
      const rows = settings.transportRows as 2 | 3 | 4;
      setTransportRows(rows === 3 || rows === 4 ? rows : 2);
    }
  }, [settings]);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen().catch(console.error);
    }
  }, []);

  const handleResolutionSelect = (res: string) => {
    localStorage.setItem("kioskResolution", res);
    setSelectedResolution(res);
  };

  const handleRowsChange = (n: 2 | 3 | 4) => {
    setTransportRows(n);
    const updated = saveSettings({ transportRows: n }, deviceId);
    queryClient.setQueryData(["/api/settings", deviceId], updated);
  };

  const boxStyle = {
    backgroundColor: "#2D2C31",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    transition: "opacity 0.15s",
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          ref={mainRef}
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: "800px", height: "480px", padding: "15px 20px", overflow: "auto" }}
        >
          {/* Back button */}
          <div className="absolute top-[5px] left-[5px]">
            <button
              className="block p-4"
              onClick={() => view === "home" ? setLocation("/settings") : setView("home")}
            >
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Title */}
          <div className="flex items-center justify-center pt-2 pb-3">
            <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>
              {view === "home" ? "Settings" : view === "general" ? "General" : view === "display" ? "Display & Brightness" : "Transportation"}
            </span>
          </div>

          {/* HOME: 2×2 grid */}
          {view === "home" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: "11px", flex: 1 }}>
              {/* General */}
              <div style={boxStyle} className="hover:opacity-80" onClick={() => setView("general")}>
                <Square className="w-8 h-8 text-white" />
                <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>General</span>
              </div>

              {/* Display & Brightness */}
              <div style={boxStyle} className="hover:opacity-80" onClick={() => setView("display")}>
                <Monitor className="w-8 h-8 text-white" />
                <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>Display & Brightness</span>
              </div>

              {/* WiFi */}
              <div style={boxStyle} className="hover:opacity-80" onClick={() => setLocation("/wifi")}>
                <Wifi className="w-8 h-8 text-white" />
                <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>WiFi</span>
              </div>

              {/* Transportation */}
              <div style={boxStyle} className="hover:opacity-80" onClick={() => setView("transportation")}>
                <Train className="w-8 h-8 text-white" />
                <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>Transportation</span>
              </div>
            </div>
          )}

          {/* GENERAL: Clock + Weather */}
          {view === "general" && (
            <div className="flex flex-col gap-[11px] flex-1 justify-center">
              <button
                onClick={() => setLocation("/clock-settings")}
                className="flex items-center gap-4 rounded-[8px] hover:opacity-80 transition-opacity"
                style={{ height: "64px", backgroundColor: "#2D2C31", padding: "0 24px" }}
              >
                <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>Clock Settings</span>
              </button>
              <button
                onClick={() => setLocation("/weather-settings")}
                className="flex items-center gap-4 rounded-[8px] hover:opacity-80 transition-opacity"
                style={{ height: "64px", backgroundColor: "#2D2C31", padding: "0 24px" }}
              >
                <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff" }}>Weather Settings</span>
              </button>
            </div>
          )}

          {/* DISPLAY & BRIGHTNESS */}
          {view === "display" && (
            <div className="flex flex-col gap-5 flex-1 justify-center">
              {/* Fullscreen toggle */}
              <div className="flex items-center justify-between" style={{ padding: "0 4px" }}>
                <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>Full Screen</span>
                <button
                  onClick={toggleFullscreen}
                  style={{
                    width: "52px",
                    height: "28px",
                    borderRadius: "14px",
                    backgroundColor: isFullscreen ? "#FFD200" : "#555",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background-color 0.2s",
                  }}
                >
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: "#ffffff",
                    position: "absolute",
                    top: "3px",
                    left: isFullscreen ? "27px" : "3px",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>

              {/* Resolution */}
              <div className="flex flex-col gap-2">
                <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#ffffff" }}>Screen Resolution</span>
                <div className="flex gap-[8px]">
                  {(["800x480", "1024x600", "1280x800", "1920x1080"] as const).map((res) => {
                    const [w, h] = res.split("x");
                    const isSelected = selectedResolution === res;
                    return (
                      <button
                        key={res}
                        onClick={() => handleResolutionSelect(res)}
                        className="flex-1 rounded-[6px] flex items-center justify-center hover:opacity-80 transition-opacity"
                        style={{ height: "44px", backgroundColor: isSelected ? "#ffffff" : "#2D2C31", border: "none", cursor: "pointer" }}
                      >
                        <span style={{ ...font, fontSize: "13px", fontWeight: 700, color: isSelected ? "#000000" : "#ffffff" }}>
                          {w}×{h}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Transport rows */}
              <div className="flex flex-col gap-2">
                <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#ffffff" }}># of Transportation Rows</span>
                <div className="flex gap-[8px]">
                  {([2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => handleRowsChange(n)}
                      className="flex-1 rounded-[6px] flex items-center justify-center hover:opacity-80 transition-opacity"
                      style={{ height: "44px", backgroundColor: transportRows === n ? "#ffffff" : "#2D2C31", border: "none", cursor: "pointer" }}
                    >
                      <span style={{ ...font, fontSize: "16px", fontWeight: 700, color: transportRows === n ? "#000000" : "#ffffff" }}>
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TRANSPORTATION: 5 modes */}
          {view === "transportation" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "11px", flex: 1 }}>
              {transportModes.map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  onClick={() => setLocation(path)}
                  className="flex flex-col items-center justify-center gap-2 rounded-[10px] hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: "#2D2C31", border: "none", cursor: "pointer" }}
                >
                  <Icon className="w-7 h-7 text-white" />
                  <span style={{ ...font, fontSize: "14px", fontWeight: 600, color: "#ffffff" }}>{label}</span>
                </button>
              ))}
            </div>
          )}
          <div className="absolute bottom-[5px] right-[5px]">
            <button className="block p-4" onClick={() => setLocation('/')}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
