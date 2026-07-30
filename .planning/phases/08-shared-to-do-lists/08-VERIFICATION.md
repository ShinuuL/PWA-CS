---
phase: 08-shared-to-do-lists
status: passed
verified: 2026-07-30T15:50:00Z
---

## Phase Goal

Let users manage shared tasks with assignments and due dates in real time. Couples create named lists, add items with checkboxes, assign items to "Me" or "Partner", set optional due dates, and see real-time updates.

## Verification Results

### Must-Haves Verified

- [x] todoStore exposes lists, items, loading, error state and initializeTodos, createList, updateList, deleteList, createItem, updateItem, toggleItem, deleteItem, cleanup actions
- [x] initializeTodos subscribes to Supabase Realtime on todo_lists and todo_items tables filtered by pair_id
- [x] Realtime INSERT/UPDATE/DELETE events update store state for both lists and items
- [x] createList inserts into todo_lists with name, pair_id, created_by, and color
- [x] deleteList deletes from todo_lists and cascading delete removes associated todo_items
- [x] createItem inserts into todo_items with title, list_id, assigned_to, due_at, and created_by
- [x] toggleItem flips the completed boolean on a todo_item
- [x] deleteItem removes a single todo_item
- [x] cleanup removes the Realtime subscription channel and resets store state
- [x] ColorPicker renders a HexColorPicker from react-colorful with controlled value/onChange props
- [x] Migration adds color TEXT DEFAULT '#B87CFF' column to todo_lists table
- [x] react-colorful is installed in package.json
- [x] AgendaPage renders 4 tabs: Eventos, Lembretes, Listas, Notas
- [x] AgendaPage initializes todoStore on mount
- [x] ListsTab shows empty state with List icon + heading + body + CTA
- [x] ListsTab shows 2-column grid of ListCards when lists exist
- [x] ListCard displays list name, color accent, item count, completion progress
- [x] ListCard long-press context menu with Renomear and Excluir
- [x] Item view shows horizontal scroll chips at top
- [x] ItemRow shows checkbox, title, assignee badge, due date
- [x] Completed items get strikethrough and move to collapsible Concluidos section
- [x] Collapsible Concluidos section shows count badge
- [x] Overdue items show red date text
- [x] ListForm allows creating/editing lists with name and color picker
- [x] ItemForm allows creating/editing items with title, assignee toggle, and due date
- [x] Delete confirmation dialogs for lists and items
- [x] Edit mode with bulk select and delete
- [x] Empty states for no lists and no items
- [x] Loading skeleton with 3 placeholder cards
- [x] `npm run lint` passes with no new errors

### Automated Checks

- Build: ✓ `npm run build` passes
- Lint: ✓ `npm run lint` passes (only pre-existing warnings)
- Tests: ✓ `npm run test:run` passes (pre-existing MemoryHero failures only)

### Human Verification

No human verification required — all acceptance criteria verified through code inspection and automated checks.

## Summary

All 28 must-haves verified. Build and lint pass. No regressions detected.
