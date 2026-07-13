"use client";

import { Trash2 } from "lucide-react";

interface ChatItemProps {
  label: string;
  active?: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function ChatItem({ label, active, onClick, onDelete }: ChatItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all group flex items-center gap-2 ${
        active
          ? "bg-indigo-500/10 text-white font-medium border border-indigo-500/20"
          : "text-text-dim hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="flex-1 truncate">{label}</span>
      <span
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 hover:text-red-400 transition-all cursor-pointer"
      >
        <Trash2 size={14} />
      </span>
    </button>
  );
}
