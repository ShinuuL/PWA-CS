---
phase: 09-spotify-random-picker
plan: 02
type: execute
wave: 1
depends_on:
  - 09-01-PLAN.md
files_modified:
  - FRONTEND/src/features/spotify/SpotifyPlayer.jsx
  - FRONTEND/src/features/spotify/SpotifyPlayer.css
  - FRONTEND/src/features/spotify/SpotifySearch.jsx
  - FRONTEND/src/features/spotify/SpotifySearch.css
  - FRONTEND/src/features/spotify/PlaylistManager.jsx
  - FRONTEND/src/features/spotify/PlaylistManager.css
  - FRONTEND/src/features/spotify/useSpotifyPlayer.js
  - FRONTEND/src/features/spotify/SpotifyCallback.jsx
  - FRONTEND/src/features/dashboard/HomePage.jsx
  - FRONTEND/src/App.jsx
  - FRONTEND/src/stores/spotifyStore.js
autonomous: true
requirements:
  - SPOT-03
  - SPOT-04
  - SPOT-05
  - SPOT-06
  - SPOT-07
  - SPOT-08
  - SPOT-10

must_haves:
  truths:
    - "SpotifyPlayer card renders on homepage grid between mood section and MiniAlbum"
    - "Card displays all 5 states: Not connected, Connected no playlist, Connected empty playlist, Playing, Premium required"
    - "SpotifySearch modal performs debounced search with 300ms delay and shows results with album art"
    - "PlaylistManager modal displays tracks with remove capability and Adicionar musica button"
    - "Web Playback SDK initializes dynamically and responds to play/pause/skip controls"
    - "Auto-rotate picks random songs at configurable interval with deduplication via play_history"
    - "Premium detection shows appropriate fallback message for free users"
    - "All UI text is in Portuguese (pt-BR)"
  artifacts:
    - FRONTEND/src/features/spotify/SpotifyPlayer.jsx
    - FRONTEND/src/features/spotify/SpotifyPlayer.css
    - FRONTEND/src/features/spotify/SpotifySearch.jsx
    - FRONTEND/src/features/spotify/SpotifySearch.css
    - FRONTEND/src/features/spotify/PlaylistManager.jsx
    - FRONTEND/src/features/spotify/PlaylistManager.css
    - FRONTEND/src/features/spotify/useSpotifyPlayer.js
    - FRONTEND/src/features/spotify/SpotifyCallback.jsx
  key_links:
    - "SpotifyPlayer imports useSpotifyAuth and useSpotifyPlayer hooks"
    - "SpotifyPlayer reads from spotifyStore for all state"
    - "SpotifySearch calls spotifyStore.searchTracks and spotifyStore.addTrack"
    - "PlaylistManager calls spotifyStore.fetchPlaylist and spotifyStore.removeTrack"
    - "HomePage imports and renders SpotifyPlayer between right-top and MiniAlbum"
    - "useSpotifyPlayer dynamically loads Spotify SDK and manages player lifecycle"
    - "SpotifyCallback handles OAuth code exchange and redirects to home"
  prohibitions: []
---

# Phase 9 Plan 02: Spotify Random Picker — UI + Integration Summary

**All UI components for Spotify integration, Web Playback SDK hook, homepage integration, and OAuth callback route**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-07-30T20:00:00Z
- **Completed:** 2026-07-30T20:10:00Z
- **Tasks:** 7
- **Files modified:** 11

## Accomplishments

- Created `useSpotifyPlayer.js` hook for Web Playback SDK lifecycle management
- Created `SpotifyPlayer.jsx` main card component with 5 states (Not connected, No playlist, Empty playlist, Playing, Premium required)
- Created `SpotifySearch.jsx` modal with debounced search (300ms) and track addition
- Created `PlaylistManager.jsx` modal with track list and removal capability
- Added visibility change handler to `spotifyStore.js` for auto-rotate pause/resume
- Integrated SpotifyPlayer into HomePage grid between mood section and MiniAlbum
- Added `/spotify/callback` route and `SpotifyCallback.jsx` component for OAuth flow

## Component Hierarchy

```
HomePage.jsx
├── CosmicBackground
├── MemoryHero
├── right-column
│   ├── right-top
│   │   ├── PartnerMood
│   │   └── MoodSelector
│   ├── SpotifyPlayer.jsx          ← NEW
│   │   ├── SpotifySearch.jsx      (modal)
│   │   └── PlaylistManager.jsx    (modal)
│   └── MiniAlbum
└── App.jsx
    └── Route: /spotify/callback → SpotifyCallback.jsx
```

## State Flow Diagram

```
spotifyStore (Zustand)
├── config: { playlist_id, interval, is_enabled }
├── currentTrack: { name, artist, albumArt, uri, duration_ms }
├── isPlaying, progress, playlistTracks, isConnected, etc.
├── Actions:
│   ├── initializeSpotify(pairId) → fetch config from DB
│   ├── startAutoRotate() → setInterval + visibility handler
│   ├── playRandom() → deduplication → SDK playback
│   ├── searchTracks(query) → Spotify Search API
│   ├── addTrack(uri) → Edge Function → Spotify API
│   └── removeTrack(uri) → Edge Function → Spotify API
└── Hooks:
    ├── useSpotifyAuth → PKCE OAuth flow
    └── useSpotifyPlayer → SDK lifecycle + controls
```

## Known Limitations

1. **Premium Required**: Web Playback SDK requires Spotify Premium; free users see fallback with "Abrir no Spotify" link
2. **6-Month Token Expiry**: Spotify refresh tokens expire after 6 months; app must handle `invalid_grant` by prompting reauthorization
3. **Single Playlist**: Only one shared playlist per couple (design decision)
4. **No Background Playback**: iOS limitations prevent background audio playback via Web Playback SDK
5. **Auto-Rotate Timer**: Client-side `setInterval` pauses when tab is hidden; resumes when visible
6. **Search Rate Limits**: 300ms debounce on search; exponential backoff on 429 responses (not implemented in client)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useSpotifyPlayer.js hook** - `8919243` (feat)
2. **Task 2: Create SpotifyPlayer.jsx main card** - `e79fdf0` (feat)
3. **Task 3: Create SpotifySearch.jsx search modal** - `49082c5` (feat)
4. **Task 4: Create PlaylistManager.jsx playlist modal** - `cadec32` (feat)
5. **Task 5: Implement auto-rotate visibility handler** - `d824724` (feat)
6. **Task 6: Integrate SpotifyPlayer into HomePage** - `2d4373c` (feat)
7. **Task 7: Add Spotify callback route** - `82271de` (feat)

## Verification

- **Lint**: `npm run lint` passes with no new errors (only pre-existing warnings)
- **Build**: `npm run build` succeeds
- **Manual Verification Required**:
  1. Open homepage, verify SpotifyPlayer card renders
  2. Connect Spotify via OAuth, verify card transitions to connected state
  3. Select playlist, verify card shows player controls
  4. Search for tracks, verify debounced results appear
  5. Add track to playlist, verify checkmark and playlist update
  6. Remove track from playlist, verify removal
  7. Play/pause/skip controls work with Web Playback SDK
  8. Auto-rotate picks random song at configured interval
  9. Deduplication prevents repeating recent tracks
  10. Premium detection shows fallback for free users
  11. All UI text in Portuguese

## Next Phase Readiness

- UI components complete and integrated
- Auto-rotate with deduplication and visibility handling implemented
- OAuth callback route ready for token exchange
- All components follow project conventions (co-located CSS, Zustand stores, lucide-react icons)
- Ready for testing with real Spotify credentials and Premium account

---
*Phase: 09-spotify-random-picker*
*Completed: 2026-07-30*