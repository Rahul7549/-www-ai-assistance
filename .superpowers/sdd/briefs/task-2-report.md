# Task 2 Report: Enhance API Helper with Auto Auth Header and Token Refresh

**Status:** DONE

**Commit hash:** aa7f592b28b37b4be45d2b76a7ad1ee9446cd6b4

## Summary

Replaced the entire content of `app/lib/api.ts` with the exact code specified in the brief (`.superpowers\sdd\briefs\task-2-brief.md`). The new implementation:

- Auto-attaches `Authorization: Bearer <token>` header from `localStorage.getItem("accessToken")` on every request.
- On a 401 response (excluding `ENDPOINTS.auth.login` and `ENDPOINTS.auth.refresh` paths, to avoid infinite retry loops), triggers a token refresh via `ENDPOINTS.auth.refresh`, then retries the original request once.
- Uses a module-level `refreshPromise` lock (`handleRefresh`) so concurrent 401s don't trigger multiple simultaneous refresh calls.
- On failed refresh: clears `accessToken`/`refreshToken` from `localStorage` and redirects via `window.location.href = "/login"`.
- Preserves the original `api.get/post/put/patch/delete` public surface — no consumer changes required elsewhere in the codebase.

## Verification

- `npx tsc --noEmit` — ran clean, no TypeScript errors.
- Diff confirmed via `git commit` to touch only `app/lib/api.ts` (1 file changed, 62 insertions, 13 deletions).

## Concerns

- None blocking. Notes for awareness:
  - This file uses `localStorage` and `window.location.href` directly with no guard for SSR (`typeof window === "undefined"`). Per the brief this matches the required exact code, so no deviation was made. If `api.*` calls ever execute during server-side rendering, this will throw. Current codebase's `ChatArea`/auth pages call it from client components, but this is worth flagging for whoever wires up call sites in later tasks.
  - The 401-exclusion check only compares `path` against `ENDPOINTS.auth.login` / `ENDPOINTS.auth.refresh` by exact string equality — fine given `ENDPOINTS` values are static string literals, but any caller invoking with a query string appended (e.g. `/api/auth/login?x=1`) would not match and could retry-loop. Not currently an issue since no call sites do this.
