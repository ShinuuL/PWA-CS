# Phase 7: Shared Reminders + Push Notifications - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-29
**Phase:** 7-shared-reminders-push-notifications
**Areas discussed:** Feature location & navigation, Push notification delivery, Reminder creation & list UX, Notification content & behavior, DateTimePicker design, Reminder editing, Real-time sync, Push toggle in Settings, Chat push notifications

---

## Feature Location & Navigation

### Where should reminders live?

| Option | Description | Selected |
|--------|-------------|----------|
| New tab on AgendaPage | Add "Lembretes" tab alongside Events and Notes. Reuses SegmentedTabs. | ✓ |
| Separate /reminders route | Dedicated route with Drawer entry. More prominent but fragments time-management. | |
| Subtab inside EventsTab | Reminders within Events view. Less discoverable. | |

**User's choice:** New tab on AgendaPage
**Notes:** Natural home — Agenda already manages time-bound items.

### Tab order

| Option | Description | Selected |
|--------|-------------|----------|
| Eventos / Lembretes / Notas | Reminders in middle — time-sensitive items first. | ✓ |
| Lembretes / Eventos / Notas | Reminders first — highest urgency. | |
| Eventos / Notas / Lembretes | Reminders last — keeps existing order. | |

**User's choice:** Eventos / Lembretes / Notas

### Empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Illustration + CTA | Romantic illustration + "Nenhum lembrete" + "Criar lembrete" button. | ✓ |
| Just text + FAB | Simple text, rely on FAB for creation. | |

**User's choice:** Illustration + CTA

### Drawer link

| Option | Description | Selected |
|--------|-------------|----------|
| Only through Agenda | Keep Drawer clean. Agenda links to all time-management. | ✓ |
| Direct Drawer link | Bell icon deep-linking to Lembretes tab. | |

**User's choice:** Only through Agenda

---

## Push Notification Delivery

### Subscription storage

| Option | Description | Selected |
|--------|-------------|----------|
| New push_subscriptions table | Dedicated table with user_id, pair_id, endpoint, p256dh, auth. | ✓ |
| Reuse profiles table | Store subscription JSON in profiles column. | |
| Supabase Realtime broadcast | Skip Web Push — in-app toasts only. | |

**User's choice:** New push_subscriptions table

### Cron schedule

| Option | Description | Selected |
|--------|-------------|----------|
| Every minute | Max 1 min delay. Standard for reminders. | ✓ |
| Every 5 minutes | Less load but up to 5 min delay. | |
| Every 15 minutes | Too slow for timely reminders. | |

**User's choice:** Every minute

### Failure handling

| Option | Description | Selected |
|--------|-------------|----------|
| Retry + client fallback | Retry once after 30s. Client checks pending on app open. | ✓ |
| Just retry | 3 retries with backoff. No client fallback. | |
| No retry needed | Trust infrastructure. | |

**User's choice:** Retry + client fallback

### Permission opt-in timing

| Option | Description | Selected |
|--------|-------------|----------|
| On first reminder creation | Contextual — user understands why. | ✓ |
| On app first load after pairing | Proactive but premature. | |
| Never auto-prompt | Only in Settings. Most尊重 but less discoverable. | |

**User's choice:** On first reminder creation

---

## Reminder Creation & List UX

### Creation form fields

| Option | Description | Selected |
|--------|-------------|----------|
| Title + date/time + notes | Minimal form. | |
| Title + date/time + priority + category | Full form matching DB schema. | ✓ |
| Title + date only | No time-of-day. Less useful. | |

**User's choice:** Title + date/time + priority + category

### List display

| Option | Description | Selected |
|--------|-------------|----------|
| Chronological cards + creator avatar | Cards with title, date, avatar, name, priority dot. Grouped by date. | ✓ |
| Simple list rows | Compact items with title, date, name. | |
| Timeline view | Vertical timeline. New pattern. | |

**User's choice:** Chronological cards with creator avatar

### Past reminders

| Option | Description | Selected |
|--------|-------------|----------|
| Collapsible section | "Concluídos" section at bottom. Tappable to expand. | ✓ |
| Separate tab/filter | Toggle between views. | |
| Inline with dimmed style | Completed stay in list with reduced opacity. | |

**User's choice:** Collapsible section

### Dismissal method

| Option | Description | Selected |
|--------|-------------|----------|
| Swipe to dismiss | Swipe left → "Concluir" button. Mobile-native. | ✓ |
| Tap card → modal | Open detail view with "Mark as done". | |
| Checkbox on card | Visible checkbox on each card. | |

**User's choice:** Swipe to dismiss

### Creation form presentation

| Option | Description | Selected |
|--------|-------------|----------|
| Modal overlay | Same as EventsTab — FAB opens modal. | ✓ |
| Inline expansion | Form expands below tabs. | |

**User's choice:** Modal overlay

---

## Notification Content & Behavior

### Notification content

| Option | Description | Selected |
|--------|-------------|----------|
| Creator name + title | Title: "{Creator} te lembra:" Body: "{title}" | ✓ |
| Just title | Generic "Lembrete: {title}". | |
| Title + notes | Title + body with notes. May be too long. | |

**User's choice:** Creator name + title

### Tap action

| Option | Description | Selected |
|--------|-------------|----------|
| Open to Lembretes tab | Deep-link to /agenda?tab=reminders. | ✓ |
| Open to home | Just open app. | |
| Open specific reminder detail | Show detail view of that reminder. | |

**User's choice:** Open to Lembretes tab

### Notification grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Separate notifications | Each reminder gets own notification. | ✓ |
| Grouped by day | All reminders for same day in one notification. | |

**User's choice:** Separate notifications

### Notification sound

| Option | Description | Selected |
|--------|-------------|----------|
| Default system sound | Device's default notification sound. | ✓ |
| Custom romantic tone | Custom audio matching app theme. | |

**User's choice:** Default system sound

---

## DateTimePicker Design

### Picker style

| Option | Description | Selected |
|--------|-------------|----------|
| Custom calendar + time picker | Custom-built calendar grid + scroll time picker. | ✓ |
| Native input[type=date/time] | Browser-native inputs. Limited styling. | |
| Hybrid: native date + custom time | Native date + custom time picker. | |

**User's choice:** Custom calendar + time picker

### Time picker style

| Option | Description | Selected |
|--------|-------------|----------|
| Scroll wheel / slot picker | Two scrollable columns for hours/minutes. | ✓ |
| Clock face dial | Analog clock face. Harder on small screens. | |
| Simple number inputs | Two text inputs. Minimal. | |

**User's choice:** Scroll wheel / slot picker

### Calendar style

| Option | Description | Selected |
|--------|-------------|----------|
| Month grid (like CalendarGrid) | Full month view, reuses existing component. | ✓ |
| Simple date scroller | Horizontal scrollable ~7 days. | |
| Month/year dropdowns + grid | Dropdown selectors + day grid. | |

**User's choice:** Month grid (like CalendarGrid)

---

## Reminder Editing

### Post-creation editing

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, edit title/date/notes | Tap card to edit. Creator attribution fixed. | ✓ |
| No editing, only dismiss | Dismiss and recreate. | |

**User's choice:** Yes, edit title/date/notes

---

## Real-Time Sync

### Partner visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, Realtime sync | Supabase Realtime subscription. Partner sees updates instantly. | ✓ |
| Refresh on app open | Only refresh on app open/tab navigation. | |

**User's choice:** Yes, Realtime sync

---

## Push Toggle in Settings

### Settings control

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, in Settings | Toggle in SettingsPage. Shows permission status. | ✓ |
| No, only system-level | Disable through device/browser settings. | |

**User's choice:** Yes, in Settings

---

## Chat Push Notifications (Scope Addition)

### Chat push behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Background-only | Push only when app NOT in foreground. In-app when open. | ✓ |
| Always push | Always send push regardless of app state. | |
| In-app only, no push | Keep existing behavior. | |

**User's choice:** Background-only

### Chat notification content

| Option | Description | Selected |
|--------|-------------|----------|
| Sender name + message preview | Title: "{Sender}" Body: "{message}" | ✓ |
| Sender name only | Title: "{Sender}" Body: "Nova mensagem". | |
| App name + count | Title: "CoupleSpace" Body: "{N} novas mensagens". | |

**User's choice:** Sender name + message preview

---

## The Agent's Discretion

- Animation details for reminder cards and DateTimePicker transitions
- Exact visual styling (colors, spacing, shadows) — follow cosmic-v2.html reference
- Error handling UX (toast messages, retry states) — follow existing patterns
- Swipe gesture visual feedback details (slide + fade + color change)
- Collapsed "Concluídos" count badge styling

## Deferred Ideas

- **Recurring reminders** (REMN-09): Daily/weekly/monthly repeats — deferred to v3
- **Location-based reminders** (REMN-10): Battery drain — out of scope
- **Snooze/reschedule on notification** (REMN-11): Additional UX complexity — deferred to v3

---

*Discussion completed: 2026-07-29*
