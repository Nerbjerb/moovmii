import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Home, MapPin, Search, Pencil, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getDeviceId } from "@/lib/deviceId";
import { savePreference, getPreferences } from "@/lib/localStorageDB";
import {
  type DrivingLocation,
  getDrivingLocations,
  saveDrivingLocations,
  upsertDrivingLocation,
  deleteDrivingLocation,
  newLocationId,
} from "@/lib/drivingLocations";
import { pressFlash } from "@/lib/pressFlash";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

type View = "library" | "nickname" | "address" | "pairFrom" | "pairTo" | "slotPicker";

export interface DrivingSlot {
  origin: string;
  destination: string;
  originName?: string;
  destName?: string;
}

const NICKNAME_PRESETS = ["Home", "Work", "Gym", "School"];

const QWERTY = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];
const NUMS = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["-","/","&","@",".","," ,"?","!","'","#"],
];

const KW = 71; const KH = 34; const KG = 5; const KWide = 111;

export default function DrivingSettings() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const editRow = parseInt(new URLSearchParams(searchString).get("editRow") || "1", 10);
  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);
  const deviceId = getDeviceId();

  // Saved locations library. Legacy slot addresses (from before the library
  // existed) are auto-converted into entries named by their address — they keep
  // working, and get real nicknames when the user renames them here.
  const [locations, setLocations] = useState<DrivingLocation[]>(() => {
    let locs = getDrivingLocations(deviceId);
    const prefs = getPreferences(deviceId);
    for (const p of prefs) {
      if (p.line !== "DRIVING") continue;
      try {
        const legacySlots: (DrivingSlot | null)[] = JSON.parse(p.stop).slots ?? [];
        for (const slot of legacySlots) {
          if (!slot) continue;
          for (const addr of [slot.origin, slot.destination]) {
            if (addr && !locs.some((l) => l.address === addr)) {
              locs = [...locs, { id: newLocationId(), name: addr, address: addr }];
            }
          }
        }
      } catch {}
    }
    saveDrivingLocations(locs, deviceId);
    return locs;
  });

  const [slots, setSlots] = useState<(DrivingSlot | null)[]>(() => {
    const prefs = getPreferences(deviceId);
    const rowPref = prefs.find((p) => p.row === editRow);
    if (rowPref?.line === "DRIVING") {
      try { return JSON.parse(rowPref.stop).slots ?? [null, null, null]; } catch {}
    }
    return [null, null, null];
  });

  const [view, setView] = useState<View>("library");
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [pendingAddress, setPendingAddress] = useState("");
  const [pendingFrom, setPendingFrom] = useState<DrivingLocation | null>(null);
  const [pendingTo, setPendingTo] = useState<DrivingLocation | null>(null);
  const [query, setQuery] = useState("");
  const [isNumMode, setIsNumMode] = useState(false);
  const [isShift, setIsShift] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectionMade = useRef(false);

  const isTypingView = view === "nickname" || view === "address";

  // Fetch autocomplete suggestions as user types an address
  useEffect(() => {
    if (view !== "address") return;
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (selectionMade.current) { selectionMade.current = false; return; }
    if (query.trim().length < 2) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/driving/autocomplete?input=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions((data.predictions || []).map((p: any) => p.description).slice(0, 4));
      } catch { setSuggestions([]); }
    }, 350);
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, [query, view]);

  const handleKey = (key: string) => {
    if (key === "⌫") setQuery((q) => q.slice(0, -1));
    else if (key === "SPACE") setQuery((q) => q + " ");
    else if (key === "123") setIsNumMode(true);
    else if (key === "ABC") setIsNumMode(false);
    else setQuery((q) => q + key);
    setSuggestions([]);
  };

  // On-screen letters honor shift; shift is single-shot like a phone keyboard
  const handleLetter = (k: string) => {
    handleKey(isShift ? k : k.toLowerCase());
    if (isShift) setIsShift(false);
  };

  // Fresh entry fields start capitalized
  useEffect(() => {
    if (isTypingView) setIsShift(true);
  }, [view]);

  useEffect(() => {
    if (!isTypingView) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") { e.preventDefault(); handleKey("⌫"); }
      else if (e.key === " ") { e.preventDefault(); handleKey("SPACE"); }
      else if (e.key === "Enter") { /* handled by Next button */ }
      else if (e.key.length === 1) { handleKey(e.key); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTypingView, handleKey]);

  const handleSelectSuggestion = (s: string) => {
    selectionMade.current = true;
    setQuery(s);
    setSuggestions([]);
  };

  const handleNext = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (view === "address") {
      setPendingAddress(trimmed);
      setQuery("");
      setSuggestions([]);
      setView("nickname");
    } else if (view === "nickname") {
      if (editingLocId) {
        // Renaming an existing place
        const loc = locations.find((l) => l.id === editingLocId);
        if (loc) setLocations(upsertDrivingLocation({ ...loc, name: trimmed }, deviceId));
        setEditingLocId(null);
      } else {
        setLocations(upsertDrivingLocation({ id: newLocationId(), name: trimmed, address: pendingAddress }, deviceId));
        setPendingAddress("");
      }
      setQuery("");
      setView("library");
    }
  };

  const handleAddLocation = () => {
    setEditingLocId(null);
    setQuery("");
    setView("address");
  };

  const handleRenameLocation = (loc: DrivingLocation) => {
    setEditingLocId(loc.id);
    // Address-named entries came from auto-conversion; start renames blank
    setQuery(loc.name === loc.address ? "" : loc.name);
    setView("nickname");
  };

  const handleDeleteLocation = (loc: DrivingLocation) => {
    setLocations(deleteDrivingLocation(loc.id, deviceId));
  };

  const handlePickPlace = (loc: DrivingLocation) => {
    if (view === "pairFrom") {
      setPendingFrom(loc);
      setView("pairTo");
    } else if (view === "pairTo") {
      setPendingTo(loc);
      setView("slotPicker");
    }
  };

  const handleSlotSelect = (slotIndex: number) => {
    if (!pendingFrom || !pendingTo) return;
    const newSlots = [...slots] as (DrivingSlot | null)[];
    newSlots[slotIndex] = {
      origin: pendingFrom.address,
      destination: pendingTo.address,
      originName: pendingFrom.name,
      destName: pendingTo.name,
    };
    setSlots(newSlots);
    setPendingFrom(null);
    setPendingTo(null);
    setView("library");
  };

  const handleBack = () => {
    if (view === "slotPicker") setView("pairTo");
    else if (view === "pairTo") setView("pairFrom");
    else if (view === "pairFrom") setView("library");
    else if (view === "nickname") {
      if (editingLocId) { setEditingLocId(null); setQuery(""); setView("library"); }
      else { setQuery(pendingAddress); setView("address"); }
    }
    else if (view === "address") { setQuery(""); setView("library"); }
    else setLocation("/settings-menu");
  };

  const handleSave = () => {
    const pref = savePreference(
      { row: editRow, stop: JSON.stringify({ slots }), direction: "driving", line: "DRIVING" },
      deviceId
    );
    queryClient.setQueryData(["/api/preferences", deviceId], (old: any) => {
      const arr = Array.isArray(old) ? old : [];
      return [...arr.filter((p: any) => p.row !== editRow), pref];
    });
    setLocation("/");
  };

  const hasSavedSlots = slots.some((s) => s !== null);

  const Key = ({ label, wide, yellow, onPress }: { label: string; wide?: boolean; yellow?: boolean; onPress: () => void }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); onPress(); }}
      style={{
        width: wide ? KWide : KW, height: KH,
        backgroundColor: yellow ? "#4ade80" : wide ? "#484848" : "#2D2C31",
        borderRadius: 5, border: "none", cursor: "pointer",
        color: yellow ? "#000" : "#fff", fontSize: 13, fontWeight: 600,
        fontFamily: "Helvetica, Arial, sans-serif", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >{label}</button>
  );

  const title =
    view === "library" ? "Favorite Driving Locations" :
    view === "address" ? "Enter Address" :
    view === "nickname" ? (editingLocId ? "Rename Place" : "Name This Place") :
    view === "pairFrom" ? "Route: Starting From" :
    view === "pairTo" ? "Route: Going To" :
    "Add to Slot";

  const slotLabel = (slot: DrivingSlot) =>
    `${slot.originName || slot.origin} → ${slot.destName || slot.destination}`;

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] relative" style={{ width: "800px", height: "480px", overflow: "hidden" }}>

          {/* Back */}
          <div className="absolute top-[5px] left-[5px] z-10">
            <button className="block p-4" onClick={handleBack}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Home */}
          <div className="absolute bottom-[5px] right-[5px] z-10">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Title */}
          <div className="absolute top-[18px] left-0 right-0 flex items-center justify-center">
            <span style={{ ...font, fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>{title}</span>
          </div>

          {/* ── LIBRARY VIEW ── */}
          {view === "library" && (
            <>
              {/* Route slot status bar */}
              <div style={{ position: "absolute", top: "54px", left: "20px", right: "20px", display: "flex", gap: "6px", alignItems: "center" }}>
                {slots.map((slot, i) => (
                  <div key={i} style={{
                    flex: 1, height: "26px", borderRadius: "6px",
                    backgroundColor: slot ? "#1a2a1a" : "#1a1a1a",
                    border: `1px solid ${slot ? "#4ade80" : "#333"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    <span style={{ ...font, fontSize: "10px", fontWeight: 600, color: slot ? "#4ade80" : "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 6px" }}>
                      {slot ? slotLabel(slot) : `Slot ${i + 1} open`}
                    </span>
                  </div>
                ))}
                {hasSavedSlots && (
                  <button onClick={handleSave} style={{ height: "26px", backgroundColor: "#FFFFFF", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 14px", flexShrink: 0 }}>
                    <span style={{ ...font, fontSize: "12px", fontWeight: 700, color: "#000" }}>Save</span>
                  </button>
                )}
              </div>

              {locations.length === 0 ? (
                /* First run: prompt to build the library */
                <div style={{ position: "absolute", top: "100px", left: "20px", right: "20px", bottom: "60px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px" }}>
                  <span style={{ ...font, fontSize: "18px", fontWeight: 700, color: "#ffffff" }}>Set Favorite Driving Locations</span>
                  <span style={{ ...font, fontSize: "13px", color: "#888", textAlign: "center", maxWidth: "420px" }}>
                    Save the places you drive to — Home, Work, the Gym — then build routes between them.
                  </span>
                  <button onClick={handleAddLocation} style={{ marginTop: "10px", height: "44px", backgroundColor: "#FFFFFF", borderRadius: "8px", border: "none", cursor: "pointer", padding: "0 24px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Plus className="w-4 h-4" style={{ color: "#000" }} />
                    <span style={{ ...font, fontSize: "15px", fontWeight: 700, color: "#000" }}>Add Location</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* Actions */}
                  <div style={{ position: "absolute", top: "92px", left: "20px", right: "20px", display: "flex", gap: "8px" }}>
                    <button onClick={handleAddLocation} style={{ flex: 1, height: "38px", backgroundColor: "#2D2C31", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px" }}>
                      <Plus className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                      <span style={{ ...font, fontSize: "13px", fontWeight: 700, color: "#ffffff" }}>Add Location</span>
                    </button>
                    <button
                      onClick={() => { setPendingFrom(null); setPendingTo(null); setView("pairFrom"); }}
                      disabled={locations.length < 2}
                      style={{ flex: 1, height: "38px", backgroundColor: locations.length >= 2 ? "#4ade80" : "#1a1a1a", borderRadius: "8px", border: "none", cursor: locations.length >= 2 ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}
                    >
                      <span style={{ ...font, fontSize: "13px", fontWeight: 700, color: locations.length >= 2 ? "#000" : "#333" }}>Set Up Route →</span>
                    </button>
                  </div>

                  {/* Location list */}
                  <div style={{ position: "absolute", top: "140px", left: "20px", right: "20px", bottom: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {locations.map((loc) => (
                      <div key={loc.id} style={{ minHeight: "48px", backgroundColor: "#2D2C31", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 14px", gap: "12px", flexShrink: 0 }}>
                        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                        <button onClick={() => handleRenameLocation(loc)} style={{ flex: 1, minWidth: 0, background: "none", border: "none", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: "1px", padding: 0 }}>
                          <span style={{ ...font, fontSize: "14px", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {loc.name === loc.address ? "Tap to name this place" : loc.name}
                          </span>
                          <span style={{ ...font, fontSize: "11px", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.address}</span>
                        </button>
                        <Pencil className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#666" }} />
                        <button onClick={() => handleDeleteLocation(loc)} style={{ color: "#666", fontSize: "20px", lineHeight: 1, border: "none", background: "none", cursor: "pointer", flexShrink: 0, padding: "4px" }}>×</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ── TYPING VIEWS (nickname / address) ── */}
          {isTypingView && (
            <>
              {/* Search/entry bar */}
              <div style={{ position: "absolute", top: "62px", left: "20px", right: "20px", height: "44px", backgroundColor: "#2D2C31", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: "#4ade80" }} />
                <span style={{ ...font, fontSize: "15px", color: query ? "#fff" : "#555", flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
                  {!query && <span className="search-cursor" />}
                  {query || (view === "nickname" ? "Nickname (e.g. Home, Work)..." : "Street address...")}
                  {query && <span className="search-cursor" />}
                </span>
                {query && (
                  <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); setQuery(""); setSuggestions([]); }} style={{ color: "#666", fontSize: "20px", lineHeight: 1, border: "none", background: "none", cursor: "pointer" }}>×</button>
                )}
              </div>

              {/* Nickname preset chips */}
              {view === "nickname" && (
                <div style={{ position: "absolute", top: "114px", left: "20px", right: "20px", display: "flex", gap: "7px", flexWrap: "wrap" }}>
                  {NICKNAME_PRESETS.map((preset) => (
                    <button key={preset} onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); setQuery(preset); }}
                      style={{ height: "32px", backgroundColor: query === preset ? "#4ade80" : "#2D2C31", borderRadius: "16px", border: "none", cursor: "pointer", padding: "0 16px" }}>
                      <span style={{ ...font, fontSize: "13px", fontWeight: 600, color: query === preset ? "#000" : "#fff" }}>{preset}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Autocomplete suggestions (address only) */}
              {view === "address" && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "112px", left: "20px", right: "20px", zIndex: 20, display: "flex", flexDirection: "column", gap: "3px" }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); handleSelectSuggestion(s); }}
                      style={{ height: "36px", backgroundColor: "#3a3a3a", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 14px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Search className="w-3 h-3 flex-shrink-0" style={{ color: "#888" }} />
                      <span style={{ ...font, fontSize: "13px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Keyboard */}
              <div style={{ position: "absolute", bottom: "48px", left: "20px", right: "20px", display: "flex", flexDirection: "column", gap: KG }}>
                {!isNumMode ? (
                  <>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      {QWERTY[0].map((k) => <Key key={k} label={isShift ? k : k.toLowerCase()} onPress={() => handleLetter(k)} />)}
                    </div>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      {QWERTY[1].map((k) => <Key key={k} label={isShift ? k : k.toLowerCase()} onPress={() => handleLetter(k)} />)}
                    </div>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      <Key label="⇧" wide yellow={isShift} onPress={() => setIsShift((s) => !s)} />
                      {QWERTY[2].map((k) => <Key key={k} label={isShift ? k : k.toLowerCase()} onPress={() => handleLetter(k)} />)}
                      <Key label="⌫" wide onPress={() => handleKey("⌫")} />
                    </div>
                    <div style={{ display: "flex", gap: KG }}>
                      <Key label="123" wide onPress={() => handleKey("123")} />
                      <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); handleKey("SPACE"); }} style={{ flex: 1, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}>space</button>
                      <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); handleNext(query); }} disabled={!query.trim()} style={{ width: KWide, height: KH, backgroundColor: query.trim() ? "#4ade80" : "#1a1a1a", borderRadius: 5, border: "none", cursor: query.trim() ? "pointer" : "default", color: query.trim() ? "#000" : "#333", fontSize: 13, fontWeight: 700, fontFamily: "Helvetica, Arial, sans-serif" }}>
                        {view === "address" ? "Next" : editingLocId ? "Save" : "Done"}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      {NUMS[0].map((k) => <Key key={k} label={k} onPress={() => handleKey(k)} />)}
                    </div>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      {NUMS[1].map((k) => <Key key={k} label={k} onPress={() => handleKey(k)} />)}
                    </div>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      <Key label="ABC" wide onPress={() => handleKey("ABC")} />
                      <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); handleKey("SPACE"); }} style={{ flex: 1, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}>space</button>
                      <Key label="⌫" wide onPress={() => handleKey("⌫")} />
                      <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); handleNext(query); }} disabled={!query.trim()} style={{ width: KWide, height: KH, backgroundColor: query.trim() ? "#4ade80" : "#1a1a1a", borderRadius: 5, border: "none", cursor: query.trim() ? "pointer" : "default", color: query.trim() ? "#000" : "#333", fontSize: 13, fontWeight: 700, fontFamily: "Helvetica, Arial, sans-serif" }}>
                        {view === "address" ? "Next" : editingLocId ? "Save" : "Done"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── ROUTE PAIR PICKER (from / to) ── */}
          {(view === "pairFrom" || view === "pairTo") && (
            <>
              <div style={{ position: "absolute", top: "56px", left: "20px", right: "20px", textAlign: "center" }}>
                <span style={{ ...font, fontSize: "13px", color: "#888" }}>
                  {view === "pairFrom" ? "Where does this route start?" : (
                    <>
                      <span style={{ color: "#4ade80" }}>{pendingFrom?.name}</span>
                      <span style={{ margin: "0 8px" }}>→</span>
                      <span style={{ color: "#f87171" }}>where to?</span>
                    </>
                  )}
                </span>
              </div>
              <div style={{ position: "absolute", top: "88px", left: "20px", right: "20px", bottom: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                {locations
                  .filter((l) => view === "pairFrom" || l.id !== pendingFrom?.id)
                  .map((loc) => (
                    <button key={loc.id} onClick={() => handlePickPlace(loc)} className="hover:opacity-80 transition-opacity"
                      style={{ minHeight: "52px", backgroundColor: "#2D2C31", borderRadius: "8px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: "0 16px", gap: "12px", flexShrink: 0, textAlign: "left" }}>
                      <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: view === "pairFrom" ? "#4ade80" : "#f87171" }} />
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "1px" }}>
                        <span style={{ ...font, fontSize: "15px", fontWeight: 700, color: "#ffffff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {loc.name === loc.address ? loc.address : loc.name}
                        </span>
                        {loc.name !== loc.address && (
                          <span style={{ ...font, fontSize: "11px", color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.address}</span>
                        )}
                      </div>
                    </button>
                  ))}
              </div>
            </>
          )}

          {/* ── SLOT PICKER VIEW ── */}
          {view === "slotPicker" && (
            <div style={{ position: "absolute", top: "56px", left: "20px", right: "20px", bottom: "56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...font, fontSize: "13px", color: "#888" }}>
                  <span style={{ color: "#4ade80" }}>{pendingFrom?.name}</span>
                  <span style={{ margin: "0 8px" }}>→</span>
                  <span style={{ color: "#f87171" }}>{pendingTo?.name}</span>
                </div>
                <div style={{ ...font, fontSize: "13px", color: "#666", marginTop: "6px" }}>Add to which slot?</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[0, 1, 2].map((i) => (
                  <button key={i} onClick={() => handleSlotSelect(i)} className="hover:opacity-80 transition-opacity"
                    style={{ height: "58px", backgroundColor: "#2D2C31", borderRadius: "8px", border: slots[i] ? "1px solid #4ade80" : "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px" }}>
                    <span style={{ ...font, fontSize: "16px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>Slot {i + 1}</span>
                    <span style={{ ...font, fontSize: "13px", color: slots[i] ? "#4ade80" : "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slots[i] ? `Replace: ${slotLabel(slots[i]!)}` : "Open"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
