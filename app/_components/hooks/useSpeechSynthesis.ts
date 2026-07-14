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
  enqueue: (text: string) => void;
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
    // Defer the initial load out of the effect body: some browsers populate
    // getVoices() synchronously and some only fire "voiceschanged" later, so
    // this covers the synchronous case without calling setState directly
    // within the effect (react-hooks/set-state-in-effect).
    const timer = setTimeout(loadVoices, 0);
    speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      clearTimeout(timer);
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
        if (!speechSynthesis.pending) setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        if (e.error !== "canceled") {
          console.error("TTS error:", e.error);
        }
        if (!speechSynthesis.pending) setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [isSupported, cancel, voices, selectedVoice]
  );

  const enqueue = useCallback(
    (text: string) => {
      if (!isSupported || !text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text);
      const voice = voices.find((v) => v.id === selectedVoice);
      if (voice) utterance.voice = voice.nativeVoice;
      utterance.rate = selectedVoice.includes("Energetic") ? 1.1 : 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        if (!speechSynthesis.pending) setIsSpeaking(false);
        utteranceRef.current = null;
      };
      utterance.onerror = (e) => {
        if (e.error !== "canceled") console.error("TTS error:", e.error);
        if (!speechSynthesis.pending) setIsSpeaking(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
    },
    [isSupported, voices, selectedVoice]
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
    enqueue,
    cancel,
    setVoice,
  };
}
