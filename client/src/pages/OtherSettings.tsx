import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getDeviceId } from "@/lib/deviceId";
import type { KioskSettings } from "@shared/schema";

export default function OtherSettings() {
  const scaleMap: Record<string, number> = { '800x480': 1, '1024x600': 1.25, '1280x800': 1.6, '1920x1080': 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem('kioskResolution') || '800x480'] || 1);
  const deviceId = getDeviceId();
  const [transportRows, setTransportRows] = useState<2 | 3 | 4>(2);

  const { data: settings } = useQuery<KioskSettings>({
    queryKey: ['/api/settings', deviceId],
  });

  useEffect(() => {
    if (settings) {
      const rows = settings.transportRows as 2 | 3 | 4;
      setTransportRows(rows === 3 || rows === 4 ? rows : 2);
    }
  }, [settings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (transportRows: number) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kioskId: deviceId,
          temperatureUnit: settings?.temperatureUnit || 'fahrenheit',
          clockFormat: settings?.clockFormat || '12hr',
          transportRows,
        }),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings', deviceId] });
    },
  });

  const handleRowsChange = (n: 2 | 3 | 4) => {
    setTransportRows(n);
    saveSettingsMutation.mutate(n);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: 'center center' }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: '800px', height: '480px', padding: '15px 20px' }}
          data-testid="other-settings-main"
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
              Other Settings
            </h1>

            <div className="flex flex-col gap-6 w-[400px]">
              <div className="flex flex-col gap-3">
                <span
                  className="text-white font-medium"
                  style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}
                >
                  # of Transportation Rows
                </span>
                <div className="flex gap-3">
                  {([2, 3, 4] as const).map((n) => (
                    <button
                      key={n}
                      onClick={() => handleRowsChange(n)}
                      className="flex-1 rounded-[6px] flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                      style={{
                        height: '44px',
                        backgroundColor: transportRows === n ? '#FFFFFF' : '#2D2C31',
                      }}
                      data-testid={`button-rows-${n}`}
                    >
                      <span
                        className="font-medium"
                        style={{
                          fontFamily: 'Helvetica, Arial, sans-serif',
                          fontSize: '16px',
                          color: transportRows === n ? '#000000' : '#FFFFFF',
                        }}
                      >
                        {n}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
