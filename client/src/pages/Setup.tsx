import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { apiFetch } from "@/lib/api";
import moovmiiLogo from "@assets/moovmii logo v2 (White).png";

const font = { fontFamily: "Helvetica, Arial, sans-serif" };

// Placeholder — confirms the device is paired. The real onboarding screens
// (location → address → transit → subway, writing to this device's config)
// land here next.
export default function Setup() {
  const params = useParams();
  const id = (params as Record<string, string>).id;
  const [name, setName] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiFetch(`/api/devices/${id}/config`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((cfg) => setName(cfg?.device?.name ?? cfg?.device?.deviceId ?? "your moovmii"))
      .catch(() => setNotFound(true));
  }, [id]);

  return (
    <div style={{ ...font, minHeight: "100vh", backgroundColor: "#0b0b0b", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 24px" }}>
      <img src={moovmiiLogo} alt="moovmii" style={{ height: "26px", width: "auto", marginTop: "56px" }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", maxWidth: "380px" }}>
        {notFound ? (
          <h1 style={{ fontSize: "22px", fontWeight: 700 }}>Device not found</h1>
        ) : (
          <>
            <div style={{ fontSize: "44px" }}>✅</div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, marginTop: "12px" }}>Paired!</h1>
            <p style={{ fontSize: "15px", color: "#9a9a9a", marginTop: "10px", lineHeight: 1.45 }}>
              {name ? `Connected to ${name}.` : "Your display is connected."} Setup steps are coming next.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
