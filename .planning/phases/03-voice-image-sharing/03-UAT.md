---
status: passed
phase: 03-voice-image-sharing
source: 03-01-PLAN.md, 03-02-PLAN.md
started: 2025-07-25T12:00:00Z
updated: 2025-07-25T18:00:00Z
---

## Current Test

number: 13
name: Album — Navigation & Auth
expected: |
  Drawer shows Album nav item with Images icon (requires pairing).
  /album route is protected — redirects to login if unauthenticated, redirects to pairing if not paired.
result: PASS

## Tests

### 1. Voice Recording — Hold to Record
expected: Press and hold mic button → live waveform animates + timer counts → release → voice message bubble appears instantly in chat
result: PASS

### 2. Voice Recording — Cancel Gesture
expected: While holding mic, slide finger left → recording cancels → no message sent, waveform disappears
result: PASS

### 3. Voice Message — Playback
expected: Tap play on a voice message → audio plays, pause button visible, duration display shown. Tapping pause stops playback.
result: PASS

### 4. Image Sharing — Pick & Compress
expected: Tap plus icon in chat input → file picker opens → select image → compression preview modal shows image + file size savings % → tap Send
result: PASS

### 5. Image Sharing — Realtime Sync
expected: After sending an image, it shows on partner's chat too (reload if needed)
result: PASS

### 6. Optimistic Updates — Instant Display
expected: Voice and image messages appear in chat immediately on send, before network round-trip completes. No loading spinner blocks the UI.
result: PASS

### 7. Persistence
expected: Reload both devices. Voice messages and images remain in chat history.
result: PASS

### 8. ImageViewer — Full Screen
expected: Tap on an image in chat → full-screen viewer opens showing the full image.
result: PASS

### 9. ImageViewer — Close
expected: Swipe down or tap X in the full-screen image viewer → closes back to chat.
result: PASS (X works, swipe-down fixed during UAT)

### 10. Optimistic Updates — Text Messages
expected: Send a text message — appears instantly in chat without page refresh
result: PASS

### 11. Shared Album — Access
expected: Tap album icon in header → opens shared photo album screen
result: PASS

### 12. Shared Album — Add Photo
expected: Tap + in album → pick image → upload → photo appears in album grid
result: PASS

### 13. Shared Album — Photo Grid & Delete
expected: All uploaded photos visible in grid. Long-press or tap delete — removes from grid.
result: PASS

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0
blocked: 0

## Bugs Found & Fixed During UAT

1. `react-audio-visualize` incompatible with React 19 → custom Canvas Waveform.jsx
2. `usePairing` infinite re-render loop → memoized with useCallback
3. Storage RLS policy bug (pair_id → id) → fixed SQL migration
4. Realtime subscription conflicts → old channel cleanup
5. Header 406 errors → .single() → .maybeSingle()
6. Chat profiles join broken → fixed FK + adjusted query
7. Optimistic messages never replaced → pendingTempIds tracking
8. setViewerSrc undefined in MessageBubble → passed as onImageClick prop
9. ImageViewer swipe-down not working → always-on drag with threshold
10. Blob URLs revoked too early → removed premature revocation
