import { SendIcon } from "lucide-react";

export default function ChatInput() {
  return (
    <div className="p-6 pt-0">
      <div className="max-w-4xl mx-auto relative group">
        <input 
          type="text" 
          placeholder="Message Nova..."
          className="w-full bg-bg-card border border-white/10 rounded-2xl py-4 px-6 pr-32 focus:outline-none focus:border-brand-primary/50 transition-all shadow-2xl"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
          <button className="text-text-dim hover:text-white">📎</button>
          <button className="text-text-dim hover:text-white">🎙️</button>
          <button className="bg-brand-primary p-2 rounded-xl hover:scale-105 active:scale-95 transition-transform">
            <SendIcon size={20} />
          </button>
        </div>
        <p className="text-[10px] text-center text-text-dim mt-3">
          Nova can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
