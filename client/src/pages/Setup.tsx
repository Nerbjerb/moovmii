import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Home, Briefcase, ShoppingBag, UtensilsCrossed, MoreHorizontal, Car, Search, Check, Plus, Minus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LINE_ICONS, SUBWAY_LINE_ORDER } from "@/lib/lineIcons";
import { getNearestSubwayPlatforms, getLineStations, getLinesAtStop, getStopDirections, type SuggestedPlatform } from "@/lib/subwaySuggest";
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
const YELLOW = "#ffffff";
const INOUT = new Set(["7", "L", "J", "Z"]);
const dirLabel = (dir: string, line: string) =>
  INOUT.has(line) ? (dir === "Uptown" ? "Outbound" : "Inbound") : dir;

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
type SubPhase = "suggest" | "lines" | "stations";
type StopCfg = { name: string; dirs: string[]; lines: string[] };

export default function Setup() {
  const params = useParams();
  const deviceUuid = (params as Record<string, string>).id;

  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("location");
  const [saving, setSaving] = useState(false);

  const [locationType, setLocationType] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>([]);

  // Subway setup
  const [subPhase, setSubPhase] = useState<SubPhase>("suggest");
  const [realPlatforms, setRealPlatforms] = useState<SuggestedPlatform[] | null>(null);
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [lineStep, setLineStep] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null); // stopId
  const [cfg, setCfg] = useState<Record<string, StopCfg>>({}); // stopId -> selection (manual picker)
  const [suggestSel, setSuggestSel] = useState<Record<string, SuggestedPlatform>>({}); // suggestor: cardKey -> card

  const locWord = (locationType === "Other" ? otherLabel : locationType) || "space";

  useEffect(() => {
    apiFetch(`/api/devices/${deviceUuid}/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((c) => {
        const o = c?.onboarding;
        if (o) {
          setLocationType(o.locationType ?? ""); setOtherLabel(o.otherLabel ?? "");
          setAddress(o.address ?? ""); setModes(Array.isArray(o.modes) ? o.modes : []);
          if (o.lat != null && o.lon != null) setCoords({ lat: o.lat, lon: o.lon });
        }
        setLoaded(true);
      })
      .catch(() => setNotFound(true));
  }, [deviceUuid]);

  useEffect(() => {
    if (step !== "address" || address.trim().length < 3) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/driving/autocomplete?input=${encodeURIComponent(address)}`);
        const j = await r.json();
        const list = Array.isArray(j) ? j : (j?.predictions ?? []);
        setSuggestions(
          list.slice(0, 4)
            .map((p: any) => (typeof p === "string" ? p : p?.description ?? p?.label ?? ""))
            .filter((s: string) => !!s)
        );
      } catch { setSuggestions([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [address, step]);

  const saveOnboarding = async (patch: Record<string, any>) => {
    setSaving(true);
    try { await apiFetch(`/api/devices/${deviceUuid}/config`, { method: "PUT", body: JSON.stringify({ onboarding: patch }) }); }
    finally { setSaving(false); }
  };

  // ---- navigation ----
  const enterSubway = async () => {
    let c = coords;
    if (address.trim() && !c) {
      try { const r = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`); if (r.ok) { const j = await r.json(); if (j?.lat != null) { c = { lat: j.lat, lon: j.lon }; setCoords(c); } } } catch {}
    }
    await saveOnboarding({ locationType, otherLabel: locationType === "Other" ? otherLabel : null, address: address || null, lat: c?.lat ?? null, lon: c?.lon ?? null, modes });
    if (!modes.includes("subway")) { finish(); return; }
    setStep("subway");
    if (c) {
      const plats = getNearestSubwayPlatforms(c.lat, c.lon, 9);
      setRealPlatforms(plats);
      setSubPhase("suggest");
    } else {
      setRealPlatforms([]);
      setSubPhase("lines");
    }
  };

  const buildFavorites = () => {
    const seen = new Set<string>();
    const favs: { line: string; stop: string; direction: string }[] = [];
    const add = (line: string, stop: string, direction: string) => {
      const k = `${line}|${stop}|${direction}`;
      if (seen.has(k)) return;
      seen.add(k);
      favs.push({ line, stop, direction });
    };
    // Suggested cards: each card is one (station, direction, color group). Keep
    // its lines paired to that card's own direction — never cross-product across
    // cards, or picking red-uptown + green-downtown would also produce
    // red-downtown + green-uptown.
    for (const card of Object.values(suggestSel))
      for (const line of card.lines) add(line, card.station, card.direction);
    // Manual station picker: the chosen dirs × lines per station is intended.
    for (const sc of Object.values(cfg))
      for (const dir of sc.dirs) for (const line of sc.lines) add(line, sc.name, dir);
    return favs;
  };

  const finish = async () => {
    const favorites = buildFavorites();
    const preferences = favorites.slice(0, 2).map((f, i) => ({ row: i + 1, ...f }));
    setSaving(true);
    try {
      await apiFetch(`/api/devices/${deviceUuid}/config`, {
        method: "PUT",
        body: JSON.stringify({ favorites, preferences, onboarding: { completedAt: new Date().toISOString() } }),
      });
    } finally { setSaving(false); setStep("done"); }
  };

  // ---- selection helpers ----
  const setStopCfg = (stopId: string, name: string, fn: (c: StopCfg) => StopCfg) =>
    setCfg((prev) => {
      const cur = prev[stopId] ?? { name, dirs: [], lines: [] };
      const next = fn({ ...cur, dirs: [...cur.dirs], lines: [...cur.lines], name });
      return { ...prev, [stopId]: next };
    });
  const toggleDir = (stopId: string, name: string, dir: string) =>
    setStopCfg(stopId, name, (c) => ({ ...c, dirs: c.dirs.includes(dir) ? c.dirs.filter((d) => d !== dir) : [...c.dirs, dir] }));
  const toggleLine = (stopId: string, name: string, line: string) =>
    setStopCfg(stopId, name, (c) => ({ ...c, lines: c.lines.includes(line) ? c.lines.filter((l) => l !== line) : [...c.lines, line] }));
  // Each suggested card toggles independently by its unique key
  // (stopId|colorGroup|direction), so selecting one never flips another that
  // happens to share the same station.
  const toggleSuggestion = (p: SuggestedPlatform) =>
    setSuggestSel((prev) => {
      const next = { ...prev };
      if (next[p.key]) delete next[p.key];
      else next[p.key] = p;
      return next;
    });
  const stopConfigured = (stopId: string) => !!cfg[stopId] && cfg[stopId].dirs.length > 0 && cfg[stopId].lines.length > 0;

  const goToLines = () => {
    // pre-select lines already chosen via suggestions
    const pre = new Set<string>();
    for (const card of Object.values(suggestSel)) card.lines.forEach((l) => pre.add(l));
    for (const sc of Object.values(cfg)) sc.lines.forEach((l) => pre.add(l));
    setSelectedLines(SUBWAY_LINE_ORDER.filter((l) => pre.has(l)));
    setSubPhase("lines");
  };

  if (notFound) return <Centered>Device not found.</Centered>;
  if (!loaded) return <Centered>Loading…</Centered>;

  const curLine = selectedLines[lineStep];
  // "Add other platforms" highlights once the manual picker has produced any
  // configured platform, so it reads as selected when you return to this screen.
  const hasOtherPlatforms = Object.keys(cfg).some((id) => stopConfigured(id));

  return (
    <div style={{ ...font, height: "100svh", backgroundColor: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
        <img src={moovmiiLogo} alt="moovmii" style={{ height: step === "subway" ? "18px" : "22px", width: "auto" }} />
      </div>

      {step === "subway" && (
        <div style={{ textAlign: "center", marginTop: "6px", fontSize: "11px", color: "#888", letterSpacing: "0.03em" }}>Setup Progress</div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 22px 22px", minHeight: 0 }}>
        {step === "location" && (
          <StepBody title="Where will you display this device?">
            <div style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
              {LOCATION_OPTIONS.map(({ id, icon: Icon }) => {
                const selected = locationType === id;
                return (
                  <div key={id}>
                    <button onClick={() => setLocationType(id)} style={rowStyle(selected)}>
                      <Icon className="w-5 h-5" style={{ color: selected ? YELLOW : "#fff" }} />
                      <span style={{ fontSize: "16px", fontWeight: 600, flex: 1, textAlign: "left" }}>{id === "Other" && otherLabel ? otherLabel : id}</span>
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
                  <button key={m.id} onClick={() => setModes((x) => x.includes(m.id) ? x.filter((i) => i !== m.id) : [...x, m.id])} style={rowStyle(selected, 52)}>
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

        {step === "subway" && subPhase === "suggest" && (
          <StepBody title="Subway Setup" subtitle="We recommend these stations based on your location">
            <div style={{ display: "flex", flexDirection: "column", gap: "9px", overflowY: "auto" }}>
              {realPlatforms === null ? <Dim>Finding nearby platforms…</Dim> : realPlatforms.length === 0 ? <Dim>No suggestions — add platforms below.</Dim> :
                realPlatforms.map((p) => {
                  const on = !!suggestSel[p.key];
                  return (
                    <button key={p.key} onClick={() => toggleSuggestion(p)} style={rowStyle(!!on, 60)}>
                      <div style={{ flex: 1, textAlign: "left", minWidth: 0 }}>
                        <div style={{ fontSize: "15px", fontWeight: 700 }}>{p.station}</div>
                        <div style={{ fontSize: "12px", color: on ? "#555" : "#999" }}>{p.directionLabel}</div>
                      </div>
                      <LineBullets lines={p.lines} />
                    </button>
                  );
                })}
              <button onClick={goToLines} style={{ ...rowStyle(hasOtherPlatforms, 56), justifyContent: "center", color: hasOtherPlatforms ? "#fff" : "#ddd" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Add other platforms to main screen</span>
              </button>
            </div>
          </StepBody>
        )}

        {step === "subway" && subPhase === "lines" && (
          <StepBody title="Subway Setup" subtitle="Which lines do you use? Lines from previous screens are selected.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", justifyItems: "center" }}>
              {SUBWAY_LINE_ORDER.map((l) => {
                const sel = selectedLines.includes(l);
                return (
                  <button key={l} onClick={() => setSelectedLines((x) => x.includes(l) ? x.filter((i) => i !== l) : [...x, l])}
                    style={{ width: "58px", height: "58px", borderRadius: "12px", backgroundColor: "#1c1c1f", border: `2px solid ${sel ? YELLOW : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: sel ? 1 : 0.55 }}>
                    {LINE_ICONS[l] ? <img src={LINE_ICONS[l]} alt={l} style={{ width: "38px", height: "38px" }} /> : <span style={{ ...font, color: "#fff" }}>{l}</span>}
                  </button>
                );
              })}
            </div>
          </StepBody>
        )}

        {step === "subway" && subPhase === "stations" && curLine && (
          <StepBody title="Subway Setup" subtitleNode={<><span>Select platform for</span><InlineBullet line={curLine} /></>}>
            <div className="show-scrollbar" style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingLeft: "4px" }}>
              {getLineStations(curLine).map((st) => {
                const isOpen = expanded === st.stopId;
                const configured = stopConfigured(st.stopId);
                const dirs = getStopDirections(st.stopId);
                const linesHere = getLinesAtStop(st.stopId);
                return (
                  <div key={st.stopId} style={{ display: "flex", gap: "12px" }}>
                    {/* line diagram rail */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "14px", flexShrink: 0 }}>
                      <div style={{ width: "2px", flex: 1, backgroundColor: "#3a3a3a" }} />
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: configured ? YELLOW : "#8a8a8a", margin: "2px 0" }} />
                      <div style={{ width: "2px", flex: 1, backgroundColor: "#3a3a3a" }} />
                    </div>
                    <div style={{ flex: 1, paddingBottom: "6px" }}>
                      <button onClick={() => setExpanded(isOpen ? null : st.stopId)}
                        style={{ ...font, width: "100%", display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "9px 0", color: configured ? YELLOW : "#fff" }}>
                        <span style={{ fontSize: "15px", fontWeight: configured ? 700 : 500, flex: 1, textAlign: "left" }}>{st.name}</span>
                        {/* Chevron only for globally-selected (configured) platforms; blank otherwise. Row stays tappable. */}
                        {configured ? (isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />) : null}
                      </button>
                      {isOpen && (
                        <div style={{ paddingBottom: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {dirs.map((d) => {
                              const on = cfg[st.stopId]?.dirs.includes(d);
                              return <Pill key={d} on={!!on} label={dirLabel(d, curLine)} onClick={() => toggleDir(st.stopId, st.name, d)} />;
                            })}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {linesHere.map((l) => {
                              const on = cfg[st.stopId]?.lines.includes(l);
                              return (
                                <button key={l} onClick={() => toggleLine(st.stopId, st.name, l)}
                                  style={{ width: "42px", height: "42px", borderRadius: "10px", backgroundColor: "#1c1c1f", border: `2px solid ${on ? YELLOW : "transparent"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: on ? 1 : 0.5 }}>
                                  {LINE_ICONS[l] ? <img src={LINE_ICONS[l]} alt={l} style={{ width: "28px", height: "28px" }} /> : l}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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

        {step !== "done" && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
            <button onClick={back} style={{ ...font, visibility: step === "location" ? "hidden" : "visible", background: "none", border: "none", color: "#9a9a9a", fontSize: "16px", fontWeight: 600, cursor: "pointer", padding: "10px 4px" }}>Back</button>
            <NextButton disabled={nextDisabled()} label={nextLabel()} onClick={next} />
          </div>
        )}
      </div>
    </div>
  );

  function back() {
    if (step === "address") setStep("location");
    else if (step === "transit") setStep("address");
    else if (step === "subway") {
      if (subPhase === "suggest") setStep("transit");
      else if (subPhase === "lines") setSubPhase(realPlatforms && realPlatforms.length ? "suggest" : "suggest");
      else if (subPhase === "stations") { if (lineStep > 0) setLineStep(lineStep - 1); else setSubPhase("lines"); setExpanded(null); }
    }
  }
  function next() {
    if (step === "location") setStep("address");
    else if (step === "address") setStep("transit");
    else if (step === "transit") enterSubway();
    else if (step === "subway") {
      if (subPhase === "suggest") finish();
      else if (subPhase === "lines") { if (selectedLines.length) { setLineStep(0); setExpanded(null); setSubPhase("stations"); } }
      else if (subPhase === "stations") { if (lineStep < selectedLines.length - 1) { setLineStep(lineStep + 1); setExpanded(null); } else finish(); }
    }
  }
  function nextLabel() {
    if (step === "subway" && subPhase === "stations" && lineStep >= selectedLines.length - 1) return "Finish";
    if (step === "subway" && subPhase === "suggest") return "Finish";
    return "Next";
  }
  function nextDisabled() {
    if (saving) return true;
    if (step === "location") return !locationType;
    if (step === "transit") return modes.length === 0;
    if (step === "subway" && subPhase === "lines") return selectedLines.length === 0;
    return false;
  }
}

// --- small components / helpers ---
function rowStyle(selected: boolean, h = 54): React.CSSProperties {
  return { ...font, width: "100%", minHeight: `${h}px`, borderRadius: "14px", backgroundColor: selected ? "#2a2a2e" : "#1c1c1f", border: `2px solid ${selected ? YELLOW : "transparent"}`, display: "flex", alignItems: "center", gap: "14px", padding: "0 16px", cursor: "pointer", color: "#fff" };
}
function LineBullets({ lines }: { lines: string[] }) {
  return <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>{lines.map((l) => LINE_ICONS[l] && <img key={l} src={LINE_ICONS[l]} alt={l} style={{ width: "26px", height: "26px" }} />)}</div>;
}
function InlineBullet({ line }: { line: string }) {
  return LINE_ICONS[line] ? <img src={LINE_ICONS[line]} alt={line} style={{ width: "22px", height: "22px", verticalAlign: "middle", margin: "0 2px" }} /> : <span>{line}</span>;
}
function Pill({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...font, height: "38px", padding: "0 16px", borderRadius: "999px", backgroundColor: on ? YELLOW : "#1c1c1f", color: on ? "#000" : "#ccc", border: `2px solid ${on ? YELLOW : "#2d2d31"}`, cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>{label}</button>
  );
}
function StepBody({ title, subtitle, subtitleNode, children }: { title: string; subtitle?: string; subtitleNode?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", paddingTop: "22px", minHeight: 0 }}>
      <h1 style={{ ...font, fontSize: "22px", fontWeight: 700, lineHeight: 1.3, margin: "0 0 10px", textAlign: subtitle || subtitleNode ? "center" : "left" }}>{title}</h1>
      {(subtitle || subtitleNode) && <div style={{ ...font, fontSize: "15px", color: "#bdbdbd", margin: "0 0 18px", lineHeight: 1.35, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", flexWrap: "wrap", textAlign: "center" }}>{subtitleNode ?? subtitle}</div>}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>{children}</div>
    </div>
  );
}
function NextButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return <button onClick={onClick} disabled={disabled} style={{ ...font, height: "48px", padding: "0 30px", borderRadius: "12px", backgroundColor: disabled ? "#2d2d31" : YELLOW, color: disabled ? "#777" : "#000", border: "none", cursor: disabled ? "default" : "pointer", fontSize: "16px", fontWeight: 700 }}>{label}</button>;
}
function Dim({ children }: { children: React.ReactNode }) {
  return <div style={{ ...font, color: "#777", fontSize: "14px", padding: "20px 0", textAlign: "center" }}>{children}</div>;
}
function Centered({ children }: { children: React.ReactNode }) {
  return <div style={{ ...font, minHeight: "100vh", backgroundColor: "#0b0b0b", color: "#9a9a9a", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>;
}
