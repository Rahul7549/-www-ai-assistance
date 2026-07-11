'use client';

import { Message } from "./Message";
import ActionPanel from "./ActionPanel";
import ChatInput from "./ChatInput";
import { Bell, ChevronDown,Menu,MessageSquare ,PanelLeftOpen } from "lucide-react";
import { ChevronRight } from 'lucide-react';
// export default function ChatArea() {

    

//     return (
//         <div className="relative bg-bg-deep">
//             {/* Central Chat Stream */}
//             <header className="flex items-center justify-between p-3 pl-0 border-b-white/5 border-b">
//                 <div className="flex items-center gap-3 pl-6">
//                     {/* <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" /> */}
//                     <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors">
//                         <img
//                             src="https://imgcdn.stablediffusionweb.com/2025/11/4/b4a6f3c7-9564-4398-abc3-c82c51284b6d.webp"
//                             className="w-full h-full object-cover"
//                         />
//                     </div>
//                     <div>
//                         <h2 className="font-semibold text-lg">Nova</h2>
//                         <p className="text-xs text-green-400 flex items-center gap-1">
//                             <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
//                         </p>
//                     </div>
//                 </div>
//                 <div className="flex gap-4 text-text-dim">
//                     {/* Icons: Search, Settings, etc. */}
//                     {/* <div className="relative cursor-pointer hover:scale-110 transition-transform">
//                         <Bell size={20} className="text-gray-400 hover:text-white" />
//                         <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-blue-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#030712]">
//                             3
//                         </span>
//                     </div> */}


//                     <button className="flex items-center gap-3 pl-4  border-white/10 group">
//                         {/* <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors"> */}
//                         {/* <img
//                                 src="https://imgcdn.stablediffusionweb.com/2025/11/4/b4a6f3c7-9564-4398-abc3-c82c51284b6d.webp"
//                                 alt="Arjun Dev"
//                                 className="w-full h-full object-cover"
//                             /> */}
//                         {/* </div> */}
//                         <div className="flex items-center gap-3 pl-4 ml-4 border-l border-white/10 group cursor-pointer">
//                             {/* Avatar with status indicator */}
//                             <div className="relative">
//                                 <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-blue-500/50 transition-all duration-300">
//                                     <img
//                                         src="https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png"
//                                         alt="Rahul Kumar Sharma"
//                                         className="w-full h-full object-cover"
//                                     />
//                                 </div>
//                                 {/* Green Online Dot */}
//                                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#030712] rounded-full" />
//                             </div>

//                             {/* Text Info */}
//                             <div className="flex flex-col text-left">
//                                 <span className="text-xs font-semibold text-white leading-tight group-hover:text-blue-400 transition-colors">
//                                     Rahul Kumar Sharma
//                                 </span>
//                                 <span className="text-[10px] text-blue-400/80 font-medium tracking-wide uppercase mt-0.5">
//                                     Pro Plan
//                                 </span>
//                             </div>

//                             {/* Icon */}
//                             <ChevronDown
//                                 size={16}
//                                 className="text-gray-500 group-hover:text-white group-hover:translate-y-0.5 transition-all duration-300"
//                             />
//                         </div>

//                     </button>
//                 </div>
//             </header>
//             <main className="flex flex-1">

//                 <section className=" border-white/5 flex flex-1 flex-col h-full rounded-md">
//                     {/* Header */}


//                     {/* Messages Container */}

//                     <section className="flex-1 flex flex-col h-full border-indigo-300/15 border-indigo-400 rounded-b-md min-h-[90vh] h-[90vh] ">



//                         {/* <VoiceAssistant/> */}
//                         <div className="flex-1 overflow-y-auto p-8 space-y-8 pt-8 custom-scrollbar">
//                             <Message
//                                 role="user"
//                                 content="Explain quantum computing in simple terms"
//                             />
//                             <Message
//                                 role="assistant"
//                                 content="Quantum computing is a type of computing that uses qubits..."
//                             />
//                             <div className="flex items-center gap-2 text-text-dim italic text-sm">
//                                 <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
//                                     <span className="animate-bounce">...</span>
//                                 </div>
//                                 Thinking...
//                             </div>
//                         </div>

//                         {/* Input Footer */}
//                         <ChatInput />

//                     </section>

//                 </section>

//                 {/* Floating Action Panel (Right Side) */}
//                 <ActionPanel />
//             </main>
//         </div>
//     );
// }

import { useState } from 'react';
import {
  ChevronRight as LayoutPanelRight,
  X,
  Send as SendIcon,
  Paperclip as PaperclipIcon,
  Mic as MicIcon,
  Search as SearchIcon,
  Copy as CopyIcon,
  RotateCcw as RotateIcon
} from "lucide-react";
import VoiceOverlay from "./VoiceOverlay";

// import ActionPanel from "./ActionPanel";
// import ChatInput from "./ChatInput";
// import { Message } from "./Message";

// export default function ChatArea() {
//   const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);

//   return (
//     <div className="flex-1 flex flex-col h-screen bg-[#0d0d12] overflow-hidden relative">
      
//       {/* --- HEADER --- */}
//       <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#0d0d12]/80 backdrop-blur-md z-10">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 ring-2 ring-indigo-500/20">
//             <img
//               src="https://stablediffusionweb.com"
//               alt="Nova AI"
//               className="w-full h-full object-cover"
//             />
//           </div>
//           <div>
//             <h2 className="font-semibold text-sm md:text-base text-white">Nova</h2>
//             <p className="text-[10px] text-green-400 flex items-center gap-1">
//               <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Online
//             </p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2 md:gap-4">
//           {/* Profile Section (Right Most) */}
//           <div className="flex items-center gap-3 pl-4 border-l border-white/10 group cursor-pointer">
//             <div className="relative hidden sm:block">
//               <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 group-hover:border-indigo-500 transition-all">
//                 <img
//                   src="https://pngtree.com"
//                   alt="Rahul"
//                   className="w-full h-full object-cover"
//                 />
//               </div>
//             </div>
//             <div className="flex flex-col text-left hidden md:flex">
//               <span className="text-[11px] font-semibold text-white leading-tight">Rahul Sharma</span>
//               <span className="text-[9px] text-indigo-400 font-medium">PRO PLAN</span>
//             </div>
//             <ChevronDown size={14} className="text-gray-500 group-hover:text-white" />
//           </div>

//           {/* Action Panel Toggle (Visible only on Mobile/Tablet) */}
//           <button 
//             onClick={() => setIsRightPanelOpen(true)}
//             className="lg:hidden p-2 hover:bg-white/5 rounded-lg text-gray-400 transition-colors"
//           >
//             <LayoutPanelRight size={20} />
//           </button>
//         </div>
//       </header>

//       {/* --- MAIN CONTENT AREA --- */}
//       <main className="flex flex-1 overflow-hidden relative">
        
//         {/* Chat Section */}
//         <section className="flex-1 flex flex-col h-full overflow-hidden">
          
//           {/* Scrollable Message History (90vh container feel) */}
//           <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
//             <div className="max-w-4xl mx-auto space-y-8">
//               <Message role="user" content="Explain quantum computing in simple terms." />
//               <Message role="assistant" content="Imagine a coin spinning on a table. While it's spinning, it's both heads and tails at once. That's a bit like a qubit!" />
              
//               {/* Thinking State */}
//               <div className="flex items-center gap-3 text-gray-500 italic text-xs animate-pulse">
//                 <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
//                   <div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" />
//                 </div>
//                 Nova is processing...
//               </div>
//             </div>
//           </div>

//           {/* Fixed Footer Input */}
//           <footer className="p-4 md:p-6 bg-gradient-to-t from-[#0d0d12] via-[#0d0d12] to-transparent">
//             <ChatInput />
//           </footer>
//         </section>

//         {/* --- RIGHT ACTION PANEL --- */}
//         {/* Responsive Logic: Fixed Side-Drawer on Mobile, Static Sidebar on Desktop (lg) */}
//         <aside className={`
//           fixed inset-y-0 right-0 z-50 w-72 bg-[#121218] border-l border-white/5 p-6 transition-transform duration-300 ease-in-out
//           lg:relative lg:translate-x-0 lg:block lg:w-80 lg:bg-transparent
//           ${isRightPanelOpen ? "translate-x-0 shadow-2xl" : "translate-x-full"}
//         `}>
//           <div className="flex items-center justify-between lg:hidden mb-6">
//             <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tools & Actions</span>
//             <button onClick={() => setIsRightPanelOpen(false)} className="text-gray-400 p-1 hover:text-white">
//               <X size={20} />
//             </button>
//           </div>
          
//           <ActionPanel />
//         </aside>

//         {/* Mobile Backdrop overlay */}
//         {isRightPanelOpen && (
//           <div 
//             className="fixed inset-0 bg-black/60 backdrop-blur-sm lg:hidden z-40"
//             onClick={() => setIsRightPanelOpen(false)}
//           />
//         )}
//       </main>
//     </div>
//   );
// }

// 'use client';
// import { useState } from 'react';



export default function ChatArea() {
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
    const [isVoiceMode, setIsVoiceMode] = useState(false);

    return (
        // Added overflow-hidden to prevent double scrollbars
        <div className="relative bg-bg-deep h-screen flex flex-col overflow-hidden">
            
            {/* Header */}
            <header className="flex items-center justify-between p-3 pl-0 border-b-white/5 border-b shrink-0">

                
                <div className="flex items-center gap-3 pl-6">


                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/10">
                        <img
                            src="https://imgcdn.stablediffusionweb.com/2024/12/12/730f79a0-b6b9-40e2-8011-c5e320b8b5ef.jpg"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm md:text-lg">Nova</h2>
                        <p className="text-[10px] md:text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 pr-4">
                    {/* Your Existing Profile Component - Now responsive */}
                    <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 ml-2 md:ml-4 border-l border-white/10 group cursor-pointer">
                        <div className="relative hidden xs:block">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-blue-500/50 transition-all duration-300">
                                <img
                                    src="https://pngtree.com"
                                    alt="Rahul Kumar Sharma"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-[#030712] rounded-full" />
                        </div>

                        <div className="flex flex-col text-left hidden sm:flex">
                            <span className="text-xs font-semibold text-white leading-tight group-hover:text-blue-400">
                                Rahul Kumar Sharma
                            </span>
                            <span className="text-[10px] text-blue-400/80 font-medium uppercase mt-0.5">
                                Pro Plan
                            </span>
                        </div>
                        <ChevronDown size={16} className="text-gray-500 group-hover:text-white" />
                    </div>

                    {/* NEW: Action Panel Toggle (Only visible on small/med screens) */}
                    <button 
                        onClick={() => setIsRightPanelOpen(true)}
                        className="lg:hidden p-2 text-gray-400 hover:text-white border border-white/10 rounded-lg ml-2"
                    >
                        <MessageSquare size={20} />
                    </button>
                </div>
            </header>

            <main className="flex flex-1 overflow-hidden relative">
                <section className="flex-1 flex flex-col h-full overflow-hidden border-white/5 relative">

                    {/* Voice Overlay */}
                    {isVoiceMode && <VoiceOverlay onClose={() => setIsVoiceMode(false)} />}

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
                        <Message role="user" content="Explain quantum computing in simple terms" />
                        <Message role="assistant" content="Quantum computing is a type of computing that uses qubits..." />

                        <div className="flex items-center gap-2 text-text-dim italic text-sm">
                            <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                                <span className="animate-bounce">...</span>
                            </div>
                            Thinking...
                        </div>
                    </div>

                    {/* Input Footer */}
                    <div className="p-4 md:p-6 shrink-0">
                        <ChatInput onMicClick={() => setIsVoiceMode(true)} />
                    </div>
                </section>

                {/* Floating Action Panel - Responsive Drawer Logic */}
                <aside className={`
                    fixed inset-y-0 right-0 z-50 w-72 bg-bg-deep border-white/10 p-6 transition-transform duration-300 ease-in-out
                    lg:relative lg:translate-x-0 lg:block lg:w-64 lg:border-l-white/5
                    ${isRightPanelOpen ? "translate-x-0 shadow-2xl bg-[var(--bg-primary)]" : "translate-x-full "}
                `}>
                    {/* Close button for Mobile Drawer */}
                    <div className="flex justify-between items-center lg:hidden mb-6">
                        <span className="text-xs font-bold text-gray-500">TOOLS</span>
                        <button onClick={() => setIsRightPanelOpen(false)}>
                            <X size={20} className="text-gray-400" />
                        </button>
                    </div>
                    <ActionPanel />
                </aside>

                {/* Backdrop overlay for mobile */}
                {isRightPanelOpen && (
                    <div 
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm lg:hidden z-40"
                        onClick={() => setIsRightPanelOpen(false)}
                    />
                )}
            </main>
        </div>
    );
}

