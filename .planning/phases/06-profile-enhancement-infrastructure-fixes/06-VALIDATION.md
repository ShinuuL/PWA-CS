---
phase: 6
slug: profile-enhancement-infrastructure-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-28
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 |
| **Config file** | vite.config.js (test section) |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test:run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | INFRA-01 | — | No manual SW registration | unit | `grep -r "serviceWorker.register" FRONTEND/src/` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | PROF-01 | — | File input accepts images | unit | `npm run test:run -- --grep "avatar"` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | PROF-02 | — | Circular crop renders | unit | `npm run test:run -- --grep "crop"` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | PROF-03 | T-06-01 | Compression produces <300KB | unit | `npm run test:run -- --grep "compress"` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 3 | PROF-04 | — | Name saves on blur | unit | `npm run test:run -- --grep "display"` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 4 | PROF-05 | — | Online dot renders | unit | `npm run test:run -- --grep "presence"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `FRONTEND/src/test/AvatarUpload.test.jsx` — stubs for PROF-01, PROF-02, PROF-03
- [ ] `FRONTEND/src/test/usePresence.test.js` — stubs for PROF-05, PROF-06, PROF-07
- [ ] `FRONTEND/src/test/ProfilePage.test.jsx` — stubs for PROF-04

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Avatar crop interaction (pinch-to-zoom) | PROF-02 | Touch gestures require real device | Tap avatar, pinch to zoom, drag to position |
| Online status dot visibility | PROF-05 | Requires two browser sessions | Open app in two browsers, verify green dot |
| "Last seen" relative time | PROF-06 | Requires waiting for offline period | Go offline >1h, verify text appears |
| Partner profile modal | D-25 | Requires paired accounts | Tap avatar in header, verify modal overlay |
| Cache busting after upload | INFRA-06 | Requires upload + partner view | Upload new avatar, check partner sees update |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
