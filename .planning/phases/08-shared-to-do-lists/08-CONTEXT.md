# Phase 8: Shared To-Do Lists - Context

**Gathered:** 2026-07-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Manage shared tasks with assignments and due dates in real time. Couples create named lists (e.g., "Groceries", "House"), add items with checkboxes, assign items to "Me" or "Partner", set optional due dates, and see real-time updates when items are added/completed. The `todo_lists` and `todo_items` tables are already in place from Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Layout
- **D-01:** To-do lists live as a "Listas" tab on AgendaPage (4th tab: Eventos / Lembretes / Listas / Notas). Reuses SegmentedTabs component.
- **D-02:** Multiple lists displayed as horizontal scrollable chips at top of tab (e.g., "Groceries", "House", "+"). Items below filter by selected list.
- **D-03:** Empty state: illustration + "Nenhuma lista" text + "Criar lista" CTA button (consistent with EventsTab/RemindersTab pattern).
- **D-04:** Lists displayed as a card grid (2 columns). Each card shows list name + color accent + item count + completion progress.

### List Management UX
- **D-05:** FAB (floating action button) opens modal for list creation. Consistent with EventsTab/RemindersTab pattern.
- **D-06:** Long-press on list card opens context menu with "Renomear" and "Excluir" options. Also add to RemindersTab for consistency.
- **D-07:** List creation form: name (required) + color picker (full color wheel).
- **D-08:** List deletion shows confirmation dialog: "Excluir [list name]? Todos os itens serao removidos." with Cancel/Excluir buttons.

### Item Creation Flow
- **D-09:** FAB opens full modal for item creation. Modal includes: title (required), assign to Me/Partner (toggle), due date (optional, uses DateTimePicker from Phase 7).
- **D-10:** Items displayed as compact rows: checkbox | title | assignee badge (mini avatar) | due date. Completed items get strikethrough.
- **D-11:** Overdue items show red date text + sort to top of their group.

### Completion & Deletion
- **D-12:** Completed items get strikethrough text + fade opacity, then auto-move to a collapsible "Concluidos" section at bottom (same pattern as RemindersTab).
- **D-13:** Edit mode toggle at top of list. Shows checkboxes for bulk select + delete button. Good for cleaning up many items.
- **D-14:** Tap on item row opens edit modal with all fields (title, assignee, due date) pre-filled. Same modal as creation but in edit mode.
- **D-15:** Collapsible "Concluidos" section with count badge (e.g., "Concluidos (3)"). Collapsed by default.

### Assignee Badge UX
- **D-16:** Assignee displayed as mini avatar (small circle with user's avatar photo). More personal than text labels.
- **D-17:** Unassigned items (assigned_to is null) show no badge. Clean row, item is clearly unassigned.

### Progress Indicator
- **D-18:** Each list card shows completion count text (e.g., "3/5 concluidos") below the list name. Simple, scannable.

### List Color System
- **D-19:** Full color wheel picker for list colors. Maximum flexibility for user expression.
- **D-20:** Color appears as thin accent line at top of list card + tinted background. Subtle but visible.

### Secondary Sort Order
- **D-21:** Items sorted by due date first (items with dates first, then undated). Within same due date, items sort by creation order (oldest first).

### Real-Time Sync
- **D-22:** Supabase Realtime subscription on todo_lists and todo_items tables. Partner sees lists and items appear/update/delete instantly. Same pattern as agendaStore/reminderStore.

### The Agent's Discretion
Areas where user said "you decide" — agent has flexibility:
- Animation details for list cards, item rows, and modal transitions
- Exact visual styling (colors, spacing, shadows) — follow cosmic-v2.html reference and existing card patterns
- Error handling UX (toast messages, retry states) — follow existing patterns
- Color wheel implementation details (component library or custom)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `FRONTEND/supabase/migrations/20260728_create_todo_lists_and_items_tables.sql` — Existing todo_lists and todo_items tables with RLS policies. All CRUD operations depend on this.
- `FRONTEND/supabase/migrations/` — All existing migrations for table patterns and RLS conventions.

### Design Reference
- `docs/cosmic-v2.html` — Design reference for romantic, minimal, modern aesthetic. Must validate new UI against this.

### Requirements
- `.planning/REQUIREMENTS.md` — TODO-01 through TODO-08. Full requirement definitions and acceptance criteria.

### Existing Code Patterns
- `FRONTEND/src/features/agenda/AgendaPage.jsx` — AgendaPage with SegmentedTabs pattern. ListsTab integrates as 4th tab.
- `FRONTEND/src/features/agenda/SegmentedTabs.jsx` — Reusable tab component for the 4-tab layout.
- `FRONTEND/src/features/agenda/EventsTab.jsx` — EventsTab pattern: FAB → modal → form, grouped list, empty state. ListsTab follows this pattern.
- `FRONTEND/src/features/agenda/RemindersTab.jsx` — RemindersTab pattern: collapsible completed section, profile fetching, real-time updates. ListsTab mirrors this.
- `FRONTEND/src/features/agenda/DateTimePicker.jsx` — Reusable DateTimePicker for due date selection.
- `FRONTEND/src/stores/agendaStore.js` — Zustand store pattern with Supabase Realtime subscription. todoStore follows this pattern.
- `FRONTEND/src/stores/reminderStore.js` — Reminder store pattern with Realtime subscription, optimistic updates, cleanup.
- `FRONTEND/src/shared/lib/supabase.js` — Supabase client initialization.

### Roadmap
- `.planning/ROADMAP.md` — Phase 8 goal, requirements, success criteria, dependency on Phase 7.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SegmentedTabs**: Already built, supports any number of tabs. Adding "Listas" is a one-line config change.
- **CalendarGrid + DateTimePicker**: Full month grid with day selection + scroll wheel time picker. Reuse for due date selection.
- **agendaStore/reminderStore pattern**: Zustand store with Supabase Realtime subscription, optimistic updates, cleanup. todoStore should mirror this exactly.
- **EventForm/ReminderForm pattern**: Modal overlay form with submit/cancel buttons. ListForm and ItemForm follow this structure.
- **RemindersTab collapsible section**: "Concluidos" section with count badge and collapse toggle. Reuse for completed items.

### Established Patterns
- **Zustand stores**: All state management via Zustand. Stores call Supabase directly, no API layer.
- **Supabase Realtime**: Postgres changes subscription with filter on pair_id. INSERT/UPDATE/DELETE handling with optimistic updates.
- **Co-located CSS**: Each component has its own .css file imported in the component.
- **Feature directories**: Features organized in `src/features/{name}/` with components, CSS, and hooks.
- **PairID system**: All tables use pair_id with RLS policies for couple-scoped access.
- **Optimistic updates**: Insert immediately, replace with server data on success, rollback on error.

### Integration Points
- **AgendaPage tabs**: Add ListsTab as fourth tab. AgendaPage initializes both agendaStore, reminderStore, and the new todoStore.
- **Drawer nav**: No changes needed — Agenda route already exists.
- **AppShell**: Lists tab renders inside AppShell > PairingGate wrapper.
- **Profile fetching**: Fetch partner avatar for assignee badges (same pattern as RemindersTab).

</code_context>

<specifics>
## Specific Ideas

- List cards should feel personal — the color accent makes each list visually distinct and expressive.
- The mini avatar assignee badge makes items feel owned and accountable, not generic.
- The collapsible "Concluidos" section should show a count badge when collapsed (consistent with RemindersTab).
- Edit mode with bulk delete is efficient for cleaning up many completed items at once.
- The full color wheel gives users creative freedom to personalize their lists.

</specifics>

<deferred>
## Deferred Ideas

- **Long-press context menu on RemindersTab** — Add the same long-press pattern for consistency with ListsTab. Small UX consistency fix, technically outside Phase 8 scope.
- **Subtasks on to-do items** (TODO-09): Deferred to v3 — complexity, validate simple checklist first.
- **Drag-and-drop reorder** (TODO-10): Deferred to v3 — touch interaction complexity.
- **Task categories/tags** (TODO-11): Deferred to v3 — color system covers basic organization.
- **Gamification/rewards** (TODO-12): Deferred to v3 — not core value.

</deferred>

---

*Phase: 8-Shared To-Do Lists*
*Context gathered: 2026-07-30*
