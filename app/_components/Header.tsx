import { Bell, ChevronDown } from "lucide-react";

export default function Header() {
  return (
    <header className="h-18 flex items-center justify-between px-6 border-b border-white/5 bg-[#030712] backdrop-blur-md">
      
      {/* Left Section: Branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Logo Placeholder - Replace with your SVG icon */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
             <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin-slow" />
          </div>
          <h1 className="text-sm font-bold tracking-wider text-white flex gap-1">
            OCEAN DEPTH <span className="text-blue-500">AI</span>
          </h1>
        </div>
        
        {/* Version Badge */}
        <span className="px-2 py-0.5 rounded-md bg-blue-900/30 border border-blue-500/20 text-[10px] text-blue-400 font-medium">
          v1.0.0
        </span>
      </div>

      {/* Middle Section: Status Indicator */}
      <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.02] border border-white/5 shadow-inner">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]" />
        <span className="text-[11px] text-gray-400 font-medium tracking-tight">
          System Status: <span className="text-gray-200">All Systems Operational</span>
        </span>
      </div>

      {/* Right Section: Actions & Profile */}
      <div className="flex items-center gap-6">
        {/* Notification Bell */}
        {/* <div className="relative cursor-pointer hover:scale-110 transition-transform">
          <Bell size={20} className="text-gray-400 hover:text-white" />
          <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-blue-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#030712]">
            3
          </span>
        </div> */}

        {/* User Profile Dropdown */}
        <button className="flex items-center gap-3 pl-4 border-l border-white/10 group">
          <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors">
            <img 
              src="https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001877.png" 
              alt="Arjun Dev" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-white leading-tight">Arjun Dev</span>
            <span className="text-[10px] text-blue-400/80 font-medium">Pro Plan</span>
          </div>
          <ChevronDown size={14} className="text-gray-500 group-hover:text-white transition-colors" />
        </button>
      </div>
    </header>
  );
}
