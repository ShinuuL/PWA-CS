---
plan_id: 05-GAP-01
phase: 05-shared-notes-agenda
title: "Calendar Swipe Animation Smoothing"
gap_id: G-05-5
type: gap_closure
priority: cosmetic
status: complete
---

## Goal

Fix the calendar swipe animation to provide a smooth transition when navigating between months, replacing the current instant snap behavior.

## Context

- **Gap**: G-05-5 — Calendar swipe animation is too fast, needs smoother transition
- **Root cause**: CalendarGrid.jsx uses `motion.div` with `drag="x"` but has no `animate`/`initial`/`transition` props for month change transitions
- **Source**: UAT test 5, user feedback

## Tasks

### Task 1: Add animated month transition to CalendarGrid

**What**: Wrap the calendar days in a `motion.div` that animates when `currentMonth` changes, using framer-motion's `AnimatePresence` + `motion.div` with slide + fade transition.

**Files**:
- Modify: `FRONTEND/src/features/agenda/CalendarGrid.jsx`

**Approach**:
1. Import `AnimatePresence` from `motion/react`
2. Add `key={format(currentMonth, 'yyyy-MM')}` to the swipe container's inner content
3. Add `initial`, `animate`, and `exit` props for horizontal slide transition
4. Add `transition` prop with `type: "spring"`, `stiffness: 300`, `damping: 30` for smooth but snappy feel

**Commit**: `fix(agenda): smooth calendar swipe month transition animation`

## Verification

1. Run `npm run lint` — must pass
2. Run `npm run build` — must succeed
3. Visual check: swipe left/right should slide calendar days horizontally with smooth spring animation
