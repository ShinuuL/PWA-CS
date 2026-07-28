---
phase: 06-profile-enhancement-infrastructure-fixes
plan: 01
subsystem: database
tags: [supabase, postgres, rls, realtime, presence, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: pairs table schema, profiles table, RLS patterns
provides:
  - shared_reminders table (enables Phase 7)
  - todo_lists + todo_items tables (enables Phase 8)
  - usePresence hook (enables Header, ChatView, PartnerProfileModal integration)
affects: [07-shared-reminders, 08-shared-todos, 06-02, 06-03]

# Tech tracking
tech-stack:
  added: []
  patterns: [supabase-realtime-presence, rls-pair-membership-check]

key-files:
  created:
    - FRONTEND/supabase/migrations/20260728_create_shared_reminders_table.sql
    - FRONTEND/supabase/migrations/20260728_create_todo_lists_and_items_tables.sql
    - FRONTEND/src/hooks/usePresence.js
  modified: []

key-decisions:
  - "RLS uses EXISTS pattern with pairs join — consistent with existing profiles RLS"
  - "usePresence tracks THIS user's presence so partner sees us; cleanup via removeChannel"

patterns-established:
  - "RLS pair-membership check: EXISTS(SELECT 1 FROM pairs WHERE id = table.pair_id AND code_used = TRUE AND (user_one = auth.uid() OR user_two = auth.uid()))"
  - "Realtime Presence hook pattern: channel per pair, track on SUBSCRIBED, cleanup on unmount"

requirements-completed: [INFRA-02, INFRA-03, INFRA-04, PROF-07]

coverage:
  - id: D1
    description: "shared_reminders table migration with RLS policies for pair members"
    requirement: INFRA-03
    verification:
      - kind: unit
        ref: "File exists: FRONTEND/supabase/migrations/20260728_create_shared_reminders_table.sql"
        status: pass
    human_judgment: false
  - id: D2
    description: "todo_lists and todo_items table migrations with RLS policies"
    requirement: INFRA-04
    verification:
      - kind: unit
        ref: "File exists: FRONTEND/supabase/migrations/20260728_create_todo_lists_and_items_tables.sql"
        status: pass
    human_judgment: false
  - id: D3
    description: "usePresence hook for Realtime Presence partner status tracking"
    requirement: PROF-07
    verification:
      - kind: unit
        ref: "File exists: FRONTEND/src/hooks/usePresence.js"
        status: pass
    human_judgment: false

# Metrics
duration: 1min
completed: 2026-07-28
status: complete
---

# Phase 6 Plan 01: Database Migrations & Presence Hook Summary

**SQL migrations for shared_reminders and todo_lists/todo_items with RLS pair-membership policies, plus a usePresence hook for Supabase Realtime Presence partner status tracking**

## Performance

- **Duration:** 1 min
- **Started:** 2026-07-28T16:49:39Z
- **Completed:** 2026-07-28T16:51:21Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- shared_reminders table migration with 10 columns and 4 RLS policies (SELECT/INSERT/UPDATE/DELETE)
- todo_lists + todo_items table migrations with RLS policies using list-join pattern for todo_items
- usePresence hook subscribing to Supabase Realtime Presence channel keyed by pair_id, returning { isOnline, lastSeen }

## Task Commits

Each task was committed atomically:

1. **Task 1: Create database migrations for shared_reminders and todo tables** - `d8af96a` (feat)
2. **Task 2: Create usePresence hook for Realtime Presence** - `e1697b3` (feat)

## Files Created/Modified
- `FRONTEND/supabase/migrations/20260728_create_shared_reminders_table.sql` - shared_reminders table with RLS
- `FRONTEND/supabase/migrations/20260728_create_todo_lists_and_items_tables.sql` - todo_lists + todo_items with RLS
- `FRONTEND/src/hooks/usePresence.js` - Custom hook for partner online status via Realtime Presence

## Decisions Made
- RLS uses EXISTS pattern with pairs join — consistent with existing profiles RLS from 20260728_fix_security_and_profiles_rls.sql
- usePresence tracks THIS user's presence (so partner sees us) and returns partner status via sync/leave events
- todo_items RLS uses list-join pattern (SELECT from todo_lists JOIN pairs) since todo_items has no direct pair_id

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing test failure in MemoryHero.test.jsx (1 of 2 test files fails). Not caused by this plan's changes — the failing test references a component not modified in this plan.

## Known Stubs
None — all deliverables are functional with no placeholder data.

## User Setup Required
None - no external service configuration required. These migrations are ready to be applied via Supabase dashboard or CLI.

## Next Phase Readiness
- shared_reminders table ready for Phase 7 (shared reminders + push notifications)
- todo_lists + todo_items tables ready for Phase 8 (shared to-do lists)
- usePresence hook ready for Header, ChatView, and PartnerProfileModal integration in later plans

## Self-Check: PASSED

- All 3 created files exist on disk
- Both task commits (d8af96a, e1697b3) found in git log
- Pre-existing MemoryHero test failure noted (not caused by this plan)

---
*Phase: 06-profile-enhancement-infrastructure-fixes*
*Completed: 2026-07-28*
