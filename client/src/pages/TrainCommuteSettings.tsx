import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Info, Home } from "lucide-react";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };
const COMMUTE_TIMES = [0, 5, 10, 15, 20, 30];

export default function TrainCommuteSettings() {
  const [, setLocation] = useLocation();
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);
  const [showTooltip, setShowTooltip] = useState(false);

  const initialTime = (): number => {
    const stored = localStorage.getItem("commuteTimeToStation");
    return stored !== null ? parseInt(stored, 10) : 0;
  };

  const [savedTime, setSavedTime] = useState<number>(initialTime);
  const [selectedTime, setSelectedTime] = useState<number>(initialTime);

  const isDirty = selectedTime !== savedTime;

  const handleSave = () => {
    localStorage.setItem("commuteTimeToStation", String(selectedTime));
    setSavedTime(selectedTime);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: "800px", height: "480px", padding: "15px 20px" }}
        >
          <div className="absolute top-[5px] left-[5px]">
            <button className="block p-4" onClick={() => setLocation("/train-settings")}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>
          <div className="absolute bottom-[5px] right-[5px]">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Save button — only visible when a change is staged */}
          <div className="absolute top-[15px] right-[20px]">
            <button
              onClick={handleSave}
              disabled={!isDirty}
              style={{
                ...font,
                fontSize: "15px",
                fontWeight: 600,
                color: isDirty ? "#000000" : "transparent",
                backgroundColor: isDirty ? "#FFD200" : "transparent",
                border: "none",
                borderRadius: "8px",
                padding: "8px 20px",
                cursor: isDirty ? "pointer" : "default",
                transition: "background-color 0.2s, color 0.2s",
                pointerEvents: isDirty ? "auto" : "none",
              }}
            >
              Save
            </button>
          </div>

          <div className="flex items-center justify-center pt-2 pb-6">
            <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>Commute Time to Station</span>
          </div>

          <div className="flex flex-col gap-4 flex-1 justify-center">
            <div className="flex items-center gap-2" style={{ position: "relative" }}>
              <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#aaaaaa" }}>
                General commute time to station
              </span>
              <button
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip((v) => !v)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
              >
                <Info className="w-4 h-4" style={{ color: "#aaaaaa" }} />
              </button>
              {showTooltip && (
                <div style={{
                  position: "absolute",
                  bottom: "calc(100% + 8px)",
                  left: 0,
                  width: "360px",
                  backgroundColor: "#1e1e1e",
                  border: "1px solid #444",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  zIndex: 10,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
                }}>
                  <span style={{ ...font, fontSize: "13px", fontWeight: 500, color: "#cccccc", lineHeight: 1.5 }}>
                    Select the time it takes to commute to your typical station. Trains arriving to the platform sooner than your selected commute time will not be displayed, and the next available train(s) will be shown instead.
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-[11px]">
              {COMMUTE_TIMES.map((mins) => {
                const isSelected = selectedTime === mins;
                return (
                  <button
                    key={mins}
                    onClick={() => setSelectedTime(mins)}
                    className="flex-1 flex flex-col items-center justify-center rounded-[10px] hover:opacity-80 transition-opacity"
                    style={{
                      height: "80px",
                      backgroundColor: isSelected ? "#ffffff" : "#2D2C31",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    {mins === 0 ? (
                      <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: isSelected ? "#000000" : "#ffffff" }}>
                        N/A
                      </span>
                    ) : (
                      <>
                        <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: isSelected ? "#000000" : "#ffffff" }}>
                          {mins}
                        </span>
                        <span style={{ ...font, fontSize: "12px", fontWeight: 500, color: isSelected ? "#333333" : "#aaaaaa" }}>
                          min
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
