import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Home, Square, ArrowLeft } from "lucide-react";
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

type LineItem = {
  id: string;
  icon: string;
  alt: string;
  size?: string;
  isRegional?: boolean;
};

type GroupItem = {
  id: string;
  lines: LineItem[];
};

const groups: GroupItem[] = [
  {
    id: "123",
    lines: [
      { id: "1", icon: train1Icon, alt: "1 train" },
      { id: "2", icon: train2Icon, alt: "2 train" },
      { id: "3", icon: train3Icon, alt: "3 train" },
    ]
  },
  {
    id: "456",
    lines: [
      { id: "4", icon: train4Icon, alt: "4 train" },
      { id: "5", icon: train5Icon, alt: "5 train" },
      { id: "6", icon: train6Icon, alt: "6 train" },
    ]
  },
  {
    id: "7",
    lines: [
      { id: "7", icon: train7Icon, alt: "7 train" },
    ]
  },
  {
    id: "ace",
    lines: [
      { id: "A", icon: trainAIcon, alt: "A train" },
      { id: "C", icon: trainCIcon, alt: "C train" },
      { id: "E", icon: trainEIcon, alt: "E train" },
    ]
  },
  {
    id: "bdfm",
    lines: [
      { id: "B", icon: trainBIcon, alt: "B train" },
      { id: "D", icon: trainDIcon, alt: "D train" },
      { id: "F", icon: trainFIcon, alt: "F train" },
      { id: "M", icon: trainMIcon, alt: "M train" },
    ]
  },
  {
    id: "nqrw",
    lines: [
      { id: "N", icon: trainNIcon, alt: "N train" },
      { id: "Q", icon: trainQIcon, alt: "Q train" },
      { id: "R", icon: trainRIcon, alt: "R train" },
      { id: "W", icon: trainWIcon, alt: "W train" },
    ]
  },
  {
    id: "l",
    lines: [
      { id: "L", icon: trainLIcon, alt: "L train" },
    ]
  },
  {
    id: "g",
    lines: [
      { id: "G", icon: trainGIcon, alt: "G train" },
    ]
  },
  {
    id: "jz",
    lines: [
      { id: "J", icon: trainJIcon, alt: "J train" },
      { id: "Z", icon: trainZIcon, alt: "Z train" },
    ]
  },
  {
    id: "regional",
    lines: [
      { id: "SIR", icon: sirIcon, alt: "SIR", size: "29px", isRegional: true },
      { id: "LIRR", icon: lirrIcon, alt: "LIRR", size: "24px", isRegional: true },
      { id: "MetroNorth", icon: metroNorthIcon, alt: "Metro-North", size: "24px", isRegional: true },
      { id: "PATH", icon: pathIcon, alt: "PATH", size: "28px", isRegional: true },
      { id: "NJT", icon: njTransitIcon, alt: "NJ Transit", size: "22px", isRegional: true },
    ]
  },
];

export default function Settings() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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

  const handleGroupClick = (groupId: string) => {
    setSelectedGroup(groupId);
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  const handleLineSelect = (lineId: string) => {
    console.log('Selected line:', lineId);
  };

  const currentGroup = groups.find(g => g.id === selectedGroup);

  const renderMainView = () => (
    <div className="flex flex-col gap-[8px]">
      {[0, 1, 2, 3, 4].map((row) => (
        <div key={row} className="flex gap-[10px]">
          {row === 0 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("123")}
              data-testid="card-settings-0"
            >
              <img src={train1Icon} alt="1 train" className="w-[38px] h-[38px]" />
              <img src={train2Icon} alt="2 train" className="w-[38px] h-[38px]" />
              <img src={train3Icon} alt="3 train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 1 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("7")}
              data-testid="card-settings-2"
            >
              <img src={train7Icon} alt="7 train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 2 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("bdfm")}
              data-testid="card-settings-4"
            >
              <img src={trainBIcon} alt="B train" className="w-[38px] h-[38px]" />
              <img src={trainDIcon} alt="D train" className="w-[38px] h-[38px]" />
              <img src={trainFIcon} alt="F train" className="w-[38px] h-[38px]" />
              <img src={trainMIcon} alt="M train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 3 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("l")}
              data-testid="card-settings-6"
            >
              <img src={trainLIcon} alt="L train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 4 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("jz")}
              data-testid="card-settings-8"
            >
              <img src={trainJIcon} alt="J train" className="w-[38px] h-[38px]" />
              <img src={trainZIcon} alt="Z train" className="w-[38px] h-[38px]" />
            </div>
          ) : null}
          {row === 0 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("456")}
              data-testid="card-settings-1"
            >
              <img src={train4Icon} alt="4 train" className="w-[38px] h-[38px]" />
              <img src={train5Icon} alt="5 train" className="w-[38px] h-[38px]" />
              <img src={train6Icon} alt="6 train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 1 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("ace")}
              data-testid="card-settings-3"
            >
              <img src={trainAIcon} alt="A train" className="w-[38px] h-[38px]" />
              <img src={trainCIcon} alt="C train" className="w-[38px] h-[38px]" />
              <img src={trainEIcon} alt="E train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 2 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("nqrw")}
              data-testid="card-settings-5"
            >
              <img src={trainNIcon} alt="N train" className="w-[38px] h-[38px]" />
              <img src={trainQIcon} alt="Q train" className="w-[38px] h-[38px]" />
              <img src={trainRIcon} alt="R train" className="w-[38px] h-[38px]" />
              <img src={trainWIcon} alt="W train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 3 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("g")}
              data-testid="card-settings-7"
            >
              <img src={trainGIcon} alt="G train" className="w-[38px] h-[38px]" />
            </div>
          ) : row === 4 ? (
            <div 
              className="rounded-[6px] flex items-center justify-center gap-[30px] cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleGroupClick("regional")}
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
          ) : null}
        </div>
      ))}
    </div>
  );

  const renderSubView = () => {
    if (!currentGroup) return null;
    
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col gap-[8px]">
          {currentGroup.lines.map((line) => (
            <div 
              key={line.id}
              className="rounded-[6px] flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity" 
              style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
              onClick={() => handleLineSelect(line.id)}
              data-testid={`card-line-${line.id}`}
            >
              <img 
                src={line.icon} 
                alt={line.alt} 
                className={line.isRegional ? "object-contain" : "w-[38px] h-[38px]"}
                style={line.isRegional ? { height: line.size } : undefined}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] flex flex-col relative"
          style={{ width: '800px', height: '480px', padding: '15px 20px' }}
          data-testid="settings-main"
        >
          {selectedGroup && (
            <div className="absolute top-[10px] left-[10px]">
              <button 
                onClick={handleBack}
                className="cursor-pointer"
                data-testid="button-back-to-groups"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {selectedGroup ? renderSubView() : renderMainView()}

          <div 
            style={{ width: '760px', height: '1px', backgroundColor: '#4a4a4a', marginTop: selectedGroup ? 'auto' : '20px' }}
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
