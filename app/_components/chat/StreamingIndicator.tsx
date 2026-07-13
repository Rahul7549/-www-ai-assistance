"use client";

export default function StreamingIndicator() {
  return (
    <div className="flex gap-3.5 items-start mb-6">
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm text-white font-semibold shrink-0"
        style={{
          background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
        }}
      >
        N
      </div>
      <div className="pt-2">
        <p className="text-xs font-semibold text-white/40 mb-2 tracking-wide">Nova</p>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(124,92,255,0.5)] animate-[pulse-dot_1.4s_ease-in-out_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(124,92,255,0.5)] animate-[pulse-dot_1.4s_ease-in-out_0.2s_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(124,92,255,0.5)] animate-[pulse-dot_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}
