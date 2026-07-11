"use client";
import { motion } from "framer-motion";
import { MicOff, Square, X } from "lucide-react";

const bars = Array.from({ length: 15 });

interface VoiceOverlayProps {
  onClose: () => void;
}

export default function VoiceOverlay({ onClose }: VoiceOverlayProps) {
  return (
    <div className="absolute inset-0 z-30 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center gap-10">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X size={20} />
      </button>

      {/* Status */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full flex items-center gap-2">
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Listening</span>
      </div>

      {/* Orb + Frequency Signals */}
      <div className="relative w-full flex items-center justify-center">
        {/* Left Frequency Signal */}
        <div className="flex items-center gap-1.5 absolute right-[60%] rotate-180">
          {bars.map((_, i) => (
            <motion.div
              key={`left-${i}`}
              className="w-[3px] bg-indigo-500/40 rounded-full"
              animate={{ height: [10, 40, 15, 50, 10] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
            />
          ))}
        </div>

        {/* Central Glowing Orb */}
        <div className="relative group">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -inset-8 border border-indigo-400/30 rounded-full"
          />

          <div className="w-32 h-32 rounded-full bg-black relative z-10 flex items-center justify-center p-[3px] overflow-hidden">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#22d3ee,#3b82f6)] animate-[spin_4s_linear_infinite]" />
            <div className="absolute inset-[3px] bg-[#0b1120] rounded-full flex items-center justify-center gap-4">
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2] }}
                className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
              />
              <motion.div
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2] }}
                className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
              />
            </div>
          </div>
        </div>

        {/* Right Frequency Signal */}
        <div className="flex items-center gap-1.5 absolute left-[60%]">
          {bars.map((_, i) => (
            <motion.div
              key={`right-${i}`}
              className="w-[3px] bg-indigo-500/40 rounded-full"
              animate={{ height: [10, 50, 20, 40, 10] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Label */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold mb-1">Speak now</h2>
        <p className="text-gray-500 text-sm">How can I help you today?</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-10">
        <button className="p-4 bg-white/5 rounded-full border border-white/10 text-gray-400 hover:text-white transition-colors">
          <MicOff size={22} />
        </button>
        <button
          onClick={onClose}
          className="p-6 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-colors"
        >
          <Square fill="white" size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
