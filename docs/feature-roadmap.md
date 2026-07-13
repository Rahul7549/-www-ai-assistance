# AI Virtual Assistant Platform — Feature Roadmap

> Reference document derived from `AI_Virtual_Assistant_Platform_Documentation.pdf` (v1.0, May 2026).
> Use this as the single source of truth for what to build, in what order, and with which technologies.

---

## Project Vision

An intelligent, extensible AI assistant platform where users create personalised assistants — complete with custom name, avatar, personality, and voice — that can hold conversations, retrieve knowledge, control a browser, and respond by voice. All assistants share one centralised AI brain; personalisation is achieved through prompt engineering, not model retraining.

---

## Architecture Layers

| Layer | Technology | Responsibility |
|---|---|---|
| Presentation | Next.js 16 + React 19 + Tailwind CSS v4 | Chat UI, assistant wizard, voice controls |
| API & Auth | Node.js + Express.js + JWT | REST endpoints, auth, assistant/chat CRUD |
| AI Orchestration | LangChain + LangGraph | Prompt construction, memory, tool selection, agent workflows |
| AI Model Runtime | Ollama + Llama 3 / Mistral | Local LLM inference, OpenAI-compatible API |
| Knowledge Base | ChromaDB + RAG Pipeline | Vector storage, semantic search, document grounding |
| Voice | Whisper (STT) + Web Speech API (TTS) | Speech-to-text and text-to-speech |
| Real-Time | Socket.IO | Token-by-token streaming to browser |
| Automation | Puppeteer | Headless browser control for AI agent tasks |
| Data | PostgreSQL (Prisma) | Users, assistants, conversations, messages |

---

## Current State (as of July 2026)

### Done

- [x] Next.js 16 frontend scaffolded (App Router, Tailwind CSS v4)
- [x] Pages: Chat (`/`), Login (`/login`), Registration (`/registration`), Voice Assistance (`/voice-assistance`)
- [x] Component library: Sidebar, ChatArea, ChatInput, Message, ActionPanel, VoiceOverlay
- [x] Express.js backend (`api-ai-assistance`) with Prisma + PostgreSQL
- [x] JWT authentication (login, register, refresh, logout)
- [x] Client-side auth guards (protected + public route groups)
- [x] API helper with auto auth header + 401 token refresh
- [x] Voice overlay UI (orb animation triggered by mic button — visual only, no actual audio)

### Not Started

- [ ] Assistant creation & personalisation wizard
- [ ] Database schema for assistants, conversations, messages
- [ ] Ollama / LLM integration
- [ ] LangChain chat pipeline
- [ ] Socket.IO real-time streaming
- [ ] ChromaDB + RAG pipeline
- [ ] Whisper speech-to-text
- [ ] Web Speech API text-to-speech
- [ ] LangGraph agent workflows
- [ ] Puppeteer browser automation tools

---

## Feature Breakdown

### Phase 1 — Foundation (Database + Assistant Setup)

#### 1.1 PostgreSQL Schema Extensions

Extend the existing Prisma schema with tables for assistants, conversations, and messages.

**Tables:**

| Table | Key Columns | Relationships |
|---|---|---|
| `Assistant` | id, userId, name, avatar, personality, voiceId, systemPrompt, createdAt | belongs to User; has many Conversations |
| `Conversation` | id, assistantId, title, createdAt, updatedAt | belongs to Assistant; has many Messages |
| `Message` | id, conversationId, role (user/assistant), content, createdAt | belongs to Conversation |

**Personality** maps to a system prompt template stored in the database. On each conversation, this prompt is injected at the start of the message history, shaping tone and behaviour without retraining.

**Backend endpoints:**
- `POST /api/assistants` — create assistant
- `GET /api/assistants` — list user's assistants
- `GET /api/assistants/:id` — get assistant details
- `PUT /api/assistants/:id` — update assistant
- `DELETE /api/assistants/:id` — delete assistant
- `POST /api/conversations` — create conversation
- `GET /api/conversations` — list conversations for an assistant
- `GET /api/conversations/:id/messages` — get messages

#### 1.2 Assistant Creation Wizard (Frontend)

Multi-step form where the user:
1. Enters assistant **name**
2. Picks an **avatar** (from a predefined set or upload)
3. Selects a **personality style** (professional, friendly, witty, concise, etc.)
4. Chooses a **voice** (from `speechSynthesis.getVoices()`)

Result: an `Assistant` record saved to the database with a generated `systemPrompt`.

#### 1.3 Chat Dashboard Update

- Sidebar shows list of user's assistants and conversations
- Selecting a conversation loads its message history
- New chat button creates a new conversation under the active assistant

---

### Phase 2 — Conversational AI

#### 2.1 Ollama Setup

- Install Ollama locally, pull `llama3` (or `mistral`)
- Ollama exposes an OpenAI-compatible `/v1/chat/completions` endpoint
- Backend proxies chat requests to Ollama
- Support streamed responses via server-sent events

#### 2.2 LangChain Integration (Backend)

- **ChatPromptTemplate**: injects assistant's personality system prompt
- **ConversationBufferMemory**: maintains rolling window of last N messages for context
- **Tool chains**: route between direct answers and tool-based actions
- **Output parsers**: structured JSON responses when needed

**Flow:**
```
User message → LangChain pipeline → inject system prompt + memory → Ollama → streamed response
```

#### 2.3 Socket.IO Real-Time Streaming

- Server: as Ollama streams tokens, emit each via `socket.emit('ai_token', token)`
- Server: emit `socket.emit('ai_done')` when response is complete
- Client: `socket.on('ai_token', (token) => append to message UI)` — typing effect
- Client: `socket.on('ai_done')` — finalise message, trigger TTS if enabled
- Room-based namespacing per user session

**Key events:**
| Event | Direction | Payload |
|---|---|---|
| `user_message` | Client → Server | `{ text, conversationId }` |
| `ai_token` | Server → Client | `{ token }` |
| `ai_done` | Server → Client | `{ messageId }` |

---

### Phase 3 — Knowledge Base (RAG)

#### 3.1 ChromaDB Setup

- Vector database for storing embedded document chunks
- Collection management per assistant (isolated knowledge bases)

#### 3.2 RAG Pipeline

1. **Ingest**: user uploads documents (PDF, TXT, etc.)
2. **Chunk**: split documents into overlapping text chunks
3. **Embed**: convert chunks to vectors using an embedding model (e.g. `nomic-embed` or `all-MiniLM`)
4. **Store**: save vectors in ChromaDB under the assistant's collection
5. **Query**: at chat time, embed user's message → cosine similarity search → top-K chunks
6. **Inject**: prepend retrieved chunks to the LLM prompt as grounding context

**Prompt pattern:**
```
Use the following context to answer the user's question.
If the context does not contain the answer, say you don't know.

Context:
{retrieved_chunks}

User: {user_message}
```

**Backend endpoints:**
- `POST /api/assistants/:id/documents` — upload & process document
- `GET /api/assistants/:id/documents` — list uploaded documents
- `DELETE /api/assistants/:id/documents/:docId` — remove document

---

### Phase 4 — Voice Interaction

#### 4.1 Speech-to-Text (Whisper)

- **Frontend**: capture audio via `MediaRecorder` API in the browser
- **Frontend**: send WAV/MP3 audio to backend via HTTP POST
- **Backend**: run Whisper model inference (Python or Node.js wrapper)
- **Backend**: return transcribed text
- Transcribed text feeds into the LangChain pipeline as normal user input

**Endpoint:** `POST /api/voice/transcribe` — accepts audio file, returns `{ text }`

#### 4.2 Text-to-Speech (Web Speech API)

- Browser-native, zero dependencies, zero cost
- `window.speechSynthesis.speak(utterance)`
- Voice selection per assistant (from `speechSynthesis.getVoices()`)
- TTS triggered when streaming response is complete (`ai_done` event)
- Mute/unmute toggle in the chat UI

---

### Phase 5 — AI Agents & Browser Automation

#### 5.1 LangGraph Agent Workflows

- Model workflows as directed graphs: nodes = actions, edges = conditions
- **Nodes**: Planner → ToolExecutor → Responder
- Conditional edges for routing decisions
- State management across graph traversal
- Support looping, branching, and error recovery

#### 5.2 Puppeteer Browser Automation

- LangChain tool wrapper: `async function openUrl(url)`
- `page.goto()`, `page.click()`, `page.type()` for browser control
- `page.evaluate()` to extract DOM content for LLM context
- Sandboxed browser instance per agent session

**Example user requests:**
- "Open YouTube and play lo-fi music"
- "Search Google for the latest AI news"
- "Fill out this form for me"

**Agent loop:**
```
LLM decides tool → Puppeteer executes → result fed back to LLM → natural language response
```

---

## Build Order Summary

| # | Feature | Phase | Depends On | Complexity |
|---|---|---|---|---|
| 1 | PostgreSQL schema (assistants, conversations, messages) | 1 | Auth (done) | Medium |
| 2 | Assistant creation wizard UI | 1 | Schema (#1) | Medium |
| 3 | Chat dashboard update (assistant/conversation list) | 1 | Schema (#1) | Medium |
| 4 | Ollama setup + LLM integration | 2 | — | Low |
| 5 | LangChain chat pipeline | 2 | Ollama (#4), Schema (#1) | High |
| 6 | Socket.IO real-time streaming | 2 | LangChain (#5) | Medium |
| 7 | ChromaDB + RAG pipeline | 3 | LangChain (#5) | High |
| 8 | Whisper speech-to-text | 4 | LangChain (#5) | Medium |
| 9 | Web Speech API text-to-speech | 4 | Streaming (#6) | Low |
| 10 | LangGraph agent workflows | 5 | LangChain (#5) | High |
| 11 | Puppeteer browser automation | 5 | LangGraph (#10) | High |

---

## Tech Quick Reference

| Technology | Category | Why Chosen |
|---|---|---|
| React + Next.js 16 | Frontend | Component model + SSR + App Router |
| Tailwind CSS v4 | Styling | Utility-first, rapid responsive design |
| Node.js + Express.js | Backend | Event-driven, handles concurrent WebSocket connections |
| JWT + bcrypt | Auth | Stateless tokens + secure password hashing |
| PostgreSQL + Prisma | Database | ACID-compliant, JSON column support, schema enforcement |
| Ollama | LLM Runtime | Local inference, no cloud costs, OpenAI-compatible API |
| Llama 3 / Mistral | LLM | Open-source, runs on consumer hardware (quantised 4-bit) |
| LangChain | AI Framework | Prompt templates, memory, tool calling, output parsing |
| LangGraph | Workflow Engine | Directed graph workflows with branching and loops |
| ChromaDB | Vector DB | Semantic search for RAG, per-assistant collections |
| Whisper | STT | Open-source, multilingual, accurate, no API cost |
| Web Speech API | TTS | Browser-native, zero dependencies, per-voice selection |
| Socket.IO | Real-Time | Bi-directional streaming, room-based namespacing |
| Puppeteer | Browser Automation | Headless Chrome, handles JS-rendered pages |
