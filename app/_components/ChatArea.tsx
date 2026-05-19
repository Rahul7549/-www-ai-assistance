import { Message } from "./Message";
import ActionPanel from "./ActionPanel";
import ChatInput from "./ChatInput";
import VoiceAssistant from "../voice-assistance/page";
import { Bell, ChevronDown } from "lucide-react";

export default function ChatArea() {
    return (
        <div className="relative bg-bg-deep">
            {/* Central Chat Stream */}
            <header className="flex items-center justify-between p-3 pl-0 border-b-white/5 border-b">
                <div className="flex items-center gap-3 pl-6">
                    {/* <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500" /> */}
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        <img
                            src="https://imgcdn.stablediffusionweb.com/2025/11/4/b4a6f3c7-9564-4398-abc3-c82c51284b6d.webp"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h2 className="font-semibold text-lg">Nova</h2>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 text-text-dim">
                    {/* Icons: Search, Settings, etc. */}
                    {/* <div className="relative cursor-pointer hover:scale-110 transition-transform">
                        <Bell size={20} className="text-gray-400 hover:text-white" />
                        <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-blue-600 rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[#030712]">
                            3
                        </span>
                    </div> */}


                    <button className="flex items-center gap-3 pl-4  border-white/10 group">
                        {/* <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 group-hover:border-blue-500/50 transition-colors"> */}
                        {/* <img
                                src="https://imgcdn.stablediffusionweb.com/2025/11/4/b4a6f3c7-9564-4398-abc3-c82c51284b6d.webp"
                                alt="Arjun Dev"
                                className="w-full h-full object-cover"
                            /> */}
                        {/* </div> */}
                        <div className="flex items-center gap-3 pl-4 ml-4 border-l border-white/10 group cursor-pointer">
                            {/* Avatar with status indicator */}
                            <div className="relative">
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-blue-500/50 transition-all duration-300">
                                    <img
                                        src="https://png.pngtree.com/png-vector/20230831/ourmid/pngtree-man-avatar-image-for-profile-png-image_9197908.png"
                                        alt="Rahul Kumar Sharma"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                {/* Green Online Dot */}
                                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#030712] rounded-full" />
                            </div>

                            {/* Text Info */}
                            <div className="flex flex-col text-left">
                                <span className="text-xs font-semibold text-white leading-tight group-hover:text-blue-400 transition-colors">
                                    Rahul Kumar Sharma
                                </span>
                                <span className="text-[10px] text-blue-400/80 font-medium tracking-wide uppercase mt-0.5">
                                    Pro Plan
                                </span>
                            </div>

                            {/* Icon */}
                            <ChevronDown
                                size={16}
                                className="text-gray-500 group-hover:text-white group-hover:translate-y-0.5 transition-all duration-300"
                            />
                        </div>

                    </button>
                </div>
            </header>
            <main className="flex flex-1">

                <section className=" border-white/5 flex flex-1 flex-col h-full rounded-md">
                    {/* Header */}


                    {/* Messages Container */}

                    <section className="flex-1 flex flex-col h-full border-indigo-300/15 border-indigo-400 rounded-b-md min-h-[90vh] h-[90vh] ">



                        {/* <VoiceAssistant/> */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-8 pt-8 custom-scrollbar">
                            <Message
                                role="user"
                                content="Explain quantum computing in simple terms"
                            />
                            <Message
                                role="assistant"
                                content="Quantum computing is a type of computing that uses qubits..."
                            />
                            <div className="flex items-center gap-2 text-text-dim italic text-sm">
                                <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
                                    <span className="animate-bounce">...</span>
                                </div>
                                Thinking...
                            </div>
                        </div>

                        {/* Input Footer */}
                        <ChatInput />

                    </section>

                </section>

                {/* Floating Action Panel (Right Side) */}
                <ActionPanel />
            </main>
        </div>
    );
}
