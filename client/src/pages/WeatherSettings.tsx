import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Square } from "lucide-react";
import resolutionIcon from "@assets/image_1772664658561.png";
import { queryClient } from "@/lib/queryClient";
import type { KioskSettings } from "@shared/schema";

export default function WeatherSettings() {
  const [temperatureUnit, setTemperatureUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResolutionPanel, setShowResolutionPanel] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState(() => localStorage.getItem('kioskResolution') || '800x480');

  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    if (settings) {
      setTemperatureUnit(settings.temperatureUnit as "fahrenheit" | "celsius");
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: { temperatureUnit: string }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          temperatureUnit: newSettings.temperatureUnit,
          clockFormat: settings?.clockFormat || '12hr'
        }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
    },
  });

  const handleTemperatureToggle = (unit: "fahrenheit" | "celsius") => {
    setTemperatureUnit(unit);
    saveSettingsMutation.mutate({ temperatureUnit: unit });
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
          data-testid="weather-settings-main"
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
              Weather Settings
            </h1>

            <div className="flex flex-col gap-6 w-[400px]">
              <div className="flex flex-col gap-3">
                <span 
                  className="text-white font-medium"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}
                >
                  Temperature Unit
                </span>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleTemperatureToggle("fahrenheit")}
                    className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{ 
                      height: '44px', 
                      backgroundColor: temperatureUnit === "fahrenheit" ? '#FFFFFF' : '#2D2C31'
                    }}
                    data-testid="button-fahrenheit"
                  >
                    <span 
                      className="font-medium"
                      style={{ 
                        fontFamily: 'Helvetica, Arial, sans-serif', 
                        fontSize: '16px',
                        color: temperatureUnit === "fahrenheit" ? '#000000' : '#FFFFFF'
                      }}
                    >
                      Fahrenheit
                    </span>
                  </button>
                  <button
                    onClick={() => handleTemperatureToggle("celsius")}
                    className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                    style={{ 
                      height: '44px', 
                      backgroundColor: temperatureUnit === "celsius" ? '#FFFFFF' : '#2D2C31'
                    }}
                    data-testid="button-celsius"
                  >
                    <span 
                      className="font-medium"
                      style={{ 
                        fontFamily: 'Helvetica, Arial, sans-serif', 
                        fontSize: '16px',
                        color: temperatureUnit === "celsius" ? '#000000' : '#FFFFFF'
                      }}
                    >
                      Celsius
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {showResolutionPanel && (
            <div className="absolute inset-0 z-50 bg-[#0b0b0b] flex flex-col justify-center items-center gap-[8px]" style={{ padding: '15px 20px' }}>
              <p style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '13px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Display Resolution</p>
              {(['800x480', '1024x600', '1280x800'] as const).map((res) => {
                const [w, h] = res.split('x');
                const isSelected = selectedResolution === res;
                return (
                  <div
                    key={res}
                    className="rounded-[6px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      width: '760px',
                      height: '58px',
                      backgroundColor: '#2D2C31',
                      border: isSelected ? '2px solid #ffd200' : '2px solid transparent',
                    }}
                    onClick={() => {
                      localStorage.setItem('kioskResolution', res);
                      setSelectedResolution(res);
                      setShowResolutionPanel(false);
                    }}
                    data-testid={`button-resolution-${res}`}
                  >
                    <span style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '20px', fontWeight: 700, color: isSelected ? '#ffd200' : '#ffffff' }}>
                      {w} × {h}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="absolute bottom-[-2px] left-[5px] flex flex-row items-center">
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
            <button
              className="cursor-pointer p-4"
              onClick={() => setShowResolutionPanel(prev => !prev)}
              data-testid="button-resolution-toggle"
            >
              <img src={resolutionIcon} alt="Resolution" className="w-6 h-6" style={{ filter: showResolutionPanel ? 'invert(1) sepia(1) saturate(10) hue-rotate(3deg)' : 'invert(1)' }} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
