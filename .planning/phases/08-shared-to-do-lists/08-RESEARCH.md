# Phase 8: Shared To-Do Lists - Research

**Researched:** 2026-07-30
**Domain:** Zustand store with Supabase Realtime, tab-based UI with list cards, checkbox items
**Confidence:** HIGH

## Summary

Phase 8 adds shared to-do lists as a 4th tab ("Listas") on AgendaPage. The database tables (`todo_lists` and `todo_items`) already exist from Phase 6 with full RLS policies, but `todo_lists` is missing a `color` column needed for D-07/D-19/D-20. A Supabase migration is required to add this column.

The implementation follows the exact same patterns as RemindersTab/reminderStore: a Zustand store (`todoStore`) with Supabase Realtime subscription, optimistic updates, and cleanup. The UI reuses SegmentedTabs (4th tab config), FAB pattern, modal overlay pattern, and collapsible completed section pattern from existing agenda components.

**Primary recommendation:** Use `react-colorful` (3.1KB gzipped, zero dependencies) for the color wheel picker. Add a `color` column migration. Mirror `reminderStore.js` pattern for `todoStore.js`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| List CRUD (create/rename/delete) | Zustand Store | Supabase DB | Store orchestrates optimistic updates; DB persists |
| Item CRUD (add/toggle/edit/delete) | Zustand Store | Supabase DB | Same pattern — store owns state, DB owns persistence |
| Real-time sync | Supabase Realtime | Zustand Store | Realtime pushes changes; store applies them |
| Sort by due date | Client-side (store) | — | Computed from store state, not DB-level sort |
| Assignee badge display | UI Component | Profile fetch | Component renders avatar; profile data fetched on demand |
| Color picker | UI Component | — | `react-colorful` HexColorPicker handles selection |
| Collapsible completed section | UI Component (state) | — | Local expanded/collapsed state in ListsTab |
| Tab integration | AgendaPage | SegmentedTabs | AgendaPage manages active tab; SegmentedTabs renders tabs |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-colorful | 5.8.0 | Hex color picker with hue slider | 3.1KB gzipped, zero deps, mobile-friendly, touch-optimized — 12x lighter than react-color |
| zustand | 5.0.14 | State management | Already in project — all stores use this |
| @supabase/supabase-js | 2.110.8 | Database + Realtime | Already in project — all data goes through this |
| date-fns | 4.4.0 | Date formatting/sorting | Already in project — used for due date display and sort |
| lucide-react | 1.26.0 | Icons | Already in project — Plus, Check, ChevronDown, etc. |
| framer-motion | 12.42.2 | Animations | Already in project — used for list item transitions |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | 2.6.0 | Toast notifications | Success/error feedback on CRUD operations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-colorful | Native `<input type="color">` | No hue wheel, ugly on mobile, inconsistent cross-browser |
| react-colorful | @uiw/react-color | 10x larger bundle (30KB+ gzipped), overkill for HEX-only use case |
| react-colorful | react-color | 12x larger bundle, unmaintained, class-based components |
| Preset color palette | react-colorful | Less flexibility, but simpler UI — D-19 specifies full color wheel |

**Installation:**
```bash
cd FRONTEND && npm install react-colorful
```

**Version verification:** react-colorful 5.8.0 confirmed on npm registry (published 17 days ago as of research date). [VERIFIED: npm registry]

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react-colorful | npm | 5+ years | 5.9M/week | github.com/omgovich/react-colorful | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
AgendaPage (4 tabs)
  ├── SegmentedTabs ─── "Eventos" | "Lembretes" | "Notas" | "Listas"
  │
  └── ListsTab (active when "Listas")
        │
        ├── Horizontal Scroll Chips (list selector)
        │     ├── Chip: "Groceries" (color accent)
        │     ├── Chip: "House" (color accent)
        │     └── Chip: "+" (create new list)
        │
        ├── List Card Grid (2 columns)
        │     ├── ListCard: name + color accent + count + progress
        │     └── ListCard: ...
        │
        └── (Selected List View)
              ├── Item rows: checkbox | title | assignee badge | due date
              ├── Completed section (collapsible)
              └── FAB → ItemForm modal
```

### Recommended Project Structure

```
FRONTEND/src/
├── features/agenda/
│   ├── ListsTab.jsx          # Main tab component (4th tab)
│   ├── ListsTab.css          # Tab styles
│   ├── ListCard.jsx          # Card component for grid view
│   ├── ListCard.css          # Card styles
│   ├── ItemRow.jsx           # Single item row with checkbox
│   ├── ItemRow.css           # Item row styles
│   ├── ListForm.jsx          # Create/rename list modal form
│   ├── ListForm.css          # List form styles
│   ├── ItemForm.jsx          # Create/edit item modal form
│   ├── ItemForm.css          # Item form styles
│   ├── ColorPicker.jsx       # Color picker wrapper (react-colorful)
│   └── ColorPicker.css       # Color picker styles
├── stores/
│   └── todoStore.js          # Zustand store (mirrors reminderStore pattern)
```

### Pattern 1: Zustand Store with Realtime (todoStore.js)
**What:** Zustand store managing todo_lists and todo_items with Supabase Realtime subscription
**When to use:** Any feature requiring real-time synced data with optimistic updates
**Example:**
```javascript
// Source: Following reminderStore.js pattern exactly
import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useTodoStore = create((set, get) => ({
  lists: [],
  items: [],       // all items across all lists
  loading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeTodos: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    try {
      // Fetch lists
      const { data: lists, error: listsErr } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: true })
      if (listsErr) throw listsErr

      // Fetch all items for this pair's lists
      const listIds = (lists || []).map(l => l.id)
      let items = []
      if (listIds.length > 0) {
        const { data: itemsData, error: itemsErr } = await supabase
          .from('todo_items')
          .select('*')
          .in('list_id', listIds)
          .order('due_at', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
        if (itemsErr) throw itemsErr
        items = itemsData || []
      }

      set({ lists: lists || [], items, loading: false })

      // Clean up old subscription
      const oldChannel = get().subscription
      if (oldChannel) supabase.removeChannel(oldChannel)

      // Subscribe to Realtime on both tables
      const channel = supabase
        .channel(`todos:${pairId}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todo_lists',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            if (!state.lists.some(l => l.id === payload.new.id)) {
              set({ lists: [...state.lists, payload.new] })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ lists: state.lists.map(l => l.id === payload.new.id ? payload.new : l) })
          } else if (payload.eventType === 'DELETE') {
            set({ lists: state.lists.filter(l => l.id !== payload.old.id) })
          }
        })
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'todo_items',
          filter: `list_id=in.(${listIds.join(',')})`
        }, (payload) => {
          const state = get()
          if (payload.eventType === 'INSERT') {
            if (!state.items.some(i => i.id === payload.new.id)) {
              set({ items: [...state.items, payload.new] })
            }
          } else if (payload.eventType === 'UPDATE') {
            set({ items: state.items.map(i => i.id === payload.new.id ? payload.new : i) })
          } else if (payload.eventType === 'DELETE') {
            set({ items: state.items.filter(i => i.id !== payload.old.id) })
          }
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  // ... CRUD methods follow reminderStore pattern
}))
```

### Pattern 2: Horizontal Scroll Chips (D-02)
**What:** Scrollable list selector chips at top of ListsTab
**When to use:** When user needs to switch between multiple lists
**Example:**
```jsx
// Source: CONTEXT.md D-02, D-04
<div className="lists-tab__chips">
  {lists.map(list => (
    <button
      key={list.id}
      className={`lists-tab__chip ${activeListId === list.id ? 'lists-tab__chip--active' : ''}`}
      onClick={() => setActiveListId(list.id)}
      style={{ '--chip-color': list.color || 'var(--color-primary)' }}
    >
      <span className="lists-tab__chip-dot" />
      {list.name}
    </button>
  ))}
  <button className="lists-tab__chip lists-tab__chip--add" onClick={openCreateList}>
    <Plus size={14} />
  </button>
</div>
```

### Pattern 3: Collapsible Completed Section (D-12, D-15)
**What:** Collapsible section showing completed items with count badge
**When to use:** When list has completed items to show/hide
**Example:**
```jsx
// Source: RemindersTab.jsx lines 186-209
{completedItems.length > 0 && (
  <div className="lists-tab__completed-section">
    <button
      className="lists-tab__completed-header"
      onClick={() => setCompletedExpanded(!completedExpanded)}
      type="button"
    >
      <span className="lists-tab__completed-label">Concluidos</span>
      <span className="lists-tab__completed-badge">{completedItems.length}</span>
      {completedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
    </button>
    {completedExpanded && (
      <div className="lists-tab__completed-list">
        {completedItems.map(item => (
          <ItemRow key={item.id} item={item} /* ... */ />
        ))}
      </div>
    )}
  </div>
)}
```

### Anti-Patterns to Avoid

- **Don't fetch items per-list separately:** Fetch all items for the pair's lists in one query, then filter client-side. Multiple sequential queries create race conditions with Realtime.
- **Don't use `assigned_to: 'me'` literally:** The value stored is `'me'` or `'partner'`, but display depends on who is viewing. The current user sees "Me" for their own, partner sees "Partner" for their own. Resolve at render time.
- **Don't hardcode sort in DB query:** D-06 requires items with due dates first, then undated, then by creation order. Supabase `nullsFirst: false` handles this, but verify the sort works correctly.
- **Don't skip the `list_id` filter on Realtime:** The Realtime subscription for `todo_items` must filter by list IDs to avoid receiving items from other pairs' lists.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color wheel picker | Canvas-based custom picker | react-colorful HexColorPicker | Touch handling, accessibility, cross-browser compatibility |
| Date formatting | Manual date string building | date-fns format() | Locale support (ptBR), timezone handling, edge cases |
| Checkbox animation | Custom CSS transitions | framer-motion AnimatePresence | Consistent with ReminderCard swipe animation pattern |
| Real-time sync | Polling with setInterval | Supabase Realtime subscription | Push-based, lower latency, no wasted bandwidth |

**Key insight:** The color wheel is the only new external dependency. Everything else reuses existing project libraries. react-colorful is specifically chosen for PWA performance — 3.1KB gzipped vs 30KB+ for alternatives.

## Common Pitfalls

### Pitfall 1: Realtime subscription filter with multiple list IDs
**What goes wrong:** Subscribing to `todo_items` without filtering by list IDs causes the subscription to receive items from all tables (or fail silently).
**Why it happens:** The `filter` parameter expects a PostgREST filter syntax. For `in` filters, the list IDs must be comma-separated inside parentheses.
**How to avoid:** Subscribe to `todo_items` with `filter: 'list_id=in.(${listIds.join(',')})'`. If no lists exist, skip the items subscription entirely.
**Warning signs:** Items appearing from other couples' lists, or Realtime events not firing.

### Pitfall 2: assigned_to display ambiguity
**What goes wrong:** User A assigns item to "me" — on User A's screen it shows "Me" badge, but on User B's screen it also shows "Me" instead of "Partner".
**Why it happens:** The stored value `'me'` is relative to the creator, not the viewer.
**How to avoid:** At render time, compare `assigned_to === 'me'` against `created_by === currentUser.id`. If `created_by === currentUser.id`, then `'me'` means "Me" for this viewer. If `created_by !== currentUser.id`, then `'me'` means "Partner" for this viewer.
**Warning signs:** Both partners seeing the same badge text.

### Pitfall 3: Missing color column migration
**What goes wrong:** CONTEXT.md D-07/D-19/D-20 require a color field on todo_lists, but the Phase 6 migration doesn't include it.
**Why it happens:** Phase 6 created the basic schema; color was a Phase 8 decision.
**How to avoid:** Create a new migration `ALTER TABLE todo_lists ADD COLUMN color TEXT DEFAULT '#B87CFF'` before implementing ListForm.
**Warning signs:** "column todo_lists.color does not exist" error on insert.

### Pitfall 4: FAB z-index conflicts with modal
**What goes wrong:** FAB appears on top of the modal overlay when both are open.
**Why it happens:** Both use high z-index values. FAB is `z-index: 20`, modal overlay is `z-index: 100`.
**How to avoid:** This is already correct in the existing pattern — FAB at 20, modal at 100. Follow the same values.
**Warning signs:** FAB visible behind or on top of modal.

### Pitfall 5: Optimistic update race condition on item toggle
**What goes wrong:** User rapidly toggles checkbox, creating multiple optimistic updates that conflict.
**Why it happens:** Each toggle fires immediately, but the previous toggle's server response hasn't arrived yet.
**How to avoid:** Use the existing pattern: optimistic update fires immediately, Realtime subscription handles the canonical state. The `alreadyPresent` check in the Realtime handler prevents duplicates.
**Warning signs:** Checkbox flickering, duplicate items in state.

## Code Examples

### Color Picker Component
```jsx
// Source: react-colorful official docs — https://www.npmjs.com/package/react-colorful
import { useState } from 'react'
import { HexColorPicker } from 'react-colorful'
import './ColorPicker.css'

export default function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      <HexColorPicker color={value} onChange={onChange} />
    </div>
  )
}
```

### Sort Items by Due Date (D-06, D-21)
```javascript
// Source: Derived from CONTEXT.md D-06, D-21
const sortedItems = useMemo(() => {
  return [...items]
    .filter(i => i.list_id === activeListId)
    .sort((a, b) => {
      // Items with due dates first, then undated
      if (a.due_at && !b.due_at) return -1
      if (!a.due_at && b.due_at) return 1
      // Within same due date group, sort by creation order
      if (a.due_at && b.due_at) {
        const dateCompare = new Date(a.due_at) - new Date(b.due_at)
        if (dateCompare !== 0) return dateCompare
      }
      return new Date(a.created_at) - new Date(b.created_at)
    })
}, [items, activeListId])
```

### Assignee Badge Resolution (D-16, D-17)
```jsx
// Source: Derived from CONTEXT.md D-16, D-17
import useAuthStore from '../../stores/authStore'

function AssigneeBadge({ item, profiles }) {
  const user = useAuthStore(s => s.user)

  // Resolve relative assignment to absolute user
  const resolvedUserId = item.assigned_to === 'me'
    ? item.created_by   // creator's user ID
    : (item.created_by === user.id ? partnerId : item.created_by)

  if (!item.assigned_to) return null  // D-17: unassigned shows no badge

  const profile = profiles[resolvedUserId]
  return profile?.avatar_url ? (
    <img className="item-row__avatar" src={profile.avatar_url} alt="" />
  ) : (
    <div className="item-row__avatar item-row__avatar--initials">
      {(profile?.display_name || '?')[0]?.toUpperCase()}
    </div>
  )
}
```

### Overdue Item Styling (D-11)
```jsx
// Source: CONTEXT.md D-11
const isOverdue = item.due_at && !item.completed && new Date(item.due_at) < new Date()

<div className={`item-row ${isOverdue ? 'item-row--overdue' : ''}`}>
  <span className="item-row__date" style={{ color: isOverdue ? '#FF6B6B' : undefined }}>
    {format(new Date(item.due_at), 'd MMM')}
  </span>
</div>
```

### Database Migration for Color Column
```sql
-- Source: Required by CONTEXT.md D-07, D-19, D-20
-- todo_lists table from Phase 6 lacks color column

ALTER TABLE todo_lists
ADD COLUMN color TEXT DEFAULT '#B87CFF';

COMMENT ON COLUMN todo_lists.color IS 'Hex color for list accent (D-07, D-19)';
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 3-tab AgendaPage | 4-tab AgendaPage (add Listas) | Phase 8 | AgendaPage.jsx tabs array + conditional render |
| No todo store | todoStore.js with Realtime | Phase 8 | New Zustand store, initialized in AgendaPage |
| No color on lists | HexColorPicker for list colors | Phase 8 | New dependency (react-colorful), migration needed |
| Flat item list | Sorted by due date, collapsible completed | Phase 8 | Client-side sort + UI state |

**Deprecated/outdated:**
- None — this is new feature addition, not a migration

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Phase 7 (Shared Reminders) provides DateTimePicker and AgendaPage tabs that Phase 8 depends on | Summary | Low — DateTimePicker already exists in codebase, AgendaPage already has 3 tabs |
| A2 | The `todo_lists` and `todo_items` tables exist from Phase 6 with full RLS | Standard Stack | Low — migration file confirmed at `20260728_create_todo_lists_and_items_tables.sql` |
| A3 | react-colorful is the best color picker choice for this project | Standard Stack | Low — verified zero deps, 3.1KB gzipped, mobile-friendly |
| A4 | The assigned_to field uses 'me'/'partner' relative to creator, not viewer | Common Pitfalls | Medium — if wrong, badge display logic needs inversion |
| A5 | Supabase Realtime supports filtering todo_items by list_id IN clause | Common Pitfalls | Medium — if not, need separate subscription per list or use pair_id filter |
| A6 | No additional Supabase migration needed beyond adding color column | Architecture | Low — confirmed by reading existing migration |

## Open Questions

1. **Should the "Listas" tab show all lists as cards, or start with a selected list's items?**
   - What we know: CONTEXT.md D-02 says "Multiple lists displayed as horizontal scrollable chips at top of tab. Items below filter by selected list." D-04 says "Lists displayed as a card grid (2 columns)."
   - What's unclear: These seem contradictory — chips suggest items view, card grid suggests overview. Probably: cards are the default view, tapping a card enters that list's items view (with chips as navigation).
   - Recommendation: Follow D-04 (card grid) as default, with chips appearing when a list is selected. This matches the "drill-down" pattern.

2. **Realtime subscription for todo_items with dynamic list IDs**
   - What we know: Supabase Realtime `filter` parameter supports `in.(id1,id2)` syntax.
   - What's unclear: Whether the filter works when list_ids change (new list created). May need to resubscribe.
   - Recommendation: On list create/delete, unsubscribe and resubscribe with updated list IDs. Follow the `cleanup + reinit` pattern from reminderStore.

3. **Color picker dark theme styling**
   - What we know: react-colorful supports dark theme via `[data-color-mode*='dark']` CSS selector.
   - What's unclear: Whether the default dark theme matches CoupleSpace's design system colors.
   - Recommendation: Override react-colorful CSS variables to match CoupleSpace's `--color-bg-card` and `--color-primary` values.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build | ✓ | — | — |
| npm | Package install | ✓ | — | — |
| Supabase project | Database + Realtime | ✓ | — | — |

**Missing dependencies with no fallback:** None
**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | `vite.config.js` (inline vitest config) |
| Quick run command | `cd FRONTEND && npm run test:run` |
| Full suite command | `cd FRONTEND && npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TODO-01 | Create named list | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |
| TODO-02 | Add items with checkboxes | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |
| TODO-03 | Toggle item completion | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |
| TODO-04 | Assign items to Me/Partner | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |
| TODO-05 | Set optional due date | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |
| TODO-06 | Sort by due date | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |
| TODO-07 | Real-time updates | integration | Manual verification | N/A |
| TODO-08 | Delete items and lists | unit | `npm run test:run -- tests/todoStore.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd FRONTEND && npm run test:run`
- **Per wave merge:** `cd FRONTEND && npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `tests/todoStore.test.js` — covers TODO-01 through TODO-08 store logic
- [ ] `tests/ListsTab.test.js` — covers UI rendering, sort, completed section
- [ ] `tests/ItemForm.test.js` — covers form validation, DateTimePicker integration

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | RLS policies on todo_lists/todo_items (pair_id based) |
| V5 Input Validation | yes | Form validation on list name (required), item title (required), color (hex format) |

### Known Threat Patterns for Supabase + Zustand

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| RLS bypass via direct API | Tampering | RLS policies already enforce pair_id membership check |
| XSS via list/item names | Tampering | React auto-escapes; no dangerouslySetInnerHTML used |
| Data leakage across pairs | Information Disclosure | RLS filter on pair_id prevents cross-pair access |
| Realtime subscription injection | Tampering | Supabase channel filtering by pair_id |

## Sources

### Primary (HIGH confidence)
- Codebase: `reminderStore.js` — exact pattern to follow for todoStore
- Codebase: `RemindersTab.jsx` — FAB, modal, collapsible section patterns
- Codebase: `AgendaPage.jsx` — tab integration point
- Codebase: `20260728_create_todo_lists_and_items_tables.sql` — existing schema + RLS
- npm: react-colorful 5.8.0 — zero deps, 3.1KB gzipped, mobile-friendly

### Secondary (MEDIUM confidence)
- WebSearch: react-colorful is maintained, widely used (5.9M weekly downloads)
- WebSearch: react-colorful supports dark theme via CSS custom properties

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — react-colorful verified on npm; all other libs already in project
- Architecture: HIGH — exact patterns exist in codebase (reminderStore, RemindersTab)
- Pitfalls: MEDIUM — Realtime subscription filter with dynamic list IDs needs verification

**Research date:** 2026-07-30
**Valid until:** 2026-08-30 (stable — no fast-moving dependencies)
