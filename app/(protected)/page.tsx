"use client";

import Sidebar from "@/app/_components/Sidebar";
import ChatArea from "@/app/_components/ChatArea";
import { ConversationProvider } from "@/app/lib/conversation-context";

export default function ChatPage() {
  return (
    <ConversationProvider>
      <div className="flex h-screen bg-bg-deep text-white font-sans">
        <Sidebar />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <ChatArea />
        </main>
      </div>
    </ConversationProvider>
  );
}
