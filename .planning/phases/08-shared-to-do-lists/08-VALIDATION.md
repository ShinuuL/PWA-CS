---
phase: 8
slug: shared-to-do-lists
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-07-30
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.10 |
| **Config file** | `vite.config.js` (inline vitest config) |
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
| 08-01-01 | 01 | 1 | TODO-01 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |
| 08-01-02 | 01 | 1 | TODO-02 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |
| 08-01-03 | 01 | 1 | TODO-03 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |
| 08-01-04 | 01 | 1 | TODO-04 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |
| 08-01-05 | 01 | 1 | TODO-05 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |
| 08-01-06 | 01 | 1 | TODO-06 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |
| 08-01-07 | 01 | 1 | TODO-07 | — | N/A | integration | Manual verification | N/A | ⬜ pending |
| 08-01-08 | 01 | 1 | TODO-08 | — | N/A | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `FRONTEND/tests/todoStore.test.js` — stubs for TODO-01 through TODO-08
- [ ] `FRONTEND/tests/ListsTab.test.js` — covers UI rendering, sort, completed section
- [ ] `FRONTEND/tests/ItemForm.test.js` — covers form validation, DateTimePicker integration

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Real-time sync between partners | TODO-07 | Requires two browser sessions | Open app on two devices, create item on one, verify it appears on other within 2 seconds |

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
