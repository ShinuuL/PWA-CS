---
status: testing
phase: 03-voice-image-sharing
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md
started: 2025-07-25T12:00:00Z
updated: 2025-07-25T12:00:00Z
---

## Current Test

number: 1
name: Voice Recording — Hold to Record
expected: |
  Press and hold the mic button in chat input bar.
  While holding: live waveform animates, timer counts up.
  Release: voice message bubble appears instantly in chat (optimistic).
awaiting: user response

## Tests

### 1. Voice Recording — Hold to Record
expected: Press and hold mic button → live waveform animates + timer counts → release → voice message bubble appears instantly in chat
result: [pending]

### 2. Voice Recording — Cancel Gesture
expected: While holding mic, slide finger left → recording cancels → no message sent, waveform disappears
result: [pending]

### 3. Voice Message — Playback
expected: Tap play on a voice message → audio plays, pause button visible, duration display shown. Tapping pause stops playback.
result: [pending]

### 4. Image Sharing — Pick & Compress
expected: Tap plus icon in chat input → file picker opens → select image → compression preview modal shows image + file size savings % → tap Send
result: [pending]

### 5. Image Message — Thumbnail Display
expected: After sending image, thumbnail appears in chat instantly (optimistic). Tap thumbnail → full-screen ImageViewer opens.
result: [pending]

### 6. ImageViewer — Zoom & Download
expected: In full-screen viewer: tap +/- buttons or pinch to zoom. Drag to pan when zoomed. Tap download button saves image. Press Esc or tap X to close.
result: [pending]

### 7. Optimistic Updates — Instant Display
expected: Voice and image messages appear in chat immediately on send, before network round-trip completes. No loading spinner blocks the UI.
result: [pending]

### 8. Supabase Storage — Persistence
expected: After sending a voice or image message, refresh the page. Messages and their media files reload correctly from Supabase Storage.
result: [pending]

### 9. Album — Database & Storage Setup
expected: album_photos table exists with pair_id, user_id, url, storage_path, caption, dimensions, file_size, created_at columns. RLS policies enforce pair-scoped access.
result: [pending]

### 10. Album Page — Grid & Upload
expected: Navigate to /album → photo grid displays (responsive columns). Upload button opens file picker → compression preview → optional caption → upload. Photos appear in grid with hover overlay (caption + date). Own photos show delete button.
result: [pending]

### 11. Album — Lightbox Viewer
expected: Tap a photo in album grid → full-screen lightbox opens with zoom controls. Swipe/drag to navigate between photos. Close via X or Esc.
result: [pending]

### 12. MiniAlbum — Homepage Widget
expected: On homepage, MiniAlbum shows horizontal scrollable row of 10 most recent photos. "See All" link navigates to /album. Empty state shows camera icon with message.
result: [pending]

### 13. Album — Navigation & Auth
expected: Drawer shows Album nav item with Images icon (requires pairing). /album route is protected — redirects to login if unauthenticated, redirects to pairing if not paired.
result: [pending]

## Summary

total: 13
passed: 0
issues: 0
pending: 13
skipped: 0
blocked: 0

## Gaps

(none yet)
