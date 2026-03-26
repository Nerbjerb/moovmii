import { useLocation } from "wouter";
import { ArrowLeft, Wifi, Monitor, Train, Bus, Ship, Car, Bike, Clock, Cloud } from "lucide-react";

const items = [
  { label: 'WiFi',              icon: Wifi,     path: '/wifi'             },
  { label: 'Display Settings',  icon: Monitor,  path: '/other-settings'   },
  { label: 'Train Settings',    icon: Train,    path: '/settings'         },
  { label: 'Bus Settings',      icon: Bus,      path: '/settings'         },
  { label: 'Ferry Settings',    icon: Ship,     path: '/settings'         },
  { label: 'Driving Settings',  icon: Car,      path: '/settings'         },
  { label: 'Citibike Settings', icon: Bike,     path: '/settings'         },
  { label: 'Clock Settings',    icon: Clock,    path: '/clock-settings'   },
  { label: 'Weather Settings',  icon: Cloud,    path: '/weather-settings' },
];

export default function SettingsMenu() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container">
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: '800px', height: '480px', padding: '15px 20px' }}
        >
          <div className="absolute top-[5px] left-[5px]">
            <button className="block p-4" onClick={() => setLocation('/settings')}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          <div className="flex flex-col items-center justify-center flex-1 gap-5">
            <h1
              className="text-white font-bold"
              style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '24px' }}
            >
              Settings
            </h1>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                width: '720px',
              }}
            >
              {items.map(({ label, icon: Icon, path }) => (
                <button
                  key={label}
                  onClick={() => setLocation(path)}
                  className="flex items-center gap-4 rounded-[8px] cursor-pointer transition-opacity hover:opacity-80"
                  style={{ height: '52px', backgroundColor: '#2D2C31', padding: '0 20px' }}
                >
                  <Icon className="w-5 h-5 text-white flex-shrink-0" />
                  <span
                    className="font-medium text-white"
                    style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '16px' }}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
