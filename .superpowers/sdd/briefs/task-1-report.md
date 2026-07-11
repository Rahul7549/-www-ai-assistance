# Task 1 Report: Create the Auth Context

**Status:** DONE

**Commit:** `81e6ded23320e1351b01c4016aa6e44b0e8f1dc8` — "feat: add AuthProvider and useAuth hook"

**File created:** `app/lib/auth-context.tsx` (129 lines)

## What was done

1. Read the brief at `.superpowers/sdd/briefs/task-1-brief.md`.
2. Verified the consumed interfaces match the brief's assumptions:
   - `app/lib/api.ts` exports `api.get/post/put/patch/delete`, each returning `Promise<T>` and throwing `Error` on non-OK responses — matches usage.
   - `app/lib/endpoints.ts` exports `ENDPOINTS.auth.login`, `.refresh`, `.logout` with the exact string paths specified in the brief.
3. Created `app/lib/auth-context.tsx` exactly as specified in the brief:
   - `User` interface, `AuthContextValue` interface, `AuthContext` (created with `createContext<AuthContextValue | null>(null)`).
   - `decodeJwtPayload` / `isTokenExpired` helpers (base64url decode via `atob`).
   - `AuthProvider`: on mount, reads `accessToken`/`refreshToken` from `localStorage`; if the access token is valid, decodes it and sets a minimal `User` (only `id` populated — `email`/`firstName`/`lastName` are empty strings, per the brief's design, since the JWT payload only carries `userid`/`role`); if expired, attempts a refresh via `ENDPOINTS.auth.refresh` and re-decodes; clears storage on failure.
   - `login(email, password)`: posts to `ENDPOINTS.auth.login`, stores both tokens, sets the full `User` from the response body (this is where `email`/`firstName`/`lastName` actually get populated), and calls `router.replace("/")`.
   - `logout()`: best-effort POST to `ENDPOINTS.auth.logout`, then always clears tokens, clears user state, and redirects to `/login`.
   - `useAuth()`: throws if called outside `AuthProvider`.
   - Uses the React 19 `<Context value={...}>` provider shorthand (not `.Provider`), which is valid under React 19 / this project's Next.js 16 setup.
4. Ran `npx tsc --noEmit` — no errors.
5. Committed as `81e6ded`.

## Concerns / notes for downstream tasks

- **Partial user profile after refresh/reload**: after a page reload where the access token is still valid (or gets silently refreshed), `user` is set with `email: "", firstName: "", lastName: ""` — only `id` is real, because the JWT payload (`{ userid, role, iat, exp }`) doesn't carry profile fields. Any UI consuming `user.email`/`firstName`/`lastName` for display (e.g., a profile header) will show blank values until the user logs in again in that browser session. This matches the brief exactly, but later tasks (e.g., protected routes, UI wiring) should be aware they may need a `/me`-style endpoint or accept this limitation.
- **No axios/fetch interceptor for 401s**: this task only builds the context; if a later task expects `api.ts` to auto-refresh on a 401 from *any* call (not just the initial mount check), that logic doesn't exist yet — confirm that's covered by a subsequent task (the plan commit mentions "API helper enhancement" as a separate task).
- File was written with LF line endings; git warned it will normalize to CRLF on next touch (Windows `core.autocrlf` behavior) — cosmetic only, no action needed.
- This repo has a `.superpowers/sdd/` workflow already in progress (spec commit `2bbe6ca`, plan commit `d525526`, this task's brief/report). Confirmed those are committed artifacts before treating this as an approved execution step, consistent with prior project guidance to avoid making source changes without clear confirmation of intent.
