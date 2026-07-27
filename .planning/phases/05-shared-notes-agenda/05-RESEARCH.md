# Phase 5: Shared Notes & Agenda - Research

**Researched:** 2026-07-27
**Domain:** CRUD features (notes + calendar events) with Supabase Realtime, Zustand stores, date-fns calendar grid, motion swipe gestures, and browser push notifications
**Confidence:** HIGH

## Summary

Phase 5 delivers two new collaborative features — shared notes and a shared calendar of events — under a single `/agenda` route with tabbed navigation. The implementation follows the established Supabase-first + Zustand pattern used by the album and dashboard features. Two new database tables (`shared_notes` and `agenda_events`) with pair-based RLS policies, two new Zustand stores, and new UI components for the tabbed interface, calendar grid, event list, and note editor.

**Primary recommendation:** Reuse the exact Zustand store pattern from `albumStore.js` (initialize/cleanup/optimistic updates/Supabase Realtime) for both notes and events. Use `date-fns` for all calendar grid logic. Build the segmented tab control as a pure CSS pill component — no library needed. For reminders, use in-app indicator only in Phase 5; defer browser push notifications to a future phase (browser support is poor, especially Safari).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Note CRUD | API / Backend (Supabase) | Frontend Server (Zustand store) | Supabase handles persistence + Realtime; Zustand orchestrates UI state |
| Event CRUD | API / Backend (Supabase) | Frontend Server (Zustand store) | Same pattern as notes |
| Tabbed navigation | Browser / Client | — | Pure client-side state (which tab is active) |
| Calendar grid | Browser / Client | — | Pure client-side date math with date-fns |
| Event list grouped by date | Browser / Client | — | Client-side grouping using date-fns |
| Swipe gesture navigation | Browser / Client | — | motion drag gesture on calendar |
| Reminders (in-app) | Browser / Client | — | Client-side indicator + notification permission |
| Reminders (push) | API / Backend | Browser / Client (Service Worker) | Requires server-side scheduling or Notification Triggers API |
| Pair-based access control | Database / Storage (RLS) | — | PostgreSQL RLS policies enforce pair membership |

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.110.8 | Database CRUD + Realtime subscriptions | Already the project's data layer |
| `zustand` | ^5.0.14 | Client state management | Already used for auth, chat, album, dashboard stores |
| `date-fns` | ^4.4.0 | Date manipulation, calendar grid, grouping | Already installed; tree-shakeable, 200+ functions |
| `motion` | ^12.42.2 | Animations, swipe gestures, tab transitions | Already installed as `framer-motion` successor |
| `react-router-dom` | ^7.18.1 | Routing, `/agenda` route | Already installed |
| `lucide-react` | ^1.26.0 | Icons (CalendarDays, FileText, Plus, etc.) | Already installed |
| `react-hot-toast` | ^2.6.0 | Success/error feedback | Already installed but unused — start using it |

### Supporting (already in project)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `vite-plugin-pwa` | ^1.3.0 | Service worker generation via Workbox | Already configured in vite.config.js |
| `workbox-window` | ^7.4.1 | Service worker lifecycle | Already installed |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Pure CSS pill tabs | `@mshafiqyajid/react-segmented-control` | Unnecessary dependency for 2 tabs — CSS is trivial |
| date-fns calendar | `react-big-calendar` | Heavy library; we only need a month grid, not full calendar |
| In-app reminders | Notification Triggers API | Poor browser support (no Safari, no Firefox) — defer to Phase 7+ |
| Zustand store per feature | Single combined store | Two stores (notesStore + agendaStore) follows existing pattern; cleaner separation |

**Installation:** None needed — all packages already installed.

**Version verification:** All versions confirmed from `package.json`:
- `@supabase/supabase-js` ^2.110.8 [VERIFIED: package.json]
- `zustand` ^5.0.14 [VERIFIED: package.json]
- `date-fns` ^4.4.0 [VERIFIED: package.json]
- `motion` ^12.42.2 [VERIFIED: package.json]

## Package Legitimacy Audit

> No new packages to install for this phase. All dependencies already exist in package.json.

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
User taps /agenda
       │
       ▼
┌─────────────────────────────┐
│  App.jsx (Router)           │
│  /agenda → AgendaPage       │
│  ProtectedRoute + PairingGate│
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  AgendaPage.jsx             │
│  ┌───────────────────────┐  │
│  │ SegmentedTabs         │  │
│  │ [Events] [Notes]      │  │
│  └───────────┬───────────┘  │
│              │              │
│    ┌─────────┴─────────┐    │
│    ▼                   ▼    │
│ ┌──────────┐  ┌──────────┐  │
│ │EventsTab │  │ NotesTab │  │
│ │- CalGrid │  │- NoteList│  │
│ │- EventLst│  │- NoteEdit│  │
│ └────┬─────┘  └────┬─────┘  │
│      │              │       │
└──────┼──────────────┼───────┘
       │              │
       ▼              ▼
┌────────────┐ ┌────────────┐
│agendaStore │ │ notesStore │
│(Zustand)   │ │ (Zustand)  │
└─────┬──────┘ └─────┬──────┘
      │               │
      ▼               ▼
┌─────────────────────────────┐
│  Supabase JS Client         │
│  - Realtime subscriptions   │
│  - CRUD operations          │
│  - RLS enforced             │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│  PostgreSQL (Supabase)      │
│  - agenda_events table      │
│  - shared_notes table       │
│  - pair_id FK + RLS policies│
└─────────────────────────────┘
```

### Recommended Project Structure

```
FRONTEND/src/
├── features/
│   └── agenda/                  # New feature directory
│       ├── AgendaPage.jsx       # Main page with tab switcher
│       ├── agenda.css           # Co-located styles
│       ├── SegmentedTabs.jsx    # Pill/segmented tab control
│       ├── EventsTab.jsx        # Calendar grid + event list
│       ├── EventForm.jsx        # Create/edit event form
│       ├── EventRow.jsx         # Single event display (cosmic-v2 style)
│       ├── CalendarGrid.jsx     # Month view calendar grid
│       ├── NotesTab.jsx         # Notes list + empty state
│       ├── NoteEditor.jsx       # Create/edit note form
│       ├── NoteCard.jsx         # Single note display
│       └── __tests__/           # Test files
├── stores/
│   ├── notesStore.js            # New: notes CRUD + Realtime
│   └── agendaStore.js           # New: events CRUD + Realtime + reminders
└── App.jsx                      # Update: replace placeholder AgendaPage import
```

### Pattern 1: Zustand Store (copy from albumStore.js)

**What:** Initialize/cleanup lifecycle with Supabase Realtime subscriptions and optimistic updates.
**When to use:** For both notesStore and agendaStore.
**Example:**
```js
// Source: FRONTEND/src/stores/albumStore.js (existing pattern)
import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useNotesStore = create((set, get) => ({
  notes: [],
  loading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeNotes: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    try {
      const { data: notes, error } = await supabase
        .from('shared_notes')
        .select('*')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: false })

      if (error) throw error
      set({ notes: notes || [], loading: false })

      // Clean up old subscription
      const oldChannel = get().subscription
      if (oldChannel) supabase.removeChannel(oldChannel)

      // Subscribe to Realtime changes
      const channel = supabase
        .channel(`notes:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'shared_notes',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            const alreadyPresent = state.notes.some(n => n.id === payload.new.id)
            if (!alreadyPresent) set({ notes: [payload.new, ...state.notes] })
          } else if (payload.eventType === 'UPDATE') {
            set({ notes: state.notes.map(n => n.id === payload.new.id ? payload.new : n) })
          } else if (payload.eventType === 'DELETE') {
            set({ notes: state.notes.filter(n => n.id !== payload.old.id) })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ... CRUD methods ...

  cleanup: () => {
    const { subscription } = get()
    if (subscription) supabase.removeChannel(subscription)
    set({ notes: [], pairId: null, subscription: null, loading: false, error: null })
  }
}))
```

### Pattern 2: Supabase Migration (pair-based RLS)

**What:** Every table gets `pair_id UUID REFERENCES pairs(id)` with RLS policies for pair members.
**When to use:** For both `shared_notes` and `agenda_events` tables.
**Example:**
```sql
-- Source: FRONTEND/supabase/migrations/20260725_create_album_photos.sql (existing pattern)
CREATE TABLE IF NOT EXISTS shared_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pair_id UUID NOT NULL REFERENCES pairs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE shared_notes ENABLE ROW LEVEL SECURITY;

-- Pair members can view notes
CREATE POLICY "Pair members can view notes"
ON shared_notes FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can insert notes
CREATE POLICY "Pair members can insert notes"
ON shared_notes FOR INSERT TO authenticated
WITH CHECK (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
  AND user_id = auth.uid()
);

-- Pair members can update any note (D-07: true collaboration)
CREATE POLICY "Pair members can update notes"
ON shared_notes FOR UPDATE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

-- Pair members can delete any note
CREATE POLICY "Pair members can delete notes"
ON shared_notes FOR DELETE TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_shared_notes_pair_created ON shared_notes (pair_id, created_at DESC);
```

### Pattern 3: Calendar Grid with date-fns

**What:** Generate a month-view calendar grid using date-fns functions.
**When to use:** In CalendarGrid.jsx component.
**Example:**
```js
// Source: date-fns official docs + web research
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isSameDay, addMonths, subMonths
} from 'date-fns'
import { ptBR } from 'date-fns/locale'

function getCalendarDays(currentMonth) {
  const firstDay = startOfMonth(currentMonth)
  const lastDay = endOfMonth(currentMonth)
  const startDate = startOfWeek(firstDay, { weekStartsOn: 0 }) // Sunday start
  const endDate = endOfWeek(lastDay, { weekStartsOn: 0 })
  return eachDayOfInterval({ start: startDate, end: endDate })
}

// Usage in component:
const [currentMonth, setCurrentMonth] = useState(new Date())
const calendarDays = getCalendarDays(currentMonth)
// Render as 7-column CSS grid, highlight days in current month
```

### Pattern 4: Swipe Gesture with motion

**What:** Horizontal swipe to navigate between months in the calendar grid.
**When to use:** In CalendarGrid.jsx for month navigation.
**Example:**
```js
// Source: motion.dev docs (motion/react)
import { motion, useMotionValue, useTransform } from 'motion/react'

function CalendarGrid({ currentMonth, onMonthChange }) {
  const x = useMotionValue(0)
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5])

  const handleDragEnd = (event, info) => {
    const threshold = 50
    if (info.offset.x > threshold) {
      onMonthChange(subMonths(currentMonth, 1)) // swipe right = previous
    } else if (info.offset.x < -threshold) {
      onMonthChange(addMonths(currentMonth, 1)) // swipe left = next
    }
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      style={{ x, opacity }}
      touch-action="pan-y"
    >
      {/* Calendar grid content */}
    </motion.div>
  )
}
```

### Pattern 5: Segmented Tab Control (Pure CSS)

**What:** Pill-style tab switcher with sliding indicator.
**When to use:** In SegmentedTabs.jsx for Events | Notes toggle.
**Example:**
```css
/* Source: web research on pure CSS segmented controls */
.segmented-tabs {
  display: flex;
  position: relative;
  background: var(--color-bg-input);
  border-radius: var(--radius-md);
  padding: 4px;
}

.segmented-tabs .tab {
  flex: 1;
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border-radius: calc(var(--radius-md) - 4px);
  transition: color 0.2s;
  z-index: 1;
}

.segmented-tabs .tab.active {
  color: var(--color-text-primary);
  background: var(--color-primary);
}
```

### Anti-Patterns to Avoid

- **Don't create a new channel per table:** Use one channel per feature with multiple `.on()` calls for different tables (Supabase Realtime supports this)
- **Don't hand-roll calendar date math:** Use date-fns `startOfMonth`, `endOfMonth`, `eachDayOfInterval` — manual date logic is error-prone
- **Don't use `setInterval` for reminders:** Notification Triggers API (`showTrigger: new TimestampTrigger`) is the correct approach, but has poor Safari/Firefox support — use in-app indicator only
- **Don't create separate routes for notes and events:** Decision D-01 says single `/agenda` route with tabs
- **Don't skip optimistic updates:** The store pattern requires optimistic UI for responsive feel, then rollback on error

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Calendar month grid | Manual date loops, `new Date()` arithmetic | `date-fns` (`startOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek`) | Timezone bugs, leap year handling, DST edge cases |
| Date formatting | Manual string concatenation | `date-fns/format` with locale (`ptBR`) | Locale-aware formatting, consistent output |
| Date grouping for event list | Custom grouping logic | `date-fns/isSameDay`, `date-fns/groupBy` | Correct date comparison across timezones |
| Swipe gesture | Touch event listeners, manual velocity calculation | `motion` (`drag="x"`, `onDragEnd`) | Physics-based gesture recognition, 60fps |
| Tab transitions | Manual CSS class toggling | `motion` (`AnimatePresence`, `animate`) | Smooth enter/exit animations |
| Supabase Realtime | Manual WebSocket management | `supabase.channel().on('postgres_changes')` | Connection pooling, reconnection, filter parsing |
| Browser notifications | Manual permission requests | `Notification.requestPermission()` + `ServiceWorkerRegistration.showNotification()` | Standard API, service worker integration |

**Key insight:** This project already has date-fns, motion, and Supabase JS installed. All the building blocks exist — the work is assembling them following established patterns, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Forgetting to clean up Realtime subscriptions
**What goes wrong:** Memory leaks and duplicate event handlers when user navigates away from `/agenda` and back.
**Why it happens:** The `initialize` function creates a subscription but `cleanup` is not called on unmount.
**How to avoid:** Call `cleanup()` in the component's `useEffect` return function. Follow the pattern from `albumStore.js`.
**Warning signs:** Console warnings about duplicate subscriptions, events firing multiple times.

### Pitfall 2: Optimistic update ID mismatch
**What goes wrong:** After inserting a note/event, the Realtime INSERT event creates a duplicate in the list because the optimistic temp ID doesn't match the server-assigned UUID.
**Why it happens:** The optimistic update uses `temp-${Date.now()}` but Realtime delivers the real UUID.
**How to avoid:** Check `alreadyPresent` before adding (as in albumStore pattern). Use `.select().single()` on insert to get the real record.
**Warning signs:** Duplicate items appearing in lists after creation.

### Pitfall 3: Calendar grid off-by-one errors
**What goes wrong:** Days from previous/next month display incorrectly, or the grid has wrong number of rows.
**Why it happens:** Manual date math doesn't account for month start day or DST transitions.
**How to avoid:** Use `startOfWeek(startOfMonth)` and `endOfWeek(endOfMonth)` to get the full grid range. Let date-fns handle edge cases.
**Warning signs:** Calendar has 5 rows one month, 6 the next, with blank cells.

### Pitfall 4: RLS policy too restrictive or too permissive
**What goes wrong:** Users can't see partner's notes, or can see notes from other pairs.
**Why it happens:** RLS policy忘记 includes `pair_id` check, or uses wrong auth function.
**How to avoid:** Copy the exact RLS pattern from `album_photos` migration. Test with both users in a pair.
**Warning signs:** 403 errors on Supabase queries, empty result sets when data exists.

### Pitfall 5: Tab state lost on navigation
**What goes wrong:** User switches to Notes tab, navigates to Chat, returns to `/agenda` — Events tab shows instead of Notes.
**Why it happens:** Tab state is in component state (useState) which resets on unmount.
**How to avoid:** Either persist tab state in URL search params (`/agenda?tab=notes`) or in Zustand store.
**Warning signs:** Users complaining about losing their place.

## Code Examples

Verified patterns from existing codebase:

### Supabase Realtime subscription (from albumStore.js)
```js
// Source: FRONTEND/src/stores/albumStore.js (lines 40-67)
const channel = supabase
  .channel(`album:${pairId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'album_photos',
    filter: `pair_id=eq.${pairId}`
  }, (payload) => {
    const { new: newPhoto } = payload
    const state = get()
    const alreadyPresent = state.photos.some(p => p.id === newPhoto.id)
    if (!alreadyPresent) {
      set({ photos: [newPhoto, ...state.photos] })
    }
  })
  .on('postgres_changes', {
    event: 'DELETE',
    schema: 'public',
    table: 'album_photos',
    filter: `pair_id=eq.${pairId}`
  }, (payload) => {
    const { old: deletedPhoto } = payload
    const state = get()
    set({ photos: state.photos.filter(p => p.id !== deletedPhoto.id) })
  })
  .subscribe()
```

### RLS policy pattern (from album_photos migration)
```sql
-- Source: FRONTEND/supabase/migrations/20260725_create_album_photos.sql (lines 19-25)
CREATE POLICY "Pair members can view album photos"
ON album_photos FOR SELECT TO authenticated
USING (
  pair_id IN (
    SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()
  )
);
```

### Route setup pattern (from App.jsx)
```jsx
// Source: FRONTEND/src/App.jsx (lines 80-91)
<Route
  path="/agenda"
  element={
    <ProtectedRoute>
      <AppShell>
        <PairingGate>
          <AgendaPage />
        </PairingGate>
      </AppShell>
    </ProtectedRoute>
  }
/>
```

### date-fns calendar grid pattern
```js
// Source: web research + date-fns docs
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Generate full calendar grid (including padding days from prev/next month)
const firstDay = startOfMonth(currentMonth)
const lastDay = endOfMonth(currentMonth)
const startDate = startOfWeek(firstDay, { weekStartsOn: 0 })
const endDate = endOfWeek(lastDay, { weekStartsOn: 0 })
const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })

// Format for display
format(day, 'EEE', { locale: ptBR })  // "seg", "ter", "qua"...
format(day, 'd')                        // "15"
format(firstDay, 'MMMM yyyy', { locale: ptBR })  // "julho de 2026"
```

### motion swipe gesture pattern
```jsx
// Source: motion.dev docs
import { motion, useMotionValue, useTransform } from 'motion/react'

const x = useMotionValue(0)
const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5])

<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, { offset }) => {
    if (offset.x > 50) onPrevMonth()
    else if (offset.x < -50) onNextMonth()
  }}
  style={{ x, opacity }}
  touch-action="pan-y"
>
```

### Segmented tabs pattern
```jsx
// Source: web research on pure CSS segmented controls
function SegmentedTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="segmented-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual date arithmetic | date-fns v4 (tree-shakeable, immutable) | 2024 | Use `startOfMonth`, `eachDayOfInterval` — no manual loops |
| framer-motion import | `motion/react` (rebranded) | 2024 | Import from `motion/react` not `framer-motion` |
| Push notifications via server | Notification Triggers API (client-scheduled) | 2020 (Chrome 80) | Can schedule notifications without server, but poor Safari/Firefox support |
| Manual WebSocket for realtime | Supabase Realtime (managed) | Already used | Just use `.channel().on().subscribe()` — no manual WS |

**Deprecated/outdated:**
- `framer-motion` package name → use `motion` (already installed as `motion` ^12.42.2)
- Manual `setInterval` for reminder scheduling → Notification Triggers API (but limited support)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 + @testing-library/react 16.3.2 |
| Config file | FRONTEND/vite.config.js (test section) |
| Quick run command | `cd FRONTEND && npx vitest run --reporter=verbose` |
| Full suite command | `cd FRONTEND && npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| NOTE-01 | User can create shared notes | unit | `npx vitest run src/features/agenda/__tests__/NoteEditor.test.jsx` | ❌ Wave 0 |
| NOTE-02 | Both partners can read and edit shared notes | integration | `npx vitest run src/features/agenda/__tests__/NotesTab.test.jsx` | ❌ Wave 0 |
| NOTE-03 | Notes are organized chronologically | unit | `npx vitest run src/stores/__tests__/notesStore.test.js` | ❌ Wave 0 |
| AGND-01 | User can create events with title, date, description | unit | `npx vitest run src/features/agenda/__tests__/EventForm.test.jsx` | ❌ Wave 0 |
| AGND-02 | Events displayed in date-organized view | unit | `npx vitest run src/features/agenda/__tests__/CalendarGrid.test.jsx` | ❌ Wave 0 |
| AGND-03 | Both partners can see and create events | integration | `npx vitest run src/features/agenda/__tests__/EventsTab.test.jsx` | ❌ Wave 0 |
| AGND-04 | User can set reminders for events | unit | `npx vitest run src/stores/__tests__/agendaStore.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd FRONTEND && npx vitest run --reporter=verbose`
- **Per wave merge:** `cd FRONTEND && npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `src/features/agenda/__tests__/` — entire test directory needs creation
- [ ] `src/stores/__tests__/notesStore.test.js` — store unit tests
- [ ] `src/stores/__tests__/agendaStore.test.js` — store unit tests
- [ ] `src/features/agenda/__tests__/AgendaPage.test.jsx` — page-level integration test
- [ ] `src/features/agenda/__tests__/CalendarGrid.test.jsx` — calendar grid tests
- [ ] `src/features/agenda/__tests__/EventForm.test.jsx` — event form tests
- [ ] `src/features/agenda/__tests__/NotesTab.test.jsx` — notes tab tests
- [ ] `src/features/agenda/__tests__/NoteEditor.test.jsx` — note editor tests

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (already enforced via `auth.uid()` in RLS) |
| V3 Session Management | yes | Supabase session (already managed by authStore) |
| V4 Access Control | yes | PostgreSQL RLS policies (pair_id membership check) |
| V5 Input Validation | yes | Client-side form validation + Supabase column constraints |
| V6 Cryptography | no | No custom crypto needed — Supabase handles transport encryption |

### Known Threat Patterns for Supabase + React stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Pair ID spoofing | Tampering | RLS policy checks `auth.uid()` against `pairs.user_one`/`user_two` |
| Unauthorized note access | Information Disclosure | RLS SELECT policy requires pair membership |
| Cross-pair data leakage | Information Disclosure | Every query filters by `pair_id` from auth store |
| XSS via note body | Tampering | React auto-escapes; plain text only (D-05: no markdown) |
| CSRF on note creation | Tampering | Supabase anon key + RLS; no session cookies to steal |

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Notification Triggers API (`showTrigger`) is not reliable enough for production use due to poor Safari/Firefox support | Reminders | Users on Safari/Firefox won't get push reminders — but in-app indicator still works |
| A2 | The existing service worker from vite-plugin-pwa does not handle push notification events — custom SW code may be needed | Reminders | Push notifications won't work without `push` event listener in SW |
| A3 | The `motion` package (installed as `motion` ^12.42.2) supports `drag="x"` and `onDragEnd` with the same API as older framer-motion | Swipe gestures | If API changed, swipe implementation needs adjustment |
| A4 | date-fns v4 `ptBR` locale is imported from `date-fns/locale` (not `date-fns/locale/pt-BR`) | Calendar formatting | Import path may differ — verify at implementation time |
| A5 | The cosmic-v2.html event-row CSS (lines 845-883) is the design reference for event display | Event styling | If design changed, event row layout may differ |

## Open Questions

1. **Push notification implementation scope**
   - What we know: Decision D-10 says "in-app indicator + browser push notifications"
   - What's unclear: Whether to implement full push (requires VAPID keys, server-side subscription storage, Service Worker push handler) or just in-app for Phase 5
   - Recommendation: Implement in-app indicator only in Phase 5. Push notifications require server infrastructure (FastAPI planned but not built) and have poor Safari support. Defer to Phase 7 when backend exists.

2. **Calendar week start day**
   - What we know: Brazilian locale typically starts week on Sunday (pt-BR)
   - What's unclear: Whether the calendar grid should start on Sunday or Monday
   - Recommendation: Start on Sunday (standard for pt-BR). Use `weekStartsOn: 0` in date-fns.

3. **Note collaboration conflict handling**
   - What we know: Both partners can edit any note (D-07)
   - What's unclear: What happens when both edit the same note simultaneously — last-write-wins or conflict resolution?
   - Recommendation: Last-write-wins with Realtime sync. Simple and fits the "shared space" philosophy. No operational transform needed.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build/dev | ✓ | — | — |
| npm | Package management | ✓ | — | — |
| Supabase project | Data layer | ✓ | — | — |
| Browser (modern) | PWA, notifications | ✓ | — | — |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Sources

### Primary (HIGH confidence)
- [CITED: supabase.com/docs/guides/realtime/postgres-changes] - Realtime subscription patterns, multiple table listeners, filter syntax
- [CITED: motion.dev/docs/react-gestures] - Drag gesture API, `onDragEnd`, `touch-action` CSS requirement
- [CITED: date-fns.org/docs] - `startOfMonth`, `eachDayOfInterval`, `startOfWeek`, `endOfWeek` functions
- [CITED: developer.chrome.com/docs/web-platform/notification-triggers] - Notification Triggers API, `TimestampTrigger` usage

### Secondary (MEDIUM confidence)
- [WebSearch verified with official source] - Segmented control CSS patterns (pure CSS, no library needed)
- [WebSearch verified with official source] - Calendar grid React patterns using date-fns

### Tertiary (LOW confidence)
- [WebSearch only] - Browser support for Notification Triggers (caniuse data may be outdated)
- [WebSearch only] - motion/react import path (rebranded from framer-motion)

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages already installed and verified in package.json
- Architecture: HIGH — follows exact patterns from albumStore.js and album migration
- Pitfalls: HIGH — derived from existing codebase patterns and known Supabase gotchas
- Security: HIGH — RLS pattern copied from existing migration; ASVS categories straightforward

**Research date:** 2026-07-27
**Valid until:** 2026-08-27 (30 days — stable stack, no fast-moving dependencies)
