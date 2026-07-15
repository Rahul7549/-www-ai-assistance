"use client";

import { useState } from "react";
import Sidebar from "@/app/_components/Sidebar";
import ChatArea from "@/app/_components/ChatArea";
import { ConversationProvider } from "@/app/lib/conversation-context";

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ConversationProvider>
      <div className="flex h-screen bg-bg-deep text-white font-sans">
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <ChatArea onOpenSidebar={() => setIsSidebarOpen(true)} />
        </main>
      </div>
    </ConversationProvider>
  );
}
