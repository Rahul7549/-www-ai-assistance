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
import { ChevronDown, MessageSquare, PencilIcon, CheckIcon, X, Menu, PenSquare } from "lucide-react";

export interface PdfAttachment {
  fileName: string;
  url: string;
  pageCount: number;
  fileSize: string;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  size: number;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  pdfAttachment?: PdfAttachment;
  sourceFiles?: string[];
  files?: FileAttachment[];
}

interface MessageFromAPI {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
}

interface ChatAreaProps {
  onOpenSidebar?: () => void;
}

export default function ChatArea({ onOpenSidebar }: ChatAreaProps) {
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [pdfCards, setPdfCards] = useState<Map<string, PdfAttachment>>(new Map());
  const [inputPrefill, setInputPrefill] = useState<{ text: string; key: number }>({ text: "", key: 0 });
  const [indexingFiles, setIndexingFiles] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastSourceFiles, setLastSourceFiles] = useState<string[]>([]);
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
      setMessages((prev) => {
        const filesMap = new Map<string, FileAttachment[]>();
        for (const m of prev) {
          if (m.role === "user" && m.files?.length) {
            filesMap.set(m.content, m.files);
          }
        }
        return res.data.map((m) => {
          const role: "user" | "assistant" = m.role === "USER" ? "user" : "assistant";
          const files = role === "user" ? filesMap.get(m.content) : undefined;
          return { id: m.id, role, content: m.content, ...(files && { files }) };
        });
      });
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  }, []);

  // Load messages when switching conversations
  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([]);
      setPdfCards(new Map());
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

    socket.on("ai_searching", () => {
      if (!mounted) return;
      setIsSearching(true);
    });

    socket.on("ai_done", (data: { conversationId: string; sourceFiles?: string[] }) => {
      if (!mounted) return;
      streamingContentRef.current = "";
      setIsStreaming(false);
      setIsSearching(false);
      setIndexingFiles([]);
      if (data.sourceFiles?.length) {
        setLastSourceFiles(data.sourceFiles);
      } else {
        setLastSourceFiles([]);
      }
      loadMessagesFromDB(data.conversationId);
      refreshConversations();
    });

    socket.on("indexing_complete", (data: { fileId: string; fileName: string }) => {
      if (!mounted) return;
      setIndexingFiles((prev) => prev.filter((name) => name !== data.fileName));
    });

    socket.on("ai_error", (data: { message: string }) => {
      if (!mounted) return;
      streamingContentRef.current = "";
      setIsStreaming(false);
      setIsSearching(false);
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

    socket.on("ai_image", (data: { url: string; conversationId: string }) => {
      if (!mounted) return;
      streamingContentRef.current = "";
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === "streaming") {
          return [
            ...prev.slice(0, -1),
            { ...last, id: crypto.randomUUID(), content: `![Generated Image](${data.url})` },
          ];
        }
        return prev;
      });
    });

    socket.on("pdf_ready", (data: PdfAttachment & { conversationId?: string }) => {
      if (!mounted) return;
      setPdfCards((prev) => {
        const next = new Map(prev);
        next.set("latest", data);
        return next;
      });
    });

    return () => {
      mounted = false;
      socket.off("ai_token");
      socket.off("ai_done");
      socket.off("ai_error");
      socket.off("ai_image");
      socket.off("pdf_ready");
      socket.off("indexing_complete");
      socket.off("ai_searching");
      disconnectSocket();
    };
  }, [refreshConversations, loadMessagesFromDB]);

  const handleSend = async (content: string, fileIds?: string[], fileNames?: string[], fileInfos?: Array<{ name: string; mimeType: string; size: number }>) => {
    if (isStreaming || !assistant) return;

    if (fileNames?.length) {
      setIndexingFiles(fileNames);
    }

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
      { id: crypto.randomUUID(), role: "user", content, files: fileInfos },
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
      fileIds,
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
      {/* Header — Mobile: compact ChatGPT-style, Desktop: full with avatar & profile */}

      {/* Mobile header */}
      <header className="flex md:hidden items-center justify-between px-3 py-2 shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSidebar}
            className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <Menu size={20} />
          </button>

          {isEditingName ? (
            <div className="flex items-center gap-2 ml-1">
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
                className="bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-sm text-white font-semibold focus:outline-none focus:border-indigo-500/60 w-32"
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
            <button
              onClick={() => { setEditName(assistant?.name ?? ""); setIsEditingName(true); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="font-semibold text-sm text-white">{assistant?.name ?? "Nova"}</span>
              <ChevronDown size={16} className="text-gray-500" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => selectConversation(null)}
            className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            title="New chat"
          >
            <PenSquare size={20} />
          </button>
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden md:flex items-center justify-between p-3 pl-6 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-full overflow-hidden border border-white/10 flex items-center justify-center text-white font-semibold"
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
                <h2 className="font-semibold text-lg">{assistant?.name ?? "Nova"}</h2>
                <button
                  onClick={() => { setEditName(assistant?.name ?? ""); setIsEditingName(true); }}
                  className="p-1 rounded hover:bg-white/10 text-white/0 group-hover/name:text-white/40 transition-colors cursor-pointer"
                >
                  <PencilIcon size={14} />
                </button>
              </div>
            )}
            <p className="text-xs text-green-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Online
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 pr-4">
          <button
            onClick={() => setIsRightPanelOpen(true)}
            className="lg:hidden p-2 text-gray-400 hover:text-white border border-white/10 rounded-lg"
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden relative">
        <section className="flex-1 flex flex-col h-full overflow-hidden border-white/5 relative">
          {isVoiceMode && (
            <VoiceOverlay
              onClose={() => {
                setIsVoiceMode(false);
                if (selectedConversationId) {
                  loadMessagesFromDB(selectedConversationId);
                }
              }}
            />
          )}

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

              const isLastAssistant = msg.role === "assistant" && msg.id !== "streaming"
                && !messages.slice(idx + 1).some((m) => m.role === "assistant" && m.id !== "streaming");
              const pdf = isLastAssistant ? pdfCards.get("latest") : undefined;

              return (
                <MessageBubble
                  key={msg.id}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={msg.id === "streaming"}
                  assistantName={assistant?.name}
                  assistantAvatar={assistant?.avatar}
                  showHeader={showHeader}
                  pdfAttachment={pdf}
                  onEdit={canModify ? (newContent: string) => handleEditMessage(msg.id, newContent) : undefined}
                  onDelete={canModify ? () => handleDeleteMessage(msg.id) : undefined}
                  sourceFiles={isLastAssistant ? lastSourceFiles : undefined}
                  files={msg.files}
                />
              );
            })}

            {isSearching && (
              <div className="flex items-center gap-2 text-xs text-indigo-400/70 px-4 py-2">
                <div className="w-3 h-3 border-2 border-indigo-400/50 border-t-transparent rounded-full animate-spin" />
                Searching the web...
              </div>
            )}

            {indexingFiles.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-indigo-400/70 px-4">
                <div className="w-3 h-3 border-2 border-indigo-400/50 border-t-transparent rounded-full animate-spin" />
                Indexing: {indexingFiles.join(", ")}
              </div>
            )}

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
              prefill={inputPrefill}
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
          <ActionPanel onAction={(prompt) => {
            setInputPrefill((prev) => ({ text: prompt, key: prev.key + 1 }));
            setIsRightPanelOpen(false);
          }} />
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
