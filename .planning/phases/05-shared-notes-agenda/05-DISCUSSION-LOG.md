# Phase 5: Shared Notes & Agenda - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-27
**Phase:** 5-shared-notes-agenda
**Areas discussed:** Navigation structure, Notes design, Events & reminders, Calendar view

---

## Navigation structure

| Option | Description | Selected |
|--------|-------------|----------|
| Combined /agenda with tabs | Single /agenda route with Notes \| Events tabs | ✓ |
| Separate /notes and /agenda | Two distinct routes with own drawer entries | |
| You decide | Agent picks based on codebase patterns | |

**User's choice:** Combined /agenda with tabs
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Pill/segmented control | Two pills, active one filled with primary color | ✓ |
| Underline tabs | Text tabs with colored underline indicator | |
| You decide | Pick what fits cosmic design system | |

**User's choice:** Pill/segmented control
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Events (default) | Calendar/events is primary view, time-sensitive | ✓ |
| Notes | Notes more frequently accessed | |
| Last used tab | Remember via localStorage | |

**User's choice:** Events (default)
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Illustration + CTA | Friendly empty illustration with create button | ✓ |
| Plain text prompt | Simple "No notes yet" text with button | |
| You decide | Pick based on existing empty states | |

**User's choice:** Illustration + CTA
**Notes:** None

---

## Notes design

| Option | Description | Selected |
|--------|-------------|----------|
| Plain text body | Simple title + body, no editor dependency | ✓ |
| Markdown body | Markdown with parsing/rendering | |
| Rich text editor | Full WYSIWYG (e.g., TipTap) | |

**User's choice:** Plain text body
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Title + body | Title required, body optional. Scannable list | ✓ |
| Body only | Just text area, first line as preview | |
| You decide | Pick what works best for UI | |

**User's choice:** Title + body
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Both partners | Both can edit any note — collaboration | ✓ |
| Creator + read-only | Only creator edits, partner reads | |
| You decide | Pick based on app philosophy | |

**User's choice:** Both partners can edit
**Notes:** None

---

## Events & reminders

| Option | Description | Selected |
|--------|-------------|----------|
| Title + date + description + category | Matches REQ + category from design ref | ✓ |
| Title + date + description | Core fields only | |
| You decide | Match design reference | |

**User's choice:** Title + date + description + category
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Predefined set | Fixed categories, user picks from list | ✓ |
| User-created | Users create own categories with custom colors | |
| You decide | Pick what's practical for v1 | |

**User's choice:** Predefined set, in pt-BR (Noite de Date, Consulta, Aniversário, Viagem, Outro)
**Notes:** User explicitly requested pt-BR for category names

---

| Option | Description | Selected |
|--------|-------------|----------|
| In-app only | Reminder badge/indicator in app | |
| Browser push | Real push notifications via service worker | |
| Both | In-app + optional browser push | ✓ |

**User's choice:** Both in-app and browser push
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| User-selectable | User picks: 1h, 1d, 1w before | ✓ |
| Fixed (1 day) | Always remind 1 day before | |
| You decide | Pick most practical default | |

**User's choice:** User-selectable reminder timing
**Notes:** Options: 1 hora antes, 1 dia antes, 1 semana antes

---

## Calendar view

| Option | Description | Selected |
|--------|-------------|----------|
| List grouped by date | Chronological, date headers (Today, Tomorrow...) | |
| Full calendar grid | Monthly grid with day indicators | |
| Both | Grid at top, list below | ✓ |

**User's choice:** Both calendar grid and list
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Swipe horizontally | Left/right swipe to change months | ✓ |
| Arrow buttons | Left/right arrow navigation | |
| Both | Swipe on mobile, arrows on desktop | |

**User's choice:** Swipe horizontally
**Notes:** None

---

## the agent's Discretion

- Note editor layout and form design
- Calendar grid implementation details
- Store structure (one combined store vs two separate)
- Database schema details (column types, indexes)

## Deferred Ideas

None — discussion stayed within phase scope
