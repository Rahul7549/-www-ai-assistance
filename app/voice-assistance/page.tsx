"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { MicOff, SlidersHorizontal, Square, RefreshCcw } from 'lucide-react';

const VoiceAssistant = () => {
  // Generate random heights for 15 bars on each side
  const bars = Array.from({ length: 15 });

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#020617] p-4 text-white">
      <div className="w-full max-w-sm aspect-[9/16] bg-[#0b1120] rounded-[48px] border border-white/5 shadow-2xl flex flex-col items-center justify-between py-16 px-8 relative overflow-hidden">
        
        {/* Status */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-xs font-medium uppercase tracking-wider">Listening</span>
        </div>

        {/* Center Section: Orb + Signals */}
        <div className="relative w-full flex items-center justify-center">
          
          {/* Left Frequency Signal */}
          <div className="flex items-center gap-1.5 absolute right-[70%] rotate-180">
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
            {/* Outer Breathing Ring */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -inset-8 border border-indigo-400/30 rounded-full" 
            />
            
            {/* The Main Orb */}
            <div className="w-32 h-32 rounded-full bg-black relative z-10 flex items-center justify-center p-[3px] overflow-hidden">
              {/* Spinning Gradient Border */}
              <div className="absolute inset-0 bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#22d3ee,#3b82f6)] animate-[spin_4s_linear_infinite]" />
              
              {/* Inner Face */}
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
          <div className="flex items-center gap-1.5 absolute left-[70%]">
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

        {/* Labels */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-1">Speak now</h2>
          <p className="text-gray-500 text-sm">How can I help you today?</p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-10">
          <button className="p-4 bg-white/5 rounded-full border border-white/10 text-gray-400"><MicOff size={22} /></button>
          <button className="p-6 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)]"><Square fill="white" size={24} className="text-white" /></button>
          <button className="p-4 bg-white/5 rounded-full border border-white/10 text-gray-400"><SlidersHorizontal size={22} /></button>
        </div>

      </div>
    </main>
  );
};

export default VoiceAssistant;
