import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";
import moovmiiLogo from "@assets/moovmii logo v2 (White).png";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };
const fmtCode = (d: string) => (d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d);
const PENDING = "pending_pair_code";
const IN_PROGRESS = "pairing_in_progress";

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.9 2.6 30.3 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6.1C12.2 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-17z" />
      <path fill="#FBBC05" d="M10.3 28.1c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.8-6.1C.9 16.2 0 20 0 24s.9 7.8 2.5 11.2l7.8-6.1z" />
      <path fill="#34A853" d="M24 48c6.3 0 11.6-2.1 15.5-5.7l-7.1-5.5c-2 1.3-4.5 2.1-8.4 2.1-6.4 0-11.8-3.7-13.7-8.9l-7.8 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
function AppleLogo({ color = "#111" }: { color?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill={color} aria-hidden>
      <path d="M16.365 1.43c0 1.14-.42 2.22-1.19 3.02-.84.88-2.2 1.56-3.33 1.47-.13-1.1.45-2.27 1.17-3.02.82-.86 2.26-1.49 3.35-1.47zM20.5 17.1c-.56 1.3-.83 1.88-1.56 3.03-1.02 1.6-2.46 3.6-4.24 3.61-1.58.02-1.99-1.03-4.14-1.02-2.15.01-2.6 1.04-4.18 1.02-1.78-.02-3.14-1.82-4.16-3.42C-.35 16.3-.78 11.1 1.1 8.35c1.14-1.66 2.9-2.63 4.55-2.63 1.69 0 2.75 1.03 4.15 1.03 1.36 0 2.19-1.03 4.14-1.03 1.47 0 3.03.8 4.14 2.18-3.64 1.99-3.05 7.2 2.32 9.23z" />
    </svg>
  );
}

export default function Pair() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [phase, setPhase] = useState<"code" | "signin">("code");
  const [code, setCode] = useState(() => {
    const fromUrl = (new URLSearchParams(window.location.search).get("pair") ?? "").replace(/\D/g, "").slice(0, 6);
    if (fromUrl) sessionStorage.setItem(PENDING, fromUrl);
    return sessionStorage.getItem(PENDING) ?? "";
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const claim = async (c: string) => {
    setBusy(true); setError("");
    try {
      const res = await apiFetch("/api/pair", { method: "POST", body: JSON.stringify({ code: c }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.paired) {
        sessionStorage.removeItem(PENDING); sessionStorage.removeItem(IN_PROGRESS);
        setLocation(`/setup/${body.device.id}`); return;
      }
      sessionStorage.removeItem(IN_PROGRESS);
      setError(body.error || "That code didn't work. Check the screen and try again.");
      setPhase("code");
    } catch {
      setError("Network error — please try again."); setPhase("code");
    } finally { setBusy(false); }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session); setReady(true);
      const pc = (sessionStorage.getItem(PENDING) ?? "").replace(/\D/g, "");
      // Returning from the Google redirect mid-pair → finish the claim.
      if (data.session && pc.length === 6 && sessionStorage.getItem(IN_PROGRESS)) claim(pc);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onContinue = () => {
    const c = code.replace(/\D/g, "");
    if (c.length !== 6) { setError("Enter the 6-digit code from your moovmii screen."); return; }
    sessionStorage.setItem(PENDING, c);
    if (session) { claim(c); return; }
    sessionStorage.setItem(IN_PROGRESS, "1");
    setError(""); setPhase("signin");
  };
  const signIn = () =>
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });

  return (
    <div style={{ ...font, minHeight: "100vh", backgroundColor: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px" }}>
      <img src={moovmiiLogo} alt="moovmii" style={{ height: "26px", width: "auto", marginTop: "64px" }} />

      <div style={{ width: "100%", maxWidth: "380px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "22px", paddingBottom: "60px" }}>
        {!ready ? null : busy ? (
          <div style={{ textAlign: "center", color: "#9a9a9a", fontSize: "16px" }}>Pairing…</div>
        ) : phase === "code" ? (
          <>
            <div style={{ textAlign: "center" }}>
              <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>Match the code</h1>
              <p style={{ fontSize: "15px", color: "#9a9a9a", marginTop: "10px", lineHeight: 1.45 }}>
                Enter the code shown on your moovmii screen.
              </p>
            </div>
            <input
              value={fmtCode(code)}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              inputMode="numeric" autoComplete="one-time-code" placeholder="000-000"
              style={{ ...font, height: "68px", borderRadius: "12px", backgroundColor: "#1c1c1f", color: "#fff", border: error ? "2px solid #e05252" : "2px solid #2d2d31", textAlign: "center", fontSize: "32px", fontWeight: 600, letterSpacing: "6px", outline: "none" }}
            />
            {error && <div style={{ color: "#ff8080", fontSize: "13px", marginTop: "-10px", textAlign: "center" }}>{error}</div>}
            <button onClick={onContinue} disabled={code.length !== 6}
              style={{ height: "54px", borderRadius: "12px", backgroundColor: code.length === 6 ? "#ffffff" : "#2d2d31", color: code.length === 6 ? "#000" : "#777", border: "none", cursor: code.length === 6 ? "pointer" : "default", fontSize: "16px", fontWeight: 700 }}>
              Enter Code To Continue
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0, textAlign: "center" }}>Sign up or Log In</h1>
            <p style={{ fontSize: "14px", color: "#9a9a9a", marginTop: "-10px", textAlign: "center" }}>to finish pairing your device.</p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={signIn}
                style={{ flex: 1, minHeight: "64px", borderRadius: "12px", backgroundColor: "#fff", color: "#111", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "9px", padding: "0 10px" }}>
                <GoogleG /><span style={{ fontSize: "13px", fontWeight: 600, textAlign: "left", lineHeight: 1.2 }}>Continue with<br />Google</span>
              </button>
              <button disabled
                style={{ flex: 1, minHeight: "64px", borderRadius: "12px", backgroundColor: "#1c1c1f", color: "#6f6f6f", border: "1px solid #2d2d31", cursor: "default", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", padding: "0 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                  <AppleLogo color="#6f6f6f" /><span style={{ fontSize: "13px", fontWeight: 600, textAlign: "left", lineHeight: 1.2 }}>Continue with<br />Apple</span>
                </div>
                <span style={{ fontSize: "10px", color: "#5a5a5a" }}>coming soon</span>
              </button>
            </div>
            <button onClick={() => { setPhase("code"); sessionStorage.removeItem(IN_PROGRESS); }}
              style={{ ...font, background: "none", border: "none", color: "#8a8a8a", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>
              Back to code
            </button>
          </>
        )}
      </div>
    </div>
  );
}
