import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "wouter";
import { Home, Briefcase, ShoppingBag, UtensilsCrossed, MoreHorizontal, Car, Search, Check, Plus, Minus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { LINE_ICONS, SUBWAY_LINE_ORDER } from "@/lib/lineIcons";
import { getNearestSubwayPlatforms, getLineStations, getLinesAtStop, getStopDirections, type SuggestedPlatform } from "@/lib/subwaySuggest";
import { getNearestPathPlatforms, getPathRouteStations, getPathRoutesAtStop, getPathStopDirections, pathDirLabel } from "@/lib/pathSuggest";
import { lineToColor, pathRouteOrder, pathRouteShort, pathRouteColors } from "@shared/stopMetadata";
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
// Short labels for the chevron "pizza tracker" (one chevron per selected mode).
const MODE_SHORT: Record<string, string> = {
  subway: "Subway", sir: "SIR", lirr: "LIRR", mnr: "Metro-North", nycbus: "NYC Bus",
  citibike: "Citibike", nycferry: "Ferry", path: "PATH", njt: "NJ Transit",
  njtbus: "NJT Bus", nywaterway: "NY Waterway", driving: "Driving",
};

type Step = "location" | "address" | "transit" | "subway" | "done";
type SubPhase = "suggest" | "lines" | "stations";
type StopCfg = { name: string; dirs: string[]; lines: string[] };

// Modes that have a config sub-flow (suggest → routes → stations) on the phone.
// Order here is the sequence modes are configured in.
const CONFIG_MODES = ["subway", "path"];

type RouteMeta = { id: string; label: string; color: string; icon?: string };
// A mode adapter lets the shared config screens render different transit modes.
type ModeAdapter = {
  title: string;
  getNearby: (lat: number, lon: number) => SuggestedPlatform[];
  routes: RouteMeta[];
  getRouteStations: (routeId: string) => { stopId: string; name: string }[];
  getRoutesAtStop: (stopId: string) => string[];
  getStopDirections: (stopId: string) => string[];
  dirLabelFor: (dir: string, routeId: string) => string;
  routeColor: (routeId: string) => string;
  routeIcon: (routeId: string) => string | undefined;
  routeMeta: (routeId: string) => RouteMeta;
};
const subwayAdapter = (): ModeAdapter => ({
  title: "Subway Setup",
  getNearby: (lat, lon) => getNearestSubwayPlatforms(lat, lon, 9),
  routes: SUBWAY_LINE_ORDER.map((l) => ({ id: l, label: l, color: lineToColor[l] || "#8a8a8a", icon: LINE_ICONS[l] })),
  getRouteStations: (line) => getLineStations(line),
  getRoutesAtStop: (stopId) => getLinesAtStop(stopId),
  getStopDirections: (stopId) => getStopDirections(stopId),
  dirLabelFor: (dir, line) => dirLabel(dir, line),
  routeColor: (line) => lineToColor[line] || "#8a8a8a",
  routeIcon: (line) => LINE_ICONS[line],
  routeMeta: (line) => ({ id: line, label: line, color: lineToColor[line] || "#8a8a8a", icon: LINE_ICONS[line] }),
});
const pathAdapter = (): ModeAdapter => ({
  title: "PATH Setup",
  getNearby: (lat, lon) => getNearestPathPlatforms(lat, lon, 8),
  routes: pathRouteOrder.map((rk) => ({ id: rk, label: pathRouteShort[rk] || rk, color: pathRouteColors[rk] || "#8a8a8a" })),
  getRouteStations: (rk) => getPathRouteStations(rk).map((name) => ({ stopId: name, name })),
  getRoutesAtStop: (name) => getPathRoutesAtStop(name),
  getStopDirections: (name) => getPathStopDirections(name),
  dirLabelFor: (dir) => pathDirLabel(dir as "Uptown" | "Downtown"),
  routeColor: (rk) => pathRouteColors[rk] || "#8a8a8a",
  routeIcon: () => undefined,
  routeMeta: (rk) => ({ id: rk, label: pathRouteShort[rk] || rk, color: pathRouteColors[rk] || "#8a8a8a" }),
});
const ADAPTERS: Record<string, () => ModeAdapter> = { subway: subwayAdapter, path: pathAdapter };

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

  // Per-mode config (subway, PATH, …)
  const [modeStep, setModeStep] = useState(0); // index into the selected config-capable modes
  const [subPhase, setSubPhase] = useState<SubPhase>("suggest");
  const [selectedLines, setSelectedLines] = useState<string[]>([]);
  const [lineStep, setLineStep] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null); // stopId
  const [cfg, setCfg] = useState<Record<string, StopCfg>>({}); // stopId -> selection (manual picker)
  const [suggestSel, setSuggestSel] = useState<Record<string, SuggestedPlatform>>({}); // suggestor: cardKey -> card
  const [addOther, setAddOther] = useState(false); // "Add other platforms" selected → Next goes to the lines picker

  const locWord = (locationType === "Other" ? otherLabel : locationType) || "space";

  // The selected modes that actually have a config flow, in configure order.
  const activeModes = MODES.filter((m) => modes.includes(m.id) && CONFIG_MODES.includes(m.id)).map((m) => m.id);
  const activeMode = activeModes[modeStep] ?? CONFIG_MODES[0];
  const adapter = useMemo(() => (ADAPTERS[activeMode] || subwayAdapter)(), [activeMode]);
  // Nearby suggestions are derived from the active mode + coords, so they're
  // always correct for the current mode (even after Back crosses mode boundaries).
  const realPlatforms = useMemo<SuggestedPlatform[] | null>(() => {
    if (step !== "subway") return null;
    if (!coords) return [];
    return adapter.getNearby(coords.lat, coords.lon);
  }, [step, adapter, coords?.lat, coords?.lon]);

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

  // ---- Browser back/forward sync ----
  // Map each flow step to a history entry so the phone's Back button (and the
  // in-app Back) walk through the setup steps — with selections kept in React
  // state — instead of leaving straight to the pairing screen. Back from the
  // first step pops out of the flow (exits to the pairing/code screen). Forward
  // re-advances.
  const navKey = step !== "subway"
    ? step
    : `subway:${modeStep}:${subPhase}${subPhase === "stations" ? `:${lineStep}` : ""}`;
  const popping = useRef(false);
  const prevNavKey = useRef(navKey);
  // Remember each mode's selected routes so Back/Forward across mode boundaries
  // restores the right ones (selectedLines is shared working state).
  const modeSnapshots = useRef<Record<number, string[]>>({});
  useEffect(() => { modeSnapshots.current[modeStep] = selectedLines; }, [modeStep, selectedLines]);

  // Tag the entry we arrived on so Back from step 1 restores "location".
  useEffect(() => {
    window.history.replaceState({ ...window.history.state, setupNav: "location" }, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push a new history entry on each forward move (skip moves caused by a pop).
  useEffect(() => {
    if (prevNavKey.current === navKey) return;
    prevNavKey.current = navKey;
    if (popping.current) { popping.current = false; return; }
    window.history.pushState({ ...window.history.state, setupNav: navKey }, "");
  }, [navKey]);

  // Restore the step a history entry points at when Back/Forward is pressed.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const key: string | undefined = e.state?.setupNav;
      if (!key) return; // popped out of the flow → let the router navigate away
      popping.current = true;
      setExpanded(null);
      if (key.startsWith("subway:")) {
        const [, ms, sp, ls] = key.split(":");
        const m = Number(ms) || 0;
        setStep("subway");
        setModeStep(m);
        setSubPhase(sp as SubPhase);
        setSelectedLines(modeSnapshots.current[m] || []);
        if (sp === "stations") setLineStep(Number(ls) || 0);
      } else {
        setStep(key as Step);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const saveOnboarding = async (patch: Record<string, any>) => {
    setSaving(true);
    try { await apiFetch(`/api/devices/${deviceUuid}/config`, { method: "PUT", body: JSON.stringify({ onboarding: patch }) }); }
    finally { setSaving(false); }
  };

  // ---- navigation ----
  // Reset the per-mode sub-flow to its first screen (suggestions if we have an
  // address, else straight to the route picker).
  const startMode = (c: { lat: number; lon: number } | null) => {
    setStep("subway");
    setAddOther(false);
    setSelectedLines([]);
    setLineStep(0);
    setExpanded(null);
    setSubPhase(c ? "suggest" : "lines");
  };
  const enterConfig = async () => {
    let c = coords;
    if (address.trim() && !c) {
      try { const r = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`); if (r.ok) { const j = await r.json(); if (j?.lat != null) { c = { lat: j.lat, lon: j.lon }; setCoords(c); } } } catch {}
    }
    await saveOnboarding({ locationType, otherLabel: locationType === "Other" ? otherLabel : null, address: address || null, lat: c?.lat ?? null, lon: c?.lon ?? null, modes });
    const seq = MODES.filter((m) => modes.includes(m.id) && CONFIG_MODES.includes(m.id)).map((m) => m.id);
    if (seq.length === 0) { finish(); return; }
    setModeStep(0);
    startMode(c);
  };
  // Finish the current mode: advance to the next selected mode, or complete setup.
  const advanceMode = () => {
    if (modeStep < activeModes.length - 1) {
      setModeStep(modeStep + 1);
      startMode(coords);
    } else {
      finish();
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
  // Lines require a direction: when the last direction is removed, drop the line
  // picks too (nothing can be saved without a direction anyway).
  const toggleDir = (stopId: string, name: string, dir: string) =>
    setStopCfg(stopId, name, (c) => {
      const dirs = c.dirs.includes(dir) ? c.dirs.filter((d) => d !== dir) : [...c.dirs, dir];
      return { ...c, dirs, lines: dirs.length === 0 ? [] : c.lines };
    });
  // Single-line station: toggling a direction also pins that lone line, so the
  // (direction × line) favorite forms without the user clicking the line.
  const pickDirSole = (stopId: string, name: string, dir: string, soleLine: string) =>
    setStopCfg(stopId, name, (c) => {
      const dirs = c.dirs.includes(dir) ? c.dirs.filter((d) => d !== dir) : [...c.dirs, dir];
      const lines = dirs.length === 0 ? [] : (c.lines.includes(soleLine) ? c.lines : [...c.lines, soleLine]);
      return { ...c, dirs, lines };
    });
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
    // pre-select this mode's routes already chosen via suggestions / manual picks
    const pre = new Set<string>();
    for (const card of Object.values(suggestSel)) card.lines.forEach((l) => pre.add(l));
    for (const sc of Object.values(cfg)) sc.lines.forEach((l) => pre.add(l));
    setSelectedLines(adapter.routes.map((r) => r.id).filter((l) => pre.has(l)));
    setSubPhase("lines");
  };

  if (notFound) return <Centered>Device not found.</Centered>;
  if (!loaded) return <Centered>Loading…</Centered>;

  const curLine = selectedLines[lineStep];

  // Chevron "pizza tracker": one chevron per selected transit mode, in flow order.
  // The active mode is highlighted; modes without a config screen yet are shown
  // as placeholders and skipped during sequencing.
  const configModes = MODES.filter((m) => modes.includes(m.id)).map((m) => m.id);
  const configIndex = configModes.indexOf(activeMode); // current mode being configured

  return (
    <div style={{ ...font, height: "100svh", backgroundColor: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "center", paddingTop: "20px" }}>
        <img src={moovmiiLogo} alt="moovmii" style={{ height: step === "subway" ? "18px" : "22px", width: "auto" }} />
      </div>

      {/* Domino's-style 2D chevron tracker: equal widths, white = current+completed */}
      {step === "subway" && configModes.length > 0 && (
        <div style={{ padding: "8px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "stretch", gap: "3px", height: "26px" }}>
            {configModes.map((id, i) => {
              const done = i <= configIndex;
              const first = i === 0;
              const last = i === configModes.length - 1;
              const CH = 10;
              const clip = configModes.length === 1
                ? undefined
                : first
                  ? `polygon(0 0, calc(100% - ${CH}px) 0, 100% 50%, calc(100% - ${CH}px) 100%, 0 100%)`
                  : last
                    ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${CH}px 50%)`
                    : `polygon(0 0, calc(100% - ${CH}px) 0, 100% 50%, calc(100% - ${CH}px) 100%, 0 100%, ${CH}px 50%)`;
              return (
                <div key={id} style={{
                  flex: 1, minWidth: 0, clipPath: clip,
                  backgroundColor: done ? "#ffffff" : "#2D2C31",
                  borderRadius: configModes.length === 1 ? "6px" : "0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{
                    ...font, fontSize: "11px", fontWeight: 700, letterSpacing: "0.2px", textTransform: "uppercase",
                    color: done ? "#000" : "#888",
                    paddingLeft: first ? "0" : `${CH}px`, paddingRight: last ? "0" : `${CH}px`,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>{MODE_SHORT[id] || id}</span>
                </div>
              );
            })}
          </div>
          <div style={{ height: "1px", backgroundColor: "#333", marginTop: "10px" }} />
        </div>
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
          <StepBody title={adapter.title} subtitle="We recommend these stations based on your location">
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
                      <RouteBadges adapter={adapter} routes={p.lines} />
                    </button>
                  );
                })}
              {/* Selecting this doesn't navigate; it makes the bottom button become "Next" → lines picker. */}
              <button onClick={() => setAddOther((v) => !v)} style={{ ...rowStyle(addOther, 56), justifyContent: "center", color: addOther ? "#fff" : "#ddd" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>Add other platforms to main screen</span>
              </button>
            </div>
          </StepBody>
        )}

        {step === "subway" && subPhase === "lines" && (
          <StepBody title={adapter.title} subtitle="Which lines do you use? Lines from previous screens are selected.">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center", overflowY: "auto" }}>
              {adapter.routes.map((r) => (
                <RouteButton key={r.id} meta={r} on={selectedLines.includes(r.id)} size={58}
                  onClick={() => setSelectedLines((x) => x.includes(r.id) ? x.filter((i) => i !== r.id) : [...x, r.id])} />
              ))}
            </div>
          </StepBody>
        )}

        {step === "subway" && subPhase === "stations" && curLine && (
          <StepBody title={adapter.title} subtitleNode={<><span>Select platform for</span><RouteInline meta={adapter.routeMeta(curLine)} /></>}>
            <div className="show-scrollbar" style={{ overflowY: "auto", flex: 1, minHeight: 0, paddingLeft: "4px" }}>
              {adapter.getRouteStations(curLine).map((st) => {
                const isOpen = expanded === st.stopId;
                const configured = stopConfigured(st.stopId);
                const dirs = adapter.getStopDirections(st.stopId);
                const linesHere = adapter.getRoutesAtStop(st.stopId);
                const singleLine = linesHere.length === 1;
                const hasDir = (cfg[st.stopId]?.dirs.length ?? 0) > 0; // lines are pickable only with a direction
                return (
                  <div key={st.stopId} style={{ display: "flex", gap: "12px" }}>
                    {/* line diagram rail: gray bars, dot in the line's color.
                        Fixed top segment keeps the dot aligned to the station
                        name; the flex bottom bar runs continuously down through
                        the expanded options. */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "14px", flexShrink: 0 }}>
                      <div style={{ width: "2px", height: "13px", backgroundColor: "#3a3a3a" }} />
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: adapter.routeColor(curLine) }} />
                      <div style={{ width: "2px", flex: 1, backgroundColor: "#3a3a3a" }} />
                    </div>
                    <div style={{ flex: 1, paddingBottom: "6px" }}>
                      <button onClick={() => setExpanded(isOpen ? null : st.stopId)}
                        style={{ ...font, width: "100%", display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: "9px 0", color: configured ? YELLOW : "#fff" }}>
                        {/* Name sizes to its content (no flex:1) so the chevron sits right after
                            the text instead of at the far edge, clear of the scroll line. */}
                        <span style={{ fontSize: "15px", fontWeight: configured ? 700 : 500, textAlign: "left" }}>{st.name}</span>
                        {/* Chevron only for globally-selected (configured) platforms; blank otherwise. Row stays tappable. */}
                        {configured ? (isOpen ? <Minus className="w-4 h-4" style={{ flexShrink: 0 }} /> : <Plus className="w-4 h-4" style={{ flexShrink: 0 }} />) : null}
                      </button>
                      {isOpen && (
                        <div style={{ paddingBottom: "10px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {dirs.map((d) => {
                              const on = cfg[st.stopId]?.dirs.includes(d);
                              return <Pill key={d} on={!!on} label={adapter.dirLabelFor(d, curLine)}
                                onClick={() => (singleLine ? pickDirSole(st.stopId, st.name, d, linesHere[0]) : toggleDir(st.stopId, st.name, d))} />;
                            })}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            {linesHere.map((l) => {
                              // Routes are only pickable once a direction is chosen. Without one they're
                              // dimmed & disabled. A lone route is locked (follows the direction pills).
                              const on = singleLine ? hasDir : !!(hasDir && cfg[st.stopId]?.lines.includes(l));
                              const disabled = !hasDir;
                              const locked = singleLine;
                              return (
                                <RouteButton key={l} meta={adapter.routeMeta(l)} on={on} size={42} disabled={disabled} locked={locked}
                                  onClick={() => toggleLine(st.stopId, st.name, l)} />
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

  // Go back through the browser history so the in-app Back and the phone's
  // hardware/browser Back behave identically (popstate restores the prior step).
  function back() {
    window.history.back();
  }
  function next() {
    if (step === "location") setStep("address");
    else if (step === "address") setStep("transit");
    else if (step === "transit") enterConfig();
    else if (step === "subway") {
      if (subPhase === "suggest") { if (addOther) goToLines(); else advanceMode(); }
      else if (subPhase === "lines") { if (selectedLines.length) { setLineStep(0); setExpanded(null); setSubPhase("stations"); } }
      else if (subPhase === "stations") { if (lineStep < selectedLines.length - 1) { setLineStep(lineStep + 1); setExpanded(null); } else advanceMode(); }
    }
  }
  function nextLabel() {
    if (step !== "subway") return "Next";
    const isLastMode = modeStep >= activeModes.length - 1;
    const endsMode =
      (subPhase === "suggest" && !addOther) ||
      (subPhase === "stations" && lineStep >= selectedLines.length - 1);
    return endsMode && isLastMode ? "Finish" : "Next";
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
// A selectable route: a subway bullet icon, or a colored chip (PATH etc.).
function RouteButton({ meta, on, size, disabled, locked, onClick }: { meta: RouteMeta; on: boolean; size: number; disabled?: boolean; locked?: boolean; onClick: () => void }) {
  const inert = disabled || locked;
  const common: React.CSSProperties = {
    border: `2px solid ${on ? YELLOW : "transparent"}`, borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: inert ? "default" : "pointer", opacity: disabled ? 0.3 : (on ? 1 : 0.55),
  };
  if (meta.icon) {
    return (
      <button disabled={disabled} onClick={inert ? undefined : onClick}
        style={{ ...common, width: `${size}px`, height: `${size}px`, backgroundColor: "#1c1c1f" }}>
        <img src={meta.icon} alt={meta.label} style={{ width: `${Math.round(size * 0.66)}px`, height: `${Math.round(size * 0.66)}px` }} />
      </button>
    );
  }
  return (
    <button disabled={disabled} onClick={inert ? undefined : onClick}
      style={{ ...common, height: `${size}px`, padding: "0 14px", backgroundColor: meta.color }}>
      <span style={{ ...font, color: "#fff", fontWeight: 700, fontSize: "12px", whiteSpace: "nowrap", letterSpacing: "0.3px" }}>{meta.label}</span>
    </button>
  );
}
// Small route indicators shown on a suggestion card.
function RouteBadges({ adapter, routes }: { adapter: ModeAdapter; routes: string[] }) {
  return (
    <div style={{ display: "flex", gap: "4px", flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end", maxWidth: "48%" }}>
      {routes.map((r) => {
        const m = adapter.routeMeta(r);
        return m.icon
          ? <img key={r} src={m.icon} alt={m.label} style={{ width: "26px", height: "26px" }} />
          : <span key={r} style={{ ...font, backgroundColor: m.color, color: "#fff", fontWeight: 700, fontSize: "10px", borderRadius: "6px", padding: "3px 6px", whiteSpace: "nowrap" }}>{m.label}</span>;
      })}
    </div>
  );
}
// Inline route badge used in a subtitle.
function RouteInline({ meta }: { meta: RouteMeta }) {
  return meta.icon
    ? <img src={meta.icon} alt={meta.label} style={{ width: "22px", height: "22px", verticalAlign: "middle", margin: "0 2px" }} />
    : <span style={{ ...font, backgroundColor: meta.color, color: "#fff", fontWeight: 700, fontSize: "12px", borderRadius: "6px", padding: "2px 8px", margin: "0 2px" }}>{meta.label}</span>;
}
function Pill({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{ ...font, height: "38px", padding: "0 16px", borderRadius: "10px", backgroundColor: on ? YELLOW : "#1c1c1f", color: on ? "#000" : "#ccc", border: `2px solid ${on ? YELLOW : "#2d2d31"}`, cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>{label}</button>
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
