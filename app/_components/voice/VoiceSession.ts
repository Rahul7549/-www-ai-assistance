declare global {
  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
      | null;
    onerror:
      | ((
          this: SpeechRecognition,
          ev: SpeechRecognitionErrorEvent,
        ) => void)
      | null;
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

export type VoiceState =
  | "IDLE"
  | "LISTENING"
  | "PROCESSING"
  | "SPEAKING"
  | "MUTED"
  | "ERROR";

export interface VoiceOption {
  id: string;
  label: string;
  nativeVoice: SpeechSynthesisVoice;
}

const VOICE_MAP: Record<string, string[]> = {
  "Nova - Energetic & Fast": ["zira", "samantha", "karen", "female"],
  "Echo - Soft & Calm": ["hazel", "fiona", "moira", "female"],
  "Atlas - Deep & Professional": ["david", "daniel", "james", "male"],
};

export class VoiceSession {
  state: VoiceState = "IDLE";
  transcript = "";
  interimTranscript = "";
  aiResponse = "";
  volume = 0;
  error: string | null = null;
  selectedVoice = "Nova - Energetic & Fast";
  voices: VoiceOption[] = [];
  isWarmingUp = false;

  onChange: (() => void) | null = null;
  onFinalTranscript: ((text: string) => void) | null = null;

  private recognition: SpeechRecognition | null = null;
  private micStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private rafId: number | null = null;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private startAbort: AbortController | null = null;
  private finalText = "";
  private prevMuteState: VoiceState = "LISTENING";
  private spokenIndex = 0;
  private streamDone = false;
  private static SENTENCE_END = /[.!?\n]\s*/;

  readonly isSupported: boolean;

  constructor() {
    this.isSupported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) &&
      "speechSynthesis" in window;

    if (this.isSupported) this.loadVoices();
  }

  private notify() {
    this.onChange?.();
  }

  // ─── Voices ───────────────────────────────────────────────

  private loadVoices() {
    const load = () => {
      const native = speechSynthesis.getVoices();
      if (!native.length) return;

      const mapped: VoiceOption[] = [];
      for (const [label, keywords] of Object.entries(VOICE_MAP)) {
        const english = native.filter((v) => v.lang.startsWith("en"));
        let match: SpeechSynthesisVoice | undefined;
        for (const kw of keywords) {
          match = english.find((v) => v.name.toLowerCase().includes(kw));
          if (match) break;
        }
        const voice = match || english[0] || native[0];
        if (voice) mapped.push({ id: label, label, nativeVoice: voice });
      }

      if (!mapped.length && native.length) {
        mapped.push({
          id: "Default",
          label: "Default Voice",
          nativeVoice: native[0],
        });
      }

      this.voices = mapped;
      this.notify();
    };

    setTimeout(load, 0);
    speechSynthesis.addEventListener("voiceschanged", load);
  }

  setVoice = (id: string) => {
    this.selectedVoice = id;
    this.notify();
  };

  // ─── STT ──────────────────────────────────────────────────

  private setupRecognition() {
    this.teardownRecognition();

    const API = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new API();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      this.finalText = final;
      this.transcript = (final + " " + interim).trim();
      this.interimTranscript = interim;
      this.notify();
      if (final || interim) this.resetSilenceTimer();
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      if (e.error === "not-allowed") {
        this.error = "Microphone access denied.";
        this.state = "ERROR";
        this.notify();
      }
    };

    rec.onend = () => {
      if (this.state === "LISTENING") {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };

    this.recognition = rec;
    try {
      rec.start();
    } catch {
      /* ignore */
    }
  }

  private teardownRecognition() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.recognition) {
      this.recognition.onend = null;
      this.recognition.onerror = null;
      this.recognition.onresult = null;
      try {
        this.recognition.stop();
      } catch {
        /* ignore */
      }
      this.recognition = null;
    }
  }

  private resetSilenceTimer() {
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      const text = this.finalText.trim();
      if (text && this.state === "LISTENING") {
        this.onFinalTranscript?.(text);
      }
    }, 1000);
  }

  // ─── Audio analyser ───────────────────────────────────────

  private setupAnalyser(stream: MediaStream) {
    this.teardownAnalyser();

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    ctx.createMediaStreamSource(stream).connect(analyser);

    this.audioCtx = ctx;
    this.analyserNode = analyser;
    this.dataArray = new Uint8Array(
      new ArrayBuffer(analyser.frequencyBinCount),
    );

    const tick = () => {
      if (!this.analyserNode || !this.dataArray) return;
      this.analyserNode.getByteTimeDomainData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = (this.dataArray[i] - 128) / 128;
        sum += v * v;
      }
      this.volume = Math.min(1, Math.sqrt(sum / this.dataArray.length) * 3);
      this.notify();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private teardownAnalyser() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.analyserNode = null;
    this.dataArray = null;
    this.volume = 0;
  }

  // ─── TTS ──────────────────────────────────────────────────

  private speakSentence(text: string, isFirst: boolean) {
    if (!text.trim()) return;

    if (isFirst) {
      speechSynthesis.cancel();
      this.teardownRecognition();
    }

    const utt = new SpeechSynthesisUtterance(text);
    const voice = this.voices.find((v) => v.id === this.selectedVoice);
    if (voice) utt.voice = voice.nativeVoice;
    utt.rate = this.selectedVoice.includes("Energetic") ? 1.1 : 1.0;

    utt.onstart = () => {
      if (this.state !== "SPEAKING") {
        this.state = "SPEAKING";
        this.notify();
      }
    };

    utt.onend = () => {
      if (this.streamDone && !speechSynthesis.pending) {
        this.clearTranscript();
        this.state = "LISTENING";
        this.setupRecognition();
        this.notify();
      }
    };

    utt.onerror = (e) => {
      if (e.error === "canceled") return;
      if (this.streamDone && !speechSynthesis.pending) {
        this.clearTranscript();
        this.state = "LISTENING";
        this.setupRecognition();
        this.notify();
      }
    };

    speechSynthesis.speak(utt);

    if (this.state !== "SPEAKING") {
      this.state = "SPEAKING";
      this.notify();
    }
  }

  private clearTranscript() {
    this.transcript = "";
    this.interimTranscript = "";
    this.finalText = "";
  }

  // ─── Public controls ─────────────────────────────────────

  start = async () => {
    if (!this.isSupported) {
      this.error = "Voice chat not supported. Use Chrome or Edge.";
      this.state = "ERROR";
      this.notify();
      return;
    }

    this.startAbort?.abort();
    const abort = new AbortController();
    this.startAbort = abort;

    this.cleanup();
    this.error = null;
    this.aiResponse = "";
    this.isWarmingUp = true;
    this.clearTranscript();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (abort.signal.aborted) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      this.micStream = stream;
      this.setupAnalyser(stream);
      this.state = "LISTENING";
      this.notify();
    } catch {
      if (abort.signal.aborted) return;
      this.error = "Microphone access required.";
      this.state = "ERROR";
      this.notify();
    }
  };

  stop = () => {
    this.startAbort?.abort();
    this.startAbort = null;
    this.cleanup();
    this.state = "IDLE";
    this.notify();
  };

  private cleanup() {
    this.teardownRecognition();
    this.teardownAnalyser();
    speechSynthesis.cancel();
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    this.aiResponse = "";
    this.isWarmingUp = false;
    this.spokenIndex = 0;
    this.streamDone = false;
    this.clearTranscript();
  }

  toggleMute = () => {
    if (this.state === "MUTED") {
      this.setupRecognition();
      this.state = this.prevMuteState;
      this.notify();
    } else {
      this.prevMuteState = this.state;
      this.teardownRecognition();
      this.state = "MUTED";
      this.notify();
    }
  };

  manualSend = () => {
    const text = this.transcript.trim();
    if (text && this.state === "LISTENING") {
      this.onFinalTranscript?.(text);
    }
  };

  modelReady() {
    this.isWarmingUp = false;
    if (this.state === "LISTENING" && !this.recognition) {
      this.setupRecognition();
    }
    this.notify();
  }

  // ─── Called by the hook for socket events ─────────────────

  addToken(token: string) {
    if (this.state !== "PROCESSING" && this.state !== "SPEAKING") return;
    this.aiResponse += token;
    this.notify();

    const unspoken = this.aiResponse.slice(this.spokenIndex);
    const match = VoiceSession.SENTENCE_END.exec(unspoken);
    if (match) {
      const boundary = this.spokenIndex + match.index + match[0].length;
      const sentence = this.aiResponse.slice(this.spokenIndex, boundary);
      this.spokenIndex = boundary;
      this.speakSentence(sentence, this.state === "PROCESSING");
    }
  }

  handleDone(fullResponse?: string) {
    if (this.state !== "PROCESSING" && this.state !== "SPEAKING") return;
    if (fullResponse && !this.aiResponse) this.aiResponse = fullResponse;

    this.streamDone = true;
    this.notify();

    const remaining = this.aiResponse.slice(this.spokenIndex).trim();
    if (remaining) {
      this.spokenIndex = this.aiResponse.length;
      this.speakSentence(remaining, this.state === "PROCESSING");
    } else if (this.state === "PROCESSING") {
      this.setupRecognition();
      this.state = "LISTENING";
      this.notify();
    }
  }

  handleError(message: string) {
    this.error = message;
    this.state = "ERROR";
    this.notify();
  }

  setProcessing() {
    this.teardownRecognition();
    this.aiResponse = "";
    this.spokenIndex = 0;
    this.streamDone = false;
    this.clearTranscript();
    this.state = "PROCESSING";
    this.notify();
  }

  destroy() {
    this.stop();
    this.onChange = null;
    this.onFinalTranscript = null;
  }
}
