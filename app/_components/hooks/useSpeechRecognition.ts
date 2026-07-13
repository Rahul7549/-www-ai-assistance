"use client";

import { useState, useRef, useCallback, useEffect } from "react";

declare global {
  // The Web Speech API's SpeechRecognition constructor and event types are
  // not part of TypeScript's lib.dom.d.ts (non-standard API). Only the result
  // types (SpeechRecognitionResult/-ResultList/-Alternative) are provided, so
  // the remaining shapes are declared here to match the browser API surface.
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
    onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
    onend: ((this: SpeechRecognition, ev: Event) => void) | null;
    start(): void;
    stop(): void;
    abort(): void;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

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
  const isListeningRef = useRef(false);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

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
    isListeningRef.current = false;
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
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch {
          isListeningRef.current = false;
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch {
      setError("Failed to start speech recognition.");
      isListeningRef.current = false;
      setIsListening(false);
    }
  }, [isSupported, lang, continuous, interimResults, startSilenceTimer]);

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
