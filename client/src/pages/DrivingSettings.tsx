import { useState, useEffect, useRef } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Home, MapPin, Search } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getDeviceId } from "@/lib/deviceId";
import { savePreference, getPreferences } from "@/lib/localStorageDB";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

type View = "origin" | "destination" | "slotPicker";

export interface DrivingSlot {
  origin: string;
  destination: string;
}

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

  const [slots, setSlots] = useState<(DrivingSlot | null)[]>(() => {
    const prefs = getPreferences(deviceId);
    const rowPref = prefs.find((p) => p.row === editRow);
    if (rowPref?.line === "DRIVING") {
      try { return JSON.parse(rowPref.stop).slots ?? [null, null, null]; } catch {}
    }
    return [null, null, null];
  });

  const [view, setView] = useState<View>("origin");
  const [pendingOrigin, setPendingOrigin] = useState("");
  const [pendingDestination, setPendingDestination] = useState("");
  const [query, setQuery] = useState("");
  const [isNumMode, setIsNumMode] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOriginView = view === "origin";
  const currentStep = isOriginView ? "origin" : "destination";

  // Fetch autocomplete suggestions as user types
  useEffect(() => {
    if (view === "slotPicker") return;
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
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

  useEffect(() => {
    if (view === "slotPicker") return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") { e.preventDefault(); handleKey("⌫"); }
      else if (e.key === " ") { e.preventDefault(); handleKey("SPACE"); }
      else if (e.key === "Enter") { /* handled by Next button */ }
      else if (e.key.length === 1) { handleKey(e.key.toUpperCase()); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view, handleKey]);

  const handleSelectSuggestion = (s: string) => {
    setQuery(s);
    setSuggestions([]);
  };

  const handleNext = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (view === "origin") {
      setPendingOrigin(trimmed);
      setQuery("");
      setSuggestions([]);
      setView("destination");
    } else if (view === "destination") {
      setPendingDestination(trimmed);
      setQuery("");
      setSuggestions([]);
      setView("slotPicker");
    }
  };

  const handleSlotSelect = (slotIndex: number) => {
    if (!pendingOrigin || !pendingDestination) return;
    const newSlots = [...slots] as (DrivingSlot | null)[];
    newSlots[slotIndex] = { origin: pendingOrigin, destination: pendingDestination };
    setSlots(newSlots);
    setPendingOrigin("");
    setPendingDestination("");
    setView("origin");
    setQuery("");
  };

  const handleBack = () => {
    if (view === "slotPicker") { setView("destination"); setQuery(pendingDestination); }
    else if (view === "destination") { setView("origin"); setQuery(pendingOrigin); }
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
      onPointerDown={(e) => { e.preventDefault(); onPress(); }}
      style={{
        width: wide ? KWide : KW, height: KH,
        backgroundColor: yellow ? "#FFD200" : wide ? "#484848" : "#2D2C31",
        borderRadius: 5, border: "none", cursor: "pointer",
        color: yellow ? "#000" : "#fff", fontSize: 13, fontWeight: 600,
        fontFamily: "Helvetica, Arial, sans-serif", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >{label}</button>
  );

  const title =
    view === "origin" ? "Enter Start Address" :
    view === "destination" ? "Enter Destination" :
    "Add to Slot";

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

          {/* ── ADDRESS ENTRY VIEWS (origin / destination) ── */}
          {view !== "slotPicker" && (
            <>
              {/* Slot status bar */}
              <div style={{ position: "absolute", top: "54px", left: "20px", right: "20px", display: "flex", gap: "6px", alignItems: "center" }}>
                {slots.map((slot, i) => (
                  <div key={i} style={{
                    flex: 1, height: "26px", borderRadius: "6px",
                    backgroundColor: slot ? "#1a2a1a" : "#1a1a1a",
                    border: `1px solid ${slot ? "#4ade80" : "#333"}`,
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    <span style={{ ...font, fontSize: "10px", fontWeight: 600, color: slot ? "#4ade80" : "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 6px" }}>
                      {slot ? `${slot.origin} → ${slot.destination}` : `Slot ${i + 1} open`}
                    </span>
                  </div>
                ))}
                {hasSavedSlots && (
                  <button onClick={handleSave} style={{ height: "26px", backgroundColor: "#FFFFFF", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 14px", flexShrink: 0 }}>
                    <span style={{ ...font, fontSize: "12px", fontWeight: 700, color: "#000" }}>Save</span>
                  </button>
                )}
              </div>

              {/* Step indicator */}
              <div style={{ position: "absolute", top: "88px", left: "20px", display: "flex", gap: "6px", alignItems: "center" }}>
                {["origin","destination"].map((step, i) => (
                  <div key={step} style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: view === step ? "#ffffff" : (
                      (step === "origin" && view === "destination") ? "#4ade80" : "#444"
                    ),
                  }} />
                ))}
                <span style={{ ...font, fontSize: "11px", color: "#666", marginLeft: "4px" }}>
                  {view === "origin" ? "Step 1 of 2 — Where are you starting from?" : "Step 2 of 2 — Where are you going?"}
                </span>
              </div>

              {/* Search bar */}
              <div style={{ position: "absolute", top: "108px", left: "20px", right: "20px", height: "44px", backgroundColor: "#2D2C31", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: view === "origin" ? "#4ade80" : "#f87171" }} />
                <span style={{ ...font, fontSize: "15px", color: query ? "#fff" : "#555", flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
                  {query || (view === "origin" ? "Start address..." : "Destination address...")}
                </span>
                {query && (
                  <button onPointerDown={(e) => { e.preventDefault(); setQuery(""); setSuggestions([]); }} style={{ color: "#666", fontSize: "20px", lineHeight: 1, border: "none", background: "none", cursor: "pointer" }}>×</button>
                )}
              </div>

              {/* Autocomplete suggestions */}
              {suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "158px", left: "20px", right: "20px", zIndex: 20, display: "flex", flexDirection: "column", gap: "3px" }}>
                  {suggestions.map((s, i) => (
                    <button key={i} onPointerDown={(e) => { e.preventDefault(); handleSelectSuggestion(s); }}
                      style={{ height: "36px", backgroundColor: "#3a3a3a", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 14px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Search className="w-3 h-3 flex-shrink-0" style={{ color: "#888" }} />
                      <span style={{ ...font, fontSize: "13px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Next button */}
              {query.trim().length > 0 && suggestions.length === 0 && (
                <button onPointerDown={(e) => { e.preventDefault(); handleNext(query); }}
                  style={{ position: "absolute", top: "158px", right: "20px", height: "36px", backgroundColor: "#4ade80", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 20px" }}>
                  <span style={{ ...font, fontSize: "13px", fontWeight: 700, color: "#000" }}>
                    {view === "origin" ? "Next →" : "Choose Slot →"}
                  </span>
                </button>
              )}

              {/* Keyboard */}
              <div style={{ position: "absolute", bottom: "48px", left: "20px", right: "20px", display: "flex", flexDirection: "column", gap: KG }}>
                {!isNumMode ? (
                  <>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      {QWERTY[0].map((k) => <Key key={k} label={k} onPress={() => handleKey(k)} />)}
                    </div>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      {QWERTY[1].map((k) => <Key key={k} label={k} onPress={() => handleKey(k)} />)}
                    </div>
                    <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
                      <Key label="⇧" wide onPress={() => {}} />
                      {QWERTY[2].map((k) => <Key key={k} label={k} onPress={() => handleKey(k)} />)}
                      <Key label="⌫" wide onPress={() => handleKey("⌫")} />
                    </div>
                    <div style={{ display: "flex", gap: KG }}>
                      <Key label="123" wide onPress={() => handleKey("123")} />
                      <button onPointerDown={(e) => { e.preventDefault(); handleKey("SPACE"); }} style={{ flex: 1, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}>space</button>
                      <button onPointerDown={(e) => { e.preventDefault(); handleNext(query); }} disabled={!query.trim()} style={{ width: KWide, height: KH, backgroundColor: query.trim() ? "#4ade80" : "#1a1a1a", borderRadius: 5, border: "none", cursor: query.trim() ? "pointer" : "default", color: query.trim() ? "#000" : "#333", fontSize: 13, fontWeight: 700, fontFamily: "Helvetica, Arial, sans-serif" }}>
                        {view === "origin" ? "Next" : "Done"}
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
                      <button onPointerDown={(e) => { e.preventDefault(); handleKey("SPACE"); }} style={{ flex: 1, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}>space</button>
                      <Key label="⌫" wide onPress={() => handleKey("⌫")} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── SLOT PICKER VIEW ── */}
          {view === "slotPicker" && (
            <div style={{ position: "absolute", top: "56px", left: "20px", right: "20px", bottom: "56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...font, fontSize: "13px", color: "#888" }}>
                  <span style={{ color: "#4ade80" }}>{pendingOrigin}</span>
                  <span style={{ margin: "0 8px" }}>→</span>
                  <span style={{ color: "#f87171" }}>{pendingDestination}</span>
                </div>
                <div style={{ ...font, fontSize: "13px", color: "#666", marginTop: "6px" }}>Add to which slot?</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[0, 1, 2].map((i) => (
                  <button key={i} onClick={() => handleSlotSelect(i)} className="hover:opacity-80 transition-opacity"
                    style={{ height: "58px", backgroundColor: "#2D2C31", borderRadius: "8px", border: slots[i] ? "1px solid #4ade80" : "1px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", padding: "0 20px", gap: "12px" }}>
                    <span style={{ ...font, fontSize: "16px", fontWeight: 700, color: "#4ade80", flexShrink: 0 }}>Slot {i + 1}</span>
                    <span style={{ ...font, fontSize: "13px", color: slots[i] ? "#4ade80" : "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slots[i] ? `Replace: ${slots[i]!.origin} → ${slots[i]!.destination}` : "Open"}
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
