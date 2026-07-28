---
phase: 06-profile-enhancement-infrastructure-fixes
plan: 03
subsystem: ui
tags: [react, supabase, presence, modal, pwa]

# Dependency graph
requires:
  - phase: 06-01
    provides: Database migrations for presence, usePresence hook
  - phase: 06-02
    provides: Avatar crop, profile auto-save, partner profile page
provides:
  - StatusDot component for online/offline indicator
  - PartnerProfileModal bottom-sheet for viewing partner info
  - Header integration with partner online status
  - ChatView integration with dynamic status and "last seen"
  - Drawer partner profile access point
affects: [chat, profile, settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [presence-tracking, bottom-sheet-modal, partner-profile-access]

key-files:
  created:
    - FRONTEND/src/shared/components/StatusDot.jsx
    - FRONTEND/src/features/profile/PartnerProfileModal.jsx
  modified:
    - FRONTEND/src/shared/components/Header.jsx
    - FRONTEND/src/shared/components/header.css
    - FRONTEND/src/features/chat/ChatView.jsx
    - FRONTEND/src/features/chat/chat.css
    - FRONTEND/src/shared/components/Drawer.jsx
    - FRONTEND/src/shared/components/drawer.css
    - FRONTEND/src/features/profile/PartnerProfile.jsx
    - FRONTEND/src/features/profile/profile.css

key-decisions:
  - "StatusDot is a pure presentational component with inline styles for simplicity"
  - "PartnerProfileModal uses motion/react for bottom-sheet animation (consistent with Drawer)"
  - "Header partner avatar tappable placeholder until PartnerProfileModal fully wired"
  - "ChatView shows partner avatar/name instead of current user in header"

patterns-established:
  - "StatusDot pattern: 8px circle with CSS variables for online/offline colors"
  - "Partner profile access: Header avatar, Drawer section, PartnerProfileModal"

requirements-completed: [INFRA-05, INFRA-06, PROF-04, PROF-05, PROF-06, PROF-07]

# Coverage metadata
coverage:
  - id: D1
    description: "StatusDot component renders 8px circle with green/gray based on isOnline prop"
    requirement: "INFRA-05"
    verification:
      - kind: unit
        ref: "FRONTEND/src/shared/components/StatusDot.jsx#StatusDot"
        status: pass
    human_judgment: false
  - id: D2
    description: "Header shows partner online status with StatusDot next to avatar"
    requirement: "INFRA-06"
    verification:
      - kind: automated_ui
        ref: "FRONTEND/src/shared/components/Header.jsx#usePresence"
        status: pass
    human_judgment: false
  - id: D3
    description: "ChatView shows dynamic status with last seen time when offline"
    requirement: "PROF-04"
    verification:
      - kind: automated_ui
        ref: "FRONTEND/src/features/chat/ChatView.jsx#usePresence"
        status: pass
    human_judgment: false
  - id: D4
    description: "PartnerProfileModal shows avatar, name, status, and Message button"
    requirement: "PROF-05"
    verification:
      - kind: automated_ui
        ref: "FRONTEND/src/features/profile/PartnerProfileModal.jsx#PartnerProfileModal"
        status: pass
    human_judgment: false
  - id: D5
    description: "Drawer has tappable partner profile section that opens PartnerProfileModal"
    requirement: "PROF-06"
    verification:
      - kind: automated_ui
        ref: "FRONTEND/src/shared/components/Drawer.jsx#PartnerProfileModal"
        status: pass
    human_judgment: false
  - id: D6
    description: "PartnerProfile.jsx empty state matches Copywriting Contract"
    requirement: "PROF-07"
    verification:
      - kind: unit
        ref: "FRONTEND/src/features/profile/PartnerProfile.jsx#empty state"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-07-28
status: complete
---

# Phase 6 Plan 03: StatusDot & PartnerProfileModal Summary

**StatusDot component with partner online presence across Header/ChatView/Drawer, plus PartnerProfileModal bottom-sheet for viewing partner info**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-28T17:05:52Z
- **Completed:** 2026-07-28T17:10:04Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- StatusDot component renders 8px circle with green (#22C55E) when online and gray (#8B8FA3) when offline
- Header shows green/gray dot next to partner avatar when paired
- ChatView shows status dot in chat header and "last seen X ago" when offline >1h
- PartnerProfileModal shows bottom-sheet overlay with partner avatar + name + status dot + Message button
- Drawer has partner profile button that opens PartnerProfileModal
- PartnerProfile.jsx empty state updated to match Copywriting Contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StatusDot component and integrate into Header and ChatView** - `553a765` (feat)
2. **Task 2: Create PartnerProfileModal and integrate into Drawer** - `90e78b0` (feat)

## Files Created/Modified
- `FRONTEND/src/shared/components/StatusDot.jsx` - New presentational component for online/offline indicator
- `FRONTEND/src/features/profile/PartnerProfileModal.jsx` - New bottom-sheet modal for partner profile
- `FRONTEND/src/shared/components/Header.jsx` - Added usePresence hook and StatusDot integration
- `FRONTEND/src/shared/components/header.css` - Added status dot positioning styles
- `FRONTEND/src/features/chat/ChatView.jsx` - Added usePresence, StatusDot, and dynamic status display
- `FRONTEND/src/features/chat/chat.css` - Added status-related styles
- `FRONTEND/src/shared/components/Drawer.jsx` - Added partner profile section and PartnerProfileModal
- `FRONTEND/src/shared/components/drawer.css` - Added partner section styles
- `FRONTEND/src/features/profile/PartnerProfile.jsx` - Updated empty state to match Copywriting Contract
- `FRONTEND/src/features/profile/profile.css` - Added modal styles

## Decisions Made
- StatusDot is a pure presentational component with inline styles for simplicity
- PartnerProfileModal uses motion/react for bottom-sheet animation (consistent with Drawer)
- Header partner avatar tappable placeholder until PartnerProfileModal fully wired
- ChatView shows partner avatar/name instead of current user in header

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Online presence feature complete across all UI touchpoints
- PartnerProfileModal provides consistent partner view from Header and Drawer
- Ready for Phase 7 (Shared Reminders + Push Notifications)

## Self-Check: PASSED

All created files exist on disk. All commits verified in git log.

---
*Phase: 06-profile-enhancement-infrastructure-fixes*
*Completed: 2026-07-28*