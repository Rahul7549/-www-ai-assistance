"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, Mic, MicOff, Square, ChevronDown } from "lucide-react";
import {
  useVoiceSession,
  type VoiceState,
} from "./hooks/useVoiceSession";

const bars = Array.from({ length: 15 });

interface VoiceOverlayProps {
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  VoiceState,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  IDLE: {
    label: "Ready",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  LISTENING: {
    label: "Listening",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  PROCESSING: {
    label: "Thinking...",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  SPEAKING: {
    label: "Speaking...",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  MUTED: {
    label: "Muted",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  ERROR: {
    label: "Error",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
};

export default function VoiceOverlay({ onClose }: VoiceOverlayProps) {
  const voice = useVoiceSession();

  useEffect(() => {
    voice.start();
    return () => {
      voice.stop();
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    voice.stop();
    onClose();
  };

  const status = STATUS_CONFIG[voice.state];

  // Animation clock: driven by requestAnimationFrame inside an effect (not
  // read directly from Date.now() during render, to keep render pure) and
  // only ticks while an animated state is active.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (voice.state !== "LISTENING" && voice.state !== "SPEAKING") return;

    let rafId: number;
    const tick = () => {
      setNow(Date.now());
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [voice.state]);

  const orbScale = voice.state === "LISTENING"
    ? 1 + voice.volume * 0.4
    : voice.state === "SPEAKING"
    ? 1 + Math.sin(now / 200) * 0.15
    : 1;

  const barHeight = (i: number) => {
    if (voice.state === "LISTENING") {
      return 10 + voice.volume * 40 + Math.sin(now / 150 + i * 0.5) * 10;
    }
    if (voice.state === "SPEAKING") {
      return 10 + Math.sin(now / 200 + i * 0.4) * 25;
    }
    return 8;
  };

  if (!voice.isSupported) {
    return (
      <div className="absolute inset-0 z-30 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <MicOff size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Voice Chat Not Supported</h2>
          <p className="text-gray-400 text-sm">
            Voice chat is not supported in this browser. Please use Chrome or Edge for the best experience.
          </p>
        </div>
        <button
          onClick={handleClose}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 p-4">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X size={20} />
      </button>

      {/* Status badge */}
      <div
        className={`${status.bgColor} border ${status.borderColor} px-4 py-1.5 rounded-full flex items-center gap-2`}
      >
        {voice.state === "LISTENING" && (
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        )}
        {voice.state === "PROCESSING" && (
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
        )}
        {voice.state === "SPEAKING" && (
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
        )}
        <span
          className={`${status.color} text-xs font-medium uppercase tracking-wider`}
        >
          {status.label}
        </span>
      </div>

      {/* Orb + Frequency Bars */}
      <div className="relative w-full flex items-center justify-center">
        {/* Left frequency bars */}
        <div className="flex items-center gap-1.5 absolute right-[60%] rotate-180">
          {bars.map((_, i) => (
            <motion.div
              key={`left-${i}`}
              className="w-[3px] bg-indigo-500/40 rounded-full"
              animate={{ height: barHeight(i) }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>

        {/* Central orb */}
        <button
          onClick={voice.manualSend}
          className="relative group cursor-pointer"
          title="Tap to send"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: voice.state === "MUTED" ? 0.1 : [0.2, 0.5, 0.2],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -inset-8 border border-indigo-400/30 rounded-full"
          />

          <motion.div
            animate={{ scale: orbScale }}
            transition={{ duration: 0.1 }}
            className="w-32 h-32 rounded-full bg-black relative z-10 flex items-center justify-center p-[3px] overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#22d3ee,#3b82f6)] ${
                voice.state === "MUTED"
                  ? ""
                  : "animate-[spin_4s_linear_infinite]"
              }`}
              style={{ opacity: voice.state === "MUTED" ? 0.3 : 1 }}
            />
            <div className="absolute inset-[3px] bg-[#0b1120] rounded-full flex items-center justify-center gap-4">
              {voice.state === "MUTED" ? (
                <MicOff size={28} className="text-gray-500" />
              ) : (
                <>
                  <motion.div
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      times: [0, 0.1, 0.2],
                    }}
                    className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                  <motion.div
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      times: [0, 0.1, 0.2],
                    }}
                    className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                </>
              )}
            </div>
          </motion.div>
        </button>

        {/* Right frequency bars */}
        <div className="flex items-center gap-1.5 absolute left-[60%]">
          {bars.map((_, i) => (
            <motion.div
              key={`right-${i}`}
              className="w-[3px] bg-indigo-500/40 rounded-full"
              animate={{ height: barHeight(i) }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Transcript / Response area */}
      <div className="text-center max-w-lg min-h-[80px]">
        {voice.state === "ERROR" && voice.error && (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">{voice.error}</p>
            <button
              onClick={() => voice.start()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {voice.state === "LISTENING" && (
          <div>
            {voice.transcript ? (
              <p className="text-lg text-white">
                {voice.transcript.replace(voice.interimTranscript, "")}
                <span className="text-gray-500">{voice.interimTranscript}</span>
              </p>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold mb-1">Speak now</h2>
                <p className="text-gray-500 text-sm">
                  How can I help you today?
                </p>
              </div>
            )}
          </div>
        )}

        {voice.state === "PROCESSING" && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm italic">
              &ldquo;{voice.transcript || "..."}&rdquo;
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {voice.state === "SPEAKING" && (
          <p className="text-white text-base leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
            {voice.aiResponse}
          </p>
        )}

        {voice.state === "MUTED" && (
          <div>
            <h2 className="text-xl font-semibold mb-1 text-gray-400">
              Microphone Muted
            </h2>
            <p className="text-gray-500 text-sm">
              Tap the mic button to resume
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-10">
        <button
          onClick={voice.toggleMute}
          className={`p-4 rounded-full border transition-colors cursor-pointer ${
            voice.state === "MUTED"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
          }`}
        >
          {voice.state === "MUTED" ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          onClick={handleClose}
          className="p-6 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-colors cursor-pointer"
        >
          <Square fill="white" size={24} className="text-white" />
        </button>
      </div>

      {/* Voice selector */}
      {voice.voices.length > 1 && (
        <div className="relative">
          <select
            value={voice.selectedVoice}
            onChange={(e) => voice.setVoice(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30 cursor-pointer"
          >
            {voice.voices.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#0b1120]">
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
