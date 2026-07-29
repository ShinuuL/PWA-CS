# Phase 7: Shared Reminders + Push Notifications - Context

**Gathered:** 2026-07-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Let couples set one-time reminders with reliable push notification delivery at the scheduled time. Also adds push notifications for chat messages (background-only when app is not in foreground). The `shared_reminders` table and stable service worker are already in place from Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Feature Location & Navigation
- **D-01:** Reminders live as a "Lembretes" tab on AgendaPage, alongside existing "Eventos" and "Notas" tabs. Reuses SegmentedTabs component.
- **D-02:** Tab order: Eventos / Lembretes / Notas — time-sensitive items first.
- **D-03:** Empty state: illustration + "Nenhum lembrete" text + "Criar lembrete" CTA button (consistent with EventsTab pattern).
- **D-04:** No direct Drawer link — accessed through Agenda route only. Keeps nav clean.

### Push Notification Delivery
- **D-05:** New `push_subscriptions` table (user_id, pair_id, endpoint, p256dh, auth) for storing Web Push subscriptions.
- **D-06:** pg_cron runs every minute to check for due reminders (reminder_at <= NOW() AND completed_at IS NULL).
- **D-07:** Retry strategy: one retry after 30s if Edge Function fails. Failed reminders marked as 'pending_send'.
- **D-08:** Client fallback: on app open, client checks for pending_send reminders and shows in-app notification.
- **D-09:** Push notification permission requested on first reminder creation (contextual opt-in).

### Reminder Creation & List UX
- **D-10:** Creation form includes: title (required), date/time picker (required), notes (optional), priority (low/normal/high), category. Modal overlay pattern matching EventsTab.
- **D-11:** Reminder cards displayed chronologically, grouped by date. Each card shows: title, date/time, creator avatar + name, priority colored dot.
- **D-12:** Past/completed reminders shown in a collapsible "Concluídos" section at bottom of list.
- **D-13:** Swipe left to dismiss/complete a reminder (mobile-native gesture, consistent with chat delete pattern).
- **D-14:** Users can edit title, date/time, and notes after creation. Creator attribution stays fixed. Edits sync to partner in real-time.

### DateTimePicker Component
- **D-15:** Custom-built DateTimePicker component — not native inputs.
- **D-16:** Calendar: month grid view, reuses CalendarGrid component from AgendaPage. Tappable days, month navigation.
- **D-17:** Time: scroll wheel / slot picker (two columns for hours and minutes). Touch-friendly, mobile-native feel.
- **D-18:** DateTimePicker is a reusable component — Phase 8 (Shared To-Do Lists) will use it for due dates.

### Notification Content & Behavior
- **D-19:** Reminder push notification: title = "{Creator name} te lembra:", body = "{reminder title}".
- **D-20:** Tapping reminder notification deep-links to Lembretes tab on AgendaPage.
- **D-21:** Notifications appear separately (no grouping). Each reminder gets its own notification.
- **D-22:** Default system notification sound (no custom audio).

### Real-Time Sync
- **D-23:** Supabase Realtime subscription on shared_reminders table. Partner sees reminders appear/update/dismiss instantly. Same pattern as agendaStore.

### Settings
- **D-24:** Push notification toggle added to SettingsPage. Shows current permission status. Allows users to disable push without uninstalling.

### Chat Push Notifications (Scope Addition)
- **D-25:** Chat push notifications added to Phase 7 scope. Fires only when app is NOT in foreground (background-only). When app is open, existing in-app notification (showNotification) is used. Prevents double-notifications.
- **D-26:** Chat push notification: title = "{Sender name}", body = "{message text}" (truncated ~50 chars).

### The Agent's Discretion
- Animation details for reminder cards and DateTimePicker transitions.
- Exact visual styling (colors, spacing, shadows) — follow cosmic-v2.html reference and existing card patterns.
- Error handling UX (toast messages, retry states) — follow existing patterns.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Database Schema
- `FRONTEND/supabase/migrations/20260728_create_shared_reminders_table.sql` — Existing shared_reminders table with RLS policies. REMN-07 and REMN-08 depend on this.
- `FRONTEND/supabase/migrations/` — All existing migrations for table patterns and RLS conventions.

### Design Reference
- `docs/cosmic-v2.html` — Design reference for romantic, minimal, modern aesthetic. Must validate new UI against this.

### Requirements
- `.planning/REQUIREMENTS.md` — REMN-01 through REMN-08, INFRA-03. Full requirement definitions and acceptance criteria.

### Existing Code Patterns
- `FRONTEND/src/features/agenda/AgendaPage.jsx` — AgendaPage with SegmentedTabs pattern. Reminders tab integrates here.
- `FRONTEND/src/features/agenda/SegmentedTabs.jsx` — Reusable tab component for the 3-tab layout.
- `FRONTEND/src/features/agenda/EventsTab.jsx` — EventsTab pattern: FAB → modal → form, grouped list, empty state. RemindersTab follows this pattern.
- `FRONTEND/src/features/agenda/CalendarGrid.jsx` — Existing calendar grid component to reuse in DateTimePicker.
- `FRONTEND/src/stores/agendaStore.js` — Zustand store pattern with Supabase Realtime subscription. reminderStore follows this pattern.
- `FRONTEND/src/stores/chatStore.js` — showNotification pattern (lines 587-601), notificationPermission state, requestNotificationPermission. Chat push builds on this.
- `FRONTEND/vite.config.js` — VitePWA config with workbox settings. Push notification setup may need manifest/service worker config changes.
- `FRONTEND/src/shared/lib/supabase.js` — Supabase client initialization.

### Roadmap
- `.planning/ROADMAP.md` — Phase 7 goal, requirements, success criteria, dependency on Phase 6.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **SegmentedTabs**: Already built, supports any number of tabs. Adding "Lembretes" is a one-line config change.
- **CalendarGrid**: Full month grid with day selection. Can be embedded in DateTimePicker for date selection.
- **agendaStore pattern**: Zustand store with Supabase Realtime subscription, optimistic updates, cleanup. reminderStore should mirror this exactly.
- **chatStore.showNotification**: Existing in-app notification function. Chat push builds on this pattern.
- **EventForm pattern**: Modal overlay form with submit/cancel buttons. ReminderForm follows this structure.

### Established Patterns
- **Zustand stores**: All state management via Zustand. Stores call Supabase directly, no API layer.
- **Supabase Realtime**: Postgres changes subscription with filter on pair_id. INSERT/UPDATE/DELETE handling with optimistic updates.
- **Co-located CSS**: Each component has its own .css file imported in the component.
- **Feature directories**: Features organized in `src/features/{name}/` with components, CSS, and hooks.
- **PairID system**: All tables use pair_id with RLS policies for couple-scoped access.
- **Optimistic updates**: Insert immediately, replace with server data on success, rollback on error.

### Integration Points
- **AgendaPage tabs**: Add RemindersTab as third tab. AgendaPage initializes both agendaStore and the new reminderStore.
- **Drawer nav**: No changes needed — Agenda route already exists.
- **AppShell**: Reminders tab renders inside AppShell > PairingGate wrapper.
- **SettingsPage**: Add push notification toggle section.
- **Service worker**: vite-plugin-pwa handles SW registration. Push event handler needs to be added to the service worker or via workbox config.

</code_context>

<specifics>
## Specific Ideas

- Reminder cards should feel personal — showing the partner's avatar and name makes it feel like a shared space, not a generic reminder app.
- The DateTimePicker should feel polished — it's a key component reused by Phase 8. Invest in smooth scroll animations for the time picker.
- Swipe to dismiss should have a satisfying visual feedback (slide + fade + color change).
- The collapsible "Concluídos" section should show a count badge when collapsed.

</specifics>

<deferred>
## Deferred Ideas

- **Recurring reminders** (REMN-09): Daily/weekly/monthly repeats. Deferred to v3 — timezone/DST complexity, validate one-time first.
- **Location-based reminders** (REMN-10): Battery drain, always-on geolocation. Out of scope.
- **Snooze/reschedule on notification** (REMN-11): Additional UX complexity. Deferred to v3.
- **Push notifications for chat** — included in Phase 7 scope (D-25, D-26) but noted as scope addition.

</deferred>

---

*Phase: 7-Shared Reminders + Push Notifications*
*Context gathered: 2026-07-29*
