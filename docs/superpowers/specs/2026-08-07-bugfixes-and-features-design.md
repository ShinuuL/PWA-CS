# Bug Fixes & Features - Design Spec

## 1. Spotify Auto-play Sequential

**Problem**: `playRandom()` sends `uris: [randomTrack.uri]` — replaces queue with 1 track. When it ends, nothing plays next.

**Solution**:
- `playRandom()`: Send full shuffled playlist as queue, starting from random index
- Remove auto-rotate timer (`startAutoRotate`, `stopAutoRotate`, `autoRotateTimer`)
- Remove countdown UI and interval selector
- Spotify handles natural track advancement

**Files**: `spotifyStore.js`, `SpotifyPlayer.jsx`, `SpotifyPlayer.css`

## 2. Date Picker Bug Fix

**Problem**: DateTimePicker opens but clicking dates doesn't register. Likely overflow:hidden on swipe container + modal clipping.

**Solution**:
- Remove `overflow: hidden` from `.calendar-grid__swipe-container`
- Ensure DateTimePicker has proper z-index in modal context
- Add `position: relative` to calendar grid for proper stacking

**Files**: `DateTimePicker.jsx`, `agenda.css`

## 3. Separate Spotify Album Art

**Problem**: Album art and controls are tightly coupled in one div.

**Solution**:
- Extract `SpotifyAlbumArt` component (image + track info)
- Extract `SpotifyControls` component (play/pause, skip, shuffle)
- `SpotifyPlayer` orchestrates layout with these sub-components

**Files**: `SpotifyPlayer.jsx`, `SpotifyPlayer.css`

## 4. Bug Report Feature

**Solution**:
- Supabase table: `bug_reports` (id, user_id, pair_id, category, description, screenshot_url, status, created_at)
- `BugReportModal` component with form (category select, description textarea, optional screenshot upload)
- Triggered from Settings page or a floating button
- Stores in Supabase, shows confirmation toast

**Files**: New `BugReportModal.jsx`, `SettingsPage.jsx`, Supabase migration

## 5. MemoryHero Desktop Layout Fix

**Problem**: `grid-row: 1 / 3` makes hero span 2 rows, but right-column content can be taller, cutting off the hero card.

**Solution**:
- Add `align-self: start` to memory-hero in desktop grid
- Ensure `min-height: 0` on grid children to prevent overflow
- Add `overflow: visible` to dashboard-grid

**Files**: `dashboard.css`, `memory-hero.css`
