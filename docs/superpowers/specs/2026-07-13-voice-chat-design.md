# Real-Time Voice Conversation — Design Spec

## Goal

Add full real-time voice conversation to the AI assistant platform. Users speak into their microphone, the assistant processes the text through the existing Ollama LLM pipeline, and speaks the response back aloud — creating a continuous conversational loop similar to ChatGPT's voice mode.

## Approach

**Browser-Native (Approach 1):** Use the Web Speech API for both speech-to-text (`SpeechRecognition`) and text-to-speech (`SpeechSynthesis`). No server-side audio processing. The existing Socket.IO text-based message flow is reused — voice transcripts are sent as regular text messages, and AI responses are spoken client-side.

**Why:** Zero additional infrastructure, no API costs, works immediately with the existing Ollama + Socket.IO stack. Voice quality from modern browser TTS is acceptable. Architecture allows future upgrade to server-side TTS (Piper/Coqui) without changing the backend message flow.

**Browser support:** Chrome, Edge, Safari (desktop + mobile). Firefox has partial support (SpeechRecognition requires flag). The UI will show a "not supported" message in unsupported browsers.

---

## User Experience

### Conversation Flow

1. User clicks the **mic button** in ChatInput (or navigates to `/voice-assistance`)
2. VoiceOverlay opens full-screen with microphone permission request
3. Once granted, status shows **"Listening..."** — orb animation reacts to mic volume
4. User speaks — real-time transcript preview appears below the orb
5. After user pauses (1.5s silence), transcript auto-submits
6. Status shifts to **"Thinking..."** — orb animation changes to a calmer pulse
7. AI response streams in via Socket.IO tokens — displayed as live text below orb
8. Once AI response completes, status changes to **"Speaking..."** — TTS reads the response
9. Orb animation syncs with speech output
10. After TTS finishes, auto-returns to **"Listening..."** — loop continues
11. User can interrupt at any point by speaking (barge-in stops TTS, starts new input)

### Controls

| Control | Action |
|---------|--------|
| **Mute button** | Toggle mic on/off (pause listening without closing) |
| **Stop button** (red) | End voice session, close overlay |
| **Close (X)** | End voice session, close overlay |
| **Tap orb** | Manual send (submit current transcript without waiting for silence) |

### Visual States

| State | Orb Behavior | Frequency Bars | Status Badge |
|-------|-------------|----------------|--------------|
| **Listening** | Pulses with mic volume (louder = bigger pulse) | Animate based on mic input amplitude | Green "Listening" |
| **Processing** | Slow calm rotation, no volume reaction | Static low bars | Yellow "Thinking..." |
| **Speaking** | Pulses with TTS speech (synced to output) | Animate based on TTS output | Blue "Speaking..." |
| **Muted** | Dim, static | No animation | Gray "Muted" |
| **Error** | Red tint, static | No animation | Red error message |

### Conversation History Integration

- Voice messages are saved to the same conversation as text messages
- They appear in the sidebar conversation list like any other chat
- When opening VoiceOverlay on an existing conversation, prior context is maintained
- When opening with no selected conversation, a new one is created (same as text chat)

---

## Technical Architecture

### State Machine

```
IDLE ──(mic granted)──> LISTENING
LISTENING ──(silence detected)──> PROCESSING
LISTENING ──(manual send)──> PROCESSING
PROCESSING ──(ai_done received)──> SPEAKING
SPEAKING ──(TTS finished)──> LISTENING
SPEAKING ──(user speaks / barge-in)──> LISTENING (cancel TTS, start new input)
ANY ──(mute toggle)──> MUTED / previous state
ANY ──(close/stop)──> IDLE
ANY ──(error)──> ERROR
ERROR ──(retry)──> LISTENING
```

### New Files

#### `app/_components/hooks/useSpeechRecognition.ts`

Wraps the Web Speech API `SpeechRecognition` interface.

**Responsibilities:**
- Start/stop continuous speech recognition
- Emit interim results (real-time preview) and final results (completed transcript)
- Detect silence (1.5s after last speech) to trigger auto-submit
- Handle browser compatibility (check `window.SpeechRecognition` or `window.webkitSpeechRecognition`)
- Handle errors (permission denied, network error, not supported)
- Support barge-in (restart recognition while TTS is playing)

**Interface:**
```typescript
interface UseSpeechRecognitionReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;        // Current interim + final combined
  interimTranscript: string; // Current interim only (gray preview text)
  finalTranscript: string;   // Confirmed text so far
  start: () => void;
  stop: () => void;
  reset: () => void;
  error: string | null;
}
```

**Configuration:**
- `lang`: "en-US" (default, extensible)
- `continuous`: true (keep listening until explicitly stopped)
- `interimResults`: true (show real-time preview)
- `silenceTimeout`: 1500ms (auto-submit after silence)
- `onFinalTranscript`: callback when silence detected or manual submit

#### `app/_components/hooks/useSpeechSynthesis.ts`

Wraps the Web Speech API `SpeechSynthesis` interface.

**Responsibilities:**
- Speak text using a selected voice
- Map the app's VOICES constant (Nova/Echo/Atlas) to available browser voices
- Handle voice selection and persistence
- Support cancel/interrupt (for barge-in)
- Emit speaking state (for orb animation sync)

**Interface:**
```typescript
interface UseSpeechSynthesisReturn {
  isSpeaking: boolean;
  isSupported: boolean;
  voices: VoiceOption[];          // Available mapped voices
  selectedVoice: string;         // Current voice ID
  speak: (text: string) => void;
  cancel: () => void;
  setVoice: (voiceId: string) => void;
}

interface VoiceOption {
  id: string;
  label: string;    // "Nova - Energetic & Fast"
  nativeVoice: SpeechSynthesisVoice;
}
```

**Voice mapping strategy:**
- On load, enumerate `speechSynthesis.getVoices()`
- Map Nova → a female energetic voice, Echo → a softer voice, Atlas → a deeper male voice
- Fallback to default voice if preferred voice not available
- Store selection in assistant's `voiceId` field

#### `app/_components/hooks/useAudioAnalyser.ts`

Provides real-time audio amplitude data from the microphone for visual feedback.

**Responsibilities:**
- Create `AudioContext` + `AnalyserNode` from the mic stream
- Sample volume at ~30fps via `requestAnimationFrame`
- Normalize volume to 0-1 range
- Clean up on unmount

**Interface:**
```typescript
interface UseAudioAnalyserReturn {
  volume: number;         // 0-1 normalized mic volume
  isActive: boolean;
  start: (stream: MediaStream) => void;
  stop: () => void;
}
```

#### `app/_components/hooks/useVoiceSession.ts`

Orchestrator hook that coordinates the full voice conversation loop.

**Responsibilities:**
- Manage the state machine (IDLE → LISTENING → PROCESSING → SPEAKING → LISTENING)
- Coordinate between STT, TTS, audio analyser, and Socket.IO
- Handle conversation creation (reuse existing or create new)
- Collect AI response tokens into full response for TTS
- Handle barge-in (user speaks while AI is talking)
- Handle mute/unmute
- Handle errors with recovery

**Interface:**
```typescript
type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'MUTED' | 'ERROR';

interface UseVoiceSessionReturn {
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
```

**Socket.IO integration:**
- Reuses `getSocket()` from `app/lib/socket.ts`
- Sends transcript via `socket.emit("user_message", { conversationId, content })`
- Listens to `ai_token` to accumulate response text
- Listens to `ai_done` to trigger TTS playback
- Listens to `ai_error` to transition to ERROR state

#### `app/_components/VoiceOverlay.tsx` (Rewrite)

Complete rewrite of the existing visual-only overlay into a functional voice conversation UI.

**Key changes from current:**
- Integrate `useVoiceSession` hook for full voice logic
- Orb animation driven by actual `volume` data (not static keyframes)
- Frequency bars driven by volume data
- Live transcript display below orb
- AI response text display
- State-aware status badge (Listening/Thinking/Speaking/Muted/Error)
- Functional mute and stop buttons
- Voice selector (dropdown or bottom sheet)
- "Not supported" fallback UI for incompatible browsers

**Layout:**
```
┌─────────────────────────────────┐
│                          [X]    │  ← Close button
│                                 │
│     ○ Listening                 │  ← Status badge (color-coded)
│                                 │
│   ═══ ◉ ═══                    │  ← Frequency bars + Orb (volume-reactive)
│                                 │
│   "What's the weather like?"    │  ← Transcript (user's speech)
│                                 │
│   "The weather today is..."     │  ← AI response (during Speaking state)
│                                 │
│     [🔇]    [⬛]               │  ← Mute + Stop buttons
│                                 │
│     🎤 Nova ▾                   │  ← Voice selector
└─────────────────────────────────┘
```

### Modified Files

#### `app/_components/ChatArea.tsx`

- Pass `selectedConversationId` and `assistant` to VoiceOverlay (already has access via context)
- When VoiceOverlay closes, refresh messages from DB (voice messages now in history)
- VoiceOverlay already rendered conditionally via `isVoiceMode` state

#### `app/_components/ChatInput.tsx`

- No changes needed — mic button already triggers `onMicClick` which sets `isVoiceMode`

#### `app/lib/socket.ts`

- No changes needed — VoiceOverlay reuses the same socket connection

### Backend Changes

**None required.** The voice feature is entirely browser-side. Transcripts flow through the existing Socket.IO `user_message` → `ai_token` → `ai_done` pipeline. Messages are saved to the database exactly as if the user had typed them.

---

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Browser doesn't support Web Speech API | Show "Voice chat is not supported in this browser. Please use Chrome or Edge." with close button |
| Mic permission denied | Show "Microphone access is required for voice chat." with retry button |
| Network error during STT | Web Speech API handles this — show error, offer retry |
| Empty transcript (noise only) | Don't submit — continue listening |
| Very long speech (>10,000 chars) | Submit at natural pauses (sentence boundaries) |
| AI is streaming when user speaks | Barge-in: cancel TTS, stop current AI stream, start new recognition |
| Multiple rapid submissions | Queue — wait for current AI response before sending next |
| Tab loses focus | Pause listening (browser may suspend AudioContext) |
| Voice overlay opened with no conversation | Create new conversation on first transcript submit (same as text chat) |

---

## Out of Scope

- Server-side TTS (Piper, Coqui) — future enhancement
- Server-side STT (Whisper) — future enhancement
- Voice cloning or custom voice training
- Multi-language support (English only for now)
- Voice activity detection (VAD) beyond simple silence timeout
- Audio recording/playback of voice messages
- Wake word detection ("Hey Nova")
