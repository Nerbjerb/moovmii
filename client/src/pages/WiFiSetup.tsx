import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Wifi, Lock, Eye, EyeOff, CheckCircle, Loader, ArrowLeft } from "lucide-react";

interface Network {
  ssid: string;
  secured: boolean;
  strength: 1 | 2 | 3 | 4;
}

const NETWORKS: Network[] = [
  { ssid: "moovmii-5G", secured: true, strength: 4 },
  { ssid: "BuildingNet", secured: true, strength: 3 },
  { ssid: "HomeNetwork_2.4", secured: true, strength: 3 },
  { ssid: "Xfinity_Guest", secured: false, strength: 2 },
  { ssid: "ATT-WiFi-5G", secured: true, strength: 1 },
];

type Screen = "list" | "password" | "connecting" | "connected";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

function SignalBars({ strength }: { strength: 1 | 2 | 3 | 4 }) {
  return (
    <div className="flex items-end gap-[2px]">
      {[1, 2, 3, 4].map((bar) => (
        <div
          key={bar}
          style={{
            width: 4,
            height: 4 + bar * 3,
            backgroundColor: bar <= strength ? "#ffffff" : "#555",
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

export default function WiFiSetup() {
  const [, navigate] = useLocation();
  const scaleMap: Record<string, number> = { '800x480': 1, '1024x600': 1.25, '1280x800': 1.6, '1920x1080': 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem('kioskResolution') || '800x480'] || 1);
  const [screen, setScreen] = useState<Screen>("list");
  const [selected, setSelected] = useState<Network | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleNetworkClick = (network: Network) => {
    setSelected(network);
    if (network.secured) {
      setScreen("password");
    } else {
      setScreen("connecting");
    }
  };

  const handleConnect = () => {
    setScreen("connecting");
  };

  useEffect(() => {
    if (screen === "connecting") {
      const t = setTimeout(() => setScreen("connected"), 2500);
      return () => clearTimeout(t);
    }
    if (screen === "connected") {
      localStorage.setItem("wifi_connected", "true");
      const t = setTimeout(() => navigate("/"), 2000);
      return () => clearTimeout(t);
    }
  }, [screen, navigate]);

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: 'center center' }}>
      <div style={{ width: 800, height: 480, display: "flex", flexDirection: "column", padding: "24px 28px", position: "relative" }}>

        {/* SCREEN: Network List */}
        {screen === "list" && (
          <>
            <div className="relative flex flex-col items-center mb-5">
              <button
                onClick={() => navigate("/settings")}
                className="absolute left-0 top-0 p-1 text-white hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <span style={{ ...font, fontSize: 13, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                WiFi Setup
              </span>
              <span style={{ ...font, fontSize: 22, fontWeight: 700, color: "#ffffff", marginTop: 4 }}>
                Select a Network
              </span>
            </div>
            <div className="flex flex-col gap-[8px]">
              {NETWORKS.map((network) => (
                <div
                  key={network.ssid}
                  onClick={() => handleNetworkClick(network)}
                  className="rounded-[6px] flex items-center justify-between cursor-pointer hover:opacity-80 transition-opacity px-4"
                  style={{ height: 58, backgroundColor: "#2D2C31" }}
                >
                  <div className="flex items-center gap-3">
                    <Wifi className="w-5 h-5 text-white" />
                    <span style={{ ...font, fontSize: 16, fontWeight: 600, color: "#ffffff" }}>
                      {network.ssid}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <SignalBars strength={network.strength} />
                    {network.secured && <Lock className="w-4 h-4" style={{ color: "#888" }} />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* SCREEN: Password Entry */}
        {screen === "password" && selected && (
          <div className="relative flex flex-col items-center justify-center h-full gap-5">
            <button
              onClick={() => { setScreen("list"); setPassword(""); }}
              className="absolute top-0 left-0 p-1 text-white hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex flex-col items-center gap-1">
              <Wifi className="w-8 h-8 text-white mb-1" />
              <span style={{ ...font, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
                {selected.ssid}
              </span>
              <span style={{ ...font, fontSize: 13, color: "#888" }}>Enter WiFi password</span>
            </div>
            <div className="relative" style={{ width: 460 }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && password.length > 0 && handleConnect()}
                placeholder="Password"
                autoFocus
                style={{
                  ...font,
                  width: "100%",
                  height: 52,
                  backgroundColor: "#2D2C31",
                  border: "2px solid #444",
                  borderRadius: 6,
                  color: "#ffffff",
                  fontSize: 16,
                  padding: "0 48px 0 16px",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#FFD200")}
                onBlur={(e) => (e.target.style.borderColor = "#444")}
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setScreen("list"); setPassword(""); }}
                style={{ ...font, fontSize: 14, color: "#888", background: "none", border: "none", cursor: "pointer", padding: "10px 20px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={password.length === 0}
                style={{
                  ...font,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#000000",
                  backgroundColor: password.length > 0 ? "#FFD200" : "#555",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 36px",
                  cursor: password.length > 0 ? "pointer" : "not-allowed",
                  transition: "background-color 0.15s",
                }}
              >
                Connect
              </button>
            </div>
          </div>
        )}

        {/* SCREEN: Connecting */}
        {screen === "connecting" && selected && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <Loader className="w-12 h-12 text-white animate-spin" />
            <span style={{ ...font, fontSize: 18, fontWeight: 600, color: "#ffffff" }}>
              Connecting to {selected.ssid}...
            </span>
          </div>
        )}

        {/* SCREEN: Connected */}
        {screen === "connected" && selected && (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <CheckCircle className="w-14 h-14" style={{ color: "#4ade80" }} />
            <span style={{ ...font, fontSize: 20, fontWeight: 700, color: "#ffffff" }}>
              Connected to {selected.ssid}
            </span>
            <span style={{ ...font, fontSize: 14, color: "#888" }}>Launching moovmii...</span>
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
