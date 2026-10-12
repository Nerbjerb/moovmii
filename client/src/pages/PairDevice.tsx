import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { getDeviceId } from "@/lib/deviceId";
import moovmiiLogo from "@assets/moovmii logo v2 (White).png";

// Tablet pairing screen. Shown after the native WiFi step while the device is
// unpaired: it registers the device, displays a 6-digit code + QR, auto-refreshes
// the code before it expires, and polls until a phone claims it — then advances
// to the kiosk.
const font = { fontFamily: "Helvetica, Arial, sans-serif" };
const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
const TOKEN_KEY = "moovmii_device_token";
const PAIR_WEB_URL = "https://app.moovmii.com/pair"; // QR deep-link target (phone)
// Branded URL shown for manual entry. Today: pair.moovmii.com (GoDaddy subdomain
// forward → app.moovmii.com/pair). Later, switch to "moovmii.com/pair".
const PAIR_DISPLAY_URL = "pair.moovmii.com";

export default function PairDevice() {
  const [, setLocation] = useLocation();
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);
  const [code, setCode] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(localStorage.getItem(TOKEN_KEY));

  // Make sure this device is registered and we hold its token.
  async function ensureToken(): Promise<string | null> {
    if (tokenRef.current) return tokenRef.current;
    const reg = await fetch("/api/devices/register", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceId: getDeviceId() }),
    }).then((r) => r.json()).catch(() => null);
    if (reg?.deviceToken) {
      tokenRef.current = reg.deviceToken;
      localStorage.setItem(TOKEN_KEY, reg.deviceToken);
      return reg.deviceToken;
    }
    // Device exists server-side but we lost the token — re-provision with a fresh id.
    if (reg?.registered) {
      const fresh = crypto.randomUUID();
      localStorage.setItem("deviceId", fresh);
      const reg2 = await fetch("/api/devices/register", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId: fresh }),
      }).then((r) => r.json()).catch(() => null);
      if (reg2?.deviceToken) {
        tokenRef.current = reg2.deviceToken;
        localStorage.setItem(TOKEN_KEY, reg2.deviceToken);
        return reg2.deviceToken;
      }
    }
    return null;
  }

  async function requestCode(token: string): Promise<number> {
    const res = await fetch("/api/devices/pairing-code", {
      method: "POST", headers: { "x-device-token": token },
    }).then((r) => r.json()).catch(() => null);
    if (res?.code) {
      setCode(res.code);
      const ms = new Date(res.expiresAt).getTime() - Date.now();
      return Math.max(30_000, ms - 30_000); // refresh ~30s before expiry
    }
    return 60_000;
  }

  useEffect(() => {
    let alive = true;
    let refreshTimer: ReturnType<typeof setTimeout>;
    let pollTimer: ReturnType<typeof setTimeout>;

    (async () => {
      const token = await ensureToken();
      if (!alive || !token) return;

      const scheduleRefresh = async () => {
        const nextMs = await requestCode(token);
        if (!alive) return;
        refreshTimer = setTimeout(scheduleRefresh, nextMs);
      };
      await scheduleRefresh();

      // Advance to the kiosk only once setup actually produces/updates config
      // (configVersion increases past where it was when this screen opened).
      // This way re-opening "Set up device" on an already-paired device stays
      // here instead of bouncing straight back to the kiosk.
      let baseline: number | null = null;
      const poll = async () => {
        const st = await fetch("/api/device/state", { headers: { "x-device-token": token } })
          .then((r) => r.json()).catch(() => null);
        if (!alive) return;
        if (st) {
          const v = st.configVersion ?? 0;
          if (baseline === null) baseline = v;
          else if (v > baseline) { setLocation("/"); return; }
        }
        pollTimer = setTimeout(poll, 3000);
      };
      pollTimer = setTimeout(poll, 3000);
    })();

    return () => { alive = false; clearTimeout(refreshTimer); clearTimeout(pollTimer); };
  }, []);

  // Use ?pair= (not ?code=) so it doesn't collide with Supabase OAuth's ?code=.
  const qrValue = code ? `${PAIR_WEB_URL}?pair=${code}` : PAIR_WEB_URL;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main className="bg-black relative" style={{ width: "800px", height: "480px", overflow: "hidden" }}>
          {/* Title */}
          <div className="absolute top-[26px] left-0 right-0 flex justify-center">
            <span style={{ ...font, fontSize: "34px", fontWeight: 400, color: "#ffffff" }}>Sign In</span>
          </div>

          {/* Left: enter a code */}
          <div style={{ position: "absolute", left: "40px", top: "118px", width: "312px", textAlign: "center" }}>
            <div style={{ ...font, fontSize: "30px", fontWeight: 400, color: "#ffffff" }}>Use a Code</div>
            <div style={{ ...font, fontSize: "15px", color: "#b9b9b9", marginTop: "16px", lineHeight: 1.4 }}>
              Enter the six-digit code<br />at {PAIR_DISPLAY_URL}
            </div>
            <div style={{
              marginTop: "30px", height: "74px", borderRadius: "14px", backgroundColor: "#2b2b2e",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ ...font, fontSize: "46px", fontWeight: 500, color: "#ffffff", letterSpacing: "3px" }}>
                {code ? `${code.slice(0, 3)}-${code.slice(3)}` : "– – – - – – –"}
              </span>
            </div>
          </div>

          {/* Center: divider + Or */}
          <div style={{ position: "absolute", left: "400px", top: "96px", bottom: "72px", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ flex: 1, width: "1px", backgroundColor: "#4a4a4a" }} />
            <span style={{ ...font, fontSize: "22px", color: "#ffffff", margin: "14px 0" }}>Or</span>
            <div style={{ flex: 1, width: "1px", backgroundColor: "#4a4a4a" }} />
          </div>

          {/* Right: QR */}
          <div style={{ position: "absolute", right: "64px", top: "122px", backgroundColor: "#ffffff", padding: "12px", borderRadius: "4px", lineHeight: 0 }}>
            <QRCodeSVG value={qrValue} size={212} level="M" />
          </div>

          {/* Bottom: logo */}
          <div className="absolute bottom-[18px] left-0 right-0 flex justify-center">
            <img src={moovmiiLogo} alt="moovmii" style={{ height: "20px", width: "auto" }} />
          </div>
        </main>
      </div>
    </div>
  );
}
