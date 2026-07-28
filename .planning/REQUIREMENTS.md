# Requirements: CoupleSpace

**Defined:** 2026-07-28
**Core Value:** Chat between couples — real-time private messaging is the foundation

## v2 Requirements

Requirements for Profile & Shared Utilities milestone. Each maps to roadmap phases.

### Profile & Avatar

- [x] **PROF-01**: User can upload a photo from device gallery or camera
- [x] **PROF-02**: User can crop uploaded photo with circular crop tool
- [x] **PROF-03**: Uploaded avatar is compressed before storage (target ~200KB)
- [x] **PROF-04**: User can edit display name (shown in chat, profile, drawer)
- [ ] **PROF-05**: Partner can see user's online status (green/gray dot)
- [ ] **PROF-06**: Partner can see "last seen X ago" when user is offline
- [x] **PROF-07**: Online status updates via Supabase Realtime Presence ✓

### Shared Reminders

- [ ] **REMN-01**: User can create a one-time reminder with title and date/time
- [ ] **REMN-02**: Both partners receive push notification at reminder time
- [ ] **REMN-03**: Reminder creator attribution shown on reminder card
- [ ] **REMN-04**: User can mark reminder as completed/dismissed
- [ ] **REMN-05**: User can view list of upcoming reminders
- [ ] **REMN-06**: User can view list of past/dismissed reminders
- [ ] **REMN-07**: Push notification delivery via Supabase Edge Function + pg_cron
- [ ] **REMN-08**: Service worker handles push event and displays notification

### Shared To-Do Lists

- [ ] **TODO-01**: User can create named to-do lists (e.g., "Groceries", "House")
- [ ] **TODO-02**: User can add items with checkboxes to a list
- [ ] **TODO-03**: User can toggle item completion (checkbox)
- [ ] **TODO-04**: User can assign items to "Me" or "Partner" with visible badge
- [ ] **TODO-05**: User can set optional due date on each item
- [ ] **TODO-06**: Items sort by due date (items with dates first, then undated)
- [ ] **TODO-07**: Both partners see real-time updates when items are added/completed
- [ ] **TODO-08**: User can delete items and lists

### Infrastructure (Cross-cutting)

- [x] **INFRA-01**: Fix dual service worker registration (remove manual SW, use vite-plugin-pwa)
- [ ] **INFRA-02**: New `online_status` table with RLS
- [x] **INFRA-03**: New `shared_reminders` table with pair_id RLS ✓
- [x] **INFRA-04**: New `todo_lists` and `todo_items` tables with pair_id RLS ✓
- [ ] **INFRA-05**: `profiles` table partner-read policy (paired users can view partner profile)
- [x] **INFRA-06**: Avatar cache busting after upload (append ?v=timestamp)

## v3 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Profile & Avatar

- **PROF-08**: Default initials avatar before photo uploaded
- **PROF-09**: Custom status text (e.g., "Busy", "At work")
- **PROF-10**: Profile themes/customization

### Shared Reminders

- **REMN-09**: Recurring reminders (daily, weekly, monthly)
- **REMN-10**: Location-based reminders
- **REMN-11**: Snooze/reschedule on notification

### Shared To-Do Lists

- **TODO-09**: Subtasks on to-do items
- **TODO-10**: Drag-and-drop reorder
- **TODO-11**: Task categories/tags
- **TODO-12**: Gamification/rewards for completion

## Out of Scope

| Feature | Reason |
|---------|--------|
| Public profiles / profile discovery | Couples-only app, no social features |
| Kanban boards / project management | Not Asana — keep it simple |
| Time tracking on tasks | Chat and album already handle this |
| Comments/threads on tasks | Use chat for discussion |
| File attachments on tasks | Use shared album |
| Recurring reminders (v2.0) | Timezone/DST complexity, validate one-time first |
| Location-based reminders | Battery drain, always-on geolocation |
| Calendar integration (Google, Apple) | External API dependencies, not core value |
| Relationship milestones | Low effort but not blocking launch |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PROF-01 | Phase 6 | Complete |
| PROF-02 | Phase 6 | Complete |
| PROF-03 | Phase 6 | Complete |
| PROF-04 | Phase 6 | Complete |
| PROF-05 | Phase 6 | Pending |
| PROF-06 | Phase 6 | Pending |
| PROF-07 | Phase 6 | Complete |
| REMN-01 | Phase 7 | Pending |
| REMN-02 | Phase 7 | Pending |
| REMN-03 | Phase 7 | Pending |
| REMN-04 | Phase 7 | Pending |
| REMN-05 | Phase 7 | Pending |
| REMN-06 | Phase 7 | Pending |
| REMN-07 | Phase 7 | Pending |
| REMN-08 | Phase 7 | Pending |
| TODO-01 | Phase 8 | Pending |
| TODO-02 | Phase 8 | Pending |
| TODO-03 | Phase 8 | Pending |
| TODO-04 | Phase 8 | Pending |
| TODO-05 | Phase 8 | Pending |
| TODO-06 | Phase 8 | Pending |
| TODO-07 | Phase 8 | Pending |
| TODO-08 | Phase 8 | Pending |
| INFRA-01 | Phase 6 | Complete |
| INFRA-02 | Phase 6 | Pending |
| INFRA-03 | Phase 6 | Complete |
| INFRA-04 | Phase 6 | Complete |
| INFRA-05 | Phase 6 | Pending |
| INFRA-06 | Phase 6 | Complete |

**Coverage:**

- v2 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0 ✓

---
*Requirements defined: 2026-07-28*
*Last updated: 2026-07-28 after initial definition*
