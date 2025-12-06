import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Home, Square } from "lucide-react";
import train1Icon from "@assets/moovmii/MTA Icons/src/svg/1.svg";
import train2Icon from "@assets/moovmii/MTA Icons/src/svg/2.svg";
import train3Icon from "@assets/moovmii/MTA Icons/src/svg/3.svg";
import train4Icon from "@assets/moovmii/MTA Icons/src/svg/4.svg";
import train5Icon from "@assets/moovmii/MTA Icons/src/svg/5.svg";
import train6Icon from "@assets/moovmii/MTA Icons/src/svg/6.svg";
import train7Icon from "@assets/moovmii/MTA Icons/src/svg/7.svg";
import trainAIcon from "@assets/moovmii/MTA Icons/src/svg/a.svg";
import trainCIcon from "@assets/moovmii/MTA Icons/src/svg/c.svg";
import trainEIcon from "@assets/moovmii/MTA Icons/src/svg/e.svg";
import trainBIcon from "@assets/moovmii/MTA Icons/src/svg/b.svg";
import trainDIcon from "@assets/moovmii/MTA Icons/src/svg/d.svg";
import trainFIcon from "@assets/moovmii/MTA Icons/src/svg/f.svg";
import trainMIcon from "@assets/moovmii/MTA Icons/src/svg/m.svg";
import trainNIcon from "@assets/moovmii/MTA Icons/src/svg/n.svg";
import trainQIcon from "@assets/moovmii/MTA Icons/src/svg/q.svg";
import trainRIcon from "@assets/moovmii/MTA Icons/src/svg/r.svg";
import trainWIcon from "@assets/moovmii/MTA Icons/src/svg/w.svg";
import trainLIcon from "@assets/moovmii/MTA Icons/src/svg/l.svg";
import trainGIcon from "@assets/moovmii/MTA Icons/src/svg/g.svg";
import trainJIcon from "@assets/moovmii/MTA Icons/src/svg/j.svg";
import trainZIcon from "@assets/moovmii/MTA Icons/src/svg/z.svg";
import sirIcon from "@assets/moovmii/MTA Icons/src/svg/sir.svg";
import pathIcon from "@assets/moovmii/MTA Icons/src/svg/PATH_logo_no_bg.png";
import lirrIcon from "@assets/moovmii/MTA Icons/src/svg/LIRR_logo_white.png";
import metroNorthIcon from "@assets/moovmii/MTA Icons/src/svg/Metro-North_logo_white.png";
import njTransitIcon from "@assets/moovmii/MTA Icons/src/svg/New_Jersey_Transit_white_cropped_trimmed.png";

export default function Settings() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

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
                ) : row === 1 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-2"
                  >
                    <img src={train7Icon} alt="7 train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 2 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-4"
                  >
                    <img src={trainBIcon} alt="B train" className="w-[38px] h-[38px]" />
                    <img src={trainDIcon} alt="D train" className="w-[38px] h-[38px]" />
                    <img src={trainFIcon} alt="F train" className="w-[38px] h-[38px]" />
                    <img src={trainMIcon} alt="M train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 3 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-6"
                  >
                    <img src={trainLIcon} alt="L train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 4 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-8"
                  >
                    <img src={trainJIcon} alt="J train" className="w-[38px] h-[38px]" />
                    <img src={trainZIcon} alt="Z train" className="w-[38px] h-[38px]" />
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
                ) : row === 1 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-3"
                  >
                    <img src={trainAIcon} alt="A train" className="w-[38px] h-[38px]" />
                    <img src={trainCIcon} alt="C train" className="w-[38px] h-[38px]" />
                    <img src={trainEIcon} alt="E train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 2 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-5"
                  >
                    <img src={trainNIcon} alt="N train" className="w-[38px] h-[38px]" />
                    <img src={trainQIcon} alt="Q train" className="w-[38px] h-[38px]" />
                    <img src={trainRIcon} alt="R train" className="w-[38px] h-[38px]" />
                    <img src={trainWIcon} alt="W train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 3 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-2" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-7"
                  >
                    <img src={trainGIcon} alt="G train" className="w-[38px] h-[38px]" />
                  </div>
                ) : row === 4 ? (
                  <div 
                    className="rounded-[6px] flex items-center justify-center gap-[30px]" 
                    style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                    data-testid="card-settings-9"
                  >
                    <img src={sirIcon} alt="SIR" className="w-[29px] h-[29px]" />
                    <div className="flex flex-col items-center gap-1">
                      <img src={lirrIcon} alt="LIRR" className="h-[15.4px] object-contain" style={{ transform: 'translateX(-3px)' }} />
                      <img src={metroNorthIcon} alt="Metro-North" className="h-[15.4px] object-contain" />
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
            className="rounded-[6px] flex items-center justify-center" 
            style={{ width: '760px', height: '58px', backgroundColor: '#2D2C31', marginTop: '20px' }}
            data-testid="card-settings-bottom"
          >
            <span className="text-white text-xl font-bold" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>Advanced Settings</span>
          </div>

          <div className="absolute bottom-[5px] left-[10px]">
            <button 
              onClick={toggleFullscreen}
              className="cursor-pointer"
              data-testid="button-fullscreen-toggle"
            >
              <Square 
                className={`w-5 h-5 ${isFullscreen ? 'text-[#ffd200]' : 'text-white'}`} 
                fill={isFullscreen ? '#ffd200' : 'none'}
              />
            </button>
          </div>
          <div className="absolute bottom-[10px] right-[10px]">
            <Link href="/" data-testid="link-back">
              <Home className="w-5 h-5 text-white cursor-pointer" data-testid="button-home" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
