import { PlusIcon} from "lucide-react";
import UserProfile from "./UserProfile";
import { ChatItem } from "./ChatItem";


export default function Sidebar() {
  return (
    <aside className="border border-indigo-300/15 border-indigo-400 border-white/5 flex flex-col h-full p-4 rounded-b-md shadow-2xl space-y-6 w-64">
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-lg bg-brand-primary animate-pulse" />
        <span className="font-bold text-xl tracking-tight">AuraAI</span>
      </div>
      
      <button className="w-full bg-indigo-600 hover:bg-indigo-700 py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
        <PlusIcon size={18} /> New Chat
      </button>

      <nav className="flex-1 overflow-y-auto space-y-1">
        <p className="text-xs text-text-dim uppercase px-2 mb-2">Today</p>
        <ChatItem label="Project Brainstorm" active />
        <ChatItem label="Research Summary" />
      </nav>

      <div className="pt-4 border-t border-white/5">
        <UserProfile name="Rahul Sharma" plan="Pro Plan" />
      </div>
    </aside>
  );
}
