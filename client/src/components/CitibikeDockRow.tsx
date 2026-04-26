import { useMemo } from "react";
import citibikeIcon from "@assets/citibike logo.png";

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
}

const EbikeIcon = () => (
  <svg width="10" height="13" viewBox="0 0 10 14" fill="white" style={{ flexShrink: 0 }}>
    <path d="M6.5 0L1 8h4l-2 6 7.5-9H7L6.5 0z" />
  </svg>
);

const BikeIcon = () => (
  <svg width="17" height="12" viewBox="0 0 17 12" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="3.5" cy="8.5" r="3" />
    <circle cx="13.5" cy="8.5" r="3" />
    <polyline points="6,8.5 7.5,3.5 11,3.5" />
    <line x1="11" y1="3.5" x2="13.5" y2="8.5" />
    <line x1="7.5" y1="3.5" x2="7.5" y2="1" />
    <line x1="5.5" y1="1" x2="9.5" y2="1" />
    <line x1="11" y1="3.5" x2="12" y2="1.5" />
    <line x1="10.5" y1="1.5" x2="13" y2="1.5" />
  </svg>
);

export default function CitibikeDockRow({ slots, stations, rowHeight }: CitibikeDockRowProps) {
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
    const name = slot?.name ?? `Slot ${index + 1} open`;
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

        {/* Right: name + badges */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
          <div
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: "12px",
              fontWeight: 700,
              color: isEmpty ? "#4a4a4a" : "#ffffff",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {name}
          </div>

          <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
            {/* E-bike badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                backgroundColor: isEmpty ? "#282828" : "#7B2FA0",
                borderRadius: "20px",
                padding: "3px 7px 3px 5px",
                flexShrink: 0,
              }}
            >
              <EbikeIcon />
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "13px", fontWeight: 700, color: isEmpty ? "#3a3a3a" : "#fff" }}>
                {ebikes}
              </span>
            </div>

            {/* Classic bike badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                backgroundColor: isEmpty ? "#282828" : "#7B2FA0",
                borderRadius: "20px",
                padding: "3px 7px 3px 4px",
                flexShrink: 0,
              }}
            >
              <BikeIcon />
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "13px", fontWeight: 700, color: isEmpty ? "#3a3a3a" : "#fff" }}>
                {bikes}
              </span>
            </div>

            {/* Parking badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "3px",
                backgroundColor: isEmpty ? "#282828" : "#484848",
                borderRadius: "20px",
                padding: "3px 8px",
                flexShrink: 0,
              }}
            >
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "12px", fontWeight: 900, color: isEmpty ? "#3a3a3a" : "#fff" }}>P</span>
              <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "13px", fontWeight: 700, color: isEmpty ? "#3a3a3a" : "#fff" }}>
                {docks}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: "flex", gap: "11px" }}>
      {[0, 1, 2].map((i) => renderCard(slots[i] ?? null, i))}
    </div>
  );
}
