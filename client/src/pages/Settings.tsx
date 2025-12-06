import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-[#E5E5E5] flex flex-col items-center justify-center p-8">
      <div className="relative">
        <main 
          className="bg-[#0b0b0b] shadow-[0_6px_20px_rgba(0,0,0,0.25)] p-6 flex flex-col relative"
          style={{ width: '800px', height: '480px' }}
          data-testid="settings-main"
        >
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
