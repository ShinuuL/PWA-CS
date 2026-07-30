# Design Spec: Spotify Random Picker — Phase 9

**Date:** 2026-07-29
**Feature:** Homepage Spotify integration with random music picker
**Milestone:** v3.0 (proposed)
**Phase:** 9

---

## 1. Overview

Add a Spotify-powered music player to the CoupleSpace homepage. Couples link a shared Spotify playlist, and the app auto-rotates through random songs. Both partners can search and add tracks, manage the playlist, and control playback — all without leaving the app.

**Key decisions:**
- **Playback:** Spotify Web Playback SDK (requires Premium)
- **Playlist:** Single shared playlist per couple
- **Random:** Auto-rotate with configurable interval (1–30 min)
- **Add songs:** Integrated search via Spotify Search API
- **UI:** Dedicated card in homepage grid
- **Manage:** Modal inline in the player card
- **Architecture:** Spotify-Only (no local cache)

---

## 2. Data Model

### Table: `spotify_config`

Stores the couple's Spotify integration settings.

```sql
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
```

### Table: `spotify_play_history`

Tracks recently played songs to avoid repeats.

```sql
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
```

### RLS Policies

```sql
-- spotify_config: couple can only access their own
CREATE POLICY "pair.spotify_config" ON spotify_config
  FOR ALL USING (
    pair_id = (SELECT pair_id FROM profiles WHERE id = auth.uid())
  );

-- spotify_play_history: couple can only access their own
CREATE POLICY "pair.spotify_history" ON spotify_play_history
  FOR ALL USING (
    pair_id = (SELECT pair_id FROM profiles WHERE id = auth.uid())
  );
```

---

## 3. Spotify Integration Flow

### 3.1 Authentication (OAuth 2.0)

**Flow:**
1. User clicks "Vincular Spotify" on the homepage card
2. App redirects to Spotify `/authorize` with scopes:
   - `playlist-read-private` — read playlist tracks
   - `playlist-modify-public` — add/remove tracks
   - `streaming` — Web Playback SDK
   - `user-read-playback-state` — read current playback
   - `user-modify-playback-state` — control playback
3. Spotify redirects back with authorization code
4. **Supabase Edge Function** exchanges code for `access_token` + `refresh_token` (server-side, keeps `client_secret` secure)
5. Tokens stored in `spotify_config` (encrypted via pgcrypto: `pgp_sym_encrypt` / `pgp_sym_decrypt` with app-level secret key)
6. User searches for and selects a playlist → `spotify_playlist_id` saved

**Edge Functions:**

1. `spotify-auth`
   - Path: `supabase/functions/spotify-auth/index.ts`
   - Handles: token exchange (code → tokens), token refresh
   - Exposed as: `POST /functions/v1/spotify-auth`

2. `spotify-playlist`
   - Path: `supabase/functions/spotify-playlist/index.ts`
   - Handles: add track, remove track, get playlist tracks
   - Exposed as: `POST /functions/v1/spotify-playlist`
   - Body: `{ action: "add_track" | "remove_track" | "get_tracks", playlist_id, track_uri? }`

### 3.2 Search Tracks

```
User types query → Frontend calls Spotify Search API
  GET https://api.spotify.com/v1/search?q={query}&type=track&limit=20

Response → Display track list (name, artist, album art, uri)

User clicks "+" → Frontend calls Edge Function
  POST /functions/v1/spotify-playlist
  Body: { action: "add_track", playlist_id, track_uri }

Edge Function → Spotify API
  POST https://api.spotify.com/v1/playlists/{id}/tracks
  Body: { uris: [track_uri] }
```

### 3.3 Auto-Rotate (Random Picker)

```
setInterval(() => {
  1. Fetch all tracks from playlist via Spotify API
  2. Query play_history for last 50 tracks
  3. Filter out recently played
  4. Pick random track from remaining
  5. Start playback via Web Playback SDK
  6. Insert into play_history
}, interval * 60 * 1000)
```

**Deduplication logic:**
- Keep last 50 entries in `play_history`
- If playlist has ≤50 tracks, allow repeats after full cycle
- Clean up entries older than 7 days periodically

### 3.4 Token Refresh

```
On each API call:
  if (token_expires_at < now + 5min):
    call Edge Function: spotify-auth → refresh
    update tokens in spotify_config
```

---

## 4. UI Components

### 4.1 File Structure

```
src/features/spotify/
├── SpotifyPlayer.jsx          # Main card on homepage
├── SpotifyPlayer.css
├── SpotifySearch.jsx           # Search modal
├── SpotifySearch.css
├── PlaylistManager.jsx         # Playlist management modal
├── PlaylistManager.css
├── useSpotifyPlayer.js         # Hook for Web Playback SDK
├── useSpotifyAuth.js           # Hook for OAuth flow
└── spotify.css                 # Shared styles
```

### 4.2 SpotifyPlayer Card

**Layout (desktop):**
```
┌─────────────────────────────┐
│  🎵 Nossa Playlist     [📋] │
│  ┌───────────────────────┐  │
│  │                       │  │
│  │    [Album Art 128px]  │  │
│  │                       │  │
│  └───────────────────────┘  │
│  Moonlight Sonata           │
│  Ludwig van Beethoven       │
│                             │
│     ⏮    ▶️    ⏭    🔀     │
│                             │
│  ░░░░░░░░░░░░░░░░░░ 1:23   │
│  Próxima em: 1:37           │
│  Intervalo: [3 min ▾]      │
└─────────────────────────────┘
```

**Layout (mobile):** Same structure, full-width card.

**States:**
- **Not connected:** "Vincule seu Spotify" + connect button
- **Connected, no playlist:** "Selecione uma playlist" + search/browse
- **Connected, empty playlist:** "Adicione músicas" + search button
- **Playing:** Full player with controls
- **Premium required:** "Requer Spotify Premium" + upgrade link

### 4.3 SpotifySearch Modal

**Layout:**
```
┌─────────────────────────────┐
│  Buscar Música         [X]  │
│  ┌───────────────────────┐  │
│  │ 🔍 Buscar música...   │  │
│  └───────────────────────┘  │
│                             │
│  ┌─────┐ Nome da Música    │
│  │ IMG │ Artista       [+] │
│  └─────┘                    │
│  ─────────────────────────  │
│  ┌─────┐ Outra Música      │
│  │ IMG │ Outro Artista [+] │
│  └─────┘                    │
│  ...                        │
│                             │
│  Carregando... (spinner)    │
│  Nenhum resultado encontrado│
└─────────────────────────────┘
```

- Search input with debounced API call (300ms)
- Results show: album art (40x40), track name, artist
- "+" button adds track to playlist
- Button shows ✓ briefly after adding
- Loading spinner during search
- Empty state message

### 4.4 PlaylistManager Modal

**Layout:**
```
┌─────────────────────────────┐
│  Nossa Playlist (12)   [X]  │
│                             │
│  🎵 Moonlight Sonata        │
│     Beethoven          [🗑] │
│  ─────────────────────────  │
│  🎵 Blinding Lights          │
│     The Weeknd          [🗑] │
│  ─────────────────────────  │
│  🎵 Shape of You             │
│     Ed Sheeran         [🗑] │
│  ...                        │
│                             │
│  [Adicionar música]         │
└─────────────────────────────┘
```

- Scrollable list of tracks
- Each track: album art, name, artist, remove button
- Remove calls Spotify API: `DELETE /playlists/{id}/tracks`
- "Adicionar música" button opens SpotifySearch
- Track count in header

### 4.5 Homepage Integration

**Updated grid layout:**

```jsx
<div className="dashboard-grid">
  <MemoryHero />              {/* grid-row: 1/3 */}
  <div className="right-column">
    <div className="right-top">
      <PartnerMood />
      <MoodSelector />
    </div>
    <SpotifyPlayer />         {/* NEW: between mood and album */}
    <MiniAlbum />
  </div>
</div>
```

---

## 5. Zustand Store

### `spotifyStore.js`

```js
{
  // State
  config: null,                // { playlist_id, interval, is_enabled }
  currentTrack: null,          // { name, artist, albumArt, uri, duration_ms }
  isPlaying: false,
  progress: 0,                 // current position in ms
  searchResults: [],
  playlistTracks: [],          // [{ uri, name, artist, albumArt }]
  isConnected: false,
  isLoading: false,
  error: null,

  // Actions
  connect: () => {},           // Initiate OAuth flow
  disconnect: () => {},        // Revoke tokens, clear config
  fetchConfig: () => {},       // Load config from Supabase
  fetchPlaylist: () => {},     // Get tracks from Spotify API
  searchTracks: (query) => {}, // Search Spotify
  addTrack: (uri) => {},       // Add to playlist
  removeTrack: (uri) => {},    // Remove from playlist
  playRandom: () => {},        // Pick and play random track
  togglePlay: () => {},        // Play/pause
  nextTrack: () => {},         // Skip to next
  setShuffle: (on) => {},      // Toggle shuffle
  setAutoRotateInterval: (min) => {}, // Set auto-rotate interval
  cleanup: () => {},           // Clear intervals, disconnect SDK
}
```

---

## 6. Error Handling

| Scenario | Handling |
|----------|----------|
| Spotify Premium not active | Card shows "Requer Spotify Premium" with upgrade link |
| Token expired | Auto-refresh via Edge Function; if fails, show "Reconectar Spotify" |
| Playlist empty | Card shows "Adicione músicas à playlist" + search button |
| Web Playback SDK unavailable | Fallback: show track info + "Abrir no Spotify" link |
| Playlist deleted on Spotify | Detect 404 → show "Playlist não encontrada" + re-link option |
| Both users offline | Player pauses; resumes when back online |
| Rate limit hit | Exponential backoff, show "Tente novamente" |
| No active Spotify device | "Abra o Spotify em um device para reproduzir" |
| Search API error | Show "Erro na busca" + retry button |

---

## 7. Spotify Web Playback SDK Integration

### `useSpotifyPlayer.js`

```js
// Responsibilities:
// 1. Load Spotify SDK script dynamically
// 2. Initialize Player with access_token
// 3. Handle device_ready / player_state_changed events
// 4. Expose: play(), pause(), next(), previous(), seek(), getCurrentState()
// 5. Auto-disconnect on token expiry
// 6. Cleanup on unmount
```

### SDK Loading

```js
// Dynamic script injection (not in index.html)
const loadSpotifySDK = () => {
  return new Promise((resolve) => {
    if (window.Spotify) { resolve(window.Spotify); return; }
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onload = resolve;
    document.body.appendChild(script);
  });
};
```

### Player Initialization

```js
const player = new Spotify.Player({
  name: 'CoupleSpace',
  getOAuthToken: (cb) => cb(accessToken),
  volume: 0.8
});

player.addListener('ready', ({ device_id }) => {
  // Store device_id for playback transfer
});

player.addListener('player_state_changed', (state) => {
  // Update store: currentTrack, isPlaying, progress
});
```

---

## 8. Requirements Mapping

| Req ID | Description | Status |
|--------|-------------|--------|
| SPOT-01 | User can connect Spotify account via OAuth | New |
| SPOT-02 | User can link a shared playlist to the app | New |
| SPOT-03 | Player card shows current track with album art | New |
| SPOT-04 | User can play/pause/skip from the homepage | New |
| SPOT-05 | Auto-rotate picks random song at configurable interval | New |
| SPOT-06 | User can search and add songs via Spotify Search API | New |
| SPOT-07 | User can view and manage playlist (remove tracks) | New |
| SPOT-08 | Recently played songs are not repeated | New |
| SPOT-09 | Token refresh happens automatically | New |
| SPOT-10 | Feature degrades gracefully without Premium | New |

---

## 9. Out of Scope

- Collaborative playlists (both users editing simultaneously)
- Queue management beyond random picker
- Lyrics display
- Social features (share what's playing)
- Spotify Connect device switching UI
- Offline playback caching

---

*Created: 2026-07-29*
