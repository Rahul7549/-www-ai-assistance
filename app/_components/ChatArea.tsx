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
import { useConversation } from "@/app/lib/conversation-context";
import { ChevronDown, MessageSquare, PencilIcon, CheckIcon, X } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageFromAPI {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

export default function ChatArea() {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingContentRef = useRef("");
  const skipLoadRef = useRef(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  const {
    assistant,
    selectedConversationId,
    selectConversation,
    addConversation,
    refreshConversations,
    renameAssistant,
  } = useConversation();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const loadMessagesFromDB = useCallback(async (convId: string) => {
    try {
      const res = await api.get<{ success: boolean; data: MessageFromAPI[] }>(
        ENDPOINTS.conversations.messages(convId)
      );
      setMessages(
        res.data.map((m) => ({
          id: m.id,
          role: m.role === "USER" ? "user" : "assistant",
          content: m.content,
        }))
      );
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  // Load messages when switching conversations
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }

    setIsLoadingMessages(true);
    loadMessagesFromDB(selectedConversationId).finally(() => setIsLoadingMessages(false));
  }, [selectedConversationId, loadMessagesFromDB]);

  // Socket lifecycle
  useEffect(() => {
    let mounted = true;
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

    socket.on("ai_done", (data: { conversationId: string }) => {
      if (!mounted) return;
      streamingContentRef.current = "";
      setIsStreaming(false);
      loadMessagesFromDB(data.conversationId);
      refreshConversations();
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
  }, [refreshConversations, loadMessagesFromDB]);

  const handleSend = async (content: string) => {
    if (isStreaming || !assistant) return;

    let activeConversationId = selectedConversationId;

    if (!activeConversationId) {
      try {
        const res = await api.post<{ data: { id: string; title: string; assistantId: string; createdAt: string } }>(
          ENDPOINTS.conversations.create,
          { assistantId: assistant.id }
        );
        activeConversationId = res.data.id;
        skipLoadRef.current = true;
        addConversation(res.data);
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

  const handleStopStreaming = () => {
    const socket = getSocket();
    socket.emit("cancel_stream");
    streamingContentRef.current = "";
    setIsStreaming(false);
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.id === "streaming") {
        if (!last.content) return prev.slice(0, -1);
        return [...prev.slice(0, -1), { ...last, id: crypto.randomUUID() }];
      }
      return prev;
    });
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!selectedConversationId || isStreaming) return;
    try {
      await api.put(
        ENDPOINTS.conversations.editMessage(selectedConversationId, messageId),
        { content: newContent, regenerate: true }
      );

      const idx = messages.findIndex((m) => m.id === messageId);
      setMessages((prev) => [
        ...prev.slice(0, idx),
        { ...prev[idx], content: newContent },
        { id: "streaming", role: "assistant" as const, content: "" },
      ]);

      setIsStreaming(true);
      streamingContentRef.current = "";

      const socket = getSocket();
      socket.emit("user_message", {
        conversationId: selectedConversationId,
        content: newContent,
      });
    } catch (err) {
      console.error("Failed to edit message:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedConversationId) return;
    try {
      await api.delete(
        ENDPOINTS.conversations.deleteMessage(selectedConversationId, messageId)
      );
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div className="relative bg-bg-deep h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-3 pl-0 border-b-white/5 border-b shrink-0">
        <div className="flex items-center gap-3 pl-6">
          <div
            className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border border-white/10 flex items-center justify-center text-white font-semibold"
            style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)" }}
          >
            {assistant?.avatar && assistant.avatar !== "default" ? (
              <img
                src={`/avatars/${assistant.avatar.toLowerCase()}.png`}
                className="w-full h-full object-cover"
                alt={assistant?.name ?? "Nova"}
              />
            ) : (
              <span className="text-lg">{(assistant?.name ?? "N").charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const trimmed = editName.trim();
                      if (trimmed && trimmed !== assistant?.name) renameAssistant(trimmed);
                      setIsEditingName(false);
                    }
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                  className="bg-white/[0.05] border border-indigo-500/30 rounded-lg px-2 py-1 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500/60 w-32"
                />
                <button
                  onClick={() => {
                    const trimmed = editName.trim();
                    if (trimmed && trimmed !== assistant?.name) renameAssistant(trimmed);
                    setIsEditingName(false);
                  }}
                  className="p-1 rounded hover:bg-white/10 text-green-400 cursor-pointer"
                >
                  <CheckIcon size={16} />
                </button>
                <button
                  onClick={() => setIsEditingName(false)}
                  className="p-1 rounded hover:bg-white/10 text-gray-400 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/name">
                <h2 className="font-semibold text-sm md:text-lg">{assistant?.name ?? "Nova"}</h2>
                <button
                  onClick={() => { setEditName(assistant?.name ?? ""); setIsEditingName(true); }}
                  className="p-1 rounded hover:bg-white/10 text-white/0 group-hover/name:text-white/40 transition-colors cursor-pointer"
                >
                  <PencilIcon size={14} />
                </button>
              </div>
            )}
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
            {isLoadingMessages && (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!isLoadingMessages && messages.length === 0 && (
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

            {messages.map((msg, idx) => {
              if (msg.id === "streaming" && !msg.content) return null;
              const prevMsg = messages[idx - 1];
              const showHeader = msg.role !== "assistant" || !prevMsg || prevMsg.role !== "assistant";
              const canModify = msg.role === "user" && msg.id !== "streaming" && !isStreaming && !!selectedConversationId;
              return (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.id === "streaming"}
                  assistantName={assistant?.name}
                  assistantAvatar={assistant?.avatar}
                  showHeader={showHeader}
                  onEdit={canModify ? (newContent: string) => handleEditMessage(msg.id, newContent) : undefined}
                  onDelete={canModify ? () => handleDeleteMessage(msg.id) : undefined}
                />
              );
            })}

            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <StreamingIndicator assistantName={assistant?.name} assistantAvatar={assistant?.avatar} />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 md:p-6 shrink-0">
            <ChatInput
              onMicClick={() => setIsVoiceMode(true)}
              onSend={handleSend}
              onStop={handleStopStreaming}
              disabled={isStreaming || !assistant}
              isStreaming={isStreaming}
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
