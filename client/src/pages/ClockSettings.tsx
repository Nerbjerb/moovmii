import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Square } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { KioskSettings } from "@shared/schema";

export default function ClockSettings() {
  const [clockFormat, setClockFormat] = useState<"12hr" | "24hr">("12hr");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    if (settings) {
      setClockFormat(settings.clockFormat as "12hr" | "24hr");
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: { clockFormat: string }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          temperatureUnit: settings?.temperatureUnit || 'fahrenheit',
          clockFormat: newSettings.clockFormat 
        }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  const handleClockToggle = (format: "12hr" | "24hr") => {
    setClockFormat(format);
    saveSettingsMutation.mutate({ clockFormat: format });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: '800px', height: '480px', padding: '15px 20px' }}
          data-testid="clock-settings-main"
        >
          <div className="absolute top-[5px] left-[5px]">
            <Link href="/" className="block p-4" data-testid="link-back-kiosk">
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" data-testid="button-back" />
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 gap-8">
            <h1 
              className="text-white font-bold"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '24px' }}
            >
              Clock Settings
            </h1>

            <div className="flex flex-col gap-6 w-[400px]">
              <div className="flex flex-col gap-3">
                <span 
                  className="text-white font-medium"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}
                >
                  Clock Format
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleClockToggle("12hr")}
                    className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{ 
                      height: '44px', 
                      backgroundColor: clockFormat === "12hr" ? '#FFFFFF' : '#2D2C31'
                    }}
                    data-testid="button-12hr"
                  >
                    <span 
                      className="font-medium"
                      style={{ 
                        fontFamily: 'Helvetica, Arial, sans-serif', 
                        fontSize: '16px',
                        color: clockFormat === "12hr" ? '#000000' : '#FFFFFF'
                      }}
                    >
                      12 Hour
                    </span>
                  </button>
                  <button
                    onClick={() => handleClockToggle("24hr")}
                    className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{ 
                      height: '44px', 
                      backgroundColor: clockFormat === "24hr" ? '#FFFFFF' : '#2D2C31'
                    }}
                    data-testid="button-24hr"
                  >
                    <span 
                      className="font-medium"
                      style={{ 
                        fontFamily: 'Helvetica, Arial, sans-serif', 
                        fontSize: '16px',
                        color: clockFormat === "24hr" ? '#000000' : '#FFFFFF'
                      }}
                    >
                      24 Hour
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute bottom-[-2px] left-[5px]">
            <button 
              onClick={toggleFullscreen}
              className="cursor-pointer p-4"
              data-testid="button-fullscreen-toggle"
            >
              <Square 
                className={`w-6 h-6 ${isFullscreen ? 'text-[#ffd200]' : 'text-white'}`} 
                fill={isFullscreen ? '#ffd200' : 'none'}
              />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
