import Sidebar from "@/app/_components/Sidebar";
import ChatArea from "@/app/_components/ChatArea";

export default function ChatPage() {
  return (
    <div className="flex h-screen bg-bg-deep text-white font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <ChatArea />
      </main>
    </div>
  );
}
