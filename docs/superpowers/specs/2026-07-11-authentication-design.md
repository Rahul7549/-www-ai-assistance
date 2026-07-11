# Authentication & Authorization Design

## Overview

Add client-side authentication and route protection to the AuraAI Next.js 16 frontend. The app uses a separate Express backend with JWT-based auth (accessToken 15min, refreshToken 7 days). Tokens are stored in localStorage.

## Requirements

- Protected pages: `/` (chat) and `/voice-assistance` require a logged-in user
- Public pages: `/login` and `/registration` are accessible without login
- Logged-in users visiting `/login` or `/registration` are redirected to `/`
- No role-based access control needed (just logged-in/not-logged-in)
- Auto token refresh when accessToken expires
- API helper auto-attaches Authorization header

## Approach

Client-side Auth Context using React Context + localStorage. No server-side proxy or cookie-based session. Chosen because it is simple, follows standard React patterns, works with the existing localStorage token storage, and requires no backend changes.

## Architecture

### Auth Context (`app/lib/auth-context.tsx`)

A React Context providing:

- `user: { id, email, firstName, lastName } | null` - current user or null
- `isLoading: boolean` - true during initial token check
- `login(email, password): Promise<void>` - authenticate, store tokens, set user
- `logout(): Promise<void>` - revoke refresh token, clear storage, redirect

**Initialization flow (on mount):**

1. Read `accessToken` from localStorage
2. If no token: set `user = null`, `isLoading = false`
3. If token exists: decode JWT payload to extract `userid` and `role`
4. If token is expired: attempt refresh using `refreshToken` from localStorage
5. If refresh succeeds: store new tokens, decode new accessToken, set user
6. If refresh fails: clear localStorage, set `user = null`

JWT decoding is done client-side (base64 decode, no crypto verification). Verification happens on the Express backend when the token is used for API calls.

### API Helper Enhancement (`app/lib/api.ts`)

Modify the existing `request()` function to:

1. Read `accessToken` from localStorage before each request
2. Add `Authorization: Bearer <token>` header if token exists
3. On 401 response: attempt token refresh using refreshToken
4. If refresh succeeds: store new tokens, retry the original request once
5. If refresh fails: clear localStorage, redirect to `/login`
6. Prevent concurrent refresh calls (use a promise lock so multiple 401s don't trigger multiple refresh attempts)

### Route Protection via Route Group Layouts

**`app/(protected)/layout.tsx`** - wraps all protected pages:

- Reads `useAuth()` to get `user` and `isLoading`
- While `isLoading`: shows a full-screen loading spinner (dark theme, matching app style)
- If `user` is null: redirects to `/login` via `router.replace('/login')`
- If `user` exists: renders `{children}`

**`app/(auth)/layout.tsx`** - wraps login/registration (already exists as a route group):

- Reads `useAuth()` to get `user` and `isLoading`
- While `isLoading`: shows loading spinner
- If `user` exists: redirects to `/` via `router.replace('/')`
- If `user` is null: renders `{children}`

**`app/layout.tsx`** - root layout:

- Wraps `{children}` with `<AuthProvider>`

### File Structure Changes

```
app/
  lib/
    api.ts              <- MODIFY: auto auth header + 401 retry with refresh
    auth-context.tsx     <- NEW: AuthProvider + useAuth hook
    endpoints.ts         <- no change
  layout.tsx             <- MODIFY: wrap with AuthProvider
  (auth)/
    layout.tsx           <- NEW: PublicOnlyRoute (redirect logged-in to /)
    login/page.tsx       <- MODIFY: replace direct api.post + localStorage calls with auth context login()
    registration/page.tsx <- no change (already calls api.post for register and redirects to /login)
  (protected)/
    layout.tsx           <- NEW: ProtectedRoute (redirect unauthenticated to /login)
    page.tsx             <- MOVE from app/page.tsx
    _components/         <- MOVE from app/_components/ (Sidebar, ChatArea, etc.)
    voice-assistance/
      page.tsx           <- MOVE from app/voice-assistance/page.tsx
```

## Flows

### Login

1. User submits email + password on `/login`
2. `(auth)/layout.tsx` confirms user is not logged in, renders login page
3. Login page calls `login(email, password)` from `useAuth()`
4. `login()` calls `api.post(ENDPOINTS.auth.login, { email, password })`
5. Stores `accessToken` and `refreshToken` in localStorage
6. Decodes JWT to extract user info, sets `user` state
7. `router.replace('/')` navigates to chat page
8. `(protected)/layout.tsx` sees `user` exists, renders chat

### Token Refresh

1. `api.ts` makes an API call with the accessToken in the Authorization header
2. Backend responds with 401 (token expired)
3. `api.ts` reads `refreshToken` from localStorage
4. Calls `POST /api/auth/refresh` with `{ refreshToken }`
5. Backend returns new `{ accessToken, refreshToken }`
6. Stores new tokens in localStorage
7. Retries the original API call with the new accessToken
8. If refresh fails (refreshToken expired/invalid): clears localStorage, redirects to `/login`

### Logout

1. User clicks logout
2. `logout()` from `useAuth()` calls `POST /api/auth/logout` with `{ refreshToken }`
3. Clears `accessToken` and `refreshToken` from localStorage
4. Sets `user = null`
5. `router.replace('/login')` navigates to login page

### Initial Page Load (protected page)

1. User navigates to `/` or `/voice-assistance`
2. `AuthProvider` mounts, sets `isLoading = true`
3. Reads accessToken from localStorage
4. If valid: decodes JWT, sets user, `isLoading = false` -> page renders
5. If expired: attempts refresh, then same as above
6. If no token: `user = null`, `isLoading = false` -> redirects to `/login`

## Loading State

While `isLoading` is true, protected and public-only layouts show a centered loading spinner on the dark background (`bg-[#020617]`). This prevents a flash of content before auth state is determined. The spinner matches the app's existing indigo color scheme.

## Error Handling

- Network errors during login: shown as error banner on login form (existing behavior)
- Failed token refresh: clear tokens, redirect to /login silently
- Concurrent refresh prevention: only one refresh call at a time; subsequent 401s wait for the first refresh to complete

## Out of Scope

- Role-based access control
- Server-side session management (cookies/proxy)
- Social login (Google/GitHub/Apple buttons exist in UI but are not functional)
- "Remember me" / persistent sessions (refreshToken already handles 7-day persistence)
