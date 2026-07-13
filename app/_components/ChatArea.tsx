"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import MessageBubble from "./chat/MessageBubble";
import StreamingIndicator from "./chat/StreamingIndicator";
import ActionPanel from "./ActionPanel";
import ChatInput from "./ChatInput";
import VoiceOverlay from "./VoiceOverlay";
import { getSocket, disconnectSocket } from "@/app/lib/socket";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";
import { ChevronDown, MessageSquare, X } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Assistant {
  id: string;
  name: string;
  avatar: string;
  personality: string;
}

interface Conversation {
  id: string;
  title: string;
  assistantId: string;
}

export default function ChatArea() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef("");

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Assistant[] }>(ENDPOINTS.assistants.list);
        if (!mounted) return;

        if (res.data.length) {
          setAssistant(res.data[0]);
        } else {
          const created = await api.post<{ success: boolean; data: Assistant }>(
            ENDPOINTS.assistants.create,
            { name: "Nova", personality: "FRIENDLY" }
          );
          if (mounted) setAssistant(created.data);
        }
      } catch (err) {
        console.error("Failed to load assistant:", err);
      }
    };

    init();

    const socket = getSocket();
    socket.connect();

    socket.on("ai_token", (data: { token: string }) => {
      if (!mounted) return;
      streamingContentRef.current += data.token;
      const updated = streamingContentRef.current;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === "streaming") {
          return [...prev.slice(0, -1), { ...last, content: updated }];
        }
        return prev;
      });
    });

    socket.on("ai_done", (data: { conversationId: string; content: string }) => {
      if (!mounted) return;
      streamingContentRef.current = "";
      setIsStreaming(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === "streaming") {
          return [
            ...prev.slice(0, -1),
            { ...last, id: crypto.randomUUID(), content: data.content },
          ];
        }
        return prev;
      });
    });

    socket.on("ai_error", (data: { message: string }) => {
      if (!mounted) return;
      streamingContentRef.current = "";
      setIsStreaming(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === "streaming") {
          return [
            ...prev.slice(0, -1),
            { ...last, id: crypto.randomUUID(), content: `Error: ${data.message}` },
          ];
        }
        return prev;
      });
    });

    return () => {
      mounted = false;
      disconnectSocket();
    };
  }, []);

  const handleSend = async (content: string) => {
    if (isStreaming || !assistant) return;

    let activeConversationId = conversationId;

    if (!activeConversationId) {
      try {
        const res = await api.post<{ data: Conversation }>(ENDPOINTS.conversations.create, {
          assistantId: assistant.id,
        });
        activeConversationId = res.data.id;
        setConversationId(activeConversationId);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content },
    ]);

    setIsStreaming(true);
    streamingContentRef.current = "";
    setMessages((prev) => [
      ...prev,
      { id: "streaming", role: "assistant", content: "" },
    ]);

    const socket = getSocket();
    socket.emit("user_message", {
      conversationId: activeConversationId,
      content,
    });
  };

  return (
    <div className="relative bg-bg-deep h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-3 pl-0 border-b-white/5 border-b shrink-0">
        <div className="flex items-center gap-3 pl-6">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/10">
            <img
              src="https://imgcdn.stablediffusionweb.com/2024/12/12/730f79a0-b6b9-40e2-8011-c5e320b8b5ef.jpg"
              className="w-full h-full object-cover"
              alt={assistant?.name ?? "Nova"}
            />
          </div>
          <div>
            <h2 className="font-semibold text-sm md:text-lg">{assistant?.name ?? "Nova"}</h2>
            <p className="text-[10px] md:text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 pr-4">
          <div className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 ml-2 md:ml-4 border-l border-white/10 group cursor-pointer">
            <div className="relative hidden xs:block">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full overflow-hidden border-2 border-white/5 group-hover:border-blue-500/50 transition-all duration-300">
                <img
                  src="https://pngtree.com"
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 border border-[#030712] rounded-full" />
            </div>
            <div className="flex-col text-left hidden sm:flex">
              <span className="text-xs font-semibold text-white leading-tight group-hover:text-blue-400">
                Rahul Kumar Sharma
              </span>
              <span className="text-[10px] text-blue-400/80 font-medium uppercase mt-0.5">
                Pro Plan
              </span>
            </div>
            <ChevronDown size={16} className="text-gray-500 group-hover:text-white" />
          </div>

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
          {isVoiceMode && <VoiceOverlay onClose={() => setIsVoiceMode(false)} />}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4">
                  <MessageSquare size={28} className="text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Start a conversation</h3>
                <p className="text-sm text-gray-500 max-w-md">
                  Type a message below to start chatting with {assistant?.name ?? "your assistant"}.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.id === "streaming"}
              />
            ))}

            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <StreamingIndicator />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 md:p-6 shrink-0">
            <ChatInput
              onMicClick={() => setIsVoiceMode(true)}
              onSend={handleSend}
              disabled={isStreaming || !assistant}
            />
          </div>
        </section>

        {/* Action Panel */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-50 w-72 bg-bg-deep border-white/10 p-6 transition-transform duration-300 ease-in-out
            lg:relative lg:translate-x-0 lg:block lg:w-64 lg:border-l-white/5
            ${isRightPanelOpen ? "translate-x-0 shadow-2xl bg-[var(--bg-primary)]" : "translate-x-full"}
          `}
        >
          <div className="flex justify-between items-center lg:hidden mb-6">
            <span className="text-xs font-bold text-gray-500">TOOLS</span>
            <button onClick={() => setIsRightPanelOpen(false)}>
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          <ActionPanel />
        </aside>

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
