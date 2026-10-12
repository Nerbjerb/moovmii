// Subway line bullet icons, shared across onboarding/setup.
import train1 from "@assets/moovmii/MTA Icons/src/svg/1.svg";
import train2 from "@assets/moovmii/MTA Icons/src/svg/2.svg";
import train3 from "@assets/moovmii/MTA Icons/src/svg/3.svg";
import train4 from "@assets/moovmii/MTA Icons/src/svg/4.svg";
import train5 from "@assets/moovmii/MTA Icons/src/svg/5.svg";
import train6 from "@assets/moovmii/MTA Icons/src/svg/6.svg";
import train7 from "@assets/moovmii/MTA Icons/src/svg/7.svg";
import trainA from "@assets/moovmii/MTA Icons/src/svg/a.svg";
import trainB from "@assets/moovmii/MTA Icons/src/svg/b.svg";
import trainC from "@assets/moovmii/MTA Icons/src/svg/c.svg";
import trainD from "@assets/moovmii/MTA Icons/src/svg/d.svg";
import trainE from "@assets/moovmii/MTA Icons/src/svg/e.svg";
import trainF from "@assets/moovmii/MTA Icons/src/svg/f.svg";
import trainG from "@assets/moovmii/MTA Icons/src/svg/g.svg";
import trainJ from "@assets/moovmii/MTA Icons/src/svg/j.svg";
import trainL from "@assets/moovmii/MTA Icons/src/svg/l.svg";
import trainM from "@assets/moovmii/MTA Icons/src/svg/m.svg";
import trainN from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import trainQ from "@assets/moovmii/MTA Icons/src/svg/q.svg";
import trainR from "@assets/moovmii/MTA Icons/src/svg/r.svg";
import trainW from "@assets/moovmii/MTA Icons/src/svg/w.svg";
import trainZ from "@assets/moovmii/MTA Icons/src/svg/z.svg";

export const LINE_ICONS: Record<string, string> = {
  "1": train1, "2": train2, "3": train3, "4": train4, "5": train5, "6": train6, "7": train7,
  A: trainA, B: trainB, C: trainC, D: trainD, E: trainE, F: trainF, G: trainG, J: trainJ,
  L: trainL, M: trainM, N: trainN, Q: trainQ, R: trainR, W: trainW, Z: trainZ,
};

// Display order for the line grid.
export const SUBWAY_LINE_ORDER = ["1", "2", "3", "4", "5", "6", "7", "A", "C", "E", "B", "D", "F", "M", "N", "Q", "R", "W", "G", "J", "Z", "L"];
