---
phase: 3
slug: voice-image-sharing
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-25
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `npm run test:run` |
| **Full suite command** | `npm run test:run -- --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test:run`
- **After every plan wave:** Run `npm run test:run -- --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | CHAT-02 | T-03-01 | Voice recording scoped to user's pair | unit | `npm run test:run -- --reporter=verbose src/test/voiceRecorder.test.js` | ❌ Wave 0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CHAT-03 | T-03-02 | Voice playback scoped to pair | unit | `npm run test:run -- --reporter=verbose src/test/voiceMessage.test.js` | ❌ Wave 0 | ⬜ pending |
| 03-01-03 | 01 | 1 | CHAT-04 | T-03-03 | Image upload validated per pair | unit | `npm run test:run -- --reporter=verbose src/test/imageCompress.test.js` | ❌ Wave 0 | ⬜ pending |
| 03-01-04 | 01 | 1 | CHAT-04 | T-03-04 | Inline display scoped to pair | unit | `npm run test:run -- --reporter=verbose src/test/imageMessage.test.js` | ❌ Wave 0 | ⬜ pending |
| 03-02-01 | 02 | 2 | HOME-04 | T-03-05 | Album data scoped to pair | unit | `npm run test:run -- --reporter=verbose src/test/miniAlbum.test.js` | ❌ Wave 0 | ⬜ pending |
| 03-02-02 | 02 | 2 | HOME-05 | T-03-06 | Album upload persisted per pair | integration | `npm run test:run -- --reporter=verbose src/test/albumUpload.test.js` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/test/voiceRecorder.test.js` — stubs for CHAT-02
- [ ] `src/test/voiceMessage.test.js` — stubs for CHAT-03
- [ ] `src/test/imageCompress.test.js` — stubs for CHAT-04
- [ ] `src/test/imageMessage.test.js` — stubs for CHAT-04
- [ ] `src/test/miniAlbum.test.js` — stubs for HOME-04
- [ ] `src/test/albumUpload.test.js` — stubs for HOME-05
- [ ] `vitest.config.js` — if none detected
- [ ] Test setup: mock `navigator.mediaDevices`, `MediaRecorder`, `AudioContext`

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Voice recording holds to record with waveform | CHAT-02 | Requires microphone permission and real audio input | Hold mic button, verify waveform animates, release to send |
| Slide left cancels recording | CHAT-02 | Touch gesture requiring real pointer events | Hold mic, slide left, verify cancel feedback and no message sent |
| Voice message plays with waveform visualization | CHAT-03 | Audio playback with real Media element | Tap voice message, verify waveform animates during playback |
| Image tap-to-expand full-screen | CHAT-04 | Touch interaction on mobile viewport | Tap image thumbnail, verify full-screen overlay, tap to close |
| Mini album horizontal scroll on homepage | HOME-04 | Scroll behavior on touch devices | Scroll horizontally through album thumbnails on homepage |
| Album upload from dedicated page | HOME-05 | File picker + upload flow | Open album page, upload photo, verify it appears in album |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
