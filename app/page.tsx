

// export default function Home() {
//   return (
//     <h1 className="text-red-600">New App</h1>
//   );
// }


import Sidebar from "./_components/Sidebar";
import ChatArea from "./_components/ChatArea";

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
