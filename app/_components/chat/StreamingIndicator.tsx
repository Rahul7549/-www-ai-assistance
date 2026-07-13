"use client";

import { SparklesIcon } from "lucide-react";

interface StreamingIndicatorProps {
  assistantName?: string;
  assistantAvatar?: string;
}

export default function StreamingIndicator({ assistantName = "Nova", assistantAvatar }: StreamingIndicatorProps) {
  const avatarSrc = assistantAvatar && assistantAvatar !== "default"
    ? `/avatars/${assistantAvatar.toLowerCase()}.png`
    : null;

  return (
    <div className="flex gap-4 items-start mb-8 max-w-[90%]">
      {/* Avatar */}
      <div className="relative shrink-0 mt-1">
        <div
          className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center text-white font-semibold ring-2 ring-indigo-500/20"
          style={{
            background: "linear-gradient(135deg, #6366f1, #a78bfa)",
            boxShadow: "0 4px 14px rgba(99,102,241,0.25)",
          }}
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt={assistantName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-base">{assistantName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-[#0b1020]" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-white">{assistantName}</span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-400/70 bg-indigo-500/10 px-2 py-0.5 rounded-full">
            <SparklesIcon size={10} />
            AI
          </span>
        </div>

        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl rounded-tl-sm px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400/50 animate-[pulse-dot_1.4s_ease-in-out_infinite]" />
              <span className="w-2 h-2 rounded-full bg-indigo-400/50 animate-[pulse-dot_1.4s_ease-in-out_0.2s_infinite]" />
              <span className="w-2 h-2 rounded-full bg-indigo-400/50 animate-[pulse-dot_1.4s_ease-in-out_0.4s_infinite]" />
            </div>
            <span className="text-xs text-white/30">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
