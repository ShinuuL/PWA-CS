---
phase: 09-spotify-random-picker
plan: 01
subsystem: api
tags: [supabase, edge-functions, deno, pgcrypto, zustand, oauth, spotify]

# Dependency graph
requires:
  - phase: 08-shared-to-do
    provides: [Supabase client, Zustand store patterns, Edge Function patterns]
provides:
  - Database tables spotify_config and spotify_play_history with RLS and pgcrypto encryption
  - spotify-auth Edge Function for OAuth token exchange and refresh
  - spotify-playlist Edge Function for playlist CRUD operations
  - spotifyStore.js Zustand store with all Spotify state and actions
  - useSpotifyAuth.js hook implementing PKCE OAuth flow
  - Environment variables for Spotify OAuth
affects: [09-spotify-random-picker]

# Tech tracking
tech-stack:
  added: [pgcrypto, spotify-oauth, deno-edge-functions]
  patterns: [encrypted-token-storage, pkce-oauth-flow, edge-function-token-exchange]

key-files:
  created:
    - FRONTEND/supabase/migrations/20260730_create_spotify_tables.sql
    - FRONTEND/supabase/functions/spotify-auth/index.ts
    - FRONTEND/supabase/functions/spotify-playlist/index.ts
    - FRONTEND/src/stores/spotifyStore.js
    - FRONTEND/src/features/spotify/useSpotifyAuth.js
  modified:
    - FRONTEND/.env.example

key-decisions:
  - "pgcrypto pgp_sym_encrypt/decrypt for token encryption at rest in Supabase DB"
  - "Edge Functions use service_role key to bypass RLS for token storage operations"
  - "OAuth PKCE flow with SHA-256 code_challenge for client-side auth"
  - "Tokens held in-memory (Zustand store) only, never persisted in localStorage"
  - "invalid_grant handling deletes config row and prompts reauthorization (6-month Spotify policy)"

patterns-established:
  - "Encrypted token storage: Edge Function handles encrypt/decrypt via pgcrypto RPC"
  - "PKCE OAuth: generate_verifier -> SHA-256 challenge -> redirect -> callback -> exchange"
  - "Edge Function pattern: corsHeaders + OPTIONS + service_role client + error handling"

requirements-completed: [SPOT-01, SPOT-02, SPOT-09]

coverage:
  - id: D1
    description: "Database migration with spotify_config and spotify_play_history tables, RLS policies, and pgcrypto encryption functions"
    requirement: SPOT-01
    verification:
      - kind: manual_procedural
        ref: "Apply migration via Supabase dashboard, verify tables and RLS exist"
        status: unknown
    human_judgment: true
    rationale: "Migration must be applied to live Supabase project and verified with SQL queries — cannot be automated in CI"
  - id: D2
    description: "spotify-auth Edge Function handling token exchange and refresh with invalid_grant detection"
    requirement: SPOT-09
    verification:
      - kind: manual_procedural
        ref: "Deploy via supabase functions deploy spotify-auth, test with valid Spotify auth code"
        status: unknown
    human_judgment: true
    rationale: "Edge Function requires Spotify API credentials and live OAuth flow to verify — manual deployment and testing needed"
  - id: D3
    description: "spotify-playlist Edge Function with get_tracks/add_track/remove_track and pagination support"
    requirement: SPOT-02
    verification:
      - kind: manual_procedural
        ref: "Deploy via supabase functions deploy spotify-playlist, test with valid playlist_id"
        status: unknown
    human_judgment: true
    rationale: "Edge Function requires Spotify API credentials and valid playlist to verify — manual deployment and testing needed"
  - id: D4
    description: "spotifyStore.js Zustand store with all state fields and action methods"
    requirement: SPOT-02
    verification:
      - kind: unit
        ref: "npm run lint — no spotifyStore errors"
        status: pass
    human_judgment: false
  - id: D5
    description: "useSpotifyAuth.js hook implementing PKCE OAuth flow with code_verifier/challenge generation"
    requirement: SPOT-01
    verification:
      - kind: unit
        ref: "npm run lint — no useSpotifyAuth errors"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-07-30
status: complete
---

# Phase 9 Plan 01: Spotify Random Picker — Infrastructure + Store + OAuth Summary

**Spotify database tables with pgcrypto token encryption, two Supabase Edge Functions for OAuth and playlist CRUD, Zustand store, and PKCE OAuth hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-30T19:18:04Z
- **Completed:** 2026-07-30T19:22:31Z
- **Tasks:** 6
- **Files modified:** 6

## Accomplishments
- Database migration with spotify_config/spotify_play_history tables, RLS policies, and pgcrypto encryption functions
- spotify-auth Edge Function for token exchange and refresh with invalid_grant handling
- spotify-playlist Edge Function for playlist CRUD with pagination support
- spotifyStore.js Zustand store with all Spotify state and actions
- useSpotifyAuth.js hook implementing full PKCE OAuth flow
- Environment variables added to .env.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Spotify database migration** - `3c501ed` (feat)
2. **Task 2: Create spotify-auth Edge Function** - `9c38142` (feat)
3. **Task 3: Create spotify-playlist Edge Function** - `931cea9` (feat)
4. **Task 4: Create spotifyStore.js Zustand store** - `bc19637` (feat)
5. **Task 5: Create useSpotifyAuth.js hook** - `05141ab` (feat)
6. **Task 6: Update .env.local with Spotify variables** - `c8e3740` (feat)

## Files Created/Modified
- `FRONTEND/supabase/migrations/20260730_create_spotify_tables.sql` — Database tables with RLS and pgcrypto
- `FRONTEND/supabase/functions/spotify-auth/index.ts` — OAuth token exchange and refresh Edge Function
- `FRONTEND/supabase/functions/spotify-playlist/index.ts` — Playlist CRUD Edge Function with pagination
- `FRONTEND/src/stores/spotifyStore.js` — Zustand store with all Spotify state and actions
- `FRONTEND/src/features/spotify/useSpotifyAuth.js` — PKCE OAuth hook
- `FRONTEND/.env.example` — Updated with Spotify env vars

## Decisions Made
- pgcrypto pgp_sym_encrypt/decrypt for token encryption at rest (AES-256)
- Edge Functions use service_role key to bypass RLS for token operations
- PKCE flow with SHA-256 code_challenge for client-side auth security
- Tokens held in-memory only (Zustand), never in localStorage
- invalid_grant handling: delete config row + prompt reauth (6-month Spotify policy)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## Self-Check: PASSED
- All 6 tasks committed with atomic commits
- Lint passes with no new warnings in spotify files
- Build succeeds (vite build)
- All required files created per plan specification

## User Setup Required

External services require manual configuration:

1. **Spotify Developer App:** Create at https://developer.spotify.com/dashboard, get Client ID and Client Secret
2. **Supabase Edge Function secrets:** Run `npx supabase secrets set SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=xxx SPOTIFY_TOKEN_ENCRYPTION_KEY=xxx`
3. **.env.local:** Add `VITE_SPOTIFY_CLIENT_ID` with your Spotify Client ID
4. **Database migration:** Apply `20260730_create_spotify_tables.sql` via Supabase dashboard
5. **Generate encryption key:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## Next Phase Readiness
- Backend infrastructure complete, ready for Plan 02 (UI + Integration)
- All Edge Functions need deployment via `npx supabase functions deploy`
- Spotify Developer App credentials required before testing OAuth flow

---
*Phase: 09-spotify-random-picker*
*Completed: 2026-07-30*
