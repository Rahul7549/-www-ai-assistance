"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  VoiceSession,
  type VoiceState,
  type VoiceOption,
} from "../voice/VoiceSession";
import { getSocket } from "@/app/lib/socket";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";
import { useConversation } from "@/app/lib/conversation-context";

export type { VoiceState, VoiceOption } from "../voice/VoiceSession";

export interface UseVoiceSessionReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  volume: number;
  error: string | null;
  isSupported: boolean;
  isWarmingUp: boolean;
  start: () => void;
  stop: () => void;
  toggleMute: () => void;
  manualSend: () => void;
  selectedVoice: string;
  voices: VoiceOption[];
  setVoice: (voiceId: string) => void;
}

interface Snapshot {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  volume: number;
  error: string | null;
  isSupported: boolean;
  isWarmingUp: boolean;
  selectedVoice: string;
  voices: VoiceOption[];
}

function takeSnapshot(s: VoiceSession): Snapshot {
  return {
    state: s.state,
    transcript: s.transcript,
    interimTranscript: s.interimTranscript,
    aiResponse: s.aiResponse,
    volume: s.volume,
    error: s.error,
    isSupported: s.isSupported,
    isWarmingUp: s.isWarmingUp,
    selectedVoice: s.selectedVoice,
    voices: s.voices,
  };
}

function checkSupport(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
    "speechSynthesis" in window
  );
}

export function useVoiceSession(): UseVoiceSessionReturn {
  // Lazy-ref init: the == null pattern is the lint-approved way
  const sessionRef = useRef<VoiceSession | null>(null);
  if (sessionRef.current == null) {
    sessionRef.current = new VoiceSession();
  }

  const [snap, setSnap] = useState<Snapshot>(() => ({
    state: "IDLE" as const,
    transcript: "",
    interimTranscript: "",
    aiResponse: "",
    volume: 0,
    error: null,
    isSupported: checkSupport(),
    isWarmingUp: false,
    selectedVoice: "Nova - Energetic & Fast",
    voices: [],
  }));

  const {
    assistant,
    selectedConversationId,
    addConversation,
    refreshConversations,
  } = useConversation();

  const conversationIdRef = useRef<string | null>(null);
  const assistantRef = useRef(assistant);
  const addConvRef = useRef(addConversation);
  const refreshRef = useRef(refreshConversations);

  useEffect(() => {
    assistantRef.current = assistant;
    addConvRef.current = addConversation;
    refreshRef.current = refreshConversations;
  });

  useEffect(() => {
    conversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Wire up session callbacks — ref access inside effects is fine
  useEffect(() => {
    const s = sessionRef.current!;

    s.onChange = () => setSnap(takeSnapshot(s));

    s.onFinalTranscript = async (transcript: string) => {
      const ast = assistantRef.current;
      if (!transcript.trim() || !ast) return;

      s.setProcessing();

      let convId = conversationIdRef.current;
      if (!convId) {
        try {
          const res = await api.post<{
            success: boolean;
            data: {
              id: string;
              title: string;
              assistantId: string;
              createdAt: string;
            };
          }>(ENDPOINTS.conversations.create, { assistantId: ast.id });
          convId = res.data.id;
          conversationIdRef.current = convId;
          addConvRef.current(res.data);
        } catch {
          s.handleError("Failed to create conversation.");
          return;
        }
      }

      const socket = getSocket();
      socket.emit("user_message", {
        conversationId: convId,
        content: transcript,
        mode: "voice",
      });
    };

    // Emit initial snapshot so voices etc. are picked up
    setSnap(takeSnapshot(s));

    return () => {
      s.onChange = null;
      s.onFinalTranscript = null;
    };
  }, []);

  // Socket listeners
  useEffect(() => {
    const s = sessionRef.current!;
    const socket = getSocket();

    const onToken = (data: { token: string }) => {
      s.addToken(data.token);
    };

    const onDone = (data?: { conversationId?: string; content?: string }) => {
      refreshRef.current();
      s.handleDone(data?.content);
    };

    const onError = (data: { message: string }) => {
      s.handleError(data.message);
    };

    const onModelReady = () => {
      s.modelReady();
    };

    socket.on("ai_token", onToken);
    socket.on("ai_done", onDone);
    socket.on("ai_error", onError);
    socket.on("model_ready", onModelReady);

    return () => {
      socket.off("ai_token", onToken);
      socket.off("ai_done", onDone);
      socket.off("ai_error", onError);
      socket.off("model_ready", onModelReady);
    };
  }, []);

  // Methods wrapped in useCallback — ref access inside callbacks is fine
  const start = useCallback(() => {
    getSocket().emit("warm_model");
    sessionRef.current?.start();
  }, []);

  const stop = useCallback(() => {
    sessionRef.current?.stop();
  }, []);

  const toggleMute = useCallback(() => {
    sessionRef.current?.toggleMute();
  }, []);

  const manualSend = useCallback(() => {
    sessionRef.current?.manualSend();
  }, []);

  const setVoice = useCallback((id: string) => {
    sessionRef.current?.setVoice(id);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      sessionRef.current?.destroy();
    };
  }, []);

  return {
    ...snap,
    start,
    stop,
    toggleMute,
    manualSend,
    setVoice,
  };
}
