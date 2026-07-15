"use client";

import { Menu, Plus, MessageSquare, X, LogOut } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { useConversation } from "@/app/lib/conversation-context";
import { ChatItem } from "./ChatItem";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { logout } = useAuth();
  const {
    conversations,
    selectedConversationId,
    selectConversation,
    deleteConversation,
  } = useConversation();

  const handleNewChat = () => {
    selectConversation(null);
  };

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setIsOpen(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`bg-[var(--bg-primary)] fixed top-0 left-0 h-screen border-r border-white/5 flex flex-col transition-all duration-300 z-50 p-4
        ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
        md:sticky md:translate-x-0
        ${isOpen ? "md:w-64" : "md:w-20"}`}
      >
        {/* Header */}
        <div className={`w-full flex items-center px-2 mb-6 ${isOpen ? "justify-between" : "justify-center"}`}>
          <span className={`font-bold text-xl tracking-tight text-white ${isOpen ? "block" : "hidden md:hidden"}`}>
            AuraAI
          </span>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
          >
            <span className="md:hidden"><X size={20} /></span>
            <span className="hidden md:inline"><Menu size={20} /></span>
          </button>
        </div>

        {/* New Chat */}
        <button
          onClick={handleNewChat}
          className={`flex items-center rounded-xl transition-all mb-4 ${
            isOpen
              ? "gap-3 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white w-full justify-start"
              : "p-3 hover:bg-white/5 w-full justify-center md:justify-center group"
          }`}
        >
          <Plus size={20} className={isOpen ? "shrink-0" : "text-gray-400 group-hover:text-indigo-400 shrink-0"} />
          <span className={`text-sm font-medium whitespace-nowrap ${isOpen ? "block" : "hidden md:hidden"}`}>
            New Chat
          </span>
        </button>

        {/* Conversation List */}
        <nav className="flex-1 w-full overflow-hidden flex flex-col">
          <div className={`flex flex-col w-full gap-1 ${isOpen ? "items-start" : "items-center md:items-center"}`}>
            {isOpen && (
              <>
                <p className="text-[10px] text-gray-500 uppercase px-2 mb-2 tracking-wider">
                  History
                </p>
                {conversations.length === 0 ? (
                  <p className="text-xs text-gray-600 px-3 py-2">No conversations yet</p>
                ) : (
                  <div className="w-full overflow-y-auto max-h-[calc(100vh-280px)] space-y-1 custom-scrollbar pr-1">
                    {conversations.map((conv) => (
                      <ChatItem
                        key={conv.id}
                        label={conv.title || "New conversation"}
                        active={conv.id === selectedConversationId}
                        onClick={() => handleSelectConversation(conv.id)}
                        onDelete={() => deleteConversation(conv.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {!isOpen && (
              <button
                onClick={() => setIsOpen(true)}
                className="flex items-center p-3 rounded-xl hover:bg-white/5 w-full group transition-colors justify-center md:justify-center"
              >
                <MessageSquare size={20} className="text-gray-400 group-hover:text-indigo-400 shrink-0" />
              </button>
            )}
          </div>
        </nav>

        {/* Logout */}
        <div className={`w-full pt-4 border-t border-white/5 ${isOpen ? "" : "flex justify-center"}`}>
          <button
            onClick={logout}
            className={`flex items-center p-3 rounded-xl hover:bg-red-500/10 w-full group transition-colors
            ${isOpen ? "justify-start gap-3" : "justify-center md:justify-center"}`}
          >
            <LogOut size={20} className="text-gray-400 group-hover:text-red-400 shrink-0" />
            <span className={`text-sm text-gray-300 font-medium group-hover:text-red-400 whitespace-nowrap ${isOpen ? "block" : "hidden md:hidden"}`}>
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
