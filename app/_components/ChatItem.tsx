interface ChatItemProps {
  label: string;
  active?: boolean;
}

export function ChatItem({ label, active }: ChatItemProps) {
  return (
    <button className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
      active 
        ? "bg-white/5 text-white font-medium" 
        : "text-text-dim hover:bg-white/5 hover:text-white"
    }`}>
      {label}
    </button>
  );
}
