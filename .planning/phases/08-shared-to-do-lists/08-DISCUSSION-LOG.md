# Phase 8: Shared To-Do Lists - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-30
**Phase:** 8-Shared To-Do Lists
**Areas discussed:** Navigation & Layout, List Management UX, Item Creation Flow, Completion & Deletion, Assignee Badge UX, Progress Indicator, List Color System, Secondary Sort Order

---

## Navigation & Layout

### Where should to-do lists live in the app?

| Option | Description | Selected |
|--------|-------------|----------|
| 4th tab on AgendaPage | Add 'Listas' as 4th tab (Eventos / Lembretes / Listas / Notas). Keeps everything in one place. | ✓ |
| Separate page | Separate route (/lists) with its own page. More room for complex list UI. | |
| 4th tab with split view | 4th tab but with split view — list selector on left, items on right. | |

**User's choice:** 4th tab on AgendaPage
**Notes:** Consistent with existing tab pattern, SegmentedTabs already supports it.

### How should user switch between multiple lists?

| Option | Description | Selected |
|--------|-------------|----------|
| Horizontal scroll chips | Horizontal scrollable chips/pills at top of tab. Compact, familiar pattern. | ✓ |
| Vertical accordion | Vertical list of lists with item count badge. More space for long list names. | |
| Dropdown selector | Single list view with dropdown selector at top. Simple but requires extra tap. | |

**User's choice:** Horizontal scroll chips
**Notes:** Compact, familiar pattern from other apps.

### What should the empty state look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Same as other tabs | Illustration + 'Nenhuma lista' text + 'Criar lista' CTA button. | ✓ |
| Minimal with CTA button | Just a centered '+' button with 'Criar primeira lista' text. | |

**User's choice:** Same as other tabs
**Notes:** Consistent with RemindersTab and EventsTab empty states.

### How should the list of lists be displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Card grid | Lists as a grid of cards (2 columns). Each card shows list name + item count + completion percentage. | ✓ |
| Simple list | Lists as a simple vertical list with name + count. Compact, more lists visible at once. | |
| All-in-one grouped view | Single list view — all items from all lists shown together, grouped by list with section headers. | |

**User's choice:** Card grid
**Notes:** Feels like a dashboard, visually appealing.

---

## List Management UX

### How should users create a new list?

| Option | Description | Selected |
|--------|-------------|----------|
| FAB → modal | FAB opens a modal with list name input. Consistent with EventsTab/RemindersTab pattern. | ✓ |
| Inline chip input | Inline '+' chip at the end of the horizontal chips row. Tapping expands to a text input. | |
| Long-press context menu | Long-press on the chips row opens a context menu with 'Create list' option. | |

**User's choice:** FAB → modal
**Notes:** Consistent with existing creation pattern.

### How should users rename or delete a list?

| Option | Description | Selected |
|--------|-------------|----------|
| Long-press context menu | Long-press on list card opens context menu with 'Rename' and 'Delete' options. | ✓ |
| Menu icon on card | Each list card has a small '...' menu icon in the corner. | |
| Swipe to delete | Swipe left on list card reveals delete button. | |

**User's choice:** Long-press context menu
**Notes:** Also add same option to RemindersTab for consistency.

### What fields should the list creation form have?

| Option | Description | Selected |
|--------|-------------|----------|
| Name only modal | Simple modal with just a text input for list name and Save/Cancel buttons. | |
| Name + color picker | Modal with name input + optional color/theme picker for the list card. | ✓ |

**User's choice:** Name + color picker
**Notes:** More personalization.

### When user deletes a list, should there be a confirmation?

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmation dialog | Alert dialog: 'Delete [list name]? All items will be removed.' with Cancel/Delete buttons. | ✓ |
| Undo toast after | Undo toast after deletion: 'List deleted' with Undo button for 5 seconds. | |

**User's choice:** Confirmation dialog
**Notes:** Standard mobile pattern, prevents accidental deletion.

---

## Item Creation Flow

### How should users add items to a list?

| Option | Description | Selected |
|--------|-------------|----------|
| Inline bottom input | Text input pinned at bottom of item list. Type and press Enter/+. | |
| FAB → full modal | FAB opens a modal with title, assignee, due date fields. More structured. | ✓ |
| Inline input + tap to edit | Inline input for title only. After adding, tap item to set assignee/due date. | |

**User's choice:** FAB → full modal
**Notes:** More structured, captures all info at creation time.

### What fields should the item creation modal have?

| Option | Description | Selected |
|--------|-------------|----------|
| Title + assign + due date | Title (required), Assign to Me/Partner (toggle), Due date (optional, uses DateTimePicker). | ✓ |
| Title + assign + due + priority | Title, Assign, Due date, Priority (low/normal/high). | |
| Title + assign + due + notes | Title, Assign, Due date, Notes (optional). | |

**User's choice:** Title + assign + due date
**Notes:** Clean, focused. Priority and notes deferred to v3.

### How should items be displayed within a list?

| Option | Description | Selected |
|--------|-------------|----------|
| Compact row | Each item as a row: checkbox | title | assignee badge | due date. | ✓ |
| Card per item | Each item as a card with checkbox, title, assignee badge, due date. | |
| Grouped by assignee | Grouped by assignee: 'My Tasks' section and 'Partner's Tasks' section. | |

**User's choice:** Compact row
**Notes:** Compact, scannable.

### How should overdue items be visually treated?

| Option | Description | Selected |
|--------|-------------|----------|
| Red date + sort to top | Overdue items show red date text + sort to top of their group. | ✓ |
| Red background highlight | Overdue items get a red background tint or border. | |
| No special treatment | No special treatment — items just show their due date. | |

**User's choice:** Red date + sort to top
**Notes:** Clear visual signal without being noisy.

---

## Completion & Deletion

### How should completed items be handled?

| Option | Description | Selected |
|--------|-------------|----------|
| Strikethrough + collapsible section | Completed items get strikethrough + fade, then auto-move to collapsible 'Concluidos' section. | ✓ |
| Hide immediately | Completed items disappear immediately from the list. | |
| Stay in place with strikethrough | Completed items stay in place with strikethrough. User manually reorders. | |

**User's choice:** Strikethrough + collapsible section
**Notes:** Same pattern as RemindersTab.

### How should users delete individual items?

| Option | Description | Selected |
|--------|-------------|----------|
| Swipe to delete | Swipe left on item row reveals red delete button. | |
| Long-press context menu | Long-press on item opens context menu with 'Delete' option. | |
| Edit mode with bulk delete | Edit mode toggle at top of list. Shows checkboxes for bulk select + delete button. | ✓ |

**User's choice:** Edit mode with bulk delete
**Notes:** Good for cleaning up many items at once.

### How should users edit existing items?

| Option | Description | Selected |
|--------|-------------|----------|
| Tap to edit modal | Tap on item row opens a modal with all fields pre-filled. | ✓ |
| Inline editing | Inline editing — tap on title to edit text directly in the row. | |
| No edit (delete + recreate) | No editing — user must delete and recreate items. | |

**User's choice:** Tap to edit modal
**Notes:** Same modal as creation but in edit mode.

### How should the completed items section work?

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible with count | Collapsible section at bottom with count badge (e.g., 'Concluidos (3)'). | ✓ |
| Always visible | Always visible section showing completed items. No collapsing. | |
| Separate tab/view | Completed items move to a separate tab/view. | |

**User's choice:** Collapsible with count
**Notes:** Collapsed by default, consistent with RemindersTab.

---

## Assignee Badge UX

### How should the assignee badge be displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Color pill with text | Small colored pill with text: blue 'Eu' for me, pink 'Parceiro(a)' for partner. | |
| Mini avatar | Avatar icon (small circle with user's avatar photo). More personal. | ✓ |
| Plain text label | Text only: 'Me' / 'Partner' in muted color. | |

**User's choice:** Mini avatar
**Notes:** More personal, shows who the task belongs to.

### What happens when an item has no assignee?

| Option | Description | Selected |
|--------|-------------|----------|
| No badge | No badge shown. Clean row, item is clearly unassigned. | ✓ |
| Gray placeholder badge | Gray 'A definir' (To define) badge. Signals that assignment is pending. | |
| Force assignment | Items must always be assigned — no unassigned state. | |

**User's choice:** No badge
**Notes:** Clean, minimal.

---

## Progress Indicator

### Should list cards show completion progress?

| Option | Description | Selected |
|--------|-------------|----------|
| Count text | Each list card shows a count like '3/5 done' below the list name. | ✓ |
| Progress bar | Each list card has a thin progress bar that fills as items are completed. | |
| No indicator | No progress indicator on list cards. | |

**User's choice:** Count text
**Notes:** Simple, scannable.

---

## List Color System

### How should the list color picker work?

| Option | Description | Selected |
|--------|-------------|----------|
| Preset palette | 8-10 preset colors (pastel tones matching cosmic-v2 aesthetic). | |
| Full color wheel | Full color wheel/picker. Maximum flexibility. | ✓ |
| Semantic color meanings | 5-6 semantic colors (e.g., blue for groceries, green for house). | |

**User's choice:** Full color wheel
**Notes:** Maximum flexibility for user expression.

### How should the list color be displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Accent line + tinted card | Color appears as thin accent line at top of list card + tinted background. | ✓ |
| Full card background | Color fills the entire list card background. | |
| Small dot indicator | Color appears as a small dot/pip on the list card. | |

**User's choice:** Accent line + tinted card
**Notes:** Subtle but visible.

---

## Secondary Sort Order

### How should items be sorted within a list?

| Option | Description | Selected |
|--------|-------------|----------|
| Due date then creation order | Items with due dates first (sorted by date), then undated items in creation order. | ✓ |
| Due date then alphabetical | Items with due dates first (sorted by date), then undated items alphabetically. | |
| Due date only (undated last) | All items sorted by due date only. Undated items go to the very bottom. | |

**User's choice:** Due date then creation order
**Notes:** Clear, predictable.

---

## The Agent's Discretion

- Animation details for list cards, item rows, and modal transitions
- Exact visual styling (colors, spacing, shadows) — follow cosmic-v2.html reference
- Error handling UX (toast messages, retry states) — follow existing patterns
- Color wheel implementation details (component library or custom)

## Deferred Ideas

- **Long-press context menu on RemindersTab** — Add the same long-press pattern for consistency with ListsTab. Small UX consistency fix, technically outside Phase 8 scope.
- **Subtasks on to-do items** (TODO-09): Deferred to v3
- **Drag-and-drop reorder** (TODO-10): Deferred to v3
- **Task categories/tags** (TODO-11): Deferred to v3
- **Gamification/rewards** (TODO-12): Deferred to v3

---

*Discussion log: 2026-07-30*
