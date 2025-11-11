import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Maximize } from "lucide-react";

interface KioskControlsProps {
  timeFormat: "12" | "24";
  onTimeFormatChange: (format: "12" | "24") => void;
  onFullscreenToggle: () => void;
}

export default function KioskControls({
  timeFormat,
  onTimeFormatChange,
  onFullscreenToggle,
}: KioskControlsProps) {
  return (
    <div className="flex gap-2.5 items-center">
      <label className="text-sm text-foreground flex items-center gap-2">
        Time format
        <Select value={timeFormat} onValueChange={(value) => onTimeFormatChange(value as "12" | "24")}>
          <SelectTrigger className="w-[100px]" data-testid="select-time-format">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="12">12-hour</SelectItem>
            <SelectItem value="24">24-hour</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <Button
        variant="outline"
        size="sm"
        onClick={onFullscreenToggle}
        title="Toggle fullscreen"
        data-testid="button-fullscreen"
      >
        <Maximize className="w-4 h-4 mr-1" />
        Full screen
      </Button>
    </div>
  );
}
