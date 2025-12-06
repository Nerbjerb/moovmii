import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

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
                <div 
                  className="rounded-[6px]" 
                  style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                  data-testid={`card-settings-${row * 2}`}
                />
                <div 
                  className="rounded-[6px]" 
                  style={{ width: '375px', height: '58px', backgroundColor: '#2D2C31' }}
                  data-testid={`card-settings-${row * 2 + 1}`}
                />
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
