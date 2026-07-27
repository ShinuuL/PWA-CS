---
phase: 4
slug: homepage-dashboard
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-27
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 |
| **Config file** | `FRONTEND/vitest.config.js` |
| **Quick run command** | `cd FRONTEND && npm run test:run` |
| **Full suite command** | `cd FRONTEND && npm run test:run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd FRONTEND && npm run test:run`
- **After every plan wave:** Run `cd FRONTEND && npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | HOME-01 | — | N/A | unit | `cd FRONTEND && npm run test:run -- dashboard` | ❌ Wave 0 | ⬜ pending |
| 04-02-01 | 02 | 1 | HOME-02 | T-04-01 | RLS: user can only write own mood | unit | `cd FRONTEND && npm run test:run -- MoodSelector` | ❌ Wave 0 | ⬜ pending |
| 04-02-02 | 02 | 1 | HOME-03 | T-04-02 | RLS: partner read only same pair | integration | `cd FRONTEND && npm run test:run -- PartnerMood` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx` — stubs for HOME-01
- [ ] `FRONTEND/src/features/dashboard/__tests__/MoodSelector.test.jsx` — stubs for HOME-02
- [ ] `FRONTEND/src/features/dashboard/__tests__/PartnerMood.test.jsx` — stubs for HOME-03
- [ ] `FRONTEND/src/stores/__tests__/dashboardStore.test.js` — store logic stubs

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Random photo displays correctly with gradient overlay | HOME-01 | Visual layout requires browser rendering | Open dashboard, verify photo loads with gradient, caption, and date |
| Mood selection feels tactile and responsive | HOME-02 | Animation quality requires human judgment | Tap each mood, verify purple border glow and animation |
| Partner mood updates in real-time without refresh | HOME-03 | Requires two devices/browsers | Set mood on device A, verify it appears on device B instantly |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
