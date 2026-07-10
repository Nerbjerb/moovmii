import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Home } from "lucide-react";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

const STORAGE_KEY = "citibike_show_parking";

export function getCitibikeShowParking(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export default function CitibikePreferences() {
  const [, setLocation] = useLocation();
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const kioskScale = scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1;

  const [showParking, setShowParking] = useState<boolean>(getCitibikeShowParking);

  const handleToggle = (value: boolean) => {
    setShowParking(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: "800px", height: "480px", padding: "15px 20px" }}
        >
          {/* Back */}
          <div className="absolute top-[5px] left-[5px]">
            <button className="block p-4" onClick={() => setLocation("/settings-menu")}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Home */}
          <div className="absolute bottom-[5px] right-[5px]">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 gap-8">
            <h1 className="text-white font-bold" style={{ ...font, fontSize: "24px" }}>
              Citibike Preferences
            </h1>

            <div className="flex flex-col gap-6 w-[400px]">
              {/* Show Parking toggle */}
              <div className="flex flex-col gap-3">
                <span className="text-white font-medium" style={{ ...font, fontSize: "16px" }}>
                  Show Parking Availability
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggle(true)}
                    className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{ height: "44px", backgroundColor: showParking ? "#FFFFFF" : "#2D2C31" }}
                  >
                    <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: showParking ? "#000000" : "#FFFFFF" }}>
                      On
                    </span>
                  </button>
                  <button
                    onClick={() => handleToggle(false)}
                    className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{ height: "44px", backgroundColor: !showParking ? "#FFFFFF" : "#2D2C31" }}
                  >
                    <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: !showParking ? "#000000" : "#FFFFFF" }}>
                      Off
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
