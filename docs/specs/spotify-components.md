# Spotify Components — UI Rules & Reference

> **Purpose:** If components get corrupted or modified incorrectly, use this document as the base to restore.
> **Last updated:** 2026-08-07

---

## Global Rules

1. **No auto-rotate** — The auto-rotate feature was removed from the UI. The store still has `startAutoRotate`, `stopAutoRotate`, `playRandom` functions but they are NOT used by any component.
2. **No countdown display** — The countdown timer is not shown anywhere.
3. **No interval selector** — The "Intervalo: X min" dropdown was removed.
4. **Controls margin-left: 5px** — The `.spotify-player__controls` has `margin-left: 5px` for alignment.
5. **Disconnect button** — Always visible when connected (red Unlink icon, `#ff6b6b`).
6. **Play button in PlaylistManager** — Each track has a play button (▶) that calls `playUri(track.uri)`.
7. **CSS is co-located** — Each component has its own `.css` file. Never create shared CSS files.
8. **BEM naming** — All classes use `component__element--modifier` pattern.
9. **No TypeScript** — All files are `.jsx`, never `.tsx`.

---

## Component: SpotifyPlayer

**Files:** `SpotifyPlayer.jsx` + `SpotifyPlayer.css`

### Layout Rules

| Element | Rule |
|---------|------|
| Container | `background: rgba(18, 20, 32, 0.85)`, `backdrop-filter: blur(20px)`, `border: 1px solid rgba(190, 140, 255, 0.12)`, `border-radius: var(--radius-lg, 24px)`, `padding: 1rem` |
| Header | Flex, `justify-content: space-between`, `margin-bottom: 1rem` |
| Title | `font-size: 1rem`, `font-weight: 600` |
| Header actions | Flex, `gap: 0.25rem` — contains playlist button + disconnect button |
| Disconnect button | `color: #ff6b6b`, hover: `background: rgba(255, 107, 107, 0.15)` |
| Album art | `128×128px`, `border-radius: var(--radius-md)`, `object-fit: cover`, `box-shadow: 0 4px 20px rgba(0,0,0,0.3)` |
| Mobile album art | `100×100px` (via `@media max-width: 768px`) |
| Controls | Flex, `gap: 1rem`, `margin-bottom: 1rem`, **`margin-left: 5px`** |
| Control buttons | `padding: 0.5rem`, `border-radius: 50%`, transparent bg |
| Play button | `width: 48px`, `height: 48px`, `background: var(--color-primary)`, white icon |
| Progress bar | `height: 4px`, `background: rgba(255,255,255,0.1)`, `border-radius: 2px` |
| Progress fill | `background: var(--color-primary)`, `transition: width 0.1s linear` |
| Time text | `font-size: 0.75rem`, `color: var(--color-text-secondary)` |

### State Machine

```
not_connected → no_playlist → empty_playlist → premium_required → playing
```

- `not_connected`: Show "Vincule seu Spotify" + Conectar button (Link2 icon)
- `no_playlist`: Show playlist selector list
- `empty_playlist`: Show "Adicione músicas" + Buscar button
- `premium_required`: Show "Requer Spotify Premium" + link + fallback track info
- `playing`: Full player UI (album art, controls, progress, playlist button)

### Imports (exact)

```jsx
import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Music, Play, Pause, SkipForward, SkipBack, Shuffle, List, ExternalLink, Link2, Unlink } from 'lucide-react'
import useSpotifyStore from '../../stores/spotifyStore'
import useSpotifyAuth from './useSpotifyAuth'
import useSpotifyPlayer from './useSpotifyPlayer'
import SpotifySearch from './SpotifySearch'
import PlaylistManager from './PlaylistManager'
import './SpotifyPlayer.css'
```

### Store Selectors (exact)

```js
config, currentTrack, isPlaying, progress, playlistTracks, isConnected, isLoading
togglePlay, setShuffle, fetchPlaylist, fetchUserPlaylists, setPlaylist, disconnect
```

### Hook Returns

```js
const { startAuth } = useSpotifyAuth()
const { next, previous, hasPremium } = useSpotifyPlayer()
```

---

## Component: PlaylistManager

**Files:** `PlaylistManager.jsx` + `PlaylistManager.css`

### Layout Rules

| Element | Rule |
|---------|------|
| Overlay | `position: fixed`, `inset: 0`, `background: rgba(0,0,0,0.7)`, `z-index: 1000` |
| Modal | `background: var(--color-bg-card)`, `border-radius: var(--radius-lg)`, `padding: 1.5rem`, `width: 90%`, `max-width: 400px`, `max-height: 80vh` |
| Track row | Flex, `gap: 0.75rem`, `padding: 0.75rem 0`, `border-bottom: 1px solid var(--color-border)` |
| Track art | `40×40px`, `border-radius: var(--radius-sm)`, `object-fit: cover` |
| Track name | `font-size: 0.875rem`, `font-weight: 500`, text-overflow: ellipsis |
| Track artist | `font-size: 0.75rem`, text-overflow: ellipsis |
| Play button | `color: var(--color-primary)`, transparent bg, `padding: 0.5rem` |
| Remove button | `color: var(--color-text-secondary)`, hover: `color: #ff3b30` |
| Add button | Full width, `background: var(--color-primary)`, white text |
| List max-height | `400px` with `overflow-y: auto` |

### Imports (exact)

```jsx
import { useEffect } from 'react'
import { X, Trash2, Plus, Music, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import useSpotifyStore from '../../stores/spotifyStore'
import './PlaylistManager.css'
```

### Store Selectors (exact)

```js
const playlistTracks = useSpotifyStore((s) => s.playlistTracks)
const removeTrack = useSpotifyStore((s) => s.removeTrack)
const playUri = useSpotifyStore((s) => s.playUri)
```

### Props

```js
{ onClose, onAddMusic }
```

### Animation (framer-motion)

- Overlay: `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}`
- Modal: `initial={{ opacity: 0, scale: 0.95, y: 20 }}`, `animate={{ opacity: 1, scale: 1, y: 0 }}`, `exit={{ opacity: 0, scale: 0.95, y: 20 }}`

---

## Component: SpotifySearch

**Files:** `SpotifySearch.jsx` + `SpotifySearch.css`

### Layout Rules

| Element | Rule |
|---------|------|
| Overlay | Same as PlaylistManager |
| Modal | Same as PlaylistManager |
| Input container | `position: relative`, `margin-bottom: 1rem` |
| Search icon | `position: absolute`, `left: 0.75rem`, `top: 50%` |
| Input | `padding: 0.75rem 0.75rem 0.75rem 2.5rem`, `background: var(--color-bg-input)`, focus: `border-color: var(--color-primary)` |
| Track row | Same as PlaylistManager |
| Add button | `border-radius: 50%`, border: `1px solid var(--color-border)` |
| Added state | `background: #1db954`, `border-color: #1db954`, white icon |
| Loading spinner | CSS `@keyframes spin` animation |
| Results max-height | `400px` |

### Imports (exact)

```jsx
import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Plus, Check, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import useSpotifyStore from '../../stores/spotifyStore'
import './SpotifySearch.css'
```

### Store Selectors (exact)

```js
const searchTracks = useSpotifyStore((s) => s.searchTracks)
const addTrack = useSpotifyStore((s) => s.addTrack)
const searchResults = useSpotifyStore((s) => s.searchResults)
```

### Debounce

- 300ms debounce on search input
- Minimum 2 characters to trigger search

---

## Component: SpotifyCallback

**File:** `SpotifyCallback.jsx` (no CSS — uses inline styles)

### Layout

- Centered text with `padding: 2rem`
- Error text: `color: #ff3b30`
- "Voltar ao início" button on error

### Flow

1. Extract `code` and `state` from URL params
2. Call `handleCallback(code, state)` from `useSpotifyAuth`
3. On success → `navigate('/home', { replace: true })`
4. On error → show error message

---

## Hook: useSpotifyAuth

**File:** `useSpotifyAuth.js`

### PKCE Flow

1. Generate 64-byte random `code_verifier`
2. SHA-256 hash → `code_challenge` (base64url)
3. Random `state` for CSRF
4. Store both in `localStorage`
5. Redirect to Spotify `/authorize` with scopes:
   - `playlist-read-private`
   - `playlist-modify-public`
   - `playlist-modify-private`
   - `streaming`
   - `user-read-playback-state`
   - `user-modify-playback-state`
   - `user-read-currently-playing`

### Callback

1. Verify `state` matches localStorage
2. Get `user` from authStore
3. Query `pairs` table (NOT profiles!) for pair_id
4. Send `code`, `code_verifier`, `redirect_uri`, `pair_id` to Edge Function
5. Store token via `setAccessToken(token, expiresIn)`
6. Clean up localStorage

### Edge Function

- Name: `spotify-auth`
- Requires `code_verifier` (PKCE mandatory)
- Action `exchange`: exchanges code for tokens
- Action `refresh`: refreshes expired token

---

## Hook: useSpotifyPlayer

**File:** `useSpotifyPlayer.js`

### SDK Loading

- Loads `https://sdk.scdn.co/spotify-player.js`
- Waits for `window.Spotify` with 100ms polling, 5s timeout

### Player Config

```js
{
  name: 'CoupleSpace',
  getOAuthToken: async (cb) => { /* refresh if needed, then cb(token) */ },
  volume: 0.8,
}
```

### Listeners

- `ready` → sets deviceId
- `player_state_changed` → updates currentTrack, isPlaying, progress
- `account_error` → sets hasPremium=false
- `authentication_error` → sets error='auth_expired'
- `playback_error` → console.error only

### Progress Polling

- 1s `setInterval` calling `player.getCurrentState()` when not paused

### Returned Functions

```js
{ play, pause, next, previous, seek, isReady, hasPremium }
```

---

## Store: spotifyStore

**File:** `spotifyStore.js`

### State Shape

```js
{
  config: null,          // { playlist_id, playlist_name, interval, is_enabled }
  currentTrack: null,    // { name, artist, albumArt, uri, duration_ms }
  isPlaying: false,
  progress: 0,
  searchResults: [],
  playlistTracks: [],
  isConnected: false,
  isLoading: false,
  error: null,
  deviceId: null,
  autoRotateTimer: null, // NOT used by UI
  accessToken: null,
  pairId: null,
  tokenExpiresAt: undefined,
  visibilityHandler: undefined, // NOT used by UI
}
```

### Key Actions

| Action | Description |
|--------|-------------|
| `initializeSpotify(pairId)` | Load config from `spotify_config` table |
| `disconnect()` | Delete config, clear all state |
| `setPlaylist(id, name)` | Update playlist in DB |
| `fetchPlaylist()` | Fetch tracks via Edge Function |
| `searchTracks(query)` | Search Spotify API directly |
| `addTrack(uri)` | Add to playlist via Edge Function |
| `removeTrack(uri)` | Remove from playlist (optimistic) |
| `playRandom()` | Random track with dedup (7-day history) |
| `playUri(uri)` | Play specific track via Spotify API |
| `togglePlay()` | Play/pause via Spotify API |
| `nextTrack()` | Skip via Spotify API |
| `setShuffle(on)` | Toggle shuffle via Spotify API |
| `setAccessToken(token, expires)` | Store token with expiry |
| `refreshTokenIfNeeded()` | Auto-refresh if <5min left |
| `fetchUserPlaylists()` | Get user's playlists from Spotify |

### Token Management

- Stored in memory only (not localStorage)
- `tokenExpiresAt` tracks expiry
- Auto-refresh when <5 minutes remaining
- `sessionStorage` used as fallback persistence
- On refresh failure: disconnect + show "reconnect" error

### Edge Functions

| Function | Action | Purpose |
|----------|--------|---------|
| `spotify-auth` | `exchange` | Code → tokens |
| `spotify-auth` | `refresh` | Refresh expired token |
| `spotify-playlist` | `get_tracks` | Fetch playlist tracks |
| `spotify-playlist` | `add_track` | Add track to playlist |
| `spotify-playlist` | `remove_track` | Remove track from playlist |

---

## Database Tables

### `spotify_config`

| Column | Type | Notes |
|--------|------|-------|
| `pair_id` | uuid | PK, references `pairs.id` |
| `spotify_playlist_id` | text | Spotify playlist ID |
| `playlist_name` | text | Display name |
| `auto_rotate_interval` | int | Minutes (default 3) — NOT used in UI |
| `is_enabled` | boolean | Auto-rotate flag — NOT used in UI |
| `access_token` | text | Spotify token |
| `refresh_token` | text | For token refresh |
| `token_expires_at` | timestamp | Token expiry |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

### `spotify_play_history`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `pair_id` | uuid | References `pairs.id` |
| `track_uri` | text | Spotify URI |
| `track_name` | text | |
| `track_artist` | text | |
| `played_at` | timestamp | default `now()` |

### `pairs` (relevant columns)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `user_one` | uuid | References `auth.users.id` |
| `user_two` | uuid | References `auth.users.id` |
| `code_used` | boolean | Must be `true` for valid pair |

---

## Environment Variables

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_SPOTIFY_CLIENT_ID=...
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify/callback
```

---

## Common Pitfalls

1. **Never query `profiles.pair_id`** — The `profiles` table does NOT have a `pair_id` column. Always query the `pairs` table.
2. **`code_verifier` is mandatory** — The Edge Function requires PKCE. Without it, Spotify returns `invalid_request`.
3. **Token scopes** — If playback 403s appear, the stored token lacks scopes. User must disconnect + reconnect.
4. **`playUri` must exist in store** — `PlaylistManager` calls `playUri(track.uri)`. If missing, the play button breaks.
5. **Controls margin-left is 5px** — Not 0, not 2px. This aligns controls with the centered album art.
6. **Disconnect deletes from DB** — `disconnect()` runs `DELETE FROM spotify_config WHERE pair_id = X`.
7. **No `created_by` in todo_items** — The table doesn't have this column.
8. **`assigned_to` is text** — Values are `'me'` or `'partner'`, not user UUIDs.
