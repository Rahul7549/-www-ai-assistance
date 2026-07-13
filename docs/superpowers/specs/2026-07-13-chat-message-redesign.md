# Chat Message Component Redesign — ChatGPT-Style

## Goal

Redesign the Message component and related chat UI to render AI responses in a modern ChatGPT-style layout: avatar + name label for AI, gradient user bubbles, markdown with syntax-highlighted code blocks, inline code, action buttons (copy/retry), animated streaming indicator, and error state.

## Architecture

The current monolithic `Message` component gets split into focused subcomponents. `ReactMarkdown` with custom renderers handles all markdown, and a new `CodeBlock` component provides syntax-highlighted code with a language tag and copy button. All styling is Tailwind utility classes + the existing CSS custom properties from `globals.css`. No new CSS files, no new dependencies beyond `react-syntax-highlighter` for proper code highlighting.

## Components

### File: `app/_components/chat/MessageBubble.tsx`

Top-level message wrapper. Receives `role` and `content`. Delegates to `UserMessage` or `AssistantMessage` based on role.

```
Props: { role: "user" | "assistant"; content: string; isStreaming?: boolean }
```

### File: `app/_components/chat/UserMessage.tsx`

Right-aligned gradient bubble. Plain text only (no markdown rendering for user messages).

- Gradient background: `linear-gradient(135deg, #6366f1, #7c5cff)`
- Border radius: `20px 20px 6px 20px` (flat bottom-right corner)
- Max width: 70%
- Shadow: `0 2px 12px rgba(99,102,241,0.25)`
- Font: 13.5px, white, line-height 1.5

### File: `app/_components/chat/AssistantMessage.tsx`

Left-aligned with avatar + name label. Renders content via `ReactMarkdown` with custom component overrides. Shows action bar below content.

Layout:
- Horizontal flex: `[Avatar 34px] [gap 14px] [Content flex-1]`
- Avatar: 34px circle, gradient `#6366f1 → #a78bfa`, displays "N" (first letter of assistant name), shadow `0 2px 8px rgba(99,102,241,0.2)`
- Name label: 12px, semibold, `rgba(255,255,255,0.4)`, 8px below avatar row top
- Content area: full width, markdown rendered
- Action bar: appears below content, flex row with gap-6px

### File: `app/_components/chat/CodeBlock.tsx`

Replaces the default `<pre><code>` from ReactMarkdown.

Structure:
- Outer container: `bg-black/35`, border `rgba(255,255,255,0.08)`, border-radius 12px, overflow hidden
- Header bar: flex between, padding 10px 16px, bg `rgba(255,255,255,0.04)`, border-bottom
  - Left: language label (11px, monospace, `rgba(255,255,255,0.35)`)
  - Right: copy button — "Copy code" text + clipboard icon, 11px, click copies content to clipboard, shows "Copied!" for 2s
- Body: padding 16px, monospace font, 12.5px, line-height 1.6, horizontal scroll
- Syntax highlighting via `react-syntax-highlighter` with `oneDark` theme (or custom dark theme matching the app palette)

### File: `app/_components/chat/StreamingIndicator.tsx`

Replaces the current "Thinking..." text. Three pulsing dots with staggered animation.

- 3 spans, each 6px circle, `rgba(124,92,255,0.5)`
- CSS keyframes: scale 0.8→1 and opacity 0.3→1, 1.4s ease infinite
- Stagger: 0s, 0.2s, 0.4s delay
- Wrapped in the same avatar + name layout as AssistantMessage

### Markdown rendering config (inside AssistantMessage)

ReactMarkdown `components` prop overrides:
- `pre` + `code` with `className` → `CodeBlock` component
- `code` (inline, no className) → styled `<code>` with bg `rgba(124,92,255,0.12)`, color `#c4b5fd`, padding 2px 7px, radius 5px, border `rgba(124,92,255,0.15)`, monospace 12px
- `strong` → white color, font-weight 600
- `em` → `rgba(255,255,255,0.6)`, italic
- `ol` / `ul` → margin 8px 0 12px, padding-left 22px
- `li` → margin-bottom 8px, marker color `rgba(124,92,255,0.6)`
- `p` → margin 0 0 10px
- `a` → color `#818cf8`, underline on hover

### Action bar buttons

Two buttons below each completed assistant message:
1. **Copy** — clipboard icon + "Copy" text, copies full message content
2. **Retry** — refresh icon + "Retry" text (wired to retry callback later, for now just UI)

Style: flex, gap 5px, padding 5px 12px, radius 8px, font 11px, color `rgba(255,255,255,0.3)`, bg `rgba(255,255,255,0.03)`, border `rgba(255,255,255,0.06)`. Hover: color 0.7, bg 0.06.

### Error state

When content starts with `"Error: "`, render as error banner instead of normal message:
- Container: flex, gap 10px, padding 10px 16px, radius 10px
- Background: `rgba(239,68,68,0.08)`, border `rgba(239,68,68,0.15)`
- Icon: 18px circle, bg `rgba(239,68,68,0.15)`, "!" text
- Text: 12px, `rgba(239,68,68,0.8)`

## Integration with ChatArea

- Replace `<Message>` usage with `<MessageBubble>`
- Replace the "Thinking..." div with `<StreamingIndicator>` (shown when `isStreaming && last message content is empty`)
- Pass `isStreaming` to the last assistant message so it can hide the action bar while streaming

## New dependency

- `react-syntax-highlighter` — for code block syntax highlighting with language detection

## Files changed

| Action | Path |
|--------|------|
| Create | `app/_components/chat/MessageBubble.tsx` |
| Create | `app/_components/chat/UserMessage.tsx` |
| Create | `app/_components/chat/AssistantMessage.tsx` |
| Create | `app/_components/chat/CodeBlock.tsx` |
| Create | `app/_components/chat/StreamingIndicator.tsx` |
| Modify | `app/_components/ChatArea.tsx` — swap `Message` import to `MessageBubble`, replace thinking div with `StreamingIndicator` |
| Delete | `app/_components/Message.tsx` — replaced by new chat/ directory |

## What this does NOT include

- Retry functionality (just the button UI, no callback wiring)
- Message timestamps
- User avatar in user messages
- Reactions or thumbs up/down
- Message editing
