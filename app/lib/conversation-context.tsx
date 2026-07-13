"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";

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
  createdAt: string;
}

interface ConversationContextValue {
  assistant: Assistant | null;
  conversations: Conversation[];
  selectedConversationId: string | null;
  selectConversation: (id: string | null) => void;
  addConversation: (conv: Conversation) => void;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  renameAssistant: (newName: string) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const fetchConversations = useCallback(async (assistantId: string) => {
    try {
      const res = await api.get<{ success: boolean; data: Conversation[] }>(
        ENDPOINTS.conversations.listByAssistant(assistantId)
      );
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const res = await api.get<{ success: boolean; data: Assistant[] }>(ENDPOINTS.assistants.list);
        if (!mounted) return;

        let loadedAssistant: Assistant;
        if (res.data.length) {
          loadedAssistant = res.data[0];
        } else {
          const created = await api.post<{ success: boolean; data: Assistant }>(
            ENDPOINTS.assistants.create,
            { name: "Nova", personality: "FRIENDLY" }
          );
          if (!mounted) return;
          loadedAssistant = created.data;
        }

        setAssistant(loadedAssistant);
        await fetchConversations(loadedAssistant.id);
      } catch (err) {
        console.error("Failed to init assistant:", err);
      }
    };

    init();
    return () => { mounted = false; };
  }, [fetchConversations]);

  const selectConversation = useCallback((id: string | null) => {
    setSelectedConversationId(id);
  }, []);

  const addConversation = useCallback((conv: Conversation) => {
    setConversations((prev) => [conv, ...prev]);
    setSelectedConversationId(conv.id);
  }, []);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.delete(ENDPOINTS.conversations.delete(id));
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }, [selectedConversationId]);

  const refreshConversations = useCallback(async () => {
    if (assistant) {
      await fetchConversations(assistant.id);
    }
  }, [assistant, fetchConversations]);

  const renameAssistant = useCallback(async (newName: string) => {
    if (!assistant) return;
    try {
      const res = await api.put<{ success: boolean; data: Assistant }>(
        ENDPOINTS.assistants.update(assistant.id),
        { name: newName }
      );
      setAssistant(res.data);
    } catch (err) {
      console.error("Failed to rename assistant:", err);
    }
  }, [assistant]);

  return (
    <ConversationContext.Provider
      value={{
        assistant,
        conversations,
        selectedConversationId,
        selectConversation,
        addConversation,
        deleteConversation,
        refreshConversations,
        renameAssistant,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useConversation must be used inside ConversationProvider");
  return ctx;
}
