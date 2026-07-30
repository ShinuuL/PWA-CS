# Phase 9: Spotify Random Picker - Context

**Gathered:** 2026-07-30
**Source:** Design Spec (docs/specs/2026-07-29-spotify-random-picker-design.md)
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a Spotify-powered music player to the CoupleSpace homepage. Couples link a shared Spotify playlist, and the app auto-rotates through random songs. Both partners can search and add tracks, manage the playlist, and control playback — all without leaving the app.

</domain>

<decisions>
## Implementation Decisions

### Playback Architecture
- **D-01:** Spotify Web Playback SDK for in-app playback (requires Spotify Premium on the user's account)
- **D-02:** Web Playback SDK loaded dynamically via script injection from `sdk.scdn.co/spotify-player.js` — not bundled via npm
- **D-03:** Player initialized with `getOAuthToken` callback that refreshes tokens via Edge Function before each playback request
- **D-04:** Device ID stored in spotifyStore after SDK `ready` event — used for playback transfer via Web API

### Authentication (OAuth 2.0)
- **D-05:** OAuth flow: user clicks "Vincular Spotify" → redirect to Spotify `/authorize` → callback with authorization code → Supabase Edge Function exchanges code for tokens
- **D-06:** Required scopes: `playlist-read-private`, `playlist-modify-public`, `streaming`, `user-read-playback-state`, `user-modify-playback-state`
- **D-07:** Token exchange happens server-side in `spotify-auth` Edge Function to keep `client_secret` secure
- **D-08:** Tokens encrypted at rest in `spotify_config` table using pgcrypto (`pgp_sym_encrypt`/`pgp_sym_decrypt`)
- **D-09:** 6-month refresh token expiration enforced by Spotify (July 2026) — app must handle `invalid_grant` by clearing tokens and prompting reauthorization
- **D-10:** Auto-refresh: check `token_expires_at` before each API call; if <5min remaining, refresh via Edge Function

### Playlist Management
- **D-11:** Single shared playlist per couple stored in `spotify_config.spotify_playlist_id`
- **D-12:** Playlist operations (add/remove tracks) go through `spotify-playlist` Edge Function for centralized token management
- **D-13:** Search API calls made directly from client (search endpoint doesn't require user-specific tokens, only access token)

### Random Selection (Auto-Rotate)
- **D-14:** Auto-rotate picks random song at configurable interval (1–30 minutes, default 3)
- **D-15:** Deduplication: maintain last 50 played tracks in `spotify_play_history`; filter them out before random selection
- **D-16:** If playlist has ≤50 tracks, allow repeats after full cycle (grace period logic)
- **D-17:** Cleanup: remove `play_history` entries older than 7 days periodically

### UI Components
- **D-18:** SpotifyPlayer card lives on homepage grid between mood section and MiniAlbum
- **D-19:** 5 card states: Not connected, Connected no playlist, Connected empty playlist, Playing, Premium required
- **D-20:** SpotifySearch modal: debounced search (300ms), results show album art + track name + artist, "+" button to add
- **D-21:** PlaylistManager modal: scrollable track list, remove button per track, "Adicionar música" button opens search
- **D-22:** Portuguese (pt-BR) UI text throughout — "Vincular Spotify", "Nossa Playlist", "Buscar Música", etc.

### Zustand Store
- **D-23:** `spotifyStore.js` manages: config, currentTrack, isPlaying, progress, searchResults, playlistTracks, isConnected, isLoading, error
- **D-24:** No Supabase Realtime subscription needed — Spotify state is fetched from API, not synced between partners via DB
- **D-25:** Auto-rotate interval managed via `setInterval` in store; cleanup on unmount/disconnect

### Error Handling
- **D-26:** Premium not active → show "Requer Spotify Premium" with upgrade link
- **D-27:** Token expired → auto-refresh; if fails, show "Reconectar Spotify"
- **D-28:** Playlist empty → show "Adicione músicas à playlist" + search button
- **D-29:** Web Playback SDK unavailable → fallback: show track info + "Abrir no Spotify" link
- **D-30:** Playlist deleted on Spotify → detect 404 → show "Playlist não encontrada" + re-link option
- **D-31:** Rate limit hit → exponential backoff, show "Tente novamente"

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema (to be created)
- `spotify_config` — Stores couple's Spotify integration settings (playlist_id, tokens, interval)
- `spotify_play_history` — Tracks recently played songs for deduplication
- RLS policies: pair_id-based access control for both tables

### Design Reference
- `docs/specs/2026-07-29-spotify-random-picker-design.md` — Complete design spec (UI layouts, data model, flows, error handling)
- `docs/cosmic-v2.html` — Design reference for romantic, minimal, modern aesthetic

### Requirements
- `.planning/REQUIREMENTS.md` — SPOT-01 through SPOT-10

### Existing Code Patterns
- `FRONTEND/src/stores/authStore.js` — Zustand store pattern for state management
- `FRONTEND/src/stores/agendaStore.js` — Zustand store with Supabase integration pattern
- `FRONTEND/src/shared/lib/supabase.js` — Supabase client initialization
- `FRONTEND/src/features/home/HomePage.jsx` — Homepage grid integration point
- `FRONTEND/src/features/spotify/` — Target directory for new components (to be created)

### External APIs
- Spotify Web Playback SDK: `https://sdk.scdn.co/spotify-player.js`
- Spotify Web API: `https://api.spotify.com/v1/`
- Spotify OAuth: `https://accounts.spotify.com/authorize`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Zustand store pattern**: authStore/agendaStore show how to create stores with Supabase integration
- **Supabase client**: Already configured, supports Edge Function invocation
- **HomePage grid**: `dashboard-grid` layout where SpotifyPlayer card slots in
- **lucide-react icons**: Already available for player controls (Play, Pause, SkipForward, etc.)
- **framer-motion**: Already available for animations

### Established Patterns
- **Zustand stores**: All state management via Zustand. Stores call Supabase directly.
- **Co-located CSS**: Each component gets its own .css file
- **Feature directories**: Features organized in `src/features/{name}/`
- **PairID system**: All tables use pair_id with RLS policies
- **PWA config**: VitePWA plugin in vite.config.js handles service worker

### Integration Points
- **HomePage grid**: SpotifyPlayer card inserted between mood section and MiniAlbum
- **AppShell**: Player renders inside AppShell > PairingGate wrapper
- **No nav changes**: Feature is a homepage card, not a new route

</code_context>

<specifics>
## Specific Ideas

- The player card should feel like a natural part of the homepage — not a bolted-on feature
- Album art should be prominent (128px) — visual appeal drives engagement
- The "Próxima em: X:XX" countdown creates anticipation for the next random song
- Portuguese UI text maintains consistency with the rest of the app
- The playlist manager modal should feel lightweight — not a separate page

</specifics>

<deferred>
## Deferred Ideas

- **Collaborative playlists** — Both users editing simultaneously (complexity, not core value)
- **Queue management** — Beyond random picker (overkill for MVP)
- **Lyrics display** — Nice-to-have but not core
- **Social features** — Share what's playing (outside couples-only scope)
- **Spotify Connect device switching** — UI for switching playback devices (complexity)
- **Offline playback caching** — Not possible with Spotify API terms

</deferred>

---

*Phase: 9-Spotify Random Picker*
*Context gathered: 2026-07-30*
