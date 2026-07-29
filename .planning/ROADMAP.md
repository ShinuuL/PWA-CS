# Roadmap: v2.0 Profile & Shared Utilities

**Milestone:** v2.0 — Profile & Shared Utilities
**Phases:** 6, 7, 8 (continuing from v1.x phases 1-5)
**Requirements:** 29 (PROF-01–07, REMN-01–08, TODO-01–08, INFRA-01–06)

## Phase 6: Profile Enhancement + Infrastructure Fixes

**Goal:** Personalize user identity and fix foundational infrastructure

### Requirements

| Req | Description |
|-----|-------------|
| INFRA-01 | Fix dual service worker registration (remove manual SW, use vite-plugin-pwa) |
| INFRA-02 | New `online_status` table with RLS |
| INFRA-03 | New `shared_reminders` table with pair_id RLS |
| INFRA-04 | New `todo_lists` and `todo_items` tables with pair_id RLS |
| INFRA-05 | `profiles` table partner-read policy (paired users can view partner profile) |
| INFRA-06 | Avatar cache busting after upload (append ?v=timestamp) |
| PROF-01 | User can upload a photo from device gallery or camera |
| PROF-02 | User can crop uploaded photo with circular crop tool |
| PROF-03 | Uploaded avatar is compressed before storage (target ~200KB) |
| PROF-04 | User can edit display name (shown in chat, profile, drawer) |
| PROF-05 | Partner can see user's online status (green/gray dot) |
| PROF-06 | Partner can see "last seen X ago" when user is offline |
| PROF-07 | Online status updates via Supabase Realtime Presence |

**Total:** 13 requirements

### Success Criteria

1. User can upload a photo, crop it circular, and see the updated avatar everywhere (chat, profile, drawer)
2. Partner sees a green dot when user is online and "last seen X ago" when offline
3. Service worker registers cleanly with no duplicate registrations
4. Partner can view the other's profile (name + avatar) in drawer and header
5. Avatar changes appear immediately without stale caching

### Dependency Note

INFRA-03 and INFRA-04 are database-only (table creation). They enable Phase 7 and Phase 8 respectively but have no frontend dependency in this phase.

### Plans

**Plans:** 3 plans

Plans:
- [x] 06-01-PLAN.md — Database migrations (shared_reminders, todo tables) + usePresence hook
- [x] 06-02-PLAN.md — Avatar upload with crop/compression, ProfilePage auto-save, SW cleanup
- [x] 06-03-PLAN.md — StatusDot, online presence in Header/ChatView, PartnerProfileModal

---

## Phase 7: Shared Reminders + Push Notifications

**Goal:** Let couples set one-time reminders with reliable push delivery

### Requirements

| Req | Description |
|-----|-------------|
| REMN-01 | User can create a one-time reminder with title and date/time |
| REMN-02 | Both partners receive push notification at reminder time |
| REMN-03 | Reminder creator attribution shown on reminder card |
| REMN-04 | User can mark reminder as completed/dismissed |
| REMN-05 | User can view list of upcoming reminders |
| REMN-06 | User can view list of past/dismissed reminders |
| REMN-07 | Push notification delivery via Supabase Edge Function + pg_cron |
| REMN-08 | Service worker handles push event and displays notification |

**Total:** 8 requirements

### Success Criteria

1. User creates a reminder and both partners receive a push notification at the scheduled time
2. User can view upcoming and past reminders separately
3. Reminder creator name is visible on each reminder card
4. User can dismiss/complete a reminder and it moves to past list
5. Push notifications work on both Android and iOS (installed PWA)

### Dependency Note

Depends on Phase 6 completion: stable service worker (INFRA-01), `shared_reminders` table (INFRA-03), and the `DateTimePicker` component built in this phase will be reused by Phase 8.

### Plans

**Plans:** 5 plans

Plans:
- [x] 07-01-PLAN.md — Database migrations (status column + push_subscriptions) + reminderStore + AgendaPage 3-tab integration + D-08 client fallback
- [x] 07-02-PLAN.md — Reusable DateTimePicker component (CalendarGrid + scroll-wheel TimePicker)
- [x] 07-03-PLAN.md — RemindersTab UI (list, ReminderCard, ReminderForm, swipe-to-dismiss, collapsible completed) — PRIMARY owner of REMN-01
- [x] 07-04-PLAN.md — Client push infrastructure (service worker, pushSubscription.js, Settings toggle)
- [x] 07-05-PLAN.md — Server push delivery (Edge Functions, pg_cron, chatStore background push)

---

## Phase 8: Shared To-Do Lists

**Goal:** Manage shared tasks with assignments and due dates in real time

### Requirements

| Req | Description |
|-----|-------------|
| TODO-01 | User can create named to-do lists (e.g., "Groceries", "House") |
| TODO-02 | User can add items with checkboxes to a list |
| TODO-03 | User can toggle item completion (checkbox) |
| TODO-04 | User can assign items to "Me" or "Partner" with visible badge |
| TODO-05 | User can set optional due date on each item |
| TODO-06 | Items sort by due date (items with dates first, then undated) |
| TODO-07 | Both partners see real-time updates when items are added/completed |
| TODO-08 | User can delete items and lists |

**Total:** 8 requirements

### Success Criteria

1. User creates a named list, adds items, and both partners see changes in real time
2. User assigns an item to "Partner" and the partner sees the badge on their end
3. Items with due dates sort above undated items; overdue items are visually distinct
4. User checks off an item and the checkbox state syncs instantly to partner
5. User deletes an item or list and it disappears for both partners

### Dependency Note

Depends on Phase 7 completion: `DateTimePicker` component, `AgendaPage` tab navigation, and `todo_lists`/`todo_items` tables (INFRA-04 from Phase 6).

---

## Coverage Validation

| Requirement Group | Count | Phase | Mapped |
|-------------------|-------|-------|--------|
| INFRA-01–06 | 6 | Phase 6 | 6/6 ✓ |
| PROF-01–07 | 7 | Phase 6 | 7/7 ✓ |
| REMN-01–08 | 8 | Phase 7 | 8/8 ✓ |
| TODO-01–08 | 8 | Phase 8 | 8/8 ✓ |
| **Total** | **29** | | **29/29 ✓** |

**Coverage: 100%**

---

*Created: 2026-07-28*
