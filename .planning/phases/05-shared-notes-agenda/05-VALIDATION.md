---
phase: 5
slug: shared-notes-agenda
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-27
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 + @testing-library/react 16.3.2 |
| **Config file** | FRONTEND/vite.config.js (test section) |
| **Quick run command** | `cd FRONTEND && npx vitest run --reporter=verbose` |
| **Full suite command** | `cd FRONTEND && npm run test:run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd FRONTEND && npx vitest run --reporter=verbose`
- **After every plan wave:** Run `cd FRONTEND && npm run test:run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | NOTE-01 | — | N/A | unit | `npx vitest run src/features/agenda/__tests__/NoteEditor.test.jsx` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | NOTE-02 | — | N/A | integration | `npx vitest run src/features/agenda/__tests__/NotesTab.test.jsx` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | NOTE-03 | — | N/A | unit | `npx vitest run src/stores/__tests__/notesStore.test.js` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | AGND-01 | — | N/A | unit | `npx vitest run src/features/agenda/__tests__/EventForm.test.jsx` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | AGND-02 | — | N/A | unit | `npx vitest run src/features/agenda/__tests__/CalendarGrid.test.jsx` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | AGND-03 | — | N/A | integration | `npx vitest run src/features/agenda/__tests__/EventsTab.test.jsx` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 2 | AGND-04 | — | N/A | unit | `npx vitest run src/stores/__tests__/agendaStore.test.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/features/agenda/__tests__/NoteEditor.test.jsx` — stubs for NOTE-01
- [ ] `src/features/agenda/__tests__/NotesTab.test.jsx` — stubs for NOTE-02
- [ ] `src/stores/__tests__/notesStore.test.js` — stubs for NOTE-03
- [ ] `src/features/agenda/__tests__/EventForm.test.jsx` — stubs for AGND-01
- [ ] `src/features/agenda/__tests__/CalendarGrid.test.jsx` — stubs for AGND-02
- [ ] `src/features/agenda/__tests__/EventsTab.test.jsx` — stubs for AGND-03
- [ ] `src/stores/__tests__/agendaStore.test.js` — stubs for AGND-04
- [ ] `src/features/agenda/__tests__/AgendaPage.test.jsx` — page-level integration test

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipe gesture navigation on calendar | AGND-02 | Touch gestures require real device | Open /agenda > Events tab > swipe left/right on calendar grid |
| Browser notification permission | AGND-04 | Requires user interaction | Create event > set reminder > verify notification appears |
| Real-time partner sync | NOTE-02, AGND-03 | Requires two authenticated users | User A creates note/event > verify User B sees it in real-time |

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
