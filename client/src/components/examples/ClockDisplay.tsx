import { useState } from "react";
import ClockDisplay from "../ClockDisplay";
import { Button } from "@/components/ui/button";

export default function ClockDisplayExample() {
  const [format, setFormat] = useState<"12" | "24">("12");

  return (
    <div className="p-8 bg-black space-y-4">
      <ClockDisplay format={format} />
      <Button onClick={() => setFormat(format === "12" ? "24" : "12")}>
        Toggle Format (Current: {format}h)
      </Button>
    </div>
  );
}
