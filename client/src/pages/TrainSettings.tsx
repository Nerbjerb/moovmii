import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Timer, Home } from "lucide-react";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

const items = [
  { label: "Alert Settings",          icon: Bell,  path: "/train-alert-settings"   },
  { label: "Commute Time to Station", icon: Timer, path: "/train-commute-settings" },
];

export default function TrainSettings() {
  const [, setLocation] = useLocation();
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: "800px", height: "480px", padding: "15px 20px" }}
        >
          <div className="absolute top-[5px] left-[5px]">
            <button className="block p-4" onClick={() => setLocation("/settings-menu")}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>
          <div className="absolute top-[5px] right-[5px]">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          <div className="flex items-center justify-center pt-2 pb-4">
            <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>Train Settings</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "11px", flex: 1 }}>
            {items.map(({ label, icon: Icon, path }) => (
              <button
                key={label}
                onClick={() => setLocation(path)}
                className="flex flex-col items-center justify-center gap-3 rounded-[10px] hover:opacity-80 transition-opacity"
                style={{ backgroundColor: "#2D2C31", border: "none", cursor: "pointer" }}
              >
                <Icon className="w-8 h-8 text-white" />
                <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#ffffff", textAlign: "center", padding: "0 12px" }}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
