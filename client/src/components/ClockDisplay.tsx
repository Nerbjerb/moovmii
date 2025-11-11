import { useState, useEffect } from "react";

interface ClockDisplayProps {
  format: "12" | "24";
}

export default function ClockDisplay({ format }: ClockDisplayProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = () => {
    const hours = time.getHours();
    const minutes = time.getMinutes();

    if (format === "12") {
      const ampm = hours >= 12 ? "PM" : "AM";
      let h12 = hours % 12;
      if (h12 === 0) h12 = 12;
      return `${String(h12).padStart(2, " ")}:${String(minutes).padStart(2, "0")} ${ampm}`;
    } else {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  };

  return (
    <div className="text-white text-[220px] font-bold leading-[0.85] tracking-tight" data-testid="text-clock">
      {formatTime()}
    </div>
  );
}
