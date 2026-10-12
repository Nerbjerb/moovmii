import { useEffect, useRef, useState } from "react";
import { useParams } from "wouter";
import { Home, Briefcase, ShoppingBag, UtensilsCrossed, MoreHorizontal, Car, Search, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";
import moovmiiLogo from "@assets/moovmii logo v2 (White).png";
import sirIcon from "@assets/moovmii/MTA Icons/src/svg/sir.svg";
import pathIcon from "@assets/moovmii/MTA Icons/src/svg/PATH_logo_no_bg.png";
import njTransitIcon from "@assets/moovmii/MTA Icons/src/svg/New_Jersey_Transit_white_cropped_trimmed.png";
import njTransitBusIcon from "@assets/njt vertical logo.png";
import nycFerryIcon from "@assets/NYC_Ferry_Horizontal_White_1768103579529.png";
import citibikeIcon from "@assets/citibike logo.png";
import mtaLogo from "@assets/MTA-logo-white.png";
import nyWaterwayLogo from "@assets/NY Waterway.png";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

const LOCATION_OPTIONS = [
  { id: "Home", icon: Home },
  { id: "Workplace", icon: Briefcase },
  { id: "Retail Space", icon: ShoppingBag },
  { id: "Restaurant or Bar", icon: UtensilsCrossed },
  { id: "Other", icon: MoreHorizontal },
];

type ModeDef = { id: string; label: string; img?: string; Icon?: typeof Car };
const MODES: ModeDef[] = [
  { id: "subway", label: "Subway", img: mtaLogo },
  { id: "sir", label: "Staten Island Railroad", img: sirIcon },
  { id: "lirr", label: "Long Island Railroad", img: mtaLogo },
  { id: "mnr", label: "Metro-North Railroad", img: mtaLogo },
  { id: "nycbus", label: "NYC Busses", img: mtaLogo },
  { id: "citibike", label: "Citibike", img: citibikeIcon },
  { id: "nycferry", label: "NYC Ferry", img: nycFerryIcon },
  { id: "path", label: "PATH Train", img: pathIcon },
  { id: "njt", label: "NJ Transit", img: njTransitIcon },
  { id: "njtbus", label: "NJ Transit Bus", img: njTransitBusIcon },
  { id: "nywaterway", label: "NY Waterway (NY/NJ)", img: nyWaterwayLogo },
  { id: "driving", label: "Driving", Icon: Car },
];

type Step = "location" | "address" | "transit" | "subway" | "done";
const YELLOW = "#FFD200";

export default function Setup() {
  const params = useParams();
  const deviceUuid = (params as Record<string, string>).id;

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("location");

  const [locationType, setLocationType] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const locWord = (locationType === "Other" ? otherLabel : locationType) || "space";

  // Load device config (confirms ownership + prefills on return).
  useEffect(() => {
    apiFetch(`/api/devices/${deviceUuid}/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((cfg) => {
        const o = cfg?.onboarding;
        if (o) {
          setLocationType(o.locationType ?? "");
          setOtherLabel(o.otherLabel ?? "");
          setAddress(o.address ?? "");
          if (o.lat != null && o.lon != null) setCoords({ lat: o.lat, lon: o.lon });
          setModes(Array.isArray(o.modes) ? o.modes : []);
        }
        setLoaded(true);
      })
      .catch(() => setNotFound(true));
  }, [deviceUuid]);

  // Address autocomplete (reuses the driving autocomplete endpoint).
  useEffect(() => {
    if (step !== "address" || address.trim().length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/driving/autocomplete?input=${encodeURIComponent(address)}`);
        const j = await r.json();
        setSuggestions(Array.isArray(j) ? j.slice(0, 4) : (j?.predictions ?? []).slice(0, 4));
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [address, step]);

  const saveOnboarding = async (patch: Record<string, any>) => {
    setSaving(true);
    try { await apiFetch(`/api/devices/${deviceUuid}/config`, { method: "PUT", body: JSON.stringify({ onboarding: patch }) }); }
    finally { setSaving(false); }
  };

  const toTransit = async () => {
    // geocode the address (best-effort) so the subway suggester has coordinates
    let c = coords;
    if (address.trim() && !c) {
      try {
        const r = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
        if (r.ok) { const j = await r.json(); if (j?.lat != null) { c = { lat: j.lat, lon: j.lon }; setCoords(c); } }
      } catch {}
    }
    setStep("transit");
  };

  const finishTransit = async () => {
    await saveOnboarding({ locationType, otherLabel: locationType === "Other" ? otherLabel : null, address: address || null, lat: coords?.lat ?? null, lon: coords?.lon ?? null, modes });
    setStep("subway");
  };

  const toggleMode = (id: string) =>
    setModes((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));

  if (notFound) return <Centered>Device not found.</Centered>;
  if (!loaded) return <Centered>Loading…</Centered>;

  return (
    <div style={{ ...font, minHeight: "100vh", backgroundColor: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "22px" }}>
        <img src={moovmiiLogo} alt="moovmii" style={{ height: "22px", width: "auto" }} />
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 22px 22px" }}>
        {step === "location" && (
          <StepBody title="Where will you display this device?">
            <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
              {LOCATION_OPTIONS.map(({ id, icon: Icon }) => {
                const selected = locationType === id;
                return (
                  <div key={id}>
                    <button onClick={() => setLocationType(id)}
                      style={{ ...font, width: "100%", height: "54px", borderRadius: "14px", backgroundColor: "#1c1c1f", border: `2px solid ${selected ? YELLOW : "transparent"}`, display: "flex", alignItems: "center", gap: "14px", padding: "0 18px", cursor: "pointer", color: "#fff" }}>
                      <Icon className="w-5 h-5" style={{ color: selected ? YELLOW : "#fff" }} />
                      <span style={{ fontSize: "16px", fontWeight: 600, flex: 1, textAlign: "left" }}>
                        {id === "Other" && otherLabel ? otherLabel : id}
                      </span>
                    </button>
                    {id === "Other" && selected && (
                      <input autoFocus value={otherLabel} onChange={(e) => setOtherLabel(e.target.value)} placeholder="Name this location"
                        style={{ ...font, width: "100%", height: "48px", marginTop: "8px", borderRadius: "12px", backgroundColor: "#141416", border: "2px solid #2d2d31", color: "#fff", padding: "0 16px", fontSize: "15px", outline: "none" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </StepBody>
        )}

        {step === "address" && (
          <StepBody title={`What is the address of your ${locWord}?`}>
            <div style={{ position: "relative" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "54px", borderRadius: "14px", backgroundColor: "#1c1c1f", border: "2px solid #2d2d31", padding: "0 16px" }}>
                <Search className="w-4 h-4" style={{ color: "#888", flexShrink: 0 }} />
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Start typing an address…" autoComplete="off"
                  style={{ ...font, flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: "15px", outline: "none" }} />
              </div>
              {suggestions.length > 0 && (
                <div style={{ marginTop: "8px", borderRadius: "12px", overflow: "hidden", border: "1px solid #2d2d31" }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => { setAddress(s); setSuggestions([]); setCoords(null); }}
                      style={{ ...font, width: "100%", textAlign: "left", background: "#141416", border: "none", borderTop: i ? "1px solid #242427" : "none", color: "#ddd", padding: "13px 16px", fontSize: "14px", cursor: "pointer" }}>{s}</button>
                  ))}
                </div>
              )}
              <p style={{ fontSize: "12px", color: "#6f6f6f", marginTop: "12px" }}>Optional — helps us suggest the closest stops.</p>
            </div>
          </StepBody>
        )}

        {step === "transit" && (
          <StepBody title={`What modes of transportation do you use from your ${locWord}? Select all that apply.`}>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", overflowY: "auto" }}>
              {MODES.map((m) => {
                const selected = modes.includes(m.id);
                return (
                  <button key={m.id} onClick={() => toggleMode(m.id)}
                    style={{ ...font, width: "100%", minHeight: "52px", borderRadius: "12px", backgroundColor: "#1c1c1f", border: `2px solid ${selected ? YELLOW : "transparent"}`, display: "flex", alignItems: "center", gap: "12px", padding: "0 16px", cursor: "pointer", color: "#fff" }}>
                    <span style={{ width: "30px", display: "flex", justifyContent: "center", flexShrink: 0 }}>
                      {m.img ? <img src={m.img} alt="" style={{ maxHeight: "22px", maxWidth: "30px", objectFit: "contain" }} /> : m.Icon ? <m.Icon className="w-5 h-5" /> : null}
                    </span>
                    <span style={{ fontSize: "15px", fontWeight: 600, flex: 1, textAlign: "left" }}>{m.label}</span>
                    {selected && <Check className="w-5 h-5" style={{ color: YELLOW }} />}
                  </button>
                );
              })}
            </div>
          </StepBody>
        )}

        {step === "subway" && (
          <StepBody title="Subway Setup">
            <div style={{ color: "#888", fontSize: "15px", marginTop: "20px" }}>
              Platform selection (recommended stops + add more) is built in the next step.
            </div>
          </StepBody>
        )}

        {step === "done" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
            <div style={{ fontSize: "48px" }}>✅</div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, marginTop: "12px" }}>All set!</h1>
            <p style={{ fontSize: "15px", color: "#9a9a9a", marginTop: "10px", lineHeight: 1.45, maxWidth: "300px" }}>
              Your moovmii is ready. The display will update in a moment.
            </p>
          </div>
        )}

        {/* Nav */}
        {step !== "done" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px" }}>
            <button onClick={() => {
              if (step === "address") setStep("location");
              else if (step === "transit") setStep("address");
              else if (step === "subway") setStep("transit");
            }} style={{ ...font, visibility: step === "location" ? "hidden" : "visible", background: "none", border: "none", color: "#9a9a9a", fontSize: "16px", fontWeight: 600, cursor: "pointer", padding: "10px 4px" }}>Back</button>
            <NextButton
              disabled={(step === "location" && !locationType) || (step === "transit" && modes.length === 0) || saving}
              label={step === "subway" ? "Finish" : "Next"}
              onClick={() => {
                if (step === "location") setStep("address");
                else if (step === "address") toTransit();
                else if (step === "transit") finishTransit();
                else if (step === "subway") { saveOnboarding({ completedAt: new Date().toISOString() }); setStep("done"); }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StepBody({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: "28px", minHeight: 0 }}>
      <h1 style={{ ...font, fontSize: "23px", fontWeight: 700, lineHeight: 1.3, margin: "0 0 24px" }}>{title}</h1>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
function NextButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...font, height: "48px", padding: "0 30px", borderRadius: "12px", backgroundColor: disabled ? "#2d2d31" : YELLOW, color: disabled ? "#777" : "#000", border: "none", cursor: disabled ? "default" : "pointer", fontSize: "16px", fontWeight: 700 }}>
      {label}
    </button>
  );
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ ...font, minHeight: "100vh", backgroundColor: "#0b0b0b", color: "#9a9a9a", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}
