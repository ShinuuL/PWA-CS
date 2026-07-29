---
phase: 07-shared-reminders-push-notifications
plan: "05"
subsystem: api
tags: [edge-functions, deno, pg_cron, webpush, supabase, push-notifications]

# Dependency graph
requires:
  - phase: 07-shared-reminders-push-notifications/01
    provides: push_subscriptions table, status column on shared_reminders
  - phase: 07-shared-reminders-push-notifications/04
    provides: client-side push subscription utilities (pushSubscription.js)
provides:
  - send-push-notification Edge Function for reminder push delivery
  - send-chat-push Edge Function for chat push delivery
  - pg_cron scheduler for automatic reminder dispatch every minute
  - chatStore foreground/background detection for push vs in-app notifications
affects: [07-shared-reminders-push-notifications/04, deployment]

# Tech tracking
tech-stack:
  added: [@negrel/webpush, pg_cron, pg_net, Deno Edge Functions]
  patterns: [server-push-delivery, subscription-cleanup-on-410, foreground-detection]

key-files:
  created:
    - FRONTEND/supabase/functions/send-push-notification/index.ts
    - FRONTEND/supabase/functions/send-chat-push/index.ts
    - FRONTEND/supabase/migrations/20260729_pg_cron_send_reminders.sql
  modified:
    - FRONTEND/src/stores/chatStore.js

key-decisions:
  - "Used @negrel/webpush for Deno-compatible web push delivery"
  - "pg_cron uses EXISTS (not NOT EXISTS) to match reminders with active subscriptions"
  - "Failed reminders marked pending_send for client-side fallback (D-07)"
  - "Chat push fires only when document.visibilityState !== 'visible' (D-25)"

patterns-established:
  - "Edge Function pattern: CORS headers, service role client, 410 subscription cleanup"
  - "Foreground detection: document.visibilityState for push vs in-app decision"

requirements-completed: [REMN-02, REMN-07]

coverage:
  - id: D1
    description: "Reminder push notification Edge Function with creator name, status tracking, and 410 cleanup"
    requirement: REMN-02
    verification:
      - kind: manual_procedural
        ref: "Deploy Edge Function, create reminder 1 min out, verify push on both devices"
        status: unknown
    human_judgment: true
    rationale: "Requires deployed Supabase project and physical devices to verify push delivery"
  - id: D2
    description: "Chat push notification Edge Function with sender name and truncated message"
    requirement: REMN-02
    verification:
      - kind: manual_procedural
        ref: "Deploy Edge Function, send message while partner app backgrounded, verify push"
        status: unknown
    human_judgment: true
    rationale: "Requires deployed Edge Function and backgrounded app state to verify"
  - id: D3
    description: "pg_cron scheduler running every minute to dispatch due reminders"
    requirement: REMN-07
    verification:
      - kind: manual_procedural
        ref: "Apply migration, create reminder, wait 1 minute, check Edge Function logs"
        status: unknown
    human_judgment: true
    rationale: "Requires Supabase project with pg_cron extension enabled and Vault secrets configured"
  - id: D4
    description: "ChatStore foreground/background detection preventing double notifications"
    requirement: REMN-02
    verification:
      - kind: unit
        ref: "npm run lint from FRONTEND/"
        status: pass
    human_judgment: false

# Metrics
duration: 4min
completed: 2026-07-29
status: complete
---

# Phase 7 Plan 05: Server-side Push Notification Infrastructure Summary

**Edge Functions for reminder and chat push delivery with pg_cron scheduler and 410 subscription cleanup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-29T16:59:50Z
- **Completed:** 2026-07-29T17:03:55Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- send-push-notification Edge Function: sends reminder push with "{Creator} te lembra:" format, handles 410 cleanup, marks status sent/pending_send
- send-chat-push Edge Function: sends chat push with sender name + truncated message, handles 410 cleanup
- pg_cron migration: runs every minute, queries due reminders with EXISTS for active subscriptions, calls Edge Function via net.http_post
- chatStore background detection: uses document.visibilityState to decide push (background) vs in-app toast (foreground)

## Task Commits

Each task was committed atomically:

1. **Task 1: Edge Functions + pg_cron Migration** - `fb566ac` (feat)
2. **Task 2: ChatStore Background Push Integration** - `c390939` (feat)

## Files Created/Modified
- `FRONTEND/supabase/functions/send-push-notification/index.ts` - Deno Edge Function for reminder push delivery with webpush, 410 cleanup, status tracking
- `FRONTEND/supabase/functions/send-chat-push/index.ts` - Deno Edge Function for chat push delivery with sender name, message truncation, 410 cleanup
- `FRONTEND/supabase/migrations/20260729_pg_cron_send_reminders.sql` - pg_cron + pg_net extensions and cron job for due reminder dispatch
- `FRONTEND/src/stores/chatStore.js` - Added foreground/background detection and Edge Function call for background chat push

## Decisions Made
- Used @negrel/webpush library (Deno-compatible) for web push delivery
- pg_cron query uses EXISTS (not NOT EXISTS) to match reminders with at least one active push subscription
- Failed Edge Function calls mark reminders as pending_send for client-side fallback per D-07
- Chat push uses document.visibilityState to detect foreground/background per D-25
- Edge Functions use service role key to bypass RLS for subscription lookups

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed await in non-async callback**
- **Found during:** Task 2 (ChatStore Background Push Integration)
- **Issue:** Used `await supabase.functions.invoke()` inside a non-async Realtime subscription callback
- **Fix:** Replaced with `.then().catch()` fire-and-forget pattern
- **Files modified:** FRONTEND/src/stores/chatStore.js
- **Verification:** npm run lint passes (no errors)
- **Committed in:** c390939 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor syntax fix to use .then() instead of await. No scope creep.

## Issues Encountered
None

## User Setup Required

External services require manual configuration:
1. **Supabase Vault secrets** — Store VAPID keys and project credentials:
   - `project_url` — Supabase project URL
   - `publishable_key` — Supabase anon/publishable key
   - `VAPID_PRIVATE_KEY` — Web push VAPID private key
   - `VAPID_PUBLIC_KEY` — Web push VAPID public key
2. **Enable extensions** — Run `CREATE EXTENSION IF NOT EXISTS pg_cron; CREATE EXTENSION IF NOT EXISTS pg_net;` in Supabase SQL Editor
3. **Deploy Edge Functions:**
   ```bash
   cd FRONTEND
   supabase functions deploy send-push-notification
   supabase functions deploy send-chat-push
   ```
4. **Apply pg_cron migration** — Run the migration SQL via Supabase dashboard or CLI

## Next Phase Readiness
- Server-side push infrastructure complete
- Client-side service worker and push receiving is in Plan 04
- Ready for integration testing once deployed

## Self-Check: PASSED

- send-push-notification/index.ts: FOUND
- send-chat-push/index.ts: FOUND
- pg_cron migration: FOUND
- SUMMARY.md: FOUND
- Commit fb566ac (Task 1): FOUND
- Commit c390939 (Task 2): FOUND

---
*Phase: 07-shared-reminders-push-notifications*
*Completed: 2026-07-29*
