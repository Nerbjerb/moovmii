import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, Home, Search } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { getDeviceId } from "@/lib/deviceId";
import { savePreference, getPreferences } from "@/lib/localStorageDB";
import type { CitibikeStation, CitibikeSlot } from "@/components/CitibikeDockRow";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

type View = "boroughs" | "search" | "slotPicker";

const boroughs = [
  { id: "manhattan",    name: "Manhattan"    },
  { id: "queens",       name: "Queens"       },
  { id: "brooklyn",     name: "Brooklyn"     },
  { id: "bronx",        name: "Bronx"        },
  { id: "staten_island", name: "Staten Island" },
  { id: "new_jersey",   name: "New Jersey"   },
];

const boroughBounds: Record<string, { minLat: number; maxLat: number; minLng: number; maxLng: number }> = {
  manhattan:    { minLat: 40.693, maxLat: 40.882, minLng: -74.020, maxLng: -73.907 },
  brooklyn:     { minLat: 40.570, maxLat: 40.712, minLng: -74.045, maxLng: -73.833 },
  queens:       { minLat: 40.607, maxLat: 40.800, minLng: -73.975, maxLng: -73.700 },
  bronx:        { minLat: 40.785, maxLat: 40.918, minLng: -73.935, maxLng: -73.748 },
  staten_island:{ minLat: 40.477, maxLat: 40.651, minLng: -74.260, maxLng: -74.053 },
  new_jersey:   { minLat: 40.688, maxLat: 40.782, minLng: -74.090, maxLng: -73.990 },
};

const QWERTY = [
  ["Q","W","E","R","T","Y","U","I","O","P"],
  ["A","S","D","F","G","H","J","K","L"],
  ["Z","X","C","V","B","N","M"],
];
const NUMS = [
  ["1","2","3","4","5","6","7","8","9","0"],
  ["-","/","&","@",".","," ,"?","!","'","#"],
];

const KW = 71;   // standard key width
const KH = 34;   // key height
const KG = 5;    // gap
const KWide = 111; // wide key width (shift, backspace, 123)

export default function CitibikeSettings() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const editRow = parseInt(new URLSearchParams(searchString).get("editRow") || "1", 10);

  const scaleMap: Record<string, number> = { "800x480": 1, "1024x600": 1.25, "1280x800": 1.6, "1920x1080": 2.25 };
  const [kioskScale] = useState(() => scaleMap[localStorage.getItem("kioskResolution") || "800x480"] || 1);

  const deviceId = getDeviceId();

  const [slots, setSlots] = useState<(CitibikeSlot | null)[]>(() => {
    const prefs = getPreferences(deviceId);
    const rowPref = prefs.find((p) => p.row === editRow);
    if (rowPref?.line === "CITIBIKE") {
      try {
        return JSON.parse(rowPref.stop).slots ?? [null, null, null];
      } catch {}
    }
    return [null, null, null];
  });

  const [view, setView] = useState<View>("boroughs");
  const [selectedBorough, setSelectedBorough] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStation, setSelectedStation] = useState<CitibikeStation | null>(null);
  const [isNumMode, setIsNumMode] = useState(false);

  const { data: allStations = [] } = useQuery<CitibikeStation[]>({
    queryKey: ["/api/citibike/stations"],
    staleTime: 60_000,
  });

  const filteredStations = useMemo(() => {
    if (!selectedBorough) return [];
    const bounds = boroughBounds[selectedBorough];
    if (!bounds) return [];
    const inBorough = allStations.filter(
      (s) => s.lat >= bounds.minLat && s.lat <= bounds.maxLat && s.lon >= bounds.minLng && s.lon <= bounds.maxLng
    );
    if (!searchQuery) return inBorough.slice(0, 30);
    const q = searchQuery.toLowerCase();
    return inBorough.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 30);
  }, [allStations, selectedBorough, searchQuery]);

  const boroughName = boroughs.find((b) => b.id === selectedBorough)?.name ?? "";
  const hasSavedSlots = slots.some((s) => s !== null);

  const handleBack = () => {
    if (view === "slotPicker") {
      setView("search");
      setSelectedStation(null);
    } else if (view === "search") {
      setView("boroughs");
      setSearchQuery("");
      setSelectedBorough(null);
    } else {
      setLocation("/settings-menu");
    }
  };

  const handleKey = (key: string) => {
    if (key === "⌫") {
      setSearchQuery((q) => q.slice(0, -1));
    } else if (key === "SPACE") {
      setSearchQuery((q) => q + " ");
    } else if (key === "123") {
      setIsNumMode(true);
    } else if (key === "ABC") {
      setIsNumMode(false);
    } else {
      setSearchQuery((q) => q + key);
    }
  };

  const handleSlotSelect = (slotIndex: number) => {
    if (!selectedStation) return;
    const newSlots = [...slots] as (CitibikeSlot | null)[];
    newSlots[slotIndex] = { id: selectedStation.station_id, name: selectedStation.name };
    setSlots(newSlots);
    setSelectedStation(null);
    setView("search");
  };

  const handleSave = () => {
    const pref = savePreference(
      { row: editRow, stop: JSON.stringify({ slots }), direction: "citibike", line: "CITIBIKE" },
      deviceId
    );
    queryClient.setQueryData(["/api/preferences", deviceId], (old: any) => {
      const arr = Array.isArray(old) ? old : [];
      return [...arr.filter((p: any) => p.row !== editRow), pref];
    });
    setLocation("/");
  };

  const Key = ({ label, wide, yellow, onPress }: { label: string; wide?: boolean; yellow?: boolean; onPress: () => void }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); onPress(); }}
      style={{
        width: wide ? KWide : KW,
        height: KH,
        backgroundColor: yellow ? "#FFD200" : wide ? "#484848" : "#2D2C31",
        borderRadius: 5,
        border: "none",
        cursor: "pointer",
        color: yellow ? "#000" : "#fff",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "Helvetica, Arial, sans-serif",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0b] flex flex-col items-center justify-center p-8 fullscreen-wrapper">
      <div className="relative fullscreen-container" style={{ transform: `scale(${kioskScale})`, transformOrigin: "center center" }}>
        <main
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] relative"
          style={{ width: "800px", height: "480px", overflow: "hidden" }}
        >
          {/* Back button */}
          <div className="absolute top-[5px] left-[5px] z-10">
            <button className="block p-4" onClick={handleBack}>
              <ArrowLeft className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Home button */}
          <div className="absolute bottom-[5px] right-[5px] z-10">
            <button className="block p-4" onClick={() => setLocation("/")}>
              <Home className="w-6 h-6 text-white cursor-pointer" />
            </button>
          </div>

          {/* Page title */}
          <div className="absolute top-[18px] left-0 right-0 flex items-center justify-center">
            <span style={{ ...font, fontSize: "20px", fontWeight: 700, color: "#ffffff" }}>
              {view === "boroughs" ? "Citibike Settings" : view === "search" ? `${boroughName} Docks` : "Add to Slot"}
            </span>
          </div>

          {/* ── BOROUGHS VIEW ── */}
          {view === "boroughs" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex flex-col gap-[8px]">
                {[0, 1, 2].map((row) => (
                  <div key={row} className="flex gap-[10px]">
                    {[0, 1].map((col) => {
                      const borough = boroughs[row * 2 + col];
                      return (
                        <div
                          key={borough.id}
                          className="rounded-[6px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ width: "375px", height: "58px", backgroundColor: "#2D2C31" }}
                          onClick={() => { setSelectedBorough(borough.id); setView("search"); }}
                        >
                          <span style={{ ...font, fontSize: "18px", fontWeight: 600, color: "#ffffff" }}>{borough.name}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SEARCH VIEW ── */}
          {view === "search" && (
            <>
              {/* Slot status + Save button */}
              <div style={{ position: "absolute", top: "54px", left: "20px", right: "20px", display: "flex", gap: "6px", alignItems: "center" }}>
                {slots.map((slot, i) => (
                  <div
                    key={i}
                    style={{
                      flex: 1,
                      height: "26px",
                      borderRadius: "6px",
                      backgroundColor: slot ? "#2a1f33" : "#1a1a1a",
                      border: `1px solid ${slot ? "#7B2FA0" : "#333"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    <span style={{ ...font, fontSize: "11px", fontWeight: 600, color: slot ? "#c084fc" : "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", padding: "0 6px" }}>
                      {slot ? slot.name : `Slot ${i + 1} open`}
                    </span>
                  </div>
                ))}
                {hasSavedSlots && (
                  <button
                    onClick={handleSave}
                    style={{ height: "26px", backgroundColor: "#FFD200", borderRadius: "6px", border: "none", cursor: "pointer", padding: "0 14px", flexShrink: 0 }}
                  >
                    <span style={{ ...font, fontSize: "12px", fontWeight: 700, color: "#000" }}>Save</span>
                  </button>
                )}
              </div>

              {/* Search bar */}
              <div style={{ position: "absolute", top: "88px", left: "20px", right: "20px", height: "44px", backgroundColor: "#2D2C31", borderRadius: "8px", display: "flex", alignItems: "center", padding: "0 14px", gap: "10px" }}>
                <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#888" }} />
                <span style={{ ...font, fontSize: "15px", color: searchQuery ? "#fff" : "#555", flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
                  {searchQuery || "Search docks..."}
                  {searchQuery && <span className="search-cursor" />}
                </span>
                {searchQuery.length > 0 && (
                  <button onPointerDown={(e) => { e.preventDefault(); setSearchQuery(""); }} style={{ color: "#666", fontSize: "20px", lineHeight: 1, border: "none", background: "none", cursor: "pointer" }}>×</button>
                )}
              </div>

              {/* Results */}
              <div style={{ position: "absolute", top: "140px", left: "20px", right: "20px", bottom: "204px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "5px" }}>
                {filteredStations.length === 0 ? (
                  <div style={{ ...font, fontSize: "14px", color: "#444", textAlign: "center", paddingTop: "16px" }}>
                    {searchQuery ? "No docks found" : "Loading stations..."}
                  </div>
                ) : (
                  filteredStations.map((station) => (
                    <button
                      key={station.station_id}
                      onPointerDown={(e) => { e.preventDefault(); setSelectedStation(station); setView("slotPicker"); }}
                      style={{ minHeight: "40px", backgroundColor: "#2D2C31", borderRadius: "6px", display: "flex", alignItems: "center", padding: "0 14px", border: "none", cursor: "pointer", textAlign: "left" }}
                      className="hover:opacity-80 transition-opacity"
                    >
                      <span style={{ ...font, fontSize: "14px", color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{station.name}</span>
                    </button>
                  ))
                )}
              </div>

              {/* QWERTY Keyboard */}
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
                      <button
                        onPointerDown={(e) => { e.preventDefault(); handleKey("SPACE"); }}
                        style={{ flex: 1, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}
                      >
                        space
                      </button>
                      <Key label="⌫" wide onPress={() => handleKey("⌫")} />
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
                      <button
                        onPointerDown={(e) => { e.preventDefault(); handleKey("SPACE"); }}
                        style={{ flex: 1, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}
                      >
                        space
                      </button>
                      <Key label="⌫" wide onPress={() => handleKey("⌫")} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── SLOT PICKER VIEW ── */}
          {view === "slotPicker" && selectedStation && (
            <div style={{ position: "absolute", top: "56px", left: "20px", right: "20px", bottom: "56px", display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ ...font, fontSize: "17px", fontWeight: 700, color: "#ffffff" }}>{selectedStation.name}</div>
                <div style={{ ...font, fontSize: "13px", color: "#666", marginTop: "4px" }}>Add to which slot?</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => handleSlotSelect(i)}
                    className="hover:opacity-80 transition-opacity"
                    style={{
                      height: "58px",
                      backgroundColor: "#2D2C31",
                      borderRadius: "8px",
                      border: slots[i] ? "1px solid #7B2FA0" : "1px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      padding: "0 20px",
                      gap: "12px",
                    }}
                  >
                    <span style={{ ...font, fontSize: "16px", fontWeight: 700, color: "#FFD200", flexShrink: 0 }}>Slot {i + 1}</span>
                    <span style={{ ...font, fontSize: "13px", color: slots[i] ? "#c084fc" : "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {slots[i] ? `Replace: ${slots[i]!.name}` : "Open"}
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
