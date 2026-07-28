# Architecture Research — v2.0 Profile & Shared Utilities

## Integration Points

### Profile Enhancement (Avatar Crop, Display Name, Online Status)

**Existing:** `profiles` table already has `avatar_url` and `display_name`. `AvatarUpload.jsx` handles upload to `avatars` storage bucket. `authStore.js` fetches profile on auth change and exposes `profile` to all components. `ProfilePage.jsx` and `PartnerProfile.jsx` render profile data.

**Changes needed:**
- **Avatar crop:** Client-side Canvas crop tool before upload. The existing `imageCompress.js` utility (`src/shared/lib/imageCompress.js`) already does Canvas-based compression — crop logic extends this pattern. No new storage bucket needed; reuses `avatars` bucket with `{user_id}/avatar.{ext}` path.
- **Display name:** Already works. No schema change. Only UI refinement if needed.
- **Online status:** Requires new `online_status` table (user-level, not pair-level) + Realtime subscription in `authStore` or a new `statusStore`. Partners subscribe to each other's status via Realtime. The existing `typing_status` table (`002_chat_schema.sql:32-39`) provides the exact pattern for per-user presence tracking.

**Integration with existing components:**
- `Header.jsx` — show partner online indicator
- `Drawer.jsx` — show partner status
- `PartnerProfile.jsx` — display online/last seen
- `ChatView.jsx` — show typing + online status together

### Shared Reminders (One-time, Push Notifications)

**Existing:** `agenda_events` table has a `reminder` TEXT column but no push notification infrastructure. `chatStore.js:578-601` already has `requestNotificationPermission()` and `showNotification()` using the Web Notifications API.

**Changes needed:**
- **New table:** `shared_reminders` (pair-scoped, one-time fire)
- **Push delivery:** Two options:
  1. **Client-side (simpler):** Schedule via `setTimeout` + Web Notifications API (already partially in chatStore). Works when tab is open. Limited for offline.
  2. **Edge Function + Push API (robust):** Supabase Edge Function fires at scheduled time, sends push via Push API. Requires service worker `push` event handler. Better for offline/background.
- **Recommended:** Hybrid — client-side for immediate reminders, Edge Function for background delivery.
- **Service worker:** Extend `sw.js` (or vite-plugin-pwa config) to handle `push` events and `notificationclick`.

**Integration with existing components:**
- `AgendaPage.jsx` — new "Reminders" tab alongside "Events" and "Notes"
- `Drawer.jsx` — optional badge for pending reminders
- `HomePage.jsx` — upcoming reminder widget

### Shared To-Do Lists

**Existing:** No to-do infrastructure. `shared_notes` table is freeform text, not structured checklists. `notesStore.js` handles CRUD + Realtime.

**Changes needed:**
- **New tables:** `todo_lists` (container) + `todo_items` (checklist items)
- **New store:** `todoStore.js` following the exact pattern of `notesStore.js` / `agendaStore.js`
- **Realtime:** Subscribe to both `todo_lists` and `todo_items` changes

**Integration with existing components:**
- `AgendaPage.jsx` — new "To-Do" tab (3 tabs total, or replace SegmentedTabs with a different nav)
- `HomePage.jsx` — overdue/upcoming todos widget

---

## New Components

### Supabase Tables

#### 1. `online_status` (user-level presence)
```sql
CREATE TABLE online_status (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **RLS:** Users can read partner's status (via pairs lookup). Users can update only their own.
- **Pattern:** Mirrors `typing_status` but user-scoped, not pair-scoped. Single row per user.
- **Heartbeat:** Client updates `last_seen` every 30s via `setInterval` when tab is active. `is_online` set to `true` on visibility change to visible, `false` on unload/hidden.

#### 2. `shared_reminders` (one-time reminders)
```sql
CREATE TABLE shared_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  remind_at TIMESTAMPTZ NOT NULL,
  fired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **RLS:** Standard pair-member pattern (SELECT/INSERT/UPDATE/DELETE).
- **Index:** `idx_reminders_pair_fire ON shared_reminders (pair_id, remind_at) WHERE fired = FALSE`
- **Edge Function:** `fire-reminders` runs on cron (pg_cron every minute), finds `remind_at <= NOW() AND fired = FALSE`, marks as fired, sends push.

#### 3. `todo_lists` (list container)
```sql
CREATE TABLE todo_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `todo_items` (checklist entries)
```sql
CREATE TABLE todo_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID NOT NULL REFERENCES todo_lists(id) ON DELETE CASCADE,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  assignee_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```
- **RLS:** Pair-member access on both tables. `assignee_id` references `auth.users` but RLS still gates via pair membership.
- **Index:** `idx_todo_items_list ON todo_items (list_id, completed)`

### Storage Buckets

No new buckets needed.
- Avatars: reuses existing `avatars` bucket
- Reminders/To-dos: pure data, no file uploads

### Edge Functions

#### 1. `fire-reminders` (Supabase Edge Function)
```
/supabase/functions/fire-reminders/index.ts
```
- Triggered by pg_cron every 60 seconds
- Queries `shared_reminders` where `remind_at <= NOW() AND fired = FALSE`
- Marks as `fired = TRUE`
- Sends Web Push to both pair members via Push API
- Requires VAPID keys stored as Supabase secrets

#### 2. `send-push` (helper, called by fire-reminders)
- Handles the actual Push API delivery
- Stores push subscription in a `push_subscriptions` table (or uses existing profile data)

### React Components

#### Profile Feature (`src/features/profile/`)
| File | Purpose |
|------|---------|
| `AvatarCrop.jsx` | Canvas-based crop tool (drag-to-crop circle overlay) |
| `AvatarUpload.jsx` | **Extend existing** — add crop step before upload |
| `OnlineStatus.jsx` | Dot indicator (green/gray) + "last seen" text |
| `PartnerProfile.jsx` | **Extend** — add OnlineStatus component |

#### Reminders Feature (`src/features/reminders/` — new directory)
| File | Purpose |
|------|---------|
| `RemindersTab.jsx` | Tab content for AgendaPage (list + create form) |
| `ReminderCard.jsx` | Single reminder display (title, time, countdown) |
| `ReminderForm.jsx` | Create/edit reminder (datetime picker) |
| `reminders.css` | Co-located styles |

#### To-Do Feature (`src/features/todo/` — new directory)
| File | Purpose |
|------|---------|
| `TodoTab.jsx` | Tab content for AgendaPage |
| `TodoListCard.jsx` | List container with item count |
| `TodoItem.jsx` | Single item (checkbox, due date, assignee) |
| `TodoForm.jsx` | Create list or add item |
| `todo.css` | Co-located styles |

#### Shared Components
| File | Purpose |
|------|---------|
| `src/shared/components/DateTimePicker.jsx` | Reusable datetime input (reminders + todo due dates) |
| `src/shared/components/Avatar.jsx` | Reusable avatar display (initials fallback, online dot) — extracted from repeated pattern in ProfilePage, PartnerProfile, ChatView |

### Zustand Stores

| Store | Pattern Source | Realtime Tables |
|-------|---------------|-----------------|
| `statusStore.js` | `dashboardStore.js` | `online_status` |
| `reminderStore.js` | `agendaStore.js` | `shared_reminders` |
| `todoStore.js` | `notesStore.js` | `todo_lists`, `todo_items` |

Each follows the established pattern: `initialize*`, `cleanup`, optimistic updates, Realtime subscription per `pair_id`.

---

## Data Flow Changes

### Before (v1.2)
```
User opens app
  → authStore.fetchProfile() loads profile from profiles table
  → checkPairStatus() loads pair from pairs table
  → Each feature initializes its own store + Realtime subscription
  → ProfilePage → direct Supabase calls to profiles table
```

### After (v2.0)
```
User opens app
  → authStore.fetchProfile() loads profile (unchanged)
  → statusStore initializes → subscribes to online_status for partner
  → Each feature initializes its store + Realtime (unchanged)
  → AvatarUpload adds crop step → uploads to avatars bucket → updates profiles.avatar_url
  → HomePage shows partner online status from statusStore
  → AgendaPage adds RemindersTab + TodoTab → initializes reminderStore + todoStore
  → reminderStore subscribes to shared_reminders → shows upcoming reminders
  → todoStore subscribes to todo_lists + todo_items → shows shared checklists
  → Edge Function fires reminders → sends push notifications
```

### Key Data Flow Changes

1. **Profile is now partner-readable.** Existing RLS on `profiles` only allows `SELECT WHERE auth.uid() = id`. Need a new policy: "Paired users can view partner profile" — adds `OR EXISTS (SELECT 1 FROM pairs WHERE ... AND partner = auth.uid())`. This enables `PartnerProfile`, `Header`, and `Drawer` to show partner name/avatar without a separate query.

2. **Online status is broadcast via Realtime.** Partners subscribe to `online_status` changes. When user A comes online, user B's client receives the Realtime event and updates the UI. This is new — currently no cross-client presence exists.

3. **Reminders fire asynchronously.** The Edge Function handles background delivery. Client also polls on visibility change for immediate check. Two paths converge: client-side `setTimeout` for foreground, Edge Function for background.

4. **To-dos have two-level hierarchy.** Unlike notes (flat), todos have `todo_lists → todo_items`. Realtime subscription must handle both tables. Store manages list ordering and item filtering.

---

## Build Order

### Phase 1: Profile Enhancement (Foundation)
**Depends on:** Nothing (existing infrastructure)
**Rationale:** Online status touches every component that shows user info. Building it first unblocks avatar display improvements and partner presence everywhere.

| Step | Task | Why |
|------|------|-----|
| 1.1 | Migration: `online_status` table + RLS | Schema first |
| 1.2 | `statusStore.js` + heartbeat logic | Core presence mechanism |
| 1.3 | `AvatarCrop.jsx` (Canvas crop tool) | Self-contained component |
| 1.4 | Extend `AvatarUpload.jsx` with crop | Integrates crop into existing flow |
| 1.5 | `Avatar.jsx` shared component | Extract repeated avatar pattern |
| 1.6 | `OnlineStatus.jsx` dot indicator | Small presentational component |
| 1.7 | Extend `PartnerProfile.jsx` | Add online status + improved avatar |
| 1.8 | Extend `Header.jsx` / `Drawer.jsx` | Show partner online indicator |
| 1.9 | Migration: Add partner-read policy to `profiles` | Enables cross-profile access |

### Phase 2: Shared Reminders
**Depends on:** Phase 1 (uses `statusStore` for partner info, `Avatar` component)
**Rationale:** Reminders are simpler than to-dos (no hierarchy). Edge Function infrastructure (pg_cron, Push API) is reusable for future features.

| Step | Task | Why |
|------|------|-----|
| 2.1 | Migration: `shared_reminders` table + RLS + index | Schema first |
| 2.2 | `reminderStore.js` | CRUD + Realtime |
| 2.3 | `DateTimePicker.jsx` shared component | Reusable for todos too |
| 2.4 | `ReminderCard.jsx` + `ReminderForm.jsx` | UI components |
| 2.5 | `RemindersTab.jsx` | Tab container |
| 2.6 | Extend `AgendaPage.jsx` — add 3rd tab | Integration point |
| 2.7 | Edge Function: `fire-reminders` + pg_cron | Background delivery |
| 2.8 | Service worker: `push` event handler | Receives push, shows notification |
| 2.9 | Client-side reminder scheduling | Foreground fallback |

### Phase 3: Shared To-Do Lists
**Depends on:** Phase 2 (shares `DateTimePicker`, `AgendaPage` tab infrastructure)
**Rationale:** Most complex feature (two-level hierarchy, assignees, due dates). Benefits from all shared infrastructure being in place.

| Step | Task | Why |
|------|------|-----|
| 3.1 | Migration: `todo_lists` + `todo_items` tables + RLS | Schema first |
| 3.2 | `todoStore.js` | Two-table CRUD + Realtime |
| 3.3 | `TodoItem.jsx` | Checkbox + due date + assignee badge |
| 3.4 | `TodoListCard.jsx` | Container with item count |
| 3.5 | `TodoForm.jsx` | Create list / add item |
| 3.6 | `TodoTab.jsx` | Tab container |
| 3.7 | Extend `AgendaPage.jsx` — 4 tabs or grouped nav | Navigation update |
| 3.8 | Dashboard widget: overdue/upcoming todos | Optional integration |
| 3.9 | Drawer badge: pending reminder count | Optional polish |

### Dependency Graph
```
Phase 1 (Profile)
  ├── online_status table + store
  ├── AvatarCrop + AvatarUpload extension
  └── profiles partner-read policy
      │
Phase 2 (Reminders)
  ├── shared_reminders table + store
  ├── DateTimePicker (shared)
  ├── Edge Function + service worker
  └── AgendaPage tab extension
      │
Phase 3 (To-Dos)
  ├── todo_lists + todo_items tables + store
  ├── TodoItem/ListCard/Form components
  ├── AgendaPage final nav
  └── Dashboard integration
```

---

## RLS Policy Design

### Pattern: Pair-Member Access (Established)
Every pair-scoped table uses this pattern:
```sql
-- SELECT: pair members can read
CREATE POLICY "Pair members can view X"
ON {table} FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- INSERT: pair members can create (must set own user_id)
CREATE POLICY "Pair members can insert X"
ON {table} FOR INSERT TO authenticated
WITH CHECK (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
  AND user_id = auth.uid()
);

-- UPDATE: pair members can update any row in their pair
CREATE POLICY "Pair members can update X"
ON {table} FOR UPDATE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- DELETE: pair members can delete any row in their pair
CREATE POLICY "Pair members can delete X"
ON {table} FOR DELETE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);
```

### New: `online_status` RLS (User-Level, Not Pair-Level)
```sql
-- Anyone authenticated can read online status (needed for partner lookup)
CREATE POLICY "Authenticated users can view online status"
ON online_status FOR SELECT TO authenticated
USING (true);

-- Users can only update their own status
CREATE POLICY "Users can update own online status"
ON online_status FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users insert their own status on first heartbeat
CREATE POLICY "Users can insert own online status"
ON online_status FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);
```
**Note:** `online_status` intentionally has broader read access — any authenticated user needs to see if their partner is online. Write is restricted to self.

### New: `profiles` Partner-Read Policy
```sql
-- Add to existing profiles RLS:
CREATE POLICY "Paired users can view partner profile"
ON profiles FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM pairs
    WHERE pairs.paired_at IS NOT NULL
    AND (
      (pairs.user_one = auth.uid() AND pairs.user_two = profiles.id)
      OR
      (pairs.user_two = auth.uid() AND pairs.user_one = profiles.id)
    )
  )
);
```
**Impact:** Enables `PartnerProfile.jsx`, `Header.jsx`, `Drawer.jsx`, and chat message bubbles to read partner profile data directly from the `profiles` table without needing a separate RPC or query. The existing "Users can view own profile" policy remains — both policies coexist.

### New: `shared_reminders` RLS
Standard pair-member pattern (as shown in established pattern above).

### New: `todo_lists` RLS
Standard pair-member pattern.

### New: `todo_items` RLS
```sql
-- Same as standard pair-member, but also gates on list ownership:
CREATE POLICY "Pair members can view todo items"
ON todo_items FOR SELECT TO authenticated
USING (
  list_id IN (
    SELECT id FROM todo_lists
    WHERE pair_id IN (
      SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
    )
  )
);
```
**Why different:** `todo_items` references `todo_lists` not `pairs` directly. RLS chains through `list_id → todo_lists.pair_id → pairs`. This is slightly more expensive but ensures items can only be read if the parent list belongs to the user's pair.

### Edge Function Security
- `fire-reminders` runs as `service_role` (bypasses RLS) — called by pg_cron, not client
- Push delivery uses VAPID keys stored in Supabase Vault secrets
- Client push subscription stored in `push_subscriptions` table with RLS

---

## Summary of All New Artifacts

| Type | Artifact | Migration |
|------|----------|-----------|
| Table | `online_status` | `20260728_online_status.sql` |
| Table | `shared_reminders` | `20260728_shared_reminders.sql` |
| Table | `todo_lists` | `20260728_todo_lists.sql` |
| Table | `todo_items` | `20260728_todo_lists.sql` (same migration) |
| Policy | `profiles` partner-read | `20260728_profiles_partner_read.sql` |
| Store | `statusStore.js` | — |
| Store | `reminderStore.js` | — |
| Store | `todoStore.js` | — |
| Component | `AvatarCrop.jsx` | — |
| Component | `Avatar.jsx` (shared) | — |
| Component | `OnlineStatus.jsx` | — |
| Component | `DateTimePicker.jsx` (shared) | — |
| Component | `RemindersTab.jsx` | — |
| Component | `ReminderCard.jsx` | — |
| Component | `ReminderForm.jsx` | — |
| Component | `TodoTab.jsx` | — |
| Component | `TodoListCard.jsx` | — |
| Component | `TodoItem.jsx` | — |
| Component | `TodoForm.jsx` | — |
| Edge Function | `fire-reminders` | — |
| Service Worker | Push event handler | — |
| CSS | `reminders.css` | — |
| CSS | `todo.css` | — |

**Modified files:**
- `AvatarUpload.jsx` — add crop step
- `PartnerProfile.jsx` — add online status + improved avatar
- `Header.jsx` — partner online indicator
- `Drawer.jsx` — partner status + reminder badge
- `AgendaPage.jsx` — 3-4 tab navigation
- `HomePage.jsx` — optional widgets (upcoming reminder, overdue todos)
- `vite.config.js` — PWA service worker push handler config
