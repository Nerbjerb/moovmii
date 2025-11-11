import { useState } from "react";
import KioskControls from "../KioskControls";

export default function KioskControlsExample() {
  const [format, setFormat] = useState<"12" | "24">("12");

  const handleFullscreen = () => {
    console.log("Fullscreen toggle triggered");
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="p-8 bg-background">
      <KioskControls
        timeFormat={format}
        onTimeFormatChange={setFormat}
        onFullscreenToggle={handleFullscreen}
      />
    </div>
  );
}
