"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useSpeechSynthesis, type VoiceOption } from "./useSpeechSynthesis";
import { useAudioAnalyser } from "./useAudioAnalyser";
import { getSocket } from "@/app/lib/socket";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";
import { useConversation } from "@/app/lib/conversation-context";

export type VoiceState =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "SPEAKING"
  | "MUTED"
  | "ERROR";

export interface UseVoiceSessionReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  aiResponse: string;
  volume: number;
  error: string | null;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  toggleMute: () => void;
  manualSend: () => void;
  selectedVoice: string;
  voices: VoiceOption[];
  setVoice: (voiceId: string) => void;
}

export function useVoiceSession(): UseVoiceSessionReturn {
  const [state, setState] = useState<VoiceState>("IDLE");
  const [aiResponse, setAiResponse] = useState("");
  const [sessionError, setSessionError] = useState<string | null>(null);

  const stateRef = useRef<VoiceState>("IDLE");
  const aiResponseRef = useRef("");
  const conversationIdRef = useRef<string | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const prevStateRef = useRef<VoiceState>("IDLE");
  const wasSpeakingRef = useRef(false);

  const {
    assistant,
    selectedConversationId,
    addConversation,
    refreshConversations,
  } = useConversation();

  const updateState = useCallback((newState: VoiceState) => {
    stateRef.current = newState;
    setState(newState);
  }, []);

  const tts = useSpeechSynthesis();

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || !assistant) return;

      if (stateRef.current === "SPEAKING") {
        tts.cancel();
      }

      updateState("PROCESSING");

      let convId = conversationIdRef.current || selectedConversationId;

      if (!convId) {
        try {
          const res = await api.post<{
            success: boolean;
            data: { id: string; title: string; assistantId: string; createdAt: string };
          }>(ENDPOINTS.conversations.create, { assistantId: assistant.id });
          convId = res.data.id;
          conversationIdRef.current = convId;
          addConversation(res.data);
        } catch {
          setSessionError("Failed to create conversation.");
          updateState("ERROR");
          return;
        }
      }

      aiResponseRef.current = "";
      setAiResponse("");

      const socket = getSocket();
      socket.emit("user_message", {
        conversationId: convId,
        content: transcript,
      });
    },
    [assistant, selectedConversationId, addConversation, updateState, tts]
  );

  const stt = useSpeechRecognition({
    onFinalTranscript: handleFinalTranscript,
    silenceTimeout: 1500,
  });

  const analyser = useAudioAnalyser();

  // Sync conversationIdRef when context changes
  useEffect(() => {
    conversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // Socket listeners for AI response
  useEffect(() => {
    const socket = getSocket();

    const handleToken = (data: { token: string }) => {
      if (stateRef.current !== "PROCESSING") return;
      aiResponseRef.current += data.token;
      setAiResponse(aiResponseRef.current);
    };

    const handleDone = () => {
      if (stateRef.current !== "PROCESSING") return;
      const fullResponse = aiResponseRef.current;
      refreshConversations();

      if (fullResponse.trim()) {
        updateState("SPEAKING");
        tts.speak(fullResponse);
      } else {
        updateState("LISTENING");
        stt.reset();
        stt.start();
      }
    };

    const handleError = (data: { message: string }) => {
      setSessionError(data.message);
      updateState("ERROR");
    };

    socket.on("ai_token", handleToken);
    socket.on("ai_done", handleDone);
    socket.on("ai_error", handleError);

    return () => {
      socket.off("ai_token", handleToken);
      socket.off("ai_done", handleDone);
      socket.off("ai_error", handleError);
    };
  }, [tts, stt, updateState, refreshConversations]);

  // Transition from SPEAKING → LISTENING when TTS finishes
  // Must wait for isSpeaking to become true first, then detect false
  useEffect(() => {
    if (tts.isSpeaking) {
      wasSpeakingRef.current = true;
    }
    if (stateRef.current === "SPEAKING" && wasSpeakingRef.current && !tts.isSpeaking) {
      wasSpeakingRef.current = false;
      updateState("LISTENING");
      stt.reset();
      stt.start();
    }
  }, [tts.isSpeaking, stt, updateState]);

  const start = useCallback(async () => {
    if (!stt.isSupported) {
      setSessionError(
        "Voice chat is not supported in this browser. Please use Chrome or Edge."
      );
      updateState("ERROR");
      return;
    }

    setSessionError(null);
    setAiResponse("");
    aiResponseRef.current = "";

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      analyser.start(stream);
      stt.start();
      updateState("LISTENING");
    } catch {
      setSessionError(
        "Microphone access is required for voice chat. Please allow microphone access and try again."
      );
      updateState("ERROR");
    }
  }, [stt, analyser, updateState]);

  const stop = useCallback(() => {
    stt.stop();
    tts.cancel();
    analyser.stop();

    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }

    const socket = getSocket();
    socket.emit("cancel_stream");

    setAiResponse("");
    aiResponseRef.current = "";
    conversationIdRef.current = null;
    wasSpeakingRef.current = false;
    updateState("IDLE");
  }, [stt, tts, analyser, updateState]);

  const toggleMute = useCallback(() => {
    if (stateRef.current === "MUTED") {
      updateState(prevStateRef.current === "MUTED" ? "LISTENING" : prevStateRef.current);
      stt.start();
    } else {
      prevStateRef.current = stateRef.current;
      stt.stop();
      updateState("MUTED");
    }
  }, [stt, updateState]);

  const manualSend = useCallback(() => {
    const text = stt.transcript.trim();
    if (text) {
      stt.stop();
      handleFinalTranscript(text);
    }
  }, [stt, handleFinalTranscript]);

  const isSupported = stt.isSupported && tts.isSupported;
  const combinedError = sessionError || stt.error;

  return {
    state,
    transcript: stt.transcript,
    interimTranscript: stt.interimTranscript,
    aiResponse,
    volume: analyser.volume,
    error: combinedError,
    isSupported,
    start,
    stop,
    toggleMute,
    manualSend,
    selectedVoice: tts.selectedVoice,
    voices: tts.voices,
    setVoice: tts.setVoice,
  };
}
