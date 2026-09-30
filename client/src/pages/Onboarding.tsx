import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Home, Briefcase, ShoppingBag, UtensilsCrossed, MoreHorizontal, MapPin, Search, Car, TrainFront, Check } from "lucide-react";
import { getDeviceId } from "@/lib/deviceId";
import { getOnboardingProfile, saveOnboardingProfile } from "@/lib/onboarding";
import OnScreenKeyboard from "@/components/OnScreenKeyboard";
import lirrIcon from "@assets/moovmii/MTA Icons/src/svg/LIRR_logo_white.png";
import metroNorthIcon from "@assets/moovmii/MTA Icons/src/svg/Metro-North_logo_white.png";
import sirIcon from "@assets/moovmii/MTA Icons/src/svg/sir.svg";
import pathIcon from "@assets/moovmii/MTA Icons/src/svg/PATH_logo_no_bg.png";
import njTransitIcon from "@assets/moovmii/MTA Icons/src/svg/New_Jersey_Transit_white_cropped_trimmed.png";
import njTransitBusIcon from "@assets/njt vertical logo.png";
import mtaBusIcon from "@assets/MTA_Regional_Bus_logo.svg_1768100704004.png";
import nycFerryIcon from "@assets/NYC_Ferry_Horizontal_White_1768103579529.png";
import citibikeIcon from "@assets/citibike logo.png";
import train1 from "@assets/moovmii/MTA Icons/src/svg/1.svg";
import train2 from "@assets/moovmii/MTA Icons/src/svg/2.svg";
import train3 from "@assets/moovmii/MTA Icons/src/svg/3.svg";
import train4 from "@assets/moovmii/MTA Icons/src/svg/4.svg";
import train5 from "@assets/moovmii/MTA Icons/src/svg/5.svg";
import train6 from "@assets/moovmii/MTA Icons/src/svg/6.svg";
import train7 from "@assets/moovmii/MTA Icons/src/svg/7.svg";
import trainA from "@assets/moovmii/MTA Icons/src/svg/a.svg";
import trainB from "@assets/moovmii/MTA Icons/src/svg/b.svg";
import trainC from "@assets/moovmii/MTA Icons/src/svg/c.svg";
import trainD from "@assets/moovmii/MTA Icons/src/svg/d.svg";
import trainE from "@assets/moovmii/MTA Icons/src/svg/e.svg";
import trainF from "@assets/moovmii/MTA Icons/src/svg/f.svg";
import trainG from "@assets/moovmii/MTA Icons/src/svg/g.svg";
import trainJ from "@assets/moovmii/MTA Icons/src/svg/j.svg";
import trainL from "@assets/moovmii/MTA Icons/src/svg/l.svg";
import trainM from "@assets/moovmii/MTA Icons/src/svg/m.svg";
import trainN from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import trainQ from "@assets/moovmii/MTA Icons/src/svg/q.svg";
import trainR from "@assets/moovmii/MTA Icons/src/svg/r.svg";
import trainW from "@assets/moovmii/MTA Icons/src/svg/w.svg";
import trainZ from "@assets/moovmii/MTA Icons/src/svg/z.svg";

// Subway line bullets
const LINE_ICONS: Record<string, string> = {
  "1": train1, "2": train2, "3": train3, "4": train4, "5": train5, "6": train6, "7": train7,
  A: trainA, B: trainB, C: trainC, D: trainD, E: trainE, F: trainF, G: trainG, J: trainJ,
  L: trainL, M: trainM, N: trainN, Q: trainQ, R: trainR, W: trainW, Z: trainZ,
};

// Line color groups for the manual "add platforms" picker (matches historical flow)
const SUBWAY_GROUPS: { id: string; lines: string[] }[] = [
  { id: "123", lines: ["1", "2", "3"] },
  { id: "456", lines: ["4", "5", "6"] },
  { id: "7", lines: ["7"] },
  { id: "ACE", lines: ["A", "C", "E"] },
  { id: "BDFM", lines: ["B", "D", "F", "M"] },
  { id: "NQRW", lines: ["N", "Q", "R", "W"] },
  { id: "L", lines: ["L"] },
  { id: "G", lines: ["G"] },
  { id: "JZ", lines: ["J", "Z"] },
];

// Config phase iterates the selected modes in this order; short labels for the tracker
const MODE_ORDER = ["subway", "sir", "lirr", "mnr", "path", "njt", "nycbus", "njtbus", "nycferry", "citibike", "driving", "nywaterway"];
const MODE_SHORT: Record<string, string> = {
  subway: "Subway", sir: "SIR", lirr: "LIRR", mnr: "Metro-North", path: "PATH", njt: "NJ Transit",
  nycbus: "NYC Bus", njtbus: "NJT Bus", nycferry: "Ferry", citibike: "Citibike", driving: "Driving", nywaterway: "NY Waterway",
};

// Placeholder suggestions until the geospatial suggester lands
type Platform = { station: string; direction: string; lines: string[] };
const SAMPLE_SUBWAY_PLATFORMS: Platform[] = [
  { station: "Broadway", direction: "Uptown Platform", lines: ["N", "W"] },
  { station: "Queensboro Plaza", direction: "Inbound Platform", lines: ["7"] },
  { station: "Steinway St", direction: "Uptown Platform", lines: ["E", "F", "R"] },
  { station: "Broadway", direction: "Downtown Platform", lines: ["N", "W"] },
  { station: "Queensboro Plaza", direction: "Outbound Platform", lines: ["7"] },
  { station: "Steinway St", direction: "Downtown Platform", lines: ["E", "F", "R"] },
  { station: "36 Av", direction: "Uptown Platform", lines: ["N", "W"] },
  { station: "36 Av", direction: "Downtown Platform", lines: ["N", "W"] },
  { station: "39 Av", direction: "Uptown Platform", lines: ["N", "W"] },
];

// Transportation modes (two columns, matching the mockup order). `img` is a
// brand logo asset; `Icon` is a lucide fallback where no brand asset exists;
// `placeholder` = listed but not yet wired to real data (NY Waterway).
type ModeDef = { id: string; label: string; img?: string; Icon?: any; placeholder?: boolean };
const LEFT_MODES: ModeDef[] = [
  { id: "subway", label: "Subway", Icon: TrainFront },
  { id: "lirr", label: "Long Island Railroad", img: lirrIcon },
  { id: "nycbus", label: "NYC Busses", img: mtaBusIcon },
  { id: "citibike", label: "Citibike", img: citibikeIcon },
  { id: "njt", label: "NJ Transit", img: njTransitIcon },
  { id: "nywaterway", label: "NY Waterway (NY/NJ)", placeholder: true },
];
const RIGHT_MODES: ModeDef[] = [
  { id: "sir", label: "Staten Island Railroad", img: sirIcon },
  { id: "mnr", label: "Metro-North Railroad", img: metroNorthIcon },
  { id: "nycferry", label: "NYC Ferry", img: nycFerryIcon },
  { id: "path", label: "PATH Train", img: pathIcon },
  { id: "njtbus", label: "NJ Transit Bus", img: njTransitBusIcon },
  { id: "driving", label: "Driving", Icon: Car },
];

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

// Onboarding wizard.
//
// Page 1 (WiFi) is handled NATIVELY by the shell before the web app loads, so
// this web wizard covers Page 2 onward. Built page by page — each step's real
// UI is filled in as its Figma mockup lands. Launched either automatically on
// first run (no saved config) or manually from Settings → General → Set up device.
type Step = "location" | "address" | "modes" | "configure" | "layout";

const STEPS: { id: Step; label: string }[] = [
  { id: "location", label: "Location Type" },
  { id: "address", label: "Your Address" },
  { id: "modes", label: "Transportation" },
  { id: "configure", label: "Lines & Stops" },
  { id: "layout", label: "Layout" },
];

const LOCATION_OPTIONS = [
  { id: "Home", icon: Home },
  { id: "Workplace", icon: Briefcase },
  { id: "Retail Space", icon: ShoppingBag },
  { id: "Restaurant or Bar", icon: UtensilsCrossed },
  { id: "Other", icon: MoreHorizontal },
];

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);
  const deviceId = getDeviceId();

  const [stepIndex, setStepIndex] = useState(0);
  const step = STEPS[stepIndex].id;

  // Pre-fill from any saved profile (manual "Set up device" re-runs pre-filled)
  const savedProfile = getOnboardingProfile(deviceId);
  const [locationType, setLocationType] = useState<string | null>(savedProfile.locationType ?? null);
  const [otherLabel, setOtherLabel] = useState<string>(savedProfile.otherLabel ?? "");
  const [otherEntry, setOtherEntry] = useState(false);

  // Address step state
  const [addressQuery, setAddressQuery] = useState<string>(savedProfile.address ?? "");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionMade = useRef(false);

  const locationValid = locationType !== null && (locationType !== "Other" || otherLabel.trim().length > 0);

  const addressPrompt = () => {
    switch (locationType) {
      case "Home": return "What is the address of your home?";
      case "Workplace": return "What is the address of your workplace?";
      case "Retail Space": return "What is the address of your retail shop?";
      case "Restaurant or Bar": return "What is the address of your restaurant or bar?";
      case "Other": return `What is the address of your ${otherLabel.trim() || "location"}?`;
      default: return "What is your address?";
    }
  };

  // Google Places autocomplete (reuses the same endpoint driving uses)
  useEffect(() => {
    if (step !== "address") return;
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (selectionMade.current) { selectionMade.current = false; return; }
    if (addressQuery.trim().length < 3) { setAddressSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/driving/autocomplete?input=${encodeURIComponent(addressQuery)}`);
        const data = await res.json();
        setAddressSuggestions((data.predictions || []).map((p: any) => p.description).slice(0, 4));
      } catch { setAddressSuggestions([]); }
    }, 350);
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, [addressQuery, step]);

  const handleSelectAddress = (s: string) => {
    selectionMade.current = true;
    setAddressQuery(s);
    setAddressSuggestions([]);
  };

  // Modes step
  const [selectedModes, setSelectedModes] = useState<string[]>(savedProfile.modes ?? []);
  const toggleMode = (id: string) =>
    setSelectedModes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const modesBlank = () => {
    switch (locationType) {
      case "Home": return "Home";
      case "Workplace": return "Workplace";
      case "Retail Space": return "your retail shop";
      case "Restaurant or Bar": return "your restaurant or bar";
      case "Other": return `your ${otherLabel.trim() || "location"}`;
      default: return "here";
    }
  };

  // Config phase: iterate selected modes; a "pizza tracker" shows sub-progress
  const configModes = MODE_ORDER.filter((id) => selectedModes.includes(id));
  const [configIndex, setConfigIndex] = useState(0);
  const currentConfigMode = configModes[configIndex];
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const platformKey = (p: Platform) => `${p.station}|${p.direction}`;
  const togglePlatform = (p: Platform) =>
    setSelectedPlatforms((prev) => (prev.includes(platformKey(p)) ? prev.filter((k) => k !== platformKey(p)) : [...prev, platformKey(p)]));

  // Manual "add additional platforms" sub-view (line-group picker → tree, scaffolded)
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const toggleGroup = (id: string) =>
    setSelectedGroups((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const layoutStepIndex = STEPS.findIndex((s) => s.id === "layout");
  const modesStepIndex = STEPS.findIndex((s) => s.id === "modes");

  const configBack = () => {
    if (showManualAdd) { setShowManualAdd(false); return; }
    if (configIndex > 0) setConfigIndex((i) => i - 1);
    else setStepIndex(modesStepIndex);
  };
  const configContinue = () => {
    // NOTE: persisting selected platforms as favorites/rows wires up with the
    // real geospatial suggester (next task) once configs carry real stop/line ids.
    // The manual-add group→line→station→direction drill-down is also scaffolded.
    setShowManualAdd(false);
    if (configIndex < configModes.length - 1) setConfigIndex((i) => i + 1);
    else setStepIndex(layoutStepIndex);
  };

  const goBack = () => {
    if (otherEntry) { setOtherEntry(false); return; }
    if (step === "configure") { configBack(); return; }
    if (stepIndex === 0) setLocation("/settings-menu");
    else setStepIndex((i) => i - 1);
  };

  const goNext = () => {
    if (step === "location") {
      saveOnboardingProfile(
        { locationType: locationType!, otherLabel: locationType === "Other" ? otherLabel.trim() : "" },
        deviceId
      );
    } else if (step === "address") {
      saveOnboardingProfile({ address: addressQuery.trim() }, deviceId);
    } else if (step === "modes") {
      saveOnboardingProfile({ modes: selectedModes }, deviceId);
    }
    if (stepIndex < STEPS.length - 1) setStepIndex((i) => i + 1);
    else setLocation("/");
  };

  const selectLocation = (id: string) => {
    setLocationType(id);
    if (id === "Other") setOtherEntry(true);
    else setOtherEntry(false);
  };

  const canProceed =
    step === "location" ? locationValid :
    step === "modes" ? selectedModes.length > 0 :
    true;

  const ModePill = ({ m }: { m: ModeDef }) => {
    const selected = selectedModes.includes(m.id);
    return (
      <button
        onClick={() => toggleMode(m.id)}
        className="hover:opacity-90 transition-opacity"
        style={{
          width: "358px", height: "46px", borderRadius: "10px", backgroundColor: "#2D2C31",
          border: `2px solid ${selected ? "#FFD200" : "transparent"}`,
          display: "flex", alignItems: "center", padding: "0 14px", gap: "12px", cursor: "pointer",
        }}
        data-testid={`mode-${m.id}`}
      >
        <div style={{ width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {m.img ? (
            <img src={m.img} alt="" style={{ maxHeight: "22px", maxWidth: "26px", objectFit: "contain" }} />
          ) : m.Icon ? (
            <m.Icon className="w-5 h-5" style={{ color: "#ffffff" }} />
          ) : null}
        </div>
        <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#ffffff", flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {m.label}
        </span>
        <div style={{
          width: "24px", height: "24px", borderRadius: "5px", flexShrink: 0,
          border: `2px solid ${selected ? "#FFD200" : "#666"}`,
          backgroundColor: selected ? "#FFD200" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {selected && <Check className="w-4 h-4" style={{ color: "#000" }} strokeWidth={3} />}
        </div>
      </button>
    );
  };

  const PlatformCard = ({ p }: { p: Platform }) => {
    const selected = selectedPlatforms.includes(platformKey(p));
    return (
      <button
        onClick={() => togglePlatform(p)}
        className="hover:opacity-90 transition-opacity"
        style={{
          width: "244px", height: "58px", borderRadius: "10px",
          backgroundColor: selected ? "#ffffff" : "#2D2C31",
          border: "2px solid transparent",
          display: "flex", alignItems: "center", padding: "0 14px", gap: "8px", cursor: "pointer",
        }}
        data-testid={`platform-${p.station}-${p.direction}`}
      >
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
          <span style={{ ...font, fontSize: "17px", fontWeight: 700, color: selected ? "#000" : "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.station}</span>
          <span style={{ ...font, fontSize: "11px", color: selected ? "#555" : "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.direction}</span>
        </div>
        <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
          {p.lines.map((l) => LINE_ICONS[l] ? (
            <img key={l} src={LINE_ICONS[l]} alt={l} style={{ width: "26px", height: "26px" }} />
          ) : (
            <span key={l} style={{ ...font, fontSize: "13px", fontWeight: 700, color: selected ? "#000" : "#fff" }}>{l}</span>
          ))}
        </div>
      </button>
    );
  };

  const GroupCard = ({ g }: { g: { id: string; lines: string[] } }) => {
    const selected = selectedGroups.includes(g.id);
    return (
      <button
        onClick={() => toggleGroup(g.id)}
        className="hover:opacity-90 transition-opacity"
        style={{
          width: "230px", height: "56px", borderRadius: "12px", backgroundColor: "#2D2C31",
          border: `2px solid ${selected ? "#FFD200" : "transparent"}`,
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", cursor: "pointer",
        }}
        data-testid={`group-${g.id}`}
      >
        {g.lines.map((l) => <img key={l} src={LINE_ICONS[l]} alt={l} style={{ width: "30px", height: "30px" }} />)}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] relative"
          style={{ width: "800px", height: "480px", overflow: "hidden" }}
        >
          {/* Back (hidden during config — that step has its own bottom Back) */}
          {step !== "configure" && (
            <div className="absolute top-[5px] left-[5px] z-10">
              <button className="block p-4" onClick={goBack}>
                <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
              </button>
            </div>
          )}

          {/* Config phase: "pizza tracker" of the selected modes instead of dots */}
          {step === "configure" && (
            <>
              <div className="absolute top-[8px] left-0 right-0 flex justify-center">
                <span style={{ ...font, fontSize: "16px", fontWeight: 700, color: "#ffffff" }}>moovmii Setup Progress</span>
              </div>
              <div style={{ position: "absolute", top: "36px", left: "16px", right: "16px", height: "32px", border: "1px solid #555", borderRadius: "999px", display: "flex", alignItems: "center", padding: "0 6px", gap: "2px" }}>
                {configModes.map((id, i) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    {i > 0 && <span style={{ ...font, fontSize: "13px", color: "#555", margin: "0 8px" }}>/</span>}
                    <span style={{
                      ...font, fontSize: "14px", fontWeight: 600,
                      color: i === configIndex ? "#000" : i < configIndex ? "#4ade80" : "#aaa",
                      backgroundColor: i === configIndex ? "#ffffff" : "transparent",
                      borderRadius: "999px", padding: i === configIndex ? "4px 16px" : "0",
                    }}>{MODE_SHORT[id]}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Progress dots (non-config steps) */}
          {step !== "configure" && (
          <div style={{ position: "absolute", top: "22px", left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
            {STEPS.map((s, i) => (
              <div key={s.id} style={{
                width: i === stepIndex ? "22px" : "8px", height: "8px", borderRadius: "999px",
                backgroundColor: i === stepIndex ? "#FFD200" : i < stepIndex ? "#4ade80" : "#3a3a3a",
                transition: "all 0.2s",
              }} />
            ))}
          </div>
          )}

          {/* ── LOCATION TYPE STEP ── */}
          {step === "location" && !otherEntry && (
            <>
              <div className="absolute top-[54px] left-0 right-0 flex justify-center">
                <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: "#ffffff" }}>Where will you display this moovmii?</span>
              </div>
              <div style={{ position: "absolute", top: "108px", left: 0, right: 0, bottom: "70px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                {LOCATION_OPTIONS.map(({ id, icon: Icon }) => {
                  const selected = locationType === id;
                  return (
                    <button
                      key={id}
                      onClick={() => selectLocation(id)}
                      className="hover:opacity-90 transition-opacity"
                      style={{
                        width: "360px", height: "52px", borderRadius: "999px",
                        backgroundColor: "#2D2C31",
                        border: `2px solid ${selected ? "#FFD200" : "transparent"}`,
                        display: "flex", alignItems: "center", padding: "0 20px", gap: "14px", cursor: "pointer",
                      }}
                      data-testid={`location-${id}`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: selected ? "#FFD200" : "#ffffff" }} />
                      <span style={{ ...font, fontSize: "16px", fontWeight: 600, color: "#ffffff", flex: 1, textAlign: "left" }}>
                        {id === "Other" && otherLabel ? otherLabel : id}
                      </span>
                      {/* Single-select indicator: filled square when chosen */}
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "5px", flexShrink: 0,
                        border: `2px solid ${selected ? "#FFD200" : "#666"}`,
                        backgroundColor: selected ? "#FFD200" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {selected && <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#000" }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── "OTHER" TEXT ENTRY (same step) ── */}
          {step === "location" && otherEntry && (
            <>
              <div className="absolute top-[54px] left-0 right-0 flex justify-center">
                <span style={{ ...font, fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>Describe your location</span>
              </div>
              <div style={{ position: "absolute", top: "92px", left: "170px", right: "170px", height: "44px", backgroundColor: "#2D2C31", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 14px" }}>
                <span style={{ ...font, fontSize: "15px", color: otherLabel ? "#fff" : "#555", flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
                  {otherLabel || "e.g. Lobby, Gym, Clinic"}
                  <span className="search-cursor" />
                </span>
                {otherLabel && (
                  <button onPointerDown={(e) => { e.preventDefault(); setOtherLabel(""); }} style={{ color: "#666", fontSize: "20px", lineHeight: 1, border: "none", background: "none", cursor: "pointer" }}>×</button>
                )}
              </div>
              <div style={{ position: "absolute", bottom: "64px", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <OnScreenKeyboard value={otherLabel} onChange={setOtherLabel} />
              </div>
            </>
          )}

          {/* ── ADDRESS STEP ── */}
          {step === "address" && (
            <>
              <div className="absolute top-[54px] left-0 right-0 flex justify-center px-6">
                <span style={{ ...font, fontSize: "21px", fontWeight: 700, color: "#ffffff", textAlign: "center" }}>{addressPrompt()}</span>
              </div>
              <div style={{ position: "absolute", top: "98px", left: "100px", right: "100px", height: "44px", backgroundColor: "#2D2C31", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                <span style={{ ...font, fontSize: "15px", color: addressQuery ? "#fff" : "#555", flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
                  {addressQuery || "Start typing an address..."}
                  <span className="search-cursor" />
                </span>
                {addressQuery && (
                  <button onPointerDown={(e) => { e.preventDefault(); setAddressQuery(""); setAddressSuggestions([]); }} style={{ color: "#666", fontSize: "20px", lineHeight: 1, border: "none", background: "none", cursor: "pointer" }}>×</button>
                )}
              </div>
              {addressSuggestions.length > 0 && (
                <div style={{ position: "absolute", top: "146px", left: "100px", right: "100px", zIndex: 20, display: "flex", flexDirection: "column", gap: "3px" }}>
                  {addressSuggestions.map((s, i) => (
                    <button key={i} onPointerDown={(e) => { e.preventDefault(); handleSelectAddress(s); }}
                      style={{ height: "36px", backgroundColor: "#3a3a3a", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 14px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Search className="w-3 h-3 flex-shrink-0" style={{ color: "#888" }} />
                      <span style={{ ...font, fontSize: "13px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                    </button>
                  ))}
                </div>
              )}
              <div style={{ position: "absolute", bottom: "64px", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                <OnScreenKeyboard value={addressQuery} onChange={(v) => { setAddressQuery(v); }} />
              </div>
            </>
          )}

          {/* ── TRANSPORTATION MODES STEP ── */}
          {step === "modes" && (
            <>
              <div className="absolute top-[50px] left-0 right-0 flex justify-center px-6">
                <span style={{ ...font, fontSize: "18px", fontWeight: 700, color: "#ffffff", textAlign: "center" }}>
                  What modes of transportation do you use from {modesBlank()}? Select all that apply.
                </span>
              </div>
              <div style={{ position: "absolute", top: "88px", left: 0, right: 0, display: "flex", justifyContent: "center", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {LEFT_MODES.map((m) => <ModePill key={m.id} m={m} />)}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                  {RIGHT_MODES.map((m) => <ModePill key={m.id} m={m} />)}
                </div>
              </div>
            </>
          )}

          {/* ── CONFIGURE STEP (per selected mode) ── */}
          {step === "configure" && (
            <>
              {/* Mode header */}
              <div className="absolute top-[78px] left-0 right-0 flex items-center justify-center gap-2">
                {currentConfigMode === "subway" && <TrainFront className="w-6 h-6" style={{ color: "#4d92fb" }} />}
                <span style={{ ...font, fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>{MODE_SHORT[currentConfigMode]} Setup</span>
              </div>

              {currentConfigMode === "subway" && !showManualAdd ? (
                <>
                  <div className="absolute top-[112px] left-0 right-0 flex justify-center">
                    <span style={{ ...font, fontSize: "17px", color: "#ddd" }}>Select platforms to add to your favorites</span>
                  </div>
                  <div style={{ position: "absolute", top: "148px", left: "24px", right: "24px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", justifyItems: "center" }}>
                    {SAMPLE_SUBWAY_PLATFORMS.map((p) => <PlatformCard key={platformKey(p)} p={p} />)}
                  </div>
                </>
              ) : currentConfigMode === "subway" && showManualAdd ? (
                <>
                  <div className="absolute top-[108px] left-0 right-0 flex justify-center px-6">
                    <span style={{ ...font, fontSize: "17px", color: "#ddd", textAlign: "center" }}>
                      What other subway lines do you use from {modesBlank()}? Select all that apply.
                    </span>
                  </div>
                  <div style={{ position: "absolute", top: "150px", left: 0, right: 0, display: "flex", justifyContent: "center" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 230px)", gap: "16px" }}>
                      {SUBWAY_GROUPS.map((g) => <GroupCard key={g.id} g={g} />)}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ position: "absolute", top: "120px", left: "20px", right: "20px", bottom: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ ...font, fontSize: "15px", color: "#555" }}>{MODE_SHORT[currentConfigMode]} setup — coming next</span>
                </div>
              )}

              {/* Config bottom bar: Back · Add additional · Continue */}
              <div className="absolute bottom-[16px] left-[20px]">
                <button onClick={configBack} className="rounded-[8px] hover:opacity-80 transition-opacity" style={{ height: "44px", padding: "0 22px", backgroundColor: "#2D2C31", border: "none", cursor: "pointer" }}>
                  <span style={{ ...font, fontSize: "15px", fontWeight: 600, color: "#fff" }}>Back</span>
                </button>
              </div>
              {currentConfigMode === "subway" && !showManualAdd && (
                <div className="absolute bottom-[16px] left-1/2 -translate-x-1/2">
                  <button
                    onClick={() => setShowManualAdd(true)}
                    className="rounded-[8px] hover:opacity-80 transition-opacity"
                    style={{ height: "44px", padding: "0 22px", backgroundColor: "#2D2C31", border: "none", cursor: "pointer" }}
                    data-testid="button-add-platforms"
                  >
                    <span style={{ ...font, fontSize: "14px", fontWeight: 600, color: "#ddd" }}>Add additional platforms to favorites</span>
                  </button>
                </div>
              )}
              <div className="absolute bottom-[16px] right-[20px]">
                <button onClick={configContinue} className="rounded-[8px] hover:opacity-80 transition-opacity" style={{ height: "44px", padding: "0 28px", backgroundColor: "#FFD200", border: "none", cursor: "pointer" }} data-testid="button-config-continue">
                  <span style={{ ...font, fontSize: "15px", fontWeight: 700, color: "#000" }}>Continue</span>
                </button>
              </div>
            </>
          )}

          {/* ── PLACEHOLDER STEP: layout (built next) ── */}
          {step === "layout" && (
            <>
              <div className="absolute top-[54px] left-0 right-0 flex flex-col items-center">
                <span style={{ ...font, fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", color: "#888", textTransform: "uppercase" }}>
                  Set Up · Step {stepIndex + 1} of {STEPS.length}
                </span>
                <span style={{ ...font, fontSize: "22px", fontWeight: 700, color: "#ffffff", marginTop: "4px" }}>{STEPS[stepIndex].label}</span>
              </div>
              <div style={{ position: "absolute", top: "120px", left: "20px", right: "20px", bottom: "70px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ ...font, fontSize: "15px", color: "#555" }}>Layout — coming next</span>
              </div>
            </>
          )}

          {/* Next / Finish — hidden during Other text entry and the config step (which has its own bar) */}
          {!(step === "location" && otherEntry) && step !== "configure" && (
            <div className="absolute bottom-[16px] right-[20px]">
              <button
                onClick={goNext}
                disabled={!canProceed}
                className="rounded-[8px] flex items-center justify-center transition-opacity"
                style={{ height: "44px", padding: "0 28px", backgroundColor: canProceed ? "#FFD200" : "#2D2C31", border: "none", cursor: canProceed ? "pointer" : "default", opacity: canProceed ? 1 : 0.5 }}
                data-testid="button-next"
              >
                <span style={{ ...font, fontSize: "15px", fontWeight: 700, color: canProceed ? "#000000" : "#666" }}>
                  {stepIndex < STEPS.length - 1 ? "Next" : "Finish"}
                </span>
              </button>
            </div>
          )}

          {/* During Other entry: a Done affordance to return to the list with the label set */}
          {step === "location" && otherEntry && (
            <div className="absolute bottom-[16px] right-[20px]">
              <button
                onClick={() => setOtherEntry(false)}
                disabled={otherLabel.trim().length === 0}
                className="rounded-[8px] flex items-center justify-center transition-opacity"
                style={{ height: "44px", padding: "0 28px", backgroundColor: otherLabel.trim() ? "#4ade80" : "#2D2C31", border: "none", cursor: otherLabel.trim() ? "pointer" : "default", opacity: otherLabel.trim() ? 1 : 0.5 }}
              >
                <span style={{ ...font, fontSize: "15px", fontWeight: 700, color: otherLabel.trim() ? "#000000" : "#666" }}>Done</span>
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
