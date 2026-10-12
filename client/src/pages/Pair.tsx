import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";
import { apiFetch } from "@/lib/api";
import moovmiiLogo from "@assets/moovmii logo v2 (White).png";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

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

export default function Pair() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const initialCode = (new URLSearchParams(search).get("code") ?? "").replace(/\D/g, "").slice(0, 6);

  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = () =>
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.href } });

  const pair = async () => {
    const c = code.replace(/\D/g, "");
    if (c.length !== 6) { setError("Enter the 6-digit code from your moovmii screen."); return; }
    setBusy(true); setError("");
    try {
      const res = await apiFetch("/api/pair", { method: "POST", body: JSON.stringify({ code: c }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.paired) { setLocation(`/setup/${body.device.id}`); return; }
      setError(body.error || "That code didn't work. Check the screen and try again.");
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ ...font, minHeight: "100vh", backgroundColor: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px" }}>
      <img src={moovmiiLogo} alt="moovmii" style={{ height: "26px", width: "auto", marginTop: "56px" }} />

      <div style={{ width: "100%", maxWidth: "380px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "20px", paddingBottom: "40px" }}>
        {!ready ? null : !session ? (
          <>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>Set up your moovmii</h1>
              <p style={{ fontSize: "15px", color: "#9a9a9a", marginTop: "10px", lineHeight: 1.45 }}>
                Sign in to pair your display and save your setup to your account.
              </p>
            </div>
            <button
              onClick={signIn}
              style={{ height: "52px", borderRadius: "12px", backgroundColor: "#fff", color: "#111", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", fontSize: "16px", fontWeight: 600 }}
            >
              <GoogleG /> Continue with Google
            </button>
          </>
        ) : (
          <>
            <div>
              <h1 style={{ fontSize: "26px", fontWeight: 700, margin: 0 }}>Enter your code</h1>
              <p style={{ fontSize: "15px", color: "#9a9a9a", marginTop: "10px", lineHeight: 1.45 }}>
                Type the 6-digit code shown on your moovmii screen.
              </p>
            </div>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              style={{
                ...font, height: "68px", borderRadius: "12px", backgroundColor: "#1c1c1f", color: "#fff",
                border: error ? "2px solid #e05252" : "2px solid #2d2d31", textAlign: "center",
                fontSize: "34px", fontWeight: 600, letterSpacing: "10px", outline: "none",
              }}
            />
            {error && <div style={{ color: "#ff8080", fontSize: "13px", marginTop: "-8px" }}>{error}</div>}
            <button
              onClick={pair}
              disabled={busy || code.length !== 6}
              style={{ height: "52px", borderRadius: "12px", backgroundColor: code.length === 6 && !busy ? "#FFD200" : "#2d2d31", color: code.length === 6 && !busy ? "#000" : "#777", border: "none", cursor: code.length === 6 && !busy ? "pointer" : "default", fontSize: "16px", fontWeight: 700 }}
            >
              {busy ? "Pairing…" : "Pair device"}
            </button>
            <div style={{ fontSize: "12px", color: "#6f6f6f", textAlign: "center" }}>
              Signed in as {session.user.email} ·{" "}
              <span onClick={() => supabase.auth.signOut()} style={{ color: "#9a9a9a", textDecoration: "underline", cursor: "pointer" }}>Sign out</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
