import { useState, useEffect } from "react";
import { pressFlash } from "@/lib/pressFlash";

// Shared on-screen QWERTY keyboard for kiosk text entry. Controlled: parent owns
// the string via value/onChange. Also accepts physical keyboard input while mounted.
const QWERTY = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];
const NUMS = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["-", "/", "&", "@", ".", ",", "?", "!", "'", "#"],
];
const KW = 71, KH = 34, KG = 5, KWide = 111;

export default function OnScreenKeyboard({ value, onChange, accent = "#4ade80" }: { value: string; onChange: (v: string) => void; accent?: string }) {
  const [isNumMode, setIsNumMode] = useState(false);
  const [isShift, setIsShift] = useState(true);

  const type = (k: string) => onChange(value + (isShift ? k : k.toLowerCase()));
  const handleLetter = (k: string) => { type(k); if (isShift) setIsShift(false); };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Backspace") { e.preventDefault(); onChange(value.slice(0, -1)); }
      else if (e.key === " ") { e.preventDefault(); onChange(value + " "); }
      else if (e.key.length === 1) { onChange(value + e.key); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [value, onChange]);

  const Key = ({ label, wide, yellow, onPress }: { label: string; wide?: boolean; yellow?: boolean; onPress: () => void }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); onPress(); }}
      style={{
        width: wide ? KWide : KW, height: KH,
        backgroundColor: yellow ? accent : wide ? "#484848" : "#2D2C31",
        borderRadius: 5, border: "none", cursor: "pointer",
        color: yellow ? "#000" : "#fff", fontSize: 13, fontWeight: 600,
        fontFamily: "Helvetica, Arial, sans-serif", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >{label}</button>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: KG, alignItems: "center" }}>
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
            <Key label="⌫" wide onPress={() => onChange(value.slice(0, -1))} />
          </div>
          <div style={{ display: "flex", gap: KG }}>
            <Key label="123" wide onPress={() => setIsNumMode(true)} />
            <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); onChange(value + " "); }} style={{ width: 300, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}>space</button>
            <Key label="⌫" wide onPress={() => onChange(value.slice(0, -1))} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
            {NUMS[0].map((k) => <Key key={k} label={k} onPress={() => onChange(value + k)} />)}
          </div>
          <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
            {NUMS[1].map((k) => <Key key={k} label={k} onPress={() => onChange(value + k)} />)}
          </div>
          <div style={{ display: "flex", gap: KG, justifyContent: "center" }}>
            <Key label="ABC" wide onPress={() => setIsNumMode(false)} />
            <button onPointerDown={(e) => { e.preventDefault(); pressFlash(e.currentTarget); onChange(value + " "); }} style={{ width: 300, height: KH, backgroundColor: "#2D2C31", borderRadius: 5, border: "none", cursor: "pointer", color: "#888", fontSize: 13, fontFamily: "Helvetica, Arial, sans-serif" }}>space</button>
            <Key label="⌫" wide onPress={() => onChange(value.slice(0, -1))} />
          </div>
        </>
      )}
    </div>
  );
}
