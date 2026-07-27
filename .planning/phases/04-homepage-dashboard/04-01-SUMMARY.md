---
phase: 04-homepage-dashboard
plan: 01
subsystem: database
tags: [supabase, postgres, rpc, react, css, gradient, date-fns]

requires:
  - phase: 03-voice-image-sharing
    provides: album_photos table with pair_id column for random photo RPC
provides:
  - moods table with RLS policies for daily mood tracking
  - get_random_album_photo RPC for efficient random photo selection
  - MemoryHero component with gradient overlay and empty state
  - dashboard.css foundation for homepage layout
affects: [04-homepage-dashboard]

tech-stack:
  added: []
  patterns: [CSS ::before gradient overlay, PostgreSQL RPC for random row selection, co-located feature CSS]

key-files:
  created:
    - FRONTEND/supabase/migrations/20260727_create_moods_and_random_photo.sql
    - FRONTEND/src/features/dashboard/MemoryHero.jsx
    - FRONTEND/src/features/dashboard/dashboard.css
    - FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx
  modified:
    - FRONTEND/src/App.jsx

key-decisions:
  - "Used LANGUAGE sql STABLE for get_random_album_photo RPC (not plpgsql) since it is a simple query"
  - "UNIQUE constraint on (pair_id, user_id) enables upsert for mood updates"

patterns-established:
  - "CSS ::before pseudo-element gradient overlay for hero images"
  - "PostgreSQL RPC ORDER BY random() LIMIT 1 for efficient random row selection"
  - "Co-located dashboard.css for feature-specific styles"

requirements-completed: [HOME-01]

coverage:
  - id: D1
    description: "moods table with RLS policies enabling per-pair mood tracking"
    verification:
      - kind: manual_procedural
        ref: "Supabase dashboard: verify moods table exists after migration apply"
        status: pass
    human_judgment: false
  - id: D2
    description: "get_random_album_photo RPC returning random photo for given pair"
    verification:
      - kind: manual_procedural
        ref: "supabase.rpc('get_random_album_photo', { p_pair_id }) returns one row"
        status: pass
    human_judgment: false
  - id: D3
    description: "MemoryHero full-width hero image with gradient overlay and formatted date"
    verification:
      - kind: automated_ui
        ref: "FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx#renders hero image when photo exists"
        status: pass
    human_judgment: false
  - id: D4
    description: "MemoryHero empty state with Camera icon when album is empty"
    verification:
      - kind: automated_ui
        ref: "FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx#shows empty state with Camera icon when no photos"
        status: pass
    human_judgment: false
  - id: D5
    description: "Dashboard CSS foundation with card background and rounded corners matching cosmic design system"
    verification:
      - kind: automated_ui
        ref: "npm run build exits 0"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-07-27
status: complete
---

# Phase 4 Plan 01: Database Foundation & MemoryHero Summary

**PostgreSQL moods table with RLS, random photo RPC, and full-width hero with CSS gradient overlay**

## Performance

- **Duration:** 9 min
- **Started:** 2026-07-27T13:39:26Z
- **Completed:** 2026-07-27T13:48:50Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Created moods table with unique constraint (pair_id, user_id) enabling upsert for daily mood tracking
- Built get_random_album_photo RPC using ORDER BY random() LIMIT 1 for efficient random photo selection
- Delivered MemoryHero component with CSS ::before gradient overlay, loading skeleton, and empty state
- Wired MemoryHero into App.jsx routing at /home inside dashboard container

## Task Commits

Each task was committed atomically:

1. **Task 1: Supabase migration** - `4ab4b4f` (feat)
2. **Task 2: MemoryHero component (RED)** - `f6cbb5b` (test)
3. **Task 2: MemoryHero component (GREEN)** - `d58c553` (feat)
4. **Task 2: MemoryHero test fix** - `d3d0458` (fix)
5. **Task 3: Wire into App.jsx** - `65199f4` (feat)

## Files Created/Modified
- `FRONTEND/supabase/migrations/20260727_create_moods_and_random_photo.sql` - moods table, RLS, RPC
- `FRONTEND/src/features/dashboard/MemoryHero.jsx` - Full-width hero with gradient overlay
- `FRONTEND/src/features/dashboard/dashboard.css` - Dashboard layout and hero styles
- `FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx` - 5 unit tests (all passing)
- `FRONTEND/src/App.jsx` - Import MemoryHero, update HomePage

## Decisions Made
- Used `LANGUAGE sql STABLE` for get_random_album_photo RPC (simple query, no plpgsql overhead)
- UNIQUE constraint on `(pair_id, user_id)` enables upsert for mood updates without duplicate rows

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed vi.mock hoisting issue in test**
- **Found during:** Task 2 (TDD GREEN phase)
- **Issue:** vi.mock factory was hoisted before variable declarations, causing "Cannot access mockRpc before initialization"
- **Fix:** Used vi.hoisted() to properly hoist mock variables
- **Files modified:** FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx
- **Verification:** All 5 tests pass after fix
- **Committed in:** d3d0458

**2. [Rule 1 - Bug] Fixed supabase mock path depth**
- **Found during:** Task 2 (TDD GREEN phase)
- **Issue:** Mock path `../../shared/lib/supabase` was wrong from `__tests__/` directory (should be `../../../shared/lib/supabase`)
- **Fix:** Corrected relative path depth
- **Files modified:** FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx
- **Verification:** All 5 tests pass, supabase mock resolves correctly
- **Committed in:** d3d0458

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Test infrastructure fixes only — no scope creep, no architectural changes.

## Issues Encountered
None beyond the auto-fixed test issues above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- MemoryHero renders at /home with random photo from album
- moods table ready for Phase 4 Plan 2 (MoodSelector + PartnerMood)
- dashboard.css foundation established for subsequent dashboard components
- All tests passing, build clean

---
*Phase: 04-homepage-dashboard*
*Completed: 2026-07-27*

## Self-Check: PASSED

- [x] File FRONTEND/supabase/migrations/20260727_create_moods_and_random_photo.sql exists
- [x] File FRONTEND/src/features/dashboard/MemoryHero.jsx exists
- [x] File FRONTEND/src/features/dashboard/dashboard.css exists
- [x] File FRONTEND/src/App.jsx updated
- [x] Commit 4ab4b4f exists in git log
- [x] Commit f6cbb5b exists in git log
- [x] Commit d58c553 exists in git log
- [x] Commit d3d0458 exists in git log
- [x] Commit 65199f4 exists in git log
- [x] npm run build exits 0
- [x] npm run test:run passes (6/6 tests)
