# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (flat config, eslint.config.mjs)
```

No test framework is configured.

## Architecture

**Next.js 16** app using the App Router with React 19, TypeScript, and Tailwind CSS v4 (via `@tailwindcss/postcss` plugin — no `tailwind.config` file; use CSS-based configuration in `globals.css`).

Path alias: `@/*` maps to the project root.

### Routing

- `/` — Main chat interface (`app/page.tsx`): Sidebar + ChatArea layout
- `/login` — Login page (`app/(auth)/login/page.tsx`)
- `/registration` — Multi-step registration wizard (`app/(auth)/registration/page.tsx`)
- `/voice-assistance` — Voice assistant UI (`app/voice-assistance/page.tsx`)

Auth pages are grouped under `(auth)` route group (no layout effect, just organization).

### Component structure

All shared components live in `app/_components/` (underscore prefix excludes from routing):

- **ChatArea** — Main chat view; owns the right-side ActionPanel as a responsive drawer (fixed overlay on mobile, static sidebar on `lg:`)
- **Sidebar** — Left nav; collapsible icon-only mode on desktop, slide-over drawer on mobile
- **ChatInput** — Message input bar with attachment/mic/send buttons
- **Message** — Chat bubble (user vs assistant styling)
- **ActionPanel** — Tool shortcuts panel (Search Web, YouTube, Summarize, Write Email)
- **ChatItem** — Single chat history list item
- **Header** — Top header bar (currently commented out in layout)
- **UserProfile** — User avatar + plan display

### Styling

Dark theme only. Design tokens are CSS custom properties in `globals.css` (`--bg-primary`, `--bg-secondary`, `--primary`, `--text-*`, etc.). Components use a mix of these variables and Tailwind utility classes. Glass-morphism card style via `.glass-card` class.

### Key dependencies

- **framer-motion** — Page transitions (registration wizard) and voice assistant animations
- **lucide-react** — All icons
- **Inter** font loaded via `next/font/google` in root layout

### API layer

Separate Express backend at `../api-ai-assistance` (port 3001). Auth endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.

Use `app/lib/api.ts` for all backend calls — never hardcode the base URL. Import as `import { api } from "@/app/lib/api"`.

### Environment

- `.env.development` — points to `http://localhost:3001` (local Express server)
- `.env.production` — points to deployed backend URL
- `.env.example` — committed template showing required variables
- `NEXT_PUBLIC_` prefix = accessible in browser; without prefix = server-only
