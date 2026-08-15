"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Square, ArrowLeft } from "lucide-react";
import { getSocket, reconnectSocket, disconnectSocket } from "@/app/lib/socket";
import { api } from "@/app/lib/api";
import { ENDPOINTS } from "@/app/lib/endpoints";
import { useRouter } from "next/navigation";

type Phase = "idle" | "listening" | "thinking" | "speaking";

interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } }; length: number };
  resultIndex: number;
}

const VoiceAssistant = () => {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const assistantIdRef = useRef<string | null>(null);
  const responseRef = useRef("");
  const transcriptRef = useRef("");
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const bars = Array.from({ length: 15 });

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    synthRef.current = null;
  }, []);

  const speak = useCallback((text: string) => {
    stopSpeaking();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onend = () => {
      setPhase("idle");
      synthRef.current = null;
    };
    utterance.onerror = () => {
      setPhase("idle");
      synthRef.current = null;
    };
    synthRef.current = utterance;
    setPhase("speaking");
    window.speechSynthesis.speak(utterance);
  }, [stopSpeaking]);

  const initConversation = useCallback(async () => {
    try {
      const assistantsRes = await api.get<{ success: boolean; data: { id: string }[] }>(
        ENDPOINTS.assistants.list
      );
      const assistantId = assistantsRes.data[0]?.id;
      if (!assistantId) throw new Error("No assistant found");
      assistantIdRef.current = assistantId;

      const convRes = await api.post<{ success: boolean; data: { id: string } }>(
        ENDPOINTS.conversations.create,
        { assistantId, title: "Voice Chat" }
      );
      conversationIdRef.current = convRes.data.id;
    } catch (err) {
      console.error("Failed to init voice conversation:", err);
      setError("Failed to connect. Please try again.");
    }
  }, []);

  useEffect(() => {
    initConversation();

    const socket = reconnectSocket();
    socketRef.current = socket;
    socket.connect();

    let tokenBuffer = "";

    socket.on("ai_token", (data: { token: string }) => {
      tokenBuffer += data.token;
      responseRef.current = tokenBuffer;
      setResponse(tokenBuffer);
    });

    socket.on("ai_done", () => {
      const fullText = responseRef.current;
      if (fullText) {
        speak(fullText);
      } else {
        setPhase("idle");
      }
      tokenBuffer = "";
      responseRef.current = "";
    });

    socket.on("ai_error", (data: { message: string }) => {
      setError(data.message);
      setPhase("idle");
      tokenBuffer = "";
      responseRef.current = "";
    });

    return () => {
      socket.off("ai_token");
      socket.off("ai_done");
      socket.off("ai_error");
      disconnectSocket();
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [initConversation, speak, stopSpeaking]);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript("");
    setResponse("");
    stopSpeaking();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setPhase("listening");
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }
      setTranscript(finalTranscript);
      transcriptRef.current = finalTranscript;
    };

    recognition.onend = () => {
      const text = transcriptRef.current;
      if (text.trim() && socketRef.current && conversationIdRef.current) {
        setPhase("thinking");
        setResponse("");
        responseRef.current = "";
        socketRef.current.emit("user_message", {
          conversationId: conversationIdRef.current,
          content: text.trim(),
          mode: "voice",
        });
      } else {
        setPhase("idle");
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "no-speech") {
        setPhase("idle");
      } else if (event.error !== "aborted") {
        setError(`Mic error: ${event.error}`);
        setPhase("idle");
      }
    };

    recognition.start();
  }, [stopSpeaking]);

  const stopSession = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    stopSpeaking();
    socketRef.current?.emit("cancel_stream");
    setPhase("idle");
    setTranscript("");
    setResponse("");
  }, [stopSpeaking]);

  const phaseConfig = {
    idle: { label: "Tap to speak", color: "text-gray-400", dotColor: "bg-gray-400", bgColor: "bg-gray-500/10", borderColor: "border-gray-500/20" },
    listening: { label: "Listening...", color: "text-emerald-400", dotColor: "bg-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
    thinking: { label: "Thinking...", color: "text-amber-400", dotColor: "bg-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/20" },
    speaking: { label: "Speaking...", color: "text-indigo-400", dotColor: "bg-indigo-400", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/20" },
  };

  const cfg = phaseConfig[phase];

  return (
    <main className="flex items-center justify-center min-h-screen bg-[#020617] p-4 text-white">
      <div className="w-full max-w-sm aspect-[9/16] bg-[#0b1120] rounded-[48px] border border-white/5 shadow-2xl flex flex-col items-center justify-between py-12 px-8 relative overflow-hidden">

        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-6 left-6 p-2 bg-white/5 rounded-full border border-white/10 text-gray-400 hover:text-white transition-colors z-10"
        >
          <ArrowLeft size={18} />
        </button>

        {/* Status badge */}
        <div className={`${cfg.bgColor} border ${cfg.borderColor} px-4 py-1.5 rounded-full flex items-center gap-2`}>
          <div className={`w-1.5 h-1.5 ${cfg.dotColor} rounded-full animate-pulse`} />
          <span className={`${cfg.color} text-xs font-medium uppercase tracking-wider`}>{cfg.label}</span>
        </div>

        {/* Center: Orb + Signals */}
        <div className="relative w-full flex items-center justify-center">
          {/* Left Frequency Signal */}
          <div className="flex items-center gap-1.5 absolute right-[70%] rotate-180">
            {bars.map((_, i) => (
              <motion.div
                key={`left-${i}`}
                className="w-[3px] bg-indigo-500/40 rounded-full"
                animate={
                  phase === "listening" || phase === "speaking"
                    ? { height: [10, 40, 15, 50, 10] }
                    : { height: 10 }
                }
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              />
            ))}
          </div>

          {/* Orb - tap to start */}
          <button
            onClick={phase === "idle" ? startListening : stopSession}
            className="relative group focus:outline-none"
          >
            <motion.div
              animate={
                phase !== "idle"
                  ? { scale: [1, 1.2, 1], opacity: [0.2, 0.5, 0.2] }
                  : { scale: 1, opacity: 0.1 }
              }
              transition={{ repeat: Infinity, duration: 3 }}
              className="absolute -inset-8 border border-indigo-400/30 rounded-full"
            />
            <div className="w-32 h-32 rounded-full bg-black relative z-10 flex items-center justify-center p-[3px] overflow-hidden">
              <div
                className={`absolute inset-0 bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#22d3ee,#3b82f6)] ${
                  phase !== "idle" ? "animate-[spin_4s_linear_infinite]" : ""
                }`}
              />
              <div className="absolute inset-[3px] bg-[#0b1120] rounded-full flex items-center justify-center gap-4">
                {phase === "idle" ? (
                  <Mic size={32} className="text-indigo-400" />
                ) : (
                  <>
                    <motion.div
                      animate={{ scaleY: [1, 0.1, 1] }}
                      transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2] }}
                      className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                    />
                    <motion.div
                      animate={{ scaleY: [1, 0.1, 1] }}
                      transition={{ repeat: Infinity, duration: 4, times: [0, 0.1, 0.2] }}
                      className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                    />
                  </>
                )}
              </div>
            </div>
          </button>

          {/* Right Frequency Signal */}
          <div className="flex items-center gap-1.5 absolute left-[70%]">
            {bars.map((_, i) => (
              <motion.div
                key={`right-${i}`}
                className="w-[3px] bg-indigo-500/40 rounded-full"
                animate={
                  phase === "listening" || phase === "speaking"
                    ? { height: [10, 50, 20, 40, 10] }
                    : { height: 10 }
                }
                transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
              />
            ))}
          </div>
        </div>

        {/* Transcript / Response */}
        <div className="text-center min-h-[80px] flex flex-col justify-center px-2">
          {error ? (
            <p className="text-red-400 text-sm">{error}</p>
          ) : phase === "listening" && transcript ? (
            <>
              <p className="text-gray-500 text-xs mb-1">You said:</p>
              <p className="text-white text-sm">{transcript}</p>
            </>
          ) : phase === "thinking" ? (
            <>
              <p className="text-gray-500 text-xs mb-1">You asked:</p>
              <p className="text-white text-sm mb-2">{transcript}</p>
            </>
          ) : (phase === "speaking" || response) ? (
            <>
              <p className="text-gray-500 text-xs mb-1">Response:</p>
              <p className="text-white text-sm line-clamp-4">{response}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-1">Speak now</h2>
              <p className="text-gray-500 text-sm">Tap the orb and ask anything</p>
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-10">
          <button
            onClick={phase === "idle" ? startListening : undefined}
            className={`p-4 rounded-full border border-white/10 ${
              phase === "idle" ? "bg-white/5 text-gray-400 hover:text-white" : "bg-white/5 text-gray-600"
            }`}
            disabled={phase !== "idle"}
          >
            {phase === "idle" ? <Mic size={22} /> : <MicOff size={22} />}
          </button>
          <button
            onClick={phase !== "idle" ? stopSession : startListening}
            className={`p-6 rounded-full shadow-lg ${
              phase !== "idle"
                ? "bg-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)]"
                : "bg-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]"
            }`}
          >
            {phase !== "idle" ? (
              <Square fill="white" size={24} className="text-white" />
            ) : (
              <Mic size={24} className="text-white" />
            )}
          </button>
          <button
            onClick={() => router.push("/")}
            className="p-4 bg-white/5 rounded-full border border-white/10 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={22} />
          </button>
        </div>
      </div>
    </main>
  );
};

export default VoiceAssistant;
