# Project Research Summary — v2.0 Profile & Shared Utilities

## Key Findings

1. **Only 1 new frontend dependency required** — `react-easy-crop` for avatar cropping. All other capabilities (presence, push, todos) use existing stack: Supabase Realtime, Web Push API (native), Zustand, and new DB tables. This keeps the bundle lean and avoids maintenance burden.

2. **Push notifications on iOS PWA is the #1 technical risk.** iOS 16.4+ supports web push but requires the PWA to be installed to home screen first. Permission prompt must come from a user gesture. Behavior differs from native apps. Budget a spike in week 1; fall back to in-app badges if iOS push is unreliable.

3. **The current service worker setup is broken** — `main.jsx` manually registers `/sw.js` (which doesn't exist) while `vite-plugin-pwa` generates its own SW. Two service workers fighting for scope causes race conditions. Must be fixed in Phase 1.

4. **Avatar upload has no compression** — files go raw to Supabase Storage. A 5MB camera photo on cellular is slow to upload, wastes storage, and slows every view that renders the avatar (chat, profile, drawer). Compress to 200KB/400px before upload.

5. **Existing RLS pattern is solid but needs one extension** — the `profiles` table currently only lets users read their own profile. Partner-facing components (`PartnerProfile`, `Header`, `Drawer`) need a new policy: paired users can view partner profile. This is a one-line policy addition.

6. **Todo conflict resolution doesn't need CRDTs** — with exactly 2 users and low concurrency, optimistic updates + last-write-wins + a `version` column is sufficient. Full operational transform is overkill.

7. **Push notifications require server-side infrastructure** — Supabase Edge Functions + pg_cron is the simplest path. The `fire-reminders` function runs every 60s, finds due reminders, marks them fired, and sends Web Push. ~50 lines of server code. No Firebase, no OneSignal, no separate push server.

## Stack Recommendations

| Capability | Add | Version | Why |
|---|---|---|---|
| Avatar crop | `react-easy-crop` | ^9.0 | Touch-native, composable, better mobile UX than alternatives |
| Image compression | Use Canvas API (already in `imageCompress.js`) | — | Zero new deps, extends existing pattern |
| Online presence | Supabase Realtime Presence (built-in) | — | Zero new deps, purpose-built for this |
| Push notifications | Web Push API (native) + `web-push` npm (server) | — | VAPID-based, works on all modern browsers |
| Push scheduling | Supabase Edge Functions + pg_cron | — | Already hosting on Supabase, ~50 lines of code |
| Task management | New DB tables + Zustand store | — | Follows exact pattern of `agendaStore.js` / `notesStore.js` |

**Total new frontend dependencies: 1** (`react-easy-crop`). Everything else is either already installed or server-side only.

## Feature Scope

### Table Stakes (must ship in v2.0)

| Feature | Priority | Complexity | Risk |
|---------|----------|------------|------|
| Avatar upload with circular crop | P0 | Medium | Mobile touch UX, cache busting |
| Display name editing | P0 | Low | Already works, minimal UI refinement |
| Online/last seen status | P0 | Medium | Presence grace window, heartbeat |
| Default avatar (initials) | P0 | Low | Zero risk |
| One-time shared reminders | P0 | Medium | Depends on push delivery |
| Push notifications (Web Push) | P0 | **High** | iOS PWA support, service worker conflicts |
| Shared to-do lists (multiple lists) | P0 | Medium | Two-level hierarchy, Realtime sync |
| To-do due dates + assignee | P0 | Low | UX clarity for "Me"/"Partner" |

### Differentiators (defer to v2.1+)

| Feature | Why Defer |
|---------|-----------|
| Recurring reminders | Timezone/DST edge cases, cron parsing — deceptively complex |
| Location-based reminders | Geolocation API, battery drain, permission complexity |
| Snooze/reschedule on notifications | Depends on push infrastructure being solid |
| Gamification/rewards for to-dos | Novelty feature, validate demand first |
| Subtasks on to-dos | Adds UI complexity, most couples don't need it |
| Calendar integration | External API dependencies, not core value |
| Relationship milestones on profile | Low effort but not blocking v2.0 launch |

### Anti-Features (do not build)

- **Profile browsing/discovery** — couples-only app, no public profiles
- **Kanban boards/project management** — this is not Asana
- **Drag-and-drop reorder** — YAGNI for v2.0, add if users request it
- **Subtasks, time tracking, comments on tasks** — chat and album already handle this
- **Recurring reminders in v2.0** — mini-calendar engine, ship one-time first
- **Location-based reminders** — always-on geolocation, battery drain
- **Rich bio/about section** — display name + avatar is sufficient for two people

## Architecture Overview

### New Supabase Tables

| Table | Scope | Key Columns |
|-------|-------|-------------|
| `online_status` | User-level (1 row per user) | `id` (PK→auth.users), `is_online`, `last_seen`, `updated_at` |
| `shared_reminders` | Pair-scoped | `pair_id`, `user_id`, `title`, `remind_at` (TIMESTAMPTZ), `fired` |
| `todo_lists` | Pair-scoped | `pair_id`, `user_id`, `title` |
| `todo_items` | List-scoped | `list_id`→todo_lists, `pair_id`, `content`, `completed`, `due_date`, `assignee_id` |

### New RLS Policies

- `online_status`: Authenticated read (any user needs partner status), self-only write
- `profiles` partner-read: Paired users can view partner profile (new policy, existing policies remain)
- `shared_reminders`, `todo_lists`, `todo_items`: Standard pair-member pattern (SELECT/INSERT/UPDATE/DELETE)

### New Zustand Stores

| Store | Pattern Source | Tables |
|-------|---------------|--------|
| `statusStore.js` | `dashboardStore.js` | `online_status` |
| `reminderStore.js` | `agendaStore.js` | `shared_reminders` |
| `todoStore.js` | `notesStore.js` | `todo_lists`, `todo_items` |

### New Components

| Component | Directory | Purpose |
|-----------|-----------|---------|
| `AvatarCrop.jsx` | `features/profile/` | Canvas-based crop tool (react-easy-crop) |
| `Avatar.jsx` | `shared/components/` | Reusable avatar (initials fallback, online dot) |
| `OnlineStatus.jsx` | `shared/components/` | Green/gray dot + "last seen" text |
| `DateTimePicker.jsx` | `shared/components/` | Reusable datetime input (reminders + todo due dates) |
| `RemindersTab.jsx` | `features/reminders/` | Tab content for AgendaPage |
| `ReminderCard.jsx` | `features/reminders/` | Single reminder display |
| `ReminderForm.jsx` | `features/reminders/` | Create/edit reminder |
| `TodoTab.jsx` | `features/todo/` | Tab content for AgendaPage |
| `TodoListCard.jsx` | `features/todo/` | List container with item count |
| `TodoItem.jsx` | `features/todo/` | Checkbox + due date + assignee badge |
| `TodoForm.jsx` | `features/todo/` | Create list / add item |

### Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `fire-reminders` | pg_cron every 60s | Find due reminders, mark fired, send Web Push |
| `send-push` | Called by fire-reminders | Push delivery via Web Push Protocol |

### Build Order (3 phases)

**Phase 1: Profile Enhancement (Foundation)**
1. Migration: `online_status` table + RLS
2. `statusStore.js` + heartbeat logic
3. `AvatarCrop.jsx` + extend `AvatarUpload.jsx`
4. `Avatar.jsx` shared component + `OnlineStatus.jsx`
5. Extend `PartnerProfile`, `Header`, `Drawer`
6. Migration: `profiles` partner-read policy
7. Fix: Remove dual SW registration, switch to `registerType: 'prompt'`
8. Add: `useOnlineStatus` hook + offline banner

**Phase 2: Shared Reminders**
1. Migration: `shared_reminders` table + RLS + index
2. `reminderStore.js` + `DateTimePicker.jsx`
3. `ReminderCard.jsx` + `ReminderForm.jsx` + `RemindersTab.jsx`
4. Extend `AgendaPage.jsx` — add Reminders tab
5. Edge Function: `fire-reminders` + pg_cron
6. Service worker: `push` event handler
7. Push subscription registration + `push_subscriptions` table
8. Custom pre-permission UX screen

**Phase 3: Shared To-Do Lists**
1. Migration: `todo_lists` + `todo_items` tables + RLS
2. `todoStore.js` (two-table CRUD + Realtime)
3. `TodoItem.jsx` + `TodoListCard.jsx` + `TodoForm.jsx`
4. `TodoTab.jsx` + extend `AgendaPage.jsx`
5. Dashboard widget: overdue/upcoming todos
6. Optimistic checkbox updates + offline refetch

## Watch Out For

1. **Dual service worker registration (Critical)** — `main.jsx` manually registers `/sw.js` while vite-plugin-pwa generates its own. Two SWs fighting for scope causes silent failures. Fix: remove the manual registration, let vite-plugin-pwa handle everything. Add custom push logic via vite-plugin-pwa's config.

2. **iOS PWA push notification limitations** — iOS requires the PWA to be installed to home screen before push works. `Notification.permission` may return `'default'` even after grant in some versions. Fix: detect standalone mode (`navigator.standalone`), show "Add to Home Screen" prompt before asking for notification permission.

3. **Avatar cache busting** — Supabase Storage upsert returns the same URL. Browser and service worker cache the old image. Fix: append `?v=${Date.now()` to avatar URLs after upload. The service worker's `urlPattern` ignores query params but the browser fetch cache treats it as a new resource.

4. **Push subscription management is missing** — `chatStore.js` uses `new Notification()` (local only). No `pushManager.subscribe()`, no Edge Function to send push payloads. This is a multi-step effort: register SW push, store subscription in DB, create Edge Function, trigger on events. Budget 2-3 days for this alone.

5. **Due date timezone handling** — `TIMESTAMPTZ` stores UTC, but users think in local time. Store all dates as UTC (already the case). On create: `new Date(localString)` sends local as UTC. On display: `date-fns format()` uses local timezone. For push: calculate `triggerTime = dueDate - now` in Edge Function using user's timezone.

## Implications for Roadmap

1. **Phase 1 must include SW fix** — the dual registration bug is foundational. Fix it before building push notifications on top of a broken SW stack.

2. **Spike push notifications in week 1** — if iOS PWA push is unreliable, pivot to in-app notification badges + "check reminders" nudge. Don't let push blockers delay the rest of v2.0.

3. **Avatar and presence are independent** — can be built in parallel by different people or in quick succession. Neither depends on the other.

4. **Reminders depend on push** — a reminder without a notification is just a note. Push infrastructure must ship before or with reminders.

5. **Todos depend on shared infrastructure** — `DateTimePicker` from reminders phase, `AgendaPage` tab nav from reminders phase. Todos are the most complex feature (two-level hierarchy, assignees, Realtime for two tables) — benefits from all shared infra being in place.

6. **Push is the hardest feature** — iOS PWA support is the risk. Budget accordingly. If the spike fails, the entire reminder value proposition changes.

7. **One-time reminders first, recurring later** — the research is unanimous: recurring reminders have deceptively complex timezone/DST/cron edge cases. Ship one-time, validate demand, then add recurrence in v2.1.

## Sources

- `STACK.md` — Stack research: current deps validated, required additions evaluated with rationale for each library choice
- `FEATURES.md` — Feature research: competitive analysis of 14 couple/task apps, table stakes vs differentiators vs anti-features for each capability
- `ARCHITECTURE.md` — Architecture research: new tables, RLS policies, Edge Functions, components, stores, build order with dependency graph
- `PITFALLS.md` — Pitfall research: 18 specific issues identified with prevention strategies, severity ratings, and phase allocation
