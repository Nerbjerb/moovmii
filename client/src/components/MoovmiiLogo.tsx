import moovmiiLogo from "@assets/moovmii_logo_transparent_1768105760941.png";

export function MoovmiiLogo() {
  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
      <img
        src={moovmiiLogo}
        alt="moovmii"
        style={{ height: 18, filter: "invert(1) hue-rotate(180deg)", opacity: 0.6 }}
      />
    </div>
  );
}
