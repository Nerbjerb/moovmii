import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import type { KioskSettings } from "@shared/schema";

export default function AdvancedSettings() {
  const [temperatureUnit, setTemperatureUnit] = useState<"fahrenheit" | "celsius">("fahrenheit");
  const [clockFormat, setClockFormat] = useState<"12hr" | "24hr">("12hr");

  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ['/api/settings'],
  });

  useEffect(() => {
    if (settings) {
      setTemperatureUnit(settings.temperatureUnit as "fahrenheit" | "celsius");
      setClockFormat(settings.clockFormat as "12hr" | "24hr");
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: { temperatureUnit: string; clockFormat: string }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
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
    saveSettingsMutation.mutate({ temperatureUnit: unit, clockFormat });
  };

  const handleClockToggle = (format: "12hr" | "24hr") => {
    setClockFormat(format);
    saveSettingsMutation.mutate({ temperatureUnit, clockFormat: format });
  };

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        backgroundColor: '#0b0b0b',
        width: '800px',
        height: '480px',
        overflow: 'hidden'
      }}
    >
      <div 
        className="flex-1 flex flex-col relative overflow-hidden"
        style={{ padding: '18px' }}
      >
        <main className="flex-1 flex flex-col">
          <div className="absolute top-[-2px] left-[5px]">
            <Link href="/settings" className="block p-4" data-testid="link-back-settings">
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" data-testid="button-back" />
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 gap-8">
            <h1 
              className="text-white font-bold"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '24px' }}
            >
              Advanced Settings
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
        </main>
      </div>
    </div>
  );
}
