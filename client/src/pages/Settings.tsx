import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import train1Icon from "@assets/moovmii/MTA Icons/src/svg/1.svg";
import train2Icon from "@assets/moovmii/MTA Icons/src/svg/2.svg";
import train3Icon from "@assets/moovmii/MTA Icons/src/svg/3.svg";
import train4Icon from "@assets/moovmii/MTA Icons/src/svg/4.svg";
import train5Icon from "@assets/moovmii/MTA Icons/src/svg/5.svg";
import train6Icon from "@assets/moovmii/MTA Icons/src/svg/6.svg";
import sirIcon from "@assets/moovmii/MTA Icons/src/svg/sir.svg";
import pathIcon from "@assets/moovmii/MTA Icons/src/svg/PATH_logo_no_bg.png";
import lirrIcon from "@assets/moovmii/MTA Icons/src/svg/LIRR_logo_white.png";
import metroNorthIcon from "@assets/moovmii/MTA Icons/src/svg/Metro-North_logo_white.png";
import njTransitIcon from "@assets/moovmii/MTA Icons/src/svg/New_Jersey_Transit_white_cropped_trimmed.png";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: '800px', height: '480px', padding: '15px 20px' }}
          data-testid="settings-main"
        >
          <div className="flex flex-col gap-[8px]">
            {[0, 1, 2, 3, 4].map((row) => (
              <div key={row} className="flex gap-[10px]">
                {row === 0 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-0"
                  >
                    <img src={train1Icon} alt="1 train" className="w-[38px] h-[38px]" />
                    <img src={train2Icon} alt="2 train" className="w-[38px] h-[38px]" />
                    <img src={train3Icon} alt="3 train" className="w-[38px] h-[38px]" />
                  </div>
                ) : (
                  <div 
                    className="rounded-[6px]" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid={`card-settings-${row * 2}`}
                  />
                )}
                {row === 0 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-1"
                  >
                    <img src={train4Icon} alt="4 train" className="w-[38px] h-[38px]" />
                    <img src={train5Icon} alt="5 train" className="w-[38px] h-[38px]" />
                    <img src={train6Icon} alt="6 train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 4 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-9"
                  >
                    <img src={sirIcon} alt="SIR" className="w-[29px] h-[29px]" />
                    <div className="flex flex-col items-center gap-1">
                      <img src={lirrIcon} alt="LIRR" className="h-[14px] object-contain" />
                      <img src={metroNorthIcon} alt="Metro-North" className="h-[14px] object-contain" />
                    </div>
                    <img src={pathIcon} alt="PATH" className="h-[21px] object-contain" />
                    <img src={njTransitIcon} alt="NJ Transit" className="h-[14px] object-contain" />
                  </div>
                ) : (
                  <div 
                    className="rounded-[6px]" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid={`card-settings-${row * 2 + 1}`}
                  />
                )}
              </div>
            ))}
          </div>

          <div 
            style={{ width: '760px', height: '1px', backgroundColor: '#4a4a4a', marginTop: '20px' }}
            data-testid="separator-line"
          />

          <div 
            className="rounded-[6px]" 
            style={{ width: '760px', height: '58px', backgroundColor: '#2D2C31', marginTop: '20px' }}
            data-testid="card-settings-bottom"
          />

          <div className="absolute bottom-[10px] right-[10px]">
            <Link href="/" data-testid="link-back">
              <ArrowLeft className="w-5 h-5 text-white cursor-pointer" data-testid="button-back" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
