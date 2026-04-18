import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Home } from "lucide-react";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

export default function FerrySettings() {
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
          <div className="absolute bottom-[5px] right-[5px]">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>
          <div className="flex items-center justify-center flex-1">
            <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>Ferry Settings</span>
          </div>
        </main>
      </div>
    </div>
  );
}
