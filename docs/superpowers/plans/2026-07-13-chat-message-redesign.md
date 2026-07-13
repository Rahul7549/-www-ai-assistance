# Chat Message Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the chat Message component into a modern ChatGPT-style layout with avatar, markdown rendering, syntax-highlighted code blocks, action buttons, streaming indicator, and error state.

**Architecture:** Split the monolithic `Message` component into focused subcomponents under `app/_components/chat/`. `ReactMarkdown` with custom component overrides handles markdown. `react-syntax-highlighter` provides code highlighting. `ChatArea.tsx` is updated to use the new components.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, ReactMarkdown, react-syntax-highlighter, lucide-react

## Global Constraints

- Next.js 16 App Router — all components under `app/_components/` must be client components (`"use client"` directive)
- Tailwind CSS v4 via `@tailwindcss/postcss` — no `tailwind.config` file; CSS-based config in `globals.css`
- Path alias: `@/*` maps to the project root
- Dark theme only — all colors use the existing CSS custom properties or hardcoded dark palette values
- No test framework configured — testing is manual via the dev server at `http://localhost:3000`
- Existing dependencies: `react-markdown@10.1.0`, `lucide-react@1.24.0`
- New dependency: `react-syntax-highlighter` (install with types: `@types/react-syntax-highlighter`)

---

### Task 1: Install dependency and create CodeBlock component

**Files:**
- Create: `app/_components/chat/CodeBlock.tsx`

**Interfaces:**
- Consumes: nothing
- Produces: `CodeBlock` component with props `{ language: string; children: string }`, used by AssistantMessage in Task 3

- [ ] **Step 1: Install react-syntax-highlighter**

```bash
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

Expected: packages added to `package.json`

- [ ] **Step 2: Create CodeBlock component**

Create `app/_components/chat/CodeBlock.tsx`:

```tsx
"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { ClipboardIcon, CheckIcon } from "lucide-react";

interface CodeBlockProps {
  language: string;
  children: string;
}

export default function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3.5 rounded-xl border border-white/[0.08] overflow-hidden bg-black/35">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.06]">
        <span className="text-[11px] font-medium font-mono text-white/35">
          {language || "text"}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] text-white/30 px-2 py-1 rounded-md bg-white/[0.04] border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.08] transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon size={12} />
              Copied!
            </>
          ) : (
            <>
              <ClipboardIcon size={12} />
              Copy code
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || "text"}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: "16px",
          background: "transparent",
          fontSize: "12.5px",
          lineHeight: "1.6",
        }}
        codeTagProps={{
          style: { fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace" },
        }}
      >
        {children}
      </SyntaxHighlighter>
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/_components/chat/CodeBlock.tsx package.json package-lock.json
git commit -m "feat: add CodeBlock component with syntax highlighting and copy button"
```

---

### Task 2: Create UserMessage and StreamingIndicator components

**Files:**
- Create: `app/_components/chat/UserMessage.tsx`
- Create: `app/_components/chat/StreamingIndicator.tsx`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `UserMessage` with props `{ content: string }`, used by MessageBubble in Task 4
  - `StreamingIndicator` with no props, used by ChatArea in Task 5

- [ ] **Step 1: Create UserMessage component**

Create `app/_components/chat/UserMessage.tsx`:

```tsx
"use client";

export default function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex w-full justify-end mb-6">
      <div
        className="max-w-[70%] px-[18px] py-3 text-white text-[13.5px] leading-normal"
        style={{
          background: "linear-gradient(135deg, #6366f1, #7c5cff)",
          borderRadius: "20px 20px 6px 20px",
          boxShadow: "0 2px 12px rgba(99,102,241,0.25)",
        }}
      >
        {content}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create StreamingIndicator component**

Create `app/_components/chat/StreamingIndicator.tsx`:

```tsx
"use client";

export default function StreamingIndicator() {
  return (
    <div className="flex gap-3.5 items-start mb-6">
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm text-white font-semibold shrink-0"
        style={{
          background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
        }}
      >
        N
      </div>
      <div className="pt-2">
        <p className="text-xs font-semibold text-white/40 mb-2 tracking-wide">Nova</p>
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(124,92,255,0.5)] animate-[pulse-dot_1.4s_ease-in-out_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(124,92,255,0.5)] animate-[pulse-dot_1.4s_ease-in-out_0.2s_infinite]" />
          <span className="w-1.5 h-1.5 rounded-full bg-[rgba(124,92,255,0.5)] animate-[pulse-dot_1.4s_ease-in-out_0.4s_infinite]" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add the `pulse-dot` keyframes to globals.css**

Add this block at the end of `app/globals.css`, after the existing `@keyframes fadeIn` block (around line 369):

```css
@keyframes pulse-dot {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add app/_components/chat/UserMessage.tsx app/_components/chat/StreamingIndicator.tsx app/globals.css
git commit -m "feat: add UserMessage bubble and StreamingIndicator components"
```

---

### Task 3: Create AssistantMessage component with markdown rendering

**Files:**
- Create: `app/_components/chat/AssistantMessage.tsx`

**Interfaces:**
- Consumes: `CodeBlock` from Task 1 — `import CodeBlock from "./CodeBlock"`
- Produces: `AssistantMessage` with props `{ content: string; isStreaming?: boolean }`, used by MessageBubble in Task 4

- [ ] **Step 1: Create AssistantMessage component**

Create `app/_components/chat/AssistantMessage.tsx`:

```tsx
"use client";

import { useState } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import { CopyIcon, RotateCcwIcon } from "lucide-react";
import CodeBlock from "./CodeBlock";

interface AssistantMessageProps {
  content: string;
  isStreaming?: boolean;
}

export default function AssistantMessage({ content, isStreaming }: AssistantMessageProps) {
  const [copied, setCopied] = useState(false);

  const isError = content.startsWith("Error: ");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isError) {
    return (
      <div className="flex gap-2.5 items-center px-4 py-2.5 rounded-[10px] mb-6 bg-red-500/[0.08] border border-red-500/[0.15]">
        <div className="w-[18px] h-[18px] rounded-full bg-red-500/[0.15] flex items-center justify-center text-[11px] text-red-400 font-bold shrink-0">
          !
        </div>
        <span className="text-xs text-red-400/80">{content.replace("Error: ", "")}</span>
      </div>
    );
  }

  const markdownComponents: Components = {
    pre({ children }) {
      return <>{children}</>;
    },
    code({ className, children }) {
      const match = /language-(\w+)/.exec(className || "");
      const codeString = String(children).replace(/\n$/, "");

      if (match) {
        return <CodeBlock language={match[1]}>{codeString}</CodeBlock>;
      }

      return (
        <code className="bg-[rgba(124,92,255,0.12)] text-[#c4b5fd] px-[7px] py-0.5 rounded-[5px] text-xs font-mono border border-[rgba(124,92,255,0.15)]">
          {children}
        </code>
      );
    },
    strong({ children }) {
      return <strong className="text-white font-semibold">{children}</strong>;
    },
    em({ children }) {
      return <em className="text-white/60 italic">{children}</em>;
    },
    p({ children }) {
      return <p className="mb-2.5 last:mb-0">{children}</p>;
    },
    ol({ children }) {
      return <ol className="my-2 mb-3 pl-[22px] list-decimal marker:text-[rgba(124,92,255,0.6)]">{children}</ol>;
    },
    ul({ children }) {
      return <ul className="my-2 mb-3 pl-[22px] list-disc marker:text-[rgba(124,92,255,0.6)]">{children}</ul>;
    },
    li({ children }) {
      return <li className="mb-2">{children}</li>;
    },
    a({ href, children }) {
      return (
        <a href={href} className="text-indigo-400 hover:underline" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className="flex gap-3.5 items-start mb-6">
      <div
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-sm text-white font-semibold shrink-0"
        style={{
          background: "linear-gradient(135deg, #6366f1, #a78bfa)",
          boxShadow: "0 2px 8px rgba(99,102,241,0.2)",
        }}
      >
        N
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-white/40 mb-2 tracking-wide">Nova</p>

        <div className="text-[13.5px] text-white/[0.82] leading-[1.75]">
          <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
        </div>

        {!isStreaming && content && (
          <div className="flex gap-1.5 mt-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-[5px] py-[5px] px-3 rounded-lg text-[11px] text-white/30 bg-white/[0.03] border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.06] transition-all cursor-pointer"
            >
              <CopyIcon size={13} />
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="flex items-center gap-[5px] py-[5px] px-3 rounded-lg text-[11px] text-white/30 bg-white/[0.03] border border-white/[0.06] hover:text-white/70 hover:bg-white/[0.06] transition-all cursor-pointer">
              <RotateCcwIcon size={13} />
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/_components/chat/AssistantMessage.tsx
git commit -m "feat: add AssistantMessage with markdown rendering and action buttons"
```

---

### Task 4: Create MessageBubble wrapper and integrate into ChatArea

**Files:**
- Create: `app/_components/chat/MessageBubble.tsx`
- Modify: `app/_components/ChatArea.tsx` — lines 4, 235-236, 239-246
- Delete: `app/_components/Message.tsx`

**Interfaces:**
- Consumes:
  - `UserMessage` from Task 2 — `import UserMessage from "./UserMessage"`
  - `AssistantMessage` from Task 3 — `import AssistantMessage from "./AssistantMessage"`
  - `StreamingIndicator` from Task 2 — `import StreamingIndicator from "./chat/StreamingIndicator"` (in ChatArea)
- Produces: `MessageBubble` with props `{ role: "user" | "assistant"; content: string; isStreaming?: boolean }`, used by ChatArea

- [ ] **Step 1: Create MessageBubble component**

Create `app/_components/chat/MessageBubble.tsx`:

```tsx
"use client";

import UserMessage from "./UserMessage";
import AssistantMessage from "./AssistantMessage";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
  if (role === "user") {
    return <UserMessage content={content} />;
  }
  return <AssistantMessage content={content} isStreaming={isStreaming} />;
}
```

- [ ] **Step 2: Update ChatArea.tsx imports**

In `app/_components/ChatArea.tsx`, replace line 4:

```tsx
// OLD:
import { Message } from "./Message";

// NEW:
import MessageBubble from "./chat/MessageBubble";
import StreamingIndicator from "./chat/StreamingIndicator";
```

- [ ] **Step 3: Update ChatArea.tsx message rendering**

In `app/_components/ChatArea.tsx`, replace the message map and streaming indicator block (lines 235-246):

```tsx
// OLD:
{messages.map((msg) => (
  <Message key={msg.id} role={msg.role} content={msg.content} />
))}

{isStreaming && messages[messages.length - 1]?.content === "" && (
  <div className="flex items-center gap-2 text-text-dim italic text-sm">
    <div className="w-8 h-8 rounded-full bg-brand-primary/20 flex items-center justify-center">
      <span className="animate-bounce">...</span>
    </div>
    Thinking...
  </div>
)}

// NEW:
{messages.map((msg, i) => (
  <MessageBubble
    key={msg.id}
    role={msg.role}
    content={msg.content}
    isStreaming={msg.id === "streaming"}
  />
))}

{isStreaming && messages[messages.length - 1]?.content === "" && (
  <StreamingIndicator />
)}
```

- [ ] **Step 4: Delete old Message component**

Delete `app/_components/Message.tsx` — it is fully replaced by the `chat/` directory.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 6: Manual test**

Start the dev server (`npm run dev`), open `http://localhost:3000`, log in, and verify:

1. **User messages** — right-aligned gradient purple bubbles with rounded corners
2. **AI responses** — left-aligned with purple gradient avatar circle "N", "Nova" name label, properly formatted markdown (bold, lists, inline code)
3. **Code blocks** — dark container with language tag in header, "Copy code" button, syntax-highlighted code
4. **Streaming** — three pulsing dots appear while waiting for first token, then tokens stream into an AssistantMessage
5. **Error state** — if AI errors, red-tinted banner with "!" icon appears instead of a normal message
6. **Action bar** — "Copy" and "Retry" buttons appear below completed AI messages, "Copy" copies text to clipboard
7. **Empty state** — "Start a conversation" prompt still shows when no messages

- [ ] **Step 7: Commit**

```bash
git add app/_components/chat/MessageBubble.tsx app/_components/ChatArea.tsx
git rm app/_components/Message.tsx
git commit -m "feat: integrate MessageBubble into ChatArea, remove old Message component"
```
