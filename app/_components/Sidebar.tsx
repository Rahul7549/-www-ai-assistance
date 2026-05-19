'use client';
import { PlusIcon,PanelLeftOpen,PanelRightOpen } from "lucide-react";
import UserProfile from "./UserProfile";
import { ChatItem } from "./ChatItem";



// import { Menu, Plus, MessageSquare, History, LogOut } from "lucide-react";

// export default function Sidebar() {
//   return (
//     <aside className="h-screen border-r border-white/5 flex flex-col items-center transition-all duration-300 
//       w-20 md:w-64 p-4"> {/* Narrow by default on small, wide on MD */}

//       {/* Top Branding / Hamburger */}
//       <div className="w-full flex items-center justify-center md:justify-between px-2 mb-8">
//         <span className="hidden md:block font-bold text-xl tracking-tight text-white">AuraAI</span>
//         <button className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
//           <Menu size={20} />
//         </button>
//       </div>

//       {/* New Chat Button */}
//       <button className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all
//         w-12 h-12 md:w-full md:h-auto md:py-3">
//         <Plus size={20} />
//         <span className="hidden md:block">New Chat</span>
//       </button>

//       {/* Navigation Icons (Visible on small screen) */}
//       <nav className="flex-1 w-full mt-8 flex flex-col items-center md:items-start gap-6">
//         <div className="flex flex-col items-center md:items-start w-full gap-2">
//            <p className="hidden md:block text-[10px] text-gray-500 uppercase px-2 mb-2">History</p>

//            {/* Message Icon for Chat History on small screens */}
//            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 w-full justify-center md:justify-start group">
//               <MessageSquare size={20} className="text-gray-400 group-hover:text-indigo-400" />
//               <span className="hidden md:block text-sm text-gray-300 font-medium">Recent Chats</span>
//            </button>

//            <button className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 w-full justify-center md:justify-start group">
//               <History size={20} className="text-gray-400 group-hover:text-indigo-400" />
//               <span className="hidden md:block text-sm text-gray-300 font-medium">Archive</span>
//            </button>
//         </div>
//       </nav>

//       {/* User Section */}
//       <div className="w-full pt-4 border-t border-white/5 flex justify-center md:justify-start">
//         <div className="md:hidden"> {/* Icon only for small screen */}
//            <div className="w-10 h-10 rounded-full bg-gray-700 border border-white/10" />
//         </div>
//         <div className="hidden md:block w-full">
//            <UserProfile name="Rahul Sharma" plan="Pro" />
//         </div>
//       </div>
//     </aside>
//   );
// }

// 'use client';
// import { Plus as PlusIcon, Menu, MessageSquare, History } from "lucide-react";
// import UserProfile from "./UserProfile";
// import { ChatItem } from "./ChatItem";


import { useState } from "react";
import { Menu, Plus, MessageSquare, History, X } from "lucide-react";

export default function Sidebar() {
    const [isOpen, setIsOpen] = useState(false); // Mobile closed by default

    return (
        <>
            {/* MOBILE OVERLAY: Darkens background when sidebar is popped open on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Floating Toggle Button for Mobile when Sidebar is Closed */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-4 left-4 p-2 bg-[#0B0F19] border border-white/10 rounded-lg text-gray-400 z-30 md:hidden hover:bg-white/5"
                >
                    <Menu size={20} />
                    {/* <PanelRightOpen size={20}/> */}

                </button>
            )}

            <aside className={` bg-[var(--bg-primary)]
        
        fixed top-0 left-0 h-screen border-r border-white/5 flex flex-col items-center transition-all duration-300 z-50 p-4
        
        
        ${isOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"}
        
       
        md:sticky md:translate-x-0 
        ${isOpen ? "md:w-64" : "md:w-20"}
      `}>

                {/* Top Branding / Hamburger */}
                <div className={`w-full flex items-center px-2 mb-8
          ${isOpen ? "justify-between" : "justify-center"}`}
                >
                    {/* Text is hidden on desktop only if sidebar is collapsed */}
                    <span className={`font-bold text-xl tracking-tight text-white
            ${isOpen ? "block" : "hidden md:hidden"}`}
                    >
                        AuraAI
                    </span>
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2 hover:bg-white/5 rounded-lg text-gray-400"
                    >
                        {/* Show an X close button on mobile layout */}
                        <span className="md:hidden"><X size={20} /></span>
                        <span className="hidden md:inline"><Menu size={20} /></span>
                    </button>
                </div>

                {/* New Chat Button */}
                {/* <button
                    className={`flex flex-row items-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 w-full py-3 gap-2 h-auto 
                       ${isOpen
                            ? "block md:py-3 md:px-4 items-start"
                            : "md:w-12 md:h-12 md:p-0 md:gap-0 "
                        }`}
                >
                    <Plus size={20} className="shrink-0" />
                    <span
                        className={`text-sm font-medium whitespace-nowrap transition-opacity duration-200
                        ${isOpen ? "block opacity-100" : "hidden md:hidden opacity-0"}`}
                    >
                        New Chat
                    </span>
                </button> */}

                <button className={`flex items-center p-3 rounded-xl hover:bg-white/5 w-full group transition-colors
              ${isOpen ? "justify-start gap-3" : "justify-center md:justify-center"}`}
                        >
                            <Plus size={20} className="text-gray-400 group-hover:text-indigo-400 shrink-0" />
                            <span className={`text-sm text-gray-300 font-medium whitespace-nowrap ${isOpen ? "block" : "hidden md:hidden"}`}>
                                New Chat
                            </span>
                        </button>


                {/* Navigation Links */}
                <nav className="flex-1 w-full mt-8 flex flex-col items-center gap-6">
                    <div className={`flex flex-col w-full gap-2 ${isOpen ? "items-start" : "items-center md:items-center"}`}>





                        <p className={`text-[10px] text-gray-500 uppercase px-2 mb-2 tracking-wider
                       ${isOpen ? "block" : "hidden md:hidden"}`}
                        >
                            History
                        </p>

                        {/* Message Icon for Chat History */}

                        


                        <button className={`flex items-center p-3 rounded-xl hover:bg-white/5 w-full group transition-colors
              ${isOpen ? "justify-start gap-3" : "justify-center md:justify-center"}`}
                        >
                            <MessageSquare size={20} className="text-gray-400 group-hover:text-indigo-400 shrink-0" />
                            <span className={`text-sm text-gray-300 font-medium whitespace-nowrap ${isOpen ? "block" : "hidden md:hidden"}`}>
                                Recent Chats
                            </span>
                        </button>

                        {/* Archive Icon */}
                        <button className={`flex items-center p-3 rounded-xl hover:bg-white/5 w-full group transition-colors
              ${isOpen ? "justify-start gap-3" : "justify-center md:justify-center"}`}
                        >
                            <History size={20} className="text-gray-400 group-hover:text-indigo-400 shrink-0" />
                            <span className={`text-sm text-gray-300 font-medium whitespace-nowrap ${isOpen ? "block" : "hidden md:hidden"}`}>
                                Archive
                            </span>
                        </button>
                    </div>
                </nav>

                {/* User Profile Section */}
                {/* <div className={`w-full pt-4 border-t border-white/5 flex
          ${isOpen ? "justify-start" : "justify-center md:justify-center"}`}
                >
                    {isOpen ? (
                        <div className="w-full">
                            <UserProfile name="Rahul Sharma" plan="Pro" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-700 border border-white/10 shrink-0 md:block hidden" />
                    )}
                </div> */}
            </aside>
        </>
    );
}
