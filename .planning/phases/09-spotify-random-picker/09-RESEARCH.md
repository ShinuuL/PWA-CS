# Phase 9: Spotify Random Picker - Research

**Researched:** 2026-07-30
**Domain:** Spotify OAuth 2.0 + PKCE, Web Playback SDK, Web API (search/playlists), Supabase Edge Functions, pgcrypto token encryption, auto-rotate random picker
**Confidence:** HIGH

## Summary

Phase 9 adds a Spotify-powered music player to the CoupleSpace homepage with random song rotation, search, and playlist management. This is the most complex feature in the project to date because it involves:
- OAuth 2.0 with PKCE for Spotify authentication
- Supabase Edge Functions (Deno) for server-side token exchange (keeping client_secret secure)
- pgcrypto symmetric encryption for tokens at rest in Supabase
- Spotify Web Playback SDK for in-browser audio streaming (requires Premium)
- Spotify Web API for search, playlist management, and playback control
- Zustand store with auto-rotate timer and non-repeating random selection

**Primary recommendation:** Use Supabase Edge Functions (already have 2 in project) for token exchange and playlist operations. Use pgcrypto pgp_sym_encrypt/pgp_sym_decrypt with a Supabase Vault encryption key for token storage. The Web Playback SDK requires Premium; implement graceful degradation for free users with Abrir no Spotify fallback.

**Critical finding:** Spotify now enforces 6-month refresh token expiration (announced June 18, 2026, enforced from July 20, 2026 for existing apps). The app MUST handle invalid_grant on refresh by prompting reauthorization. This is a breaking change from the previous indefinite refresh token lifetime.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| OAuth token exchange (code -> tokens) | Supabase Edge Function | Spotify API | client_secret stays server-side; Edge Function handles the exchange |
| Token refresh | Supabase Edge Function | Spotify API | Same server-side pattern; reads encrypted tokens from DB |
| Token encryption at rest | pgcrypto (Supabase DB) | Supabase Vault | pgp_sym_encrypt with Vault-managed key |
| In-browser playback | Spotify Web Playback SDK | -- | Client-side only; creates local Spotify Connect device |
| Search tracks | Spotify Web API (direct from client) | -- | Search uses access_token directly; no secret needed |
| Playlist management (add/remove) | Supabase Edge Function | Spotify API | Keeps token refresh logic centralized; avoids client-side token management |
| Auto-rotate random picker | Zustand store (client timer) | Supabase DB (play_history) | setInterval on client; play_history dedup in DB |
| Current track state | Zustand store | Web Playback SDK | player_state_changed events update store |
| UI components | React JSX | CSS co-located | Standard project pattern |
| RLS for spotify_config/spotify_play_history | Supabase RLS | -- | pair_id-based policies (same as existing patterns) |

## Standard Stack

### Core (no new npm dependencies required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | 5.0.14 | State management (spotifyStore) | Already in project -- all stores use this |
| @supabase/supabase-js | 2.110.8 | Database + Edge Function invocations | Already in project -- all data goes through this |
| lucide-react | 1.26.0 | Icons (Play, Pause, Skip, Search, etc.) | Already in project |
| motion | 12.42.2 | Animations (album art, player transitions) | Already in project |
| react-hot-toast | 2.6.0 | Success/error feedback | Already in project |
| date-fns | 4.4.0 | Formatting countdown | Already in project |

### External SDKs (loaded dynamically, no npm install)

| SDK | Source | Purpose | Why Not npm |
|-----|--------|---------|-------------|
| Spotify Web Playback SDK | https://sdk.scdn.co/spotify-player.js | In-browser audio streaming | Not available as npm package; loaded via dynamic script injection |

### Server-Side (Supabase Edge Functions)

| Component | Purpose | Rationale |
|-----------|---------|-----------|
| Supabase Edge Functions (Deno) | Token exchange, token refresh, playlist operations | client_secret never leaves server; project already has 2 Edge Functions |
| pgcrypto (PostgreSQL extension) | Encrypt tokens at rest | Built into Supabase; pgp_sym_encrypt/pgp_sym_decrypt |
| Supabase Vault | Encryption key management | Managed key rotation; avoids hardcoding keys in SQL |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Edge Functions | Vercel/Netlify serverless | Would split backend across platforms; project already uses Supabase Edge Functions |
| pgcrypto symmetric encryption | Application-level AES-256-GCM | More complex key management; pgcrypto is built into Supabase and simpler |
| Supabase Vault for key | Hardcoded encryption key in Edge Function env | Vault provides managed rotation; hardcoded key is a security risk |
| Direct client-side token exchange | Edge Function token exchange | Exposes client_secret in browser bundle; violates OAuth security model |
| Web Playback SDK | Spotify Connect API only | Would require user to manually switch devices; no in-browser playback |
| No encryption (tokens in plain text) | pgcrypto encryption | Security risk: DB breach exposes all user tokens |

**Installation:** None -- no new npm packages needed.

**Version verification:** Spotify Web Playback SDK loaded from https://sdk.scdn.co/spotify-player.js (official CDN). pgcrypto is pre-installed in Supabase projects. [VERIFIED: official sources]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| (no new npm packages) | -- | -- | -- | -- | -- | -- |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

**Note:** The Spotify Web Playback SDK is loaded as an external script, not an npm dependency. It is Spotify's official SDK hosted on their CDN (sdk.scdn.co). No npm audit needed.
## Architecture Patterns

### System Architecture Diagram

CoupleSpace PWA -> HomePage.jsx -> SpotifyPlayer.jsx (NEW)
  Hooks: useSpotifyAuth.js, useSpotifyPlayer.js
  Modals: SpotifySearch.jsx, PlaylistManager.jsx
  Store: spotifyStore.js (Zustand)

Data flow:
  Client -> Supabase (anon key, RLS) -> spotify_config (encrypted), spotify_play_history
  Client -> Supabase Edge Functions -> Spotify APIs
  Client -> Spotify Web Playback SDK (in-browser audio)

### Recommended Project Structure

FRONTEND/src/features/spotify/ - All Spotify UI components and hooks
FRONTEND/src/stores/spotifyStore.js - Zustand store
FRONTEND/supabase/functions/spotify-auth/index.ts - Token exchange
FRONTEND/supabase/functions/spotify-playlist/index.ts - Playlist CRUD
FRONTEND/supabase/migrations/YYYYMMDD_create_spotify_tables.sql


### Pattern 2: Supabase Edge Function for Token Exchange (spotify-auth)

**What:** Deno-based Edge Function handling OAuth token exchange and refresh
**When to use:** Any operation requiring client_secret (token exchange, refresh)
**Pattern source:** Following project pattern from send-push-notification/index.ts

Key implementation details:
- Import serve from Deno std http/server.ts
- Import createClient from @supabase/supabase-js via esm.sh
- Use corsHeaders object (same pattern as existing Edge Functions)
- Access SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_TOKEN_ENCRYPTION_KEY from Deno.env
- Handle OPTIONS preflight requests
- Use supabase.service_role key for DB access (bypasses RLS)
- Encrypt tokens via supabase.rpc('encrypt_token', { p_token, p_key }) before storing
- Decrypt tokens via supabase.rpc('decrypt_token', { p_encrypted, p_key }) when refreshing
- Return CORS headers on all responses

Token exchange flow:
1. Receive authorization code from client
2. POST to https://accounts.spotify.com/api/token with code, redirect_uri, client_id, client_secret
3. Encrypt access_token and refresh_token via pgcrypto
4. Upsert into spotify_config table
5. Return access_token + expires_in to client (decrypted, for in-memory use)

Token refresh flow:
1. Receive pair_id from client
2. Fetch encrypted refresh_token from spotify_config
3. Decrypt refresh_token
4. POST to https://accounts.spotify.com/api/token with refresh_token, client_id, client_secret
5. If invalid_grant: delete spotify_config row, return 401
6. Otherwise: encrypt new tokens, update spotify_config, return new access_token

### Pattern 3: Dynamic SDK Loading (useSpotifyPlayer.js)

**What:** Custom React hook that dynamically loads the Spotify Web Playback SDK
**When to use:** Initializing in-browser Spotify playback

Key implementation details:
- Dynamic script injection (not in index.html): create script element, set src to sdk.scdn.co/spotify-player.js
- Wait for window.Spotify to be defined after script loads
- Create new Spotify.Player with name 'CoupleSpace', getOAuthToken callback, volume 0.8
- Listen for 'ready' event -> store device_id
- Listen for 'player_state_changed' -> update store (currentTrack, isPlaying, progress)
- Listen for 'authentication_error' and 'account_error' for error handling
- player.connect() returns Promise<boolean>
- Cleanup: player.disconnect() on unmount
- Use useRef to hold player instance across renders
- Use cancelled flag pattern for async cleanup

### Pattern 4: OAuth PKCE Flow (useSpotifyAuth.js)

**What:** Custom React hook implementing Spotify Authorization Code with PKCE
**When to use:** Initiating Spotify OAuth from the client

Key implementation details:
- Generate code_verifier: crypto.getRandomValues(new Uint8Array(64)), base64url encode
- Generate code_challenge: SHA-256 hash of verifier, base64url encode
- Store code_verifier in localStorage temporarily
- Build authorization URL: https://accounts.spotify.com/authorize with params:
  - response_type: 'code'
  - client_id: from VITE_SPOTIFY_CLIENT_ID env var
  - scope: streaming user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-read-private playlist-modify-public playlist-modify-private
  - redirect_uri: from VITE_SPOTIFY_REDIRECT_URI env var
  - code_challenge_method: 'S256'
  - code_challenge: computed challenge
- Redirect user to authUrl
- On callback: extract code from URL params, call Edge Function to exchange
- Edge Function handles the actual token exchange (server-side)
- After exchange: store access_token in Zustand (in-memory), clear code_verifier from localStorage

Required scopes for this feature:
- streaming: Web Playback SDK
- user-read-playback-state: read current playback
- user-modify-playback-state: control playback (play/pause/skip)
- user-read-currently-playing: read currently playing track
- playlist-read-private: read user playlists
- playlist-modify-public: add/remove tracks from public playlists
- playlist-modify-private: add/remove tracks from private playlists

### Pattern 5: Auto-Rotate Random Picker Algorithm

**What:** Non-repeating random track selection with configurable interval
**When to use:** Auto-play feature on the homepage player card

Algorithm:
1. Fetch all tracks from playlist (via Edge Function -> Spotify API, handle pagination for >100 tracks)
2. Query spotify_play_history for last 50 tracks (ordered by played_at DESC, limit 50)
3. Build Set of recently played track URIs
4. Filter playlist tracks: candidates = allTracks.filter(t => !recentUris.has(t.uri))
5. If candidates is empty (all played recently): candidates = allTracks (full cycle reset)
6. Pick random: candidates[Math.floor(Math.random() * candidates.length)]
7. Start playback via Web Playback SDK or Spotify API
8. Insert into spotify_play_history
9. Clean up entries older than 7 days periodically

Timer management:
- Use setInterval with intervalMinutes * 60 * 1000
- Store timer reference in Zustand state (autoRotateTimer)
- Clear previous timer before setting new one
- Clear on cleanup() and component unmount
- Pause when document.visibilitychange = 'hidden'

### Pattern 6: Token Refresh Middleware

**What:** Automatic token refresh before API calls
**When to use:** Any Spotify API call that uses the access token

Implementation:
- On each Spotify API call, check if token_expires_at < now + 5 minutes
- If expired: call Edge Function spotify-auth with action='refresh'
- Edge Function decrypts refresh_token, calls Spotify token endpoint, re-encrypts new tokens
- If invalid_grant: clear spotify_config, show "Reconectar Spotify" UI
- Update access_token in Zustand store (in-memory)
- For search (client-side): use refreshed access_token directly
- For playlist operations: Edge Function handles token internally

### Pattern 7: Homepage Integration

**What:** Adding SpotifyPlayer to the HomePage grid layout
**When to use:** Integrating the player card into the dashboard

Updated HomePage.jsx layout:
`
dashboard-grid
  MemoryHero (grid-row: 1/3)
  right-column
    right-top
      PartnerMood
      MoodSelector
    SpotifyPlayer    <-- NEW: between mood and album
    MiniAlbum
`

The SpotifyPlayer component:
- Calls useSpotifyAuth hook for OAuth flow
- Calls useSpotifyPlayer hook for SDK lifecycle
- Reads from spotifyStore for state
- Shows different states: Not Connected, Connected No Playlist, Playing, Premium Required
- Contains SpotifySearch and PlaylistManager as modals


### Anti-Patterns to Avoid

- **Do not store access_token/refresh_token in localStorage:** Tokens at rest in the browser are vulnerable to XSS. Store in Supabase DB encrypted with pgcrypto. The access token can be held in-memory (Zustand store) during the session.
- **Do not use PKCE flow for token exchange on the client with client_secret:** The design spec says Supabase Edge Function exchanges code for tokens (server-side, keeps client_secret secure).
- **Do not skip token encryption in the database:** The design spec explicitly requires pgcrypto. A Supabase service-role key leak would expose all user tokens if stored in plain text.
- **Do not forget the 6-month refresh token expiration:** Spotify now expires refresh tokens after 6 months. The app MUST handle invalid_grant by clearing config and prompting reauthorization.
- **Do not auto-play without user gesture on mobile:** Browsers block auto-play without user interaction. The auto-rotate timer should trigger on user gesture or use the Web Playback SDK's own playback transfer mechanism.
- **Do not call Spotify API directly from client for playlist modification:** The design spec routes add/remove through Edge Functions. This centralizes token refresh logic.
- **Do not assume Web Playback SDK works everywhere:** iOS has limitations (no background playback, no auto-start on transfer). The app must degrade gracefully (SPOT-10).
- **Do not use setInterval without cleanup:** The auto-rotate timer must be cleared in the store's cleanup() method and on component unmount.


## Don't Hand-Roll

| Problem | Do Not Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth PKCE flow | Custom crypto + redirect logic | Implement per Spotify official docs | Well-documented flow with specific requirements (S256, state param) |
| Token encryption | Custom AES implementation | pgcrypto pgp_sym_encrypt/pgp_sym_decrypt | Battle-tested PostgreSQL extension; Supabase has it pre-installed |
| Web Playback SDK integration | Custom audio player | Spotify Web Playback SDK | Only way to play full Spotify tracks in-browser; handles DRM |
| Token refresh logic | Client-side refresh with client_secret | Supabase Edge Function | Keeps client_secret server-side; centralized refresh logic |
| Random track selection | Complex shuffle algorithms | Fisher-Yates with Set-based dedup | Simple, efficient, well-understood; play_history provides dedup |
| Search debouncing | Custom debounce implementation | 300ms setTimeout with cleanup | Standard pattern; avoids excessive API calls |


## Common Pitfalls

### Pitfall 1: 404 on initial playback after SDK ready event
**What goes wrong:** After the Web Playback SDK fires ready, calling PUT /v1/me/player/play returns 404 Device not found.
**Why it happens:** There is a race condition -- the device is registered but not yet fully active in Spotify's device registry. This is a documented issue (Spotify Community, Nov 2022).
**How to avoid:** Add a 1-2 second delay after ready event before first playback call. Or use the SDK's own player.resume() after transferring playback. Alternatively, retry the play call with exponential backoff (100ms, 300ms, 1000ms).
**Warning signs:** 404 on /v1/me/player/play, device not appearing in Spotify app's device list.

### Pitfall 2: Refresh token expires after 6 months (NEW as of July 2026)
**What goes wrong:** After ~6 months, token refresh returns invalid_grant. If not handled, the app enters a broken state.
**Why it happens:** Spotify introduced 6-month refresh token expiration on June 18, 2026 (enforced from July 20, 2026 for existing apps). Refreshing an access token does NOT extend the refresh token lifetime.
**How to avoid:** Catch invalid_grant on refresh. Clear the spotify_config row (or mark as disconnected). Show Reconectar Spotify UI to the user. Prompt them through the full OAuth flow again.
**Warning signs:** Token refresh suddenly failing for long-standing connections; invalid_grant error.

### Pitfall 3: Web Playback SDK requires Premium
**What goes wrong:** Non-Premium users see account_error event. If not handled, the player appears broken.
**Why it happens:** The Web Playback SDK explicitly requires Spotify Premium. Free users cannot stream through the SDK.
**How to avoid:** Listen for account_error event. Show Requer Spotify Premium with upgrade link. For free users, show track info + Abrir no Spotify deep link. This is SPOT-10.
**Warning signs:** account_error event firing; user reports nothing happens when I click play.

### Pitfall 4: pgcrypto column type mismatch
**What goes wrong:** pgp_sym_encrypt returns bytea, but the design spec's access_token and refresh_token columns are defined as TEXT.
**Why it happens:** The design spec shows TEXT columns, but pgcrypto encrypts to bytea. If you store bytea in a TEXT column, you will get encoding errors.
**How to avoid:** Cast the encrypted result: pgp_sym_encrypt(..., key)::text. The Edge Function handles encrypt/decrypt, so the column type is internal.
**Warning signs:** bytea text conflict errors; garbled encrypted data in DB viewer.

### Pitfall 5: CORS issues with Edge Functions
**What goes wrong:** Browser blocks requests to Edge Functions due to CORS.
**Why it happens:** Edge Functions must return proper CORS headers. The project's existing Edge Functions already have this pattern (corsHeaders object).
**How to avoid:** Include the standard CORS headers object (matching send-push-notification/index.ts pattern). The Supabase client handles this automatically when using supabase.functions.invoke().
**Warning signs:** Browser console shows CORS errors; requests fail with status 0.

### Pitfall 6: Auto-rotate timer not cleaned up on component unmount
**What goes wrong:** Timer continues firing after navigating away from HomePage, causing memory leaks and API calls to stale state.
**Why it happens:** setInterval persists unless explicitly cleared. React components unmount on navigation but do not automatically clean up external timers.
**How to avoid:** Store the timer reference in Zustand state (autoRotateTimer). In cleanup() method, call clearInterval(autoRotateTimer). In the component useEffect return, call cleanup(). Follow the exact pattern from dashboardStore.js cleanup().
**Warning signs:** Multiple API calls after navigation; Can't perform React state update on unmounted component warnings.

### Pitfall 7: Playlist track pagination
**What goes wrong:** Playlists with more than 100 tracks do not load fully because Spotify API returns paginated results (max 100 per request).
**Why it happens:** The GET /v1/playlists/{id}/tracks endpoint returns a paging object with limit=100 by default. Large playlists require multiple requests using offset or following next URLs.
**How to avoid:** Implement pagination in the Edge Function or client. Fetch with limit=100 and follow next cursor until all tracks are loaded. Store all track URIs in the store. For the random picker, this is critical -- missing tracks means biased selection.
**Warning signs:** Playlist showing only 100 tracks; random picker only selecting from a subset.


## Code Examples

### Database Migration

```sql
-- Enable pgcrypto if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encryption helper functions (using Supabase Vault)
CREATE OR REPLACE FUNCTION encrypt_token(p_token text, p_key text)
RETURNS text AS $$
  SELECT pgp_sym_encrypt(p_token, p_key, 'cipher-algo=aes256')::text;
$$
LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION decrypt_token(p_encrypted text, p_key text)
RETURNS text AS $$
  SELECT pgp_sym_decrypt(p_encrypted::bytea, p_key);
$$
LANGUAGE sql SECURITY DEFINER;

-- Main config table
CREATE TABLE spotify_config(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  spotify_playlist_id TEXT NOT NULL,
  playlist_name TEXT,
  auto_rotate_interval INTEGER DEFAULT 3,
  is_enabled BOOLEAN DEFAULT TRUE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(pair_id)
);

-- Play history for deduplication
CREATE TABLE spotify_play_history(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  track_uri TEXT NOT NULL,
  track_name TEXT,
  track_artist TEXT,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spotify_history_pair_played
  ON spotify_play_history(pair_id, played_at DESC);

-- RLS policies
CREATE POLICY "pair.spotify_config" ON spotify_config
  FOR ALL USING (
    pair_id = (SELECT pair_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "pair.spotify_history" ON spotify_play_history
  FOR ALL USING (
    pair_id = (SELECT pair_id FROM profiles WHERE id = auth.uid())
  );
```
### Edge Function: spotify-auth (summary)

```typescript
// File: supabase/functions/spotify-auth/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// corsHeaders object (same as send-push-notification)
// Handles action: "exchange" | "refresh"
// Exchange: code + redirect_uri -> Spotify token endpoint -> encrypt -> store in DB
// Refresh: pair_id -> decrypt refresh_token -> Spotify token endpoint -> re-encrypt -> update DB
// On invalid_grant: delete config, return 401
// Returns: { access_token, expires_in }
```
### Edge Function: spotify-playlist (summary)

```typescript
// File: supabase/functions/spotify-playlist/index.ts
// Handles action: "get_tracks" | "add_track" | "remove_track"
// Decrypts access_token from DB, proxies to Spotify Web API
// get_tracks: GET /v1/playlists/{id}/tracks (handle pagination)
// add_track: POST /v1/playlists/{id}/tracks with { uris: [track_uri] }
// remove_track: DELETE /v1/playlists/{id}/tracks with { tracks: [{ uri }] }
// Uses Supabase auth JWT to verify user owns the pair
```
### Homepage Integration (HomePage.jsx)

```jsx
import SpotifyPlayer from '../spotify/SpotifyPlayer'  // NEW

// In return JSX, add between right-top and MiniAlbum:
// <SpotifyPlayer />
```
### Environment Variables

`ash
# FRONTEND/.env.local additions
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5173/spotify/callback

# Supabase Edge Function secrets (set via supabase secrets set)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
SPOTIFY_TOKEN_ENCRYPTION_KEY=your_32_byte_base64_key
`

Generate encryption key:
`ash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
`


## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase pgcrypto extension is available and enabled | Architecture | Low -- Supabase has pgcrypto pre-installed |
| A2 | Supabase Vault is available for encryption key management | Standard Stack | Medium -- Vault may not be GA; fallback: store key in Edge Function env vars |
| A3 | The existing Edge Function pattern works for Spotify token exchange | Architecture | Low -- pattern already proven in send-push-notification and send-chat-push |
| A4 | The Web Playback SDK script loads correctly via dynamic injection in React | Common Pitfalls | Low -- official Spotify example confirms this works |
| A5 | Spotify refresh token expiration (6 months) is enforced as of July 20, 2026 | Common Pitfalls | Low -- confirmed by Spotify blog post dated June 18, 2026 |
| A6 | The spotify_config and spotify_play_history tables do not exist yet | Architecture | Low -- no existing migration found for these tables |
| A7 | The project's Supabase project has the pgcrypto extension enabled | Standard Stack | Low -- enabled by default in new Supabase projects |
| A8 | crypto.getRandomValues and crypto.subtle.digest are available in the browser | Common Pitfalls | Low -- supported in all modern browsers |
| A9 | The Spotify Web Playback SDK is not available as an npm package | Standard Stack | Low -- confirmed: only available via CDN script tag |


## Open Questions

1. **Should the Spotify callback be handled in-app or via a dedicated route?**
   - Recommendation: Use a dedicated React Router route (/spotify/callback) that extracts the code, calls the Edge Function, and redirects back to home.

2. **How should the connect playlist flow work?**
   - Recommendation: After OAuth, show a playlist selector modal. Fetch user's playlists via GET /v1/me/playlists. Let them pick an existing playlist or create a new one.

3. **Should both partners need to authorize Spotify, or just one?**
   - Recommendation: Only one partner needs to authorize (the playlist owner). Both can add/remove tracks because the Edge Function uses the playlist owner's token.

4. **What happens when the playlist is deleted on Spotify?**
   - Recommendation: Detect on-demand when fetching tracks fails with 404. Show error state with option to re-link.

5. **How should the auto-rotate timer interact with page visibility?**
   - Recommendation: Pause auto-rotate when tab is hidden (Page Visibility API). Resume when visible.


## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build | Yes | -- | -- |
| npm | Package install | Yes | -- | -- |
| Supabase project | Database + Edge Functions | Yes | -- | -- |
| pgcrypto extension | Token encryption | Yes (pre-installed) | -- | -- |
| Supabase CLI | Edge Function deployment | Check | >=1.50 | Manual deploy via dashboard |
| Spotify Developer App | OAuth credentials | Needs creation | -- | -- |
| Spotify Premium account | Web Playback SDK testing | Needs verification | -- | Abrir no Spotify fallback |

**Missing dependencies with no fallback:** None


## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | vite.config.js (inline vitest config) |
| Quick run command | cd FRONTEND && npm run test:run |
| Full suite command | cd FRONTEND && npm run test:run |

### Phase Requirements -> Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| SPOT-01 | User can connect Spotify account via OAuth | integration | Manual verification (OAuth flow) | N/A |
| SPOT-02 | User can link a shared playlist to the app | unit | npm run test:run -- tests/spotifyStore.test.js | Wave 0 |
| SPOT-03 | Player card shows current track with album art | unit | npm run test:run -- tests/SpotifyPlayer.test.jsx | Wave 0 |
| SPOT-04 | User can play/pause/skip from the homepage | unit | npm run test:run -- tests/spotifyStore.test.js | Wave 0 |
| SPOT-05 | Auto-rotate picks random song at configurable interval | unit | npm run test:run -- tests/spotifyStore.test.js | Wave 0 |
| SPOT-06 | User can search and add songs via Spotify Search API | unit | npm run test:run -- tests/SpotifySearch.test.jsx | Wave 0 |
| SPOT-07 | User can view and manage playlist (remove tracks) | unit | npm run test:run -- tests/PlaylistManager.test.jsx | Wave 0 |
| SPOT-08 | Recently played songs are not repeated | unit | npm run test:run -- tests/spotifyStore.test.js | Wave 0 |
| SPOT-09 | Token refresh happens automatically | integration | Manual verification (Edge Function) | N/A |
| SPOT-10 | Feature degrades gracefully without Premium | unit | npm run test:run -- tests/SpotifyPlayer.test.jsx | Wave 0 |

### Sampling Rate
- Per task commit: cd FRONTEND && npm run test:run
- Per wave merge: cd FRONTEND && npm run test:run
- Phase gate: Full suite green before /gsd-verify-work

### Wave 0 Gaps
- [ ] tests/spotifyStore.test.js -- covers SPOT-02, SPOT-04, SPOT-05, SPOT-08
- [ ] tests/SpotifyPlayer.test.jsx -- covers SPOT-03, SPOT-10
- [ ] tests/SpotifySearch.test.jsx -- covers SPOT-06
- [ ] tests/PlaylistManager.test.jsx -- covers SPOT-07


## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OAuth 2.0 with PKCE; tokens stored encrypted server-side |
| V3 Session Management | yes | Refresh token lifecycle (6-month expiry); automatic re-auth prompt |
| V4 Access Control | yes | RLS policies on spotify_config/spotify_play_history (pair_id based) |
| V6 Stored Cryptography | yes | pgcrypto AES-256 encryption for tokens at rest |
| V7 Error Handling | yes | Graceful degradation; no token leakage in error messages |

### Known Threat Patterns (STRIDE)

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Token theft via DB breach | Information Disclosure | pgcrypto AES-256 encryption; tokens useless without encryption key |
| XSS stealing access token from memory | Tampering | Token held in Zustand (in-memory), not localStorage; no dangerouslySetInnerHTML |
| OAuth code interception | Spoofing | PKCE (code_challenge S256) prevents code reuse; state parameter prevents CSRF |
| Refresh token abuse after expiry | Elevation of Privilege | 6-month expiry enforced; invalid_grant handling clears tokens |
| Edge Function unauthorized access | Tampering | Supabase JWT verification (default); service role key never exposed to client |
| Cross-pair playlist access | Information Disclosure | RLS policies enforce pair_id membership; Edge Functions verify user ownership |
| Rate limiting on Spotify API | Denial of Service | Exponential backoff; 300ms debounce on search; respect 429 responses |
| Web Playback SDK device spoofing | Tampering | SDK handles device registration; device_id from ready event is trusted |


## Sources

### Primary (HIGH confidence)
- Codebase: authStore.js, dashboardStore.js, agendaStore.js -- Zustand store patterns
- Codebase: supabase.js -- Supabase client initialization
- Codebase: HomePage.jsx -- Integration point for SpotifyPlayer card
- Codebase: send-push-notification/index.ts, send-chat-push/index.ts -- Edge Function patterns
- Codebase: package.json, vite.config.js -- Current dependencies and build config
- Design spec: 2026-07-29-spotify-random-picker-design.md -- Full feature spec

### Secondary (MEDIUM confidence)
- WebSearch: Spotify Web Playback SDK documentation (developer.spotify.com)
- WebSearch: Spotify OAuth PKCE flow (developer.spotify.com)
- WebSearch: Spotify Web API search endpoint (developer.spotify.com)
- WebSearch: Spotify refresh token documentation (developer.spotify.com) -- 6-month expiry
- WebSearch: Supabase Edge Functions (supabase.com/docs)
- WebSearch: pgcrypto PostgreSQL docs (postgresql.org)
- WebSearch: Supabase pgcrypto discussion (github.com/supabase)

### Tertiary (LOW confidence)
- WebSearch: Spotify Community posts -- 404 device not found workaround
- WebSearch: Stack Overflow -- Web Playback SDK React integration patterns


## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH -- All npm dependencies already in project; Edge Functions pattern proven; pgcrypto built into Supabase
- Architecture: HIGH -- Exact patterns exist in codebase (Edge Functions, Zustand stores, RLS policies)
- Pitfalls: MEDIUM -- 6-month refresh token expiry is new (July 2026); initial playback 404 is a known race condition
- External APIs: HIGH -- Spotify documentation is comprehensive and stable

**Research date:** 2026-07-30
**Valid until:** 2026-08-30 (Spotify APIs stable; Edge Functions stable; pgcrypto stable)
## RESEARCH COMPLETE
