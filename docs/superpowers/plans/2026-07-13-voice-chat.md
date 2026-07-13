# Real-Time Voice Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add browser-native real-time voice conversation (STT + TTS) to the AI assistant, reusing the existing Socket.IO text pipeline with zero backend changes.

**Architecture:** Four custom React hooks (`useSpeechRecognition`, `useSpeechSynthesis`, `useAudioAnalyser`, `useVoiceSession`) compose the voice pipeline. `useVoiceSession` orchestrates a state machine (IDLE → LISTENING → PROCESSING → SPEAKING → loop) that coordinates STT input, Socket.IO messaging, and TTS output. The existing `VoiceOverlay.tsx` is rewritten to consume `useVoiceSession` and render volume-reactive animations.

**Tech Stack:** Web Speech API (SpeechRecognition + SpeechSynthesis), Web Audio API (AudioContext + AnalyserNode), React 19 hooks, framer-motion, Socket.IO (existing), TypeScript

## Global Constraints

- Next.js 16 App Router, React 19, TypeScript strict
- Tailwind CSS v4 via `@tailwindcss/postcss` — no tailwind.config, use CSS vars in `globals.css`
- All components are `"use client"` (browser APIs required)
- Path alias: `@/*` maps to project root
- Icons: `lucide-react` only
- Socket helper: import `{ getSocket }` from `@/app/lib/socket`
- API helper: import `{ api }` from `@/app/lib/api`
- Endpoints: import `{ ENDPOINTS }` from `@/app/lib/endpoints`
- Conversation context: import `{ useConversation }` from `@/app/lib/conversation-context`
- No backend changes — voice is entirely browser-side
- Dark theme only — use CSS vars (`--bg-primary`, `--text-primary`, etc.)
- No test framework configured — manual browser testing only
- Animations: `framer-motion` for orb/bars, CSS transitions for state changes

## File Structure

```
app/_components/
  hooks/
    useSpeechRecognition.ts   ← NEW: Web Speech API STT wrapper
    useSpeechSynthesis.ts     ← NEW: Web Speech API TTS wrapper
    useAudioAnalyser.ts       ← NEW: Mic volume via Web Audio API
    useVoiceSession.ts        ← NEW: State machine orchestrator
  VoiceOverlay.tsx            ← REWRITE: Full voice conversation UI
  ChatArea.tsx                ← MODIFY: Pass props to VoiceOverlay, refresh on close
```

---

### Task 1: useSpeechRecognition Hook

**Files:**
- Create: `app/_components/hooks/useSpeechRecognition.ts`

**Interfaces:**
- Consumes: nothing (standalone hook)
- Produces: `useSpeechRecognition(options: SpeechRecognitionOptions): UseSpeechRecognitionReturn` — used by Task 4 (`useVoiceSession`)

- [ ] **Step 1: Create the type declarations and hook skeleton**

Create the file `app/_components/hooks/useSpeechRecognition.ts`:

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognitionOptions {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
  silenceTimeout?: number;
  onFinalTranscript?: (transcript: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  interimTranscript: string;
  finalTranscript: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}

export function useSpeechRecognition(
  options: SpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    lang = "en-US",
    continuous = true,
    interimResults = true,
    silenceTimeout = 1500,
    onFinalTranscript,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const finalTranscriptRef = useRef("");

  onFinalTranscriptRef.current = onFinalTranscript;

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      const text = finalTranscriptRef.current.trim();
      if (text) {
        onFinalTranscriptRef.current?.(text);
        finalTranscriptRef.current = "";
        setFinalTranscript("");
        setInterimTranscript("");
      }
    }, silenceTimeout);
  }, [silenceTimeout, clearSilenceTimer]);

  const stop = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, [clearSilenceTimer]);

  const start = useCallback(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    setError(null);
    setFinalTranscript("");
    setInterimTranscript("");
    finalTranscriptRef.current = "";

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      finalTranscriptRef.current = final;
      setFinalTranscript(final);
      setInterimTranscript(interim);

      if (final || interim) {
        startSilenceTimer();
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed") {
        setError("Microphone access was denied. Please allow microphone access and try again.");
      } else if (event.error === "no-speech") {
        // Not a real error — just no speech detected, keep listening
        return;
      } else if (event.error === "aborted") {
        return;
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      setError("Failed to start speech recognition.");
      setIsListening(false);
    }
  }, [isSupported, lang, continuous, interimResults, startSilenceTimer, isListening]);

  const reset = useCallback(() => {
    clearSilenceTimer();
    finalTranscriptRef.current = "";
    setFinalTranscript("");
    setInterimTranscript("");
  }, [clearSilenceTimer]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, [clearSilenceTimer]);

  const transcript = (finalTranscript + " " + interimTranscript).trim();

  return {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    finalTranscript,
    start,
    stop,
    reset,
    error,
  };
}
```

- [ ] **Step 2: Manual browser test**

Open the app in Chrome. Import the hook in a temporary test component or VoiceOverlay. Call `start()`, speak, verify:
- `isListening` becomes `true`
- `transcript` updates in real time
- `onFinalTranscript` fires after 1.5s silence
- `stop()` ends recognition
- `error` is set if mic is denied

- [ ] **Step 3: Commit**

```bash
git add app/_components/hooks/useSpeechRecognition.ts
git commit -m "feat(voice): add useSpeechRecognition hook

Wraps Web Speech API with continuous listening, interim results,
silence-based auto-submit, and error handling."
```

---

### Task 2: useSpeechSynthesis Hook

**Files:**
- Create: `app/_components/hooks/useSpeechSynthesis.ts`

**Interfaces:**
- Consumes: `VOICES` from `@/app/lib/endpoints` (array of voice label strings)
- Produces: `useSpeechSynthesis(): UseSpeechSynthesisReturn` — used by Task 4 (`useVoiceSession`)

- [ ] **Step 1: Create the hook**

Create the file `app/_components/hooks/useSpeechSynthesis.ts`:

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

export interface VoiceOption {
  id: string;
  label: string;
  nativeVoice: SpeechSynthesisVoice;
}

interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: VoiceOption[];
  selectedVoice: string;
  speak: (text: string) => void;
  cancel: () => void;
  setVoice: (voiceId: string) => void;
}

const VOICE_MAP: Record<string, { keywords: string[]; gender: string }> = {
  "Nova - Energetic & Fast": {
    keywords: ["zira", "samantha", "karen", "female"],
    gender: "female",
  },
  "Echo - Soft & Calm": {
    keywords: ["hazel", "fiona", "moira", "female"],
    gender: "female",
  },
  "Atlas - Deep & Professional": {
    keywords: ["david", "daniel", "james", "male"],
    gender: "male",
  },
};

function findBestVoice(
  nativeVoices: SpeechSynthesisVoice[],
  keywords: string[]
): SpeechSynthesisVoice | null {
  const englishVoices = nativeVoices.filter((v) => v.lang.startsWith("en"));
  for (const keyword of keywords) {
    const match = englishVoices.find((v) =>
      v.name.toLowerCase().includes(keyword)
    );
    if (match) return match;
  }
  return englishVoices[0] || nativeVoices[0] || null;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("Nova - Energetic & Fast");
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const loadVoices = useCallback(() => {
    if (!isSupported) return;
    const nativeVoices = speechSynthesis.getVoices();
    if (nativeVoices.length === 0) return;

    const mapped: VoiceOption[] = [];
    for (const [label, config] of Object.entries(VOICE_MAP)) {
      const native = findBestVoice(nativeVoices, config.keywords);
      if (native) {
        mapped.push({ id: label, label, nativeVoice: native });
      }
    }

    if (mapped.length === 0 && nativeVoices.length > 0) {
      mapped.push({
        id: "Default",
        label: "Default Voice",
        nativeVoice: nativeVoices[0],
      });
    }

    setVoices(mapped);
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;
    loadVoices();
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [isSupported, loadVoices]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.id === selectedVoice);
      if (voice) {
        utterance.voice = voice.nativeVoice;
      }
      utterance.rate = selectedVoice.includes("Energetic") ? 1.1 : 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          console.error("TTS error:", e.error);
        }
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [isSupported, cancel, voices, selectedVoice]
  );

  const setVoice = useCallback((voiceId: string) => {
    setSelectedVoice(voiceId);
  }, []);

  useEffect(() => {
    return () => {
      if (isSupported) {
        speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    voices,
    selectedVoice,
    speak,
    cancel,
    setVoice,
  };
}
```

- [ ] **Step 2: Manual browser test**

Open Chrome console. Verify `speechSynthesis.getVoices()` returns voices. Test the hook by calling `speak("Hello, I am Nova")` — audio should play. Test `cancel()` mid-speech. Verify `isSpeaking` toggles correctly.

- [ ] **Step 3: Commit**

```bash
git add app/_components/hooks/useSpeechSynthesis.ts
git commit -m "feat(voice): add useSpeechSynthesis hook

Wraps Web Speech API TTS with voice mapping (Nova/Echo/Atlas),
cancel support, and speaking state tracking."
```

---

### Task 3: useAudioAnalyser Hook

**Files:**
- Create: `app/_components/hooks/useAudioAnalyser.ts`

**Interfaces:**
- Consumes: nothing (standalone hook, receives `MediaStream` via `start()`)
- Produces: `useAudioAnalyser(): UseAudioAnalyserReturn` — used by Task 4 (`useVoiceSession`)

- [ ] **Step 1: Create the hook**

Create the file `app/_components/hooks/useAudioAnalyser.ts`:

```typescript
"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface UseAudioAnalyserReturn {
  volume: number;
  isActive: boolean;
  start: (stream: MediaStream) => void;
  stop: () => void;
}

export function useAudioAnalyser(): UseAudioAnalyserReturn {
  const [volume, setVolume] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const tick = useCallback(() => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    analyserRef.current.getByteTimeDomainData(dataArrayRef.current);

    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      const val = (dataArrayRef.current[i] - 128) / 128;
      sum += val * val;
    }
    const rms = Math.sqrt(sum / dataArrayRef.current.length);
    const normalized = Math.min(1, rms * 3);
    setVolume(normalized);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    dataArrayRef.current = null;
    setVolume(0);
    setIsActive(false);
  }, []);

  const start = useCallback(
    (stream: MediaStream) => {
      stop();

      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceRef.current = source;
      dataArrayRef.current = dataArray;

      setIsActive(true);
      rafRef.current = requestAnimationFrame(tick);
    },
    [stop, tick]
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { volume, isActive, start, stop };
}
```

- [ ] **Step 2: Manual browser test**

Request mic access (`navigator.mediaDevices.getUserMedia({ audio: true })`), pass the stream to `start()`. Verify `volume` changes when speaking (0 = silence, approaching 1 = loud). Verify `stop()` cleans up.

- [ ] **Step 3: Commit**

```bash
git add app/_components/hooks/useAudioAnalyser.ts
git commit -m "feat(voice): add useAudioAnalyser hook

Uses Web Audio API to provide real-time mic volume (0-1)
for driving orb/frequency bar animations."
```

---

### Task 4: useVoiceSession Orchestrator Hook

**Files:**
- Create: `app/_components/hooks/useVoiceSession.ts`

**Interfaces:**
- Consumes:
  - `useSpeechRecognition(options)` from `@/app/_components/hooks/useSpeechRecognition`
  - `useSpeechSynthesis()` from `@/app/_components/hooks/useSpeechSynthesis`
  - `useAudioAnalyser()` from `@/app/_components/hooks/useAudioAnalyser`
  - `getSocket()` from `@/app/lib/socket`
  - `api` from `@/app/lib/api`
  - `ENDPOINTS` from `@/app/lib/endpoints`
  - `useConversation()` from `@/app/lib/conversation-context`
  - `VoiceOption` type from `@/app/_components/hooks/useSpeechSynthesis`
- Produces: `useVoiceSession(): UseVoiceSessionReturn` — used by Task 5 (`VoiceOverlay`)

- [ ] **Step 1: Create the hook**

Create the file `app/_components/hooks/useVoiceSession.ts`:

```typescript
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

  const handleFinalTranscript = useCallback(
    async (transcript: string) => {
      if (!transcript.trim() || !assistant) return;

      updateState("PROCESSING");

      let convId = conversationIdRef.current || selectedConversationId;

      if (!convId) {
        try {
          const res = await api.post<{
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
    [assistant, selectedConversationId, addConversation, updateState]
  );

  const stt = useSpeechRecognition({
    onFinalTranscript: handleFinalTranscript,
    silenceTimeout: 1500,
  });

  const tts = useSpeechSynthesis();
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
  useEffect(() => {
    if (stateRef.current === "SPEAKING" && !tts.isSpeaking) {
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
```

- [ ] **Step 2: Manual browser test**

Temporarily render a test UI that shows `state`, `transcript`, `aiResponse`, `volume`. Verify the full loop:
1. `start()` requests mic → state = LISTENING
2. Speak → `transcript` updates in real time
3. Pause 1.5s → state = PROCESSING, message sent via socket
4. AI tokens stream → `aiResponse` fills
5. `ai_done` → state = SPEAKING, TTS reads response
6. TTS finishes → state = LISTENING (loop)
7. `toggleMute()` pauses/resumes listening
8. `stop()` cleans up everything

- [ ] **Step 3: Commit**

```bash
git add app/_components/hooks/useVoiceSession.ts
git commit -m "feat(voice): add useVoiceSession orchestrator hook

State machine (IDLE→LISTENING→PROCESSING→SPEAKING→loop) that
coordinates STT, TTS, audio analyser, and Socket.IO messaging."
```

---

### Task 5: Rewrite VoiceOverlay UI + ChatArea Integration

**Files:**
- Rewrite: `app/_components/VoiceOverlay.tsx`
- Modify: `app/_components/ChatArea.tsx` (lines 7, 29, 337, 388-390)

**Interfaces:**
- Consumes:
  - `useVoiceSession()` from `@/app/_components/hooks/useVoiceSession` — all state and controls
  - `VoiceState` type from `@/app/_components/hooks/useVoiceSession`
  - `framer-motion` for animations
  - `lucide-react` icons: `X`, `MicOff`, `Mic`, `Square`, `ChevronDown`
- Produces: `<VoiceOverlay onClose={() => void} />` component — rendered by ChatArea

- [ ] **Step 1: Rewrite VoiceOverlay.tsx**

Replace the entire contents of `app/_components/VoiceOverlay.tsx` with:

```typescript
"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { X, Mic, MicOff, Square, ChevronDown } from "lucide-react";
import {
  useVoiceSession,
  type VoiceState,
} from "./hooks/useVoiceSession";

const bars = Array.from({ length: 15 });

interface VoiceOverlayProps {
  onClose: () => void;
}

const STATUS_CONFIG: Record<
  VoiceState,
  { label: string; color: string; bgColor: string; borderColor: string }
> = {
  IDLE: {
    label: "Ready",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  LISTENING: {
    label: "Listening",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
  },
  PROCESSING: {
    label: "Thinking...",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
  },
  SPEAKING: {
    label: "Speaking...",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  MUTED: {
    label: "Muted",
    color: "text-gray-400",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  ERROR: {
    label: "Error",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/20",
  },
};

export default function VoiceOverlay({ onClose }: VoiceOverlayProps) {
  const voice = useVoiceSession();

  useEffect(() => {
    voice.start();
    return () => {
      voice.stop();
    };
    // Only run on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    voice.stop();
    onClose();
  };

  const status = STATUS_CONFIG[voice.state];

  const orbScale = voice.state === "LISTENING"
    ? 1 + voice.volume * 0.4
    : voice.state === "SPEAKING"
    ? 1 + Math.sin(Date.now() / 200) * 0.15
    : 1;

  const barHeight = (i: number) => {
    if (voice.state === "LISTENING") {
      return 10 + voice.volume * 40 + Math.sin(Date.now() / 150 + i * 0.5) * 10;
    }
    if (voice.state === "SPEAKING") {
      return 10 + Math.sin(Date.now() / 200 + i * 0.4) * 25;
    }
    return 8;
  };

  if (!voice.isSupported) {
    return (
      <div className="absolute inset-0 z-30 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <MicOff size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Voice Chat Not Supported</h2>
          <p className="text-gray-400 text-sm">
            Voice chat is not supported in this browser. Please use Chrome or Edge for the best experience.
          </p>
        </div>
        <button
          onClick={handleClose}
          className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 bg-[#020617]/95 backdrop-blur-md flex flex-col items-center justify-center gap-8 p-4">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <X size={20} />
      </button>

      {/* Status badge */}
      <div
        className={`${status.bgColor} border ${status.borderColor} px-4 py-1.5 rounded-full flex items-center gap-2`}
      >
        {voice.state === "LISTENING" && (
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        )}
        {voice.state === "PROCESSING" && (
          <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse" />
        )}
        {voice.state === "SPEAKING" && (
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
        )}
        <span
          className={`${status.color} text-xs font-medium uppercase tracking-wider`}
        >
          {status.label}
        </span>
      </div>

      {/* Orb + Frequency Bars */}
      <div className="relative w-full flex items-center justify-center">
        {/* Left frequency bars */}
        <div className="flex items-center gap-1.5 absolute right-[60%] rotate-180">
          {bars.map((_, i) => (
            <motion.div
              key={`left-${i}`}
              className="w-[3px] bg-indigo-500/40 rounded-full"
              animate={{ height: barHeight(i) }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>

        {/* Central orb */}
        <button
          onClick={voice.manualSend}
          className="relative group cursor-pointer"
          title="Tap to send"
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: voice.state === "MUTED" ? 0.1 : [0.2, 0.5, 0.2],
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="absolute -inset-8 border border-indigo-400/30 rounded-full"
          />

          <motion.div
            animate={{ scale: orbScale }}
            transition={{ duration: 0.1 }}
            className="w-32 h-32 rounded-full bg-black relative z-10 flex items-center justify-center p-[3px] overflow-hidden"
          >
            <div
              className={`absolute inset-0 bg-[conic-gradient(from_0deg,#3b82f6,#a855f7,#22d3ee,#3b82f6)] ${
                voice.state === "MUTED"
                  ? ""
                  : "animate-[spin_4s_linear_infinite]"
              }`}
              style={{ opacity: voice.state === "MUTED" ? 0.3 : 1 }}
            />
            <div className="absolute inset-[3px] bg-[#0b1120] rounded-full flex items-center justify-center gap-4">
              {voice.state === "MUTED" ? (
                <MicOff size={28} className="text-gray-500" />
              ) : (
                <>
                  <motion.div
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      times: [0, 0.1, 0.2],
                    }}
                    className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                  <motion.div
                    animate={{ scaleY: [1, 0.1, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      times: [0, 0.1, 0.2],
                    }}
                    className="w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"
                  />
                </>
              )}
            </div>
          </motion.div>
        </button>

        {/* Right frequency bars */}
        <div className="flex items-center gap-1.5 absolute left-[60%]">
          {bars.map((_, i) => (
            <motion.div
              key={`right-${i}`}
              className="w-[3px] bg-indigo-500/40 rounded-full"
              animate={{ height: barHeight(i) }}
              transition={{ duration: 0.1 }}
            />
          ))}
        </div>
      </div>

      {/* Transcript / Response area */}
      <div className="text-center max-w-lg min-h-[80px]">
        {voice.state === "ERROR" && voice.error && (
          <div className="space-y-3">
            <p className="text-red-400 text-sm">{voice.error}</p>
            <button
              onClick={() => voice.start()}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {voice.state === "LISTENING" && (
          <div>
            {voice.transcript ? (
              <p className="text-lg text-white">
                {voice.transcript.replace(voice.interimTranscript, "")}
                <span className="text-gray-500">{voice.interimTranscript}</span>
              </p>
            ) : (
              <div>
                <h2 className="text-2xl font-semibold mb-1">Speak now</h2>
                <p className="text-gray-500 text-sm">
                  How can I help you today?
                </p>
              </div>
            )}
          </div>
        )}

        {voice.state === "PROCESSING" && (
          <div className="space-y-2">
            <p className="text-gray-400 text-sm italic">
              &ldquo;{voice.transcript || "..."}&rdquo;
            </p>
            <div className="flex items-center justify-center gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {voice.state === "SPEAKING" && (
          <p className="text-white text-base leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
            {voice.aiResponse}
          </p>
        )}

        {voice.state === "MUTED" && (
          <div>
            <h2 className="text-xl font-semibold mb-1 text-gray-400">
              Microphone Muted
            </h2>
            <p className="text-gray-500 text-sm">
              Tap the mic button to resume
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-10">
        <button
          onClick={voice.toggleMute}
          className={`p-4 rounded-full border transition-colors cursor-pointer ${
            voice.state === "MUTED"
              ? "bg-white/10 border-white/20 text-white"
              : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
          }`}
        >
          {voice.state === "MUTED" ? <MicOff size={22} /> : <Mic size={22} />}
        </button>
        <button
          onClick={handleClose}
          className="p-6 bg-red-500 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:bg-red-600 transition-colors cursor-pointer"
        >
          <Square fill="white" size={24} className="text-white" />
        </button>
      </div>

      {/* Voice selector */}
      {voice.voices.length > 1 && (
        <div className="relative">
          <select
            value={voice.selectedVoice}
            onChange={(e) => voice.setVoice(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 rounded-xl px-4 py-2 pr-8 text-sm text-gray-300 focus:outline-none focus:border-indigo-500/30 cursor-pointer"
          >
            {voice.voices.map((v) => (
              <option key={v.id} value={v.id} className="bg-[#0b1120]">
                {v.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update ChatArea.tsx to refresh messages on voice overlay close**

In `app/_components/ChatArea.tsx`, modify the VoiceOverlay close handler. Find this line (around line 337):

```typescript
{isVoiceMode && <VoiceOverlay onClose={() => setIsVoiceMode(false)} />}
```

Replace it with:

```typescript
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
```

- [ ] **Step 3: Full end-to-end browser test**

Test in Chrome with the dev server running (`npm run dev`):

1. Click mic button in ChatInput → VoiceOverlay opens
2. Grant mic permission → status shows "Listening" with green badge
3. Speak a question → transcript appears below orb in real time
4. Pause speaking → after 1.5s, status changes to "Thinking..."
5. AI response streams in → response text appears below orb
6. AI finishes → status changes to "Speaking...", TTS reads response aloud
7. TTS finishes → status returns to "Listening" (loop continues)
8. Test mute button → status shows "Muted", mic stops
9. Unmute → returns to "Listening"
10. Test stop button → overlay closes
11. Check sidebar → conversation appears in history
12. Click the conversation → messages (from voice) are visible as text

Edge cases to test:
- Deny mic permission → error message shown with retry button
- Close overlay mid-stream → stream cancelled, overlay closes
- Tap orb → manual send without waiting for silence
- Open overlay on existing conversation → context maintained

- [ ] **Step 4: Commit**

```bash
git add app/_components/VoiceOverlay.tsx app/_components/ChatArea.tsx
git commit -m "feat(voice): rewrite VoiceOverlay with full voice conversation

Integrates useVoiceSession for real-time STT→AI→TTS loop.
Volume-reactive orb and frequency bars, state-aware status badge,
transcript display, mute/stop controls, voice selector, and
browser-not-supported fallback. ChatArea refreshes messages on close."
```

---

### Task 6: Final Integration Polish and Browser Testing

**Files:**
- Modify: `app/_components/VoiceOverlay.tsx` (if fixes needed)
- Modify: `app/_components/hooks/useVoiceSession.ts` (if fixes needed)

**Interfaces:**
- Consumes: all hooks and components from Tasks 1-5
- Produces: nothing new — this is a polish/fix pass

- [ ] **Step 1: Test barge-in (user speaks while AI is talking)**

During the SPEAKING state, start talking. Verify:
- TTS cancels immediately
- State transitions to LISTENING
- New transcript starts capturing
- Previous AI response is discarded

If barge-in doesn't work, add this to `useVoiceSession.ts` — inside the `useSpeechRecognition` `onresult` handler: when state is SPEAKING and new speech is detected, call `tts.cancel()` and transition to LISTENING.

- [ ] **Step 2: Test conversation creation flow**

1. With no selected conversation, open VoiceOverlay
2. Speak a question → new conversation created automatically
3. Close overlay → conversation appears in sidebar with auto-generated title
4. Re-open overlay → conversation context preserved

- [ ] **Step 3: Test error recovery**

1. Start voice session normally
2. In Chrome, go to Settings → Site Settings → Microphone → Block for localhost
3. Open VoiceOverlay → should show error "Microphone access is required..."
4. Click "Try Again" → should re-prompt for permission
5. Re-allow mic → should start listening

- [ ] **Step 4: Verify no regressions in text chat**

1. Close VoiceOverlay
2. Type a text message → should work exactly as before
3. Edit a message → should regenerate
4. Delete a message → should remove
5. Create new chat → should work
6. Switch conversations → should work
7. Stop streaming → should work

- [ ] **Step 5: Run lint**

```bash
npm run lint
```

Fix any lint errors in the new files.

- [ ] **Step 6: Commit any fixes**

```bash
git add -u
git commit -m "fix(voice): integration polish and lint fixes"
```

Only commit if there were actual changes. Skip this step if everything worked on first pass.
