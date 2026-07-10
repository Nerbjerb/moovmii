import { useMemo } from "react";
import citibikeIcon from "@assets/citibike logo.png";
import ebikeIcon from "@assets/Citibike icons/e-bike logo.png";
import normalBikeIcon from "@assets/Citibike icons/normal bike logo.png";

export interface CitibikeSlot {
  id: string;
  name: string;
}

export interface CitibikeStation {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
  bikes_available: number;
  ebikes_available: number;
  docks_available: number;
}

interface CitibikeDockRowProps {
  slots: (CitibikeSlot | null)[];
  stations: CitibikeStation[];
  rowHeight?: number;
  labelHeight?: number;
  showParking?: boolean;
}

export default function CitibikeDockRow({ slots, stations, rowHeight, labelHeight = 20, showParking = false }: CitibikeDockRowProps) {
  const cardHeight = rowHeight ?? 115;

  const stationMap = useMemo(() => {
    const map: Record<string, CitibikeStation> = {};
    for (const s of stations) map[s.station_id] = s;
    return map;
  }, [stations]);

  const renderCard = (slot: CitibikeSlot | null, index: number) => {
    const station = slot ? stationMap[slot.id] : null;
    const ebikes = station?.ebikes_available ?? 0;
    const bikes = station?.bikes_available ?? 0;
    const docks = station?.docks_available ?? 0;
    const name = slot?.name ?? "";
    const isEmpty = !slot;

    return (
      <div
        key={index}
        style={{
          width: "246px",
          height: `${cardHeight}px`,
          backgroundColor: "#2D2C31",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: "10px",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Citibike logo */}
        <img
          src={citibikeIcon}
          alt="Citibike"
          style={{
            height: "17px",
            width: "52px",
            objectFit: "contain",
            opacity: isEmpty ? 0.25 : 1,
            flexShrink: 0,
          }}
        />

        {/* Badges */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: showParking ? "5px" : "8px",
              backgroundColor: isEmpty ? "#282828" : "#7B2FA0",
              borderRadius: "20px",
              padding: showParking ? "3.3px 10px 3.3px 5px" : "3.3px 16px 3.3px 8px",
            }}
          >
            <img src={ebikeIcon} alt="e-bike" style={{ height: showParking ? "25px" : "38px", width: "auto", flexShrink: 0 }} />
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: showParking ? "20px" : "30px", fontWeight: 700, color: isEmpty ? "#3a3a3a" : "#fff" }}>
              {ebikes}
            </span>
            <img src={normalBikeIcon} alt="bike" style={{ height: showParking ? "23px" : "35px", width: "auto", flexShrink: 0 }} />
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: showParking ? "20px" : "30px", fontWeight: 700, color: isEmpty ? "#3a3a3a" : "#fff" }}>
              {bikes}
            </span>
            {showParking && (
              <>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "18px", fontWeight: 900, color: isEmpty ? "#3a3a3a" : "#fff", marginLeft: "3px" }}>P</span>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "20px", fontWeight: 700, color: isEmpty ? "#3a3a3a" : "#fff" }}>
                  {docks}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: "11px" }}>
      {[0, 1, 2].map((i) => {
        const slot = slots[i] ?? null;
        const label = slot?.name ?? "";
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: `${labelHeight}px`, fontWeight: 700, color: label ? "#ffffff" : "transparent" }}>
              {label || " "}
            </span>
            {renderCard(slot, i)}
          </div>
        );
      })}
    </div>
  );
}
