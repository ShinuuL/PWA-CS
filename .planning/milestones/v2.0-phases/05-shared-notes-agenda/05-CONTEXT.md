# Phase 5: Shared Notes & Agenda - Context

**Gathered:** 2026-07-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Couples can collaborate on shared notes and manage a shared calendar of events. Two new CRUD features (notes + agenda) delivered as a single `/agenda` route with tabbed navigation. Each feature follows established Supabase + Zustand patterns.

</domain>

<decisions>
## Implementation Decisions

### Navigation Structure
- **D-01:** Notes and events combined under a single `/agenda` route with Notes | Events tabs (not separate routes)
- **D-02:** Tab style is a pill/segmented control — two pills at the top, active one filled with primary color
- **D-03:** Events tab is active by default when opening `/agenda` (time-sensitive; notes are reference material)
- **D-04:** Empty states use illustration + CTA button ("Create your first note/event")

### Notes Design
- **D-05:** Notes use plain text body (no markdown, no rich text editor)
- **D-06:** Notes have title (required) + body (optional) fields — title makes notes scannable in list view
- **D-07:** Both partners can edit any note — true collaboration, fits the shared-space philosophy

### Events & Reminders
- **D-08:** Events have title, date, description, and category fields
- **D-09:** Predefined categories in pt-BR: Noite de Date, Consulta, Aniversário, Viagem, Outro (user picks from list)
- **D-10:** Reminders use both in-app indicator + browser push notifications
- **D-11:** Reminder timing is user-selectable when creating event: 1 hora antes, 1 dia antes, 1 semana antes

### Calendar View
- **D-12:** Events tab shows calendar grid at top + list grouped by date below (both views)
- **D-13:** Calendar grid navigated by horizontal swipe (native mobile feel)

### the agent's Discretion
- Note editor layout and form design — agent picks what fits cosmic design system
- Calendar grid implementation details (week start day, highlight style) — agent decides
- Store structure for combined notes+agenda — agent can use one store or two
- Database schema details (column types, indexes) — agent designs based on patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — NOTE-01, NOTE-02, NOTE-03, AGND-01, AGND-02, AGND-03, AGND-04
- `.planning/ROADMAP.md` — Phase 5 goal, success criteria, dependencies

### Design Reference
- `docs/cosmic-v2.html` §Calendar Events (lines 845-883) — event-row design, date block layout, category pill styling

### Codebase Patterns (read for implementation reference)
- `FRONTEND/src/stores/albumStore.js` — canonical Zustand store pattern (initialize, cleanup, optimistic updates, Supabase Realtime)
- `FRONTEND/src/stores/dashboardStore.js` — another store reference
- `FRONTEND/src/features/dashboard/` — feature directory structure pattern
- `FRONTEND/src/features/album/` — feature with page + grid + upload components
- `FRONTEND/src/shared/lib/supabase.js` — Supabase client setup
- `FRONTEND/src/App.jsx` — router setup, existing `/agenda` placeholder route
- `FRONTEND/src/shared/components/Drawer.jsx` — nav items (already has `/agenda` entry)
- `FRONTEND/supabase/migrations/` — migration patterns (UUID PKs, pair_id FK, RLS policies)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Zustand store pattern** (albumStore/dashboardStore): `initialize` + `cleanup` + optimistic updates + Supabase Realtime subscriptions — copy this pattern for notesStore and agendaStore
- **ProtectedRoute + PairingGate**: Route wrappers already in place, `/agenda` route already uses them
- **AppShell layout**: Header + Drawer + content area — notes/agenda render inside this
- **Drawer nav**: Already has `/agenda` with `CalendarDays` icon — no nav changes needed
- **date-fns**: Already installed — use for date formatting, grouping, calendar grid
- **motion (framer-motion)**: Already installed — use for tab transitions, swipe gestures
- **react-hot-toast**: Available but unused — can use for success/error feedback
- **CSS custom properties**: `--color-primary`, `--color-bg-card`, `--radius-md`, etc. — all defined in index.css

### Established Patterns
- **Pair-based RLS**: Every table gets `pair_id UUID REFERENCES pairs(id)` — notes and events tables must follow this
- **Feature flat structure**: Components + CSS at feature root level, no subdirectories (except `__tests__/`)
- **Co-located CSS**: One CSS file per feature, imported in component file
- **No barrel exports**: Components imported directly by path

### Integration Points
- `FRONTEND/src/App.jsx` — replace placeholder `AgendaPage` with real component
- `FRONTEND/src/stores/` — add `notesStore.js` and/or `agendaStore.js`
- `FRONTEND/src/features/` — create `notes/` and/or `agenda/` feature directories
- `FRONTEND/supabase/migrations/` — add migration for `shared_notes` and `agenda_events` tables

</code_context>

<specifics>
## Specific Ideas

- User's response language is pt-BR — category names, UI labels, and empty state text should be in Brazilian Portuguese
- Categories: Noite de Date, Consulta, Aniversário, Viagem, Outro (predefined set)
- Reminder options: 1 hora antes, 1 dia antes, 1 semana antes
- The cosmic-v2.html event-row shows: date block (day + month), event info (title + description), category pill — follow this layout

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 5-Shared Notes & Agenda*
*Context gathered: 2026-07-27*
