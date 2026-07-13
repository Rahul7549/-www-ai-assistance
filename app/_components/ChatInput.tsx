"use client";
import { useState } from "react";
import { MicIcon, PaperclipIcon, SendIcon, SquareIcon } from "lucide-react";

interface ChatInputProps {
    onMicClick?: () => void;
    onSend: (message: string) => void;
    onStop?: () => void;
    disabled?: boolean;
    isStreaming?: boolean;
}

export default function ChatInput({ onMicClick, onSend, onStop, disabled, isStreaming }: ChatInputProps) {
    const [input, setInput] = useState("");

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed || disabled) return;
        onSend(trimmed);
        setInput("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="p-6 pt-0">
            <div className="max-w-4xl mx-auto relative">
                <div className="relative flex items-center group">
                    <input
                        type="text"
                        placeholder="Message Nova..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        className="w-full bg-bg-card border border-white/10 rounded-2xl py-4 px-6 pr-32 focus:outline-none focus:border-brand-primary/50 transition-all shadow-2xl disabled:opacity-50"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3">
                        <button className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <PaperclipIcon size={20} />
                        </button>
                        <button onClick={onMicClick} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
                            <MicIcon size={20} />
                        </button>
                        {isStreaming ? (
                            <button
                                onClick={onStop}
                                className="bg-red-600 p-2.5 rounded-xl hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-red-500/20 cursor-pointer"
                            >
                                <SquareIcon size={18} className="text-white fill-white" />
                            </button>
                        ) : (
                            <button
                                onClick={handleSend}
                                disabled={disabled || !input.trim()}
                                className="bg-indigo-600 p-2.5 rounded-xl hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <SendIcon size={18} className="text-white" />
                            </button>
                        )}
                    </div>
                </div>
                <p className="text-[10px] text-center text-text-dim mt-3">
                    Nova can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    );
}
