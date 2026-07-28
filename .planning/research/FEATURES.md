# Features Research — v2.0 Profile & Shared Utilities

Researched 2026-07-27. Competitive analysis of couple/family apps: Between, Couple, Paired, Lovewick, FeelClose, Cupla, Love Nudge, Connected, OurHome, Honeydue, GoodBooks Life, DuoDo, Flamme, and general task/reminder apps (Todoist, TickTick, Any.do, Microsoft To Do).

---

## Profile & Avatar

### Table Stakes (must-have for v2.0)

- **Display name** — editable text field, shown everywhere (chat, dashboard, album). Couples apps use first names or nicknames, never full names. Allow special characters and emoji in names.
- **Avatar photo** — upload from gallery or camera. Circular crop tool (square crop is acceptable but circular is industry standard for avatars). Show instant preview before save. Supabase Storage for the image.
- **Default avatar** — when no photo is uploaded, show initials or a gender-neutral silhouette. Never leave a blank broken-image state. Apps like Between and Couple use colored circles with initials.
- **Avatar in chat** — small avatar next to messages is expected UX. Shows who sent what without reading the sender name every time.
- **Online/last seen status** — green dot for online, "Last seen 5m ago" for recently active. This is table stakes for any real-time messaging app. WhatsApp, iMessage, and every couple chat app has this.

### Differentiators (nice-to-have, defer beyond v2.0)

- **Profile completeness indicator** — "Complete your profile" nudge with a progress bar. Drives engagement during onboarding but not essential for v2.0 since users already have profiles from Google OAuth.
- **Custom status/mood text** — "At the gym", "Sleeping", "Busy". Between and Couple both have this. Could layer on top of the existing mood tracker.
- **Profile themes/backgrounds** — couple-specific: matching profile themes, shared cover photos. This is a differentiator for couple apps vs generic messaging.
- **Relationship milestones on profile** — "Together since March 2024", days counter. Every couples app has this. Low effort, high emotional value. Consider as a fast-follow.
- **Avatar animations** — animated stickers, GIF avatars. Not worth the complexity.

### Anti-Features (things to avoid)

- **Profile browsing/discovery** — this is a couples-only app. No public profiles, no discovery feed, no "other couples" feature. Keeps the space private.
- **Bio/about section with rich text** — overkill for a two-person app. Display name + avatar is sufficient.
- **Profile verification badges** — unnecessary in a private couple space.
- **Multiple profile photos/gallery** — the shared photo album already handles this. Profile photo is single and purposeful.
- **Social media link display** — no need to link Instagram/Twitter in a private couple space.

---

## Shared Reminders

### Table Stakes (must-have for v2.0)

- **One-time reminder creation** — title, date/time, optional note. Both partners see it. Simple form: "What" + "When".
- **Push notification delivery** — when the reminder fires, both partners get a push notification. This is the core value proposition. Without push, reminders are just a list.
- **Reminder list view** — chronological list of upcoming reminders, separated into "Upcoming" and "Past". Both partners see the same list.
- **Creator attribution** — show who created each reminder ("Reminder by Alex"). Prevents confusion about who set what.
- **Completion/dismiss** — mark as done, or dismiss the notification. Completed reminders move to a "Done" section.
- **Both partners notified** — unlike a personal reminder app, shared reminders notify BOTH people. This is what makes it a couple feature vs a general reminder app.

### Differentiators (nice-to-have, defer beyond v2.0)

- **Recurring reminders** — weekly bill payment, monthly anniversary check-in. LoveSync and Couple Reminder both offer this. High value but adds recurrence rule complexity (cron-like scheduling, timezone handling).
- **Location-based reminders** — "Remind me when we're near the grocery store". Couple Reminder and Any.do have this. Requires geolocation API access, significant complexity.
- **Natural language input** — "Remind me to call the vet next Tuesday at 3pm" auto-parses to date/time. Todoist and TickTick do this well. Requires NLP or regex parsing.
- **Snooze/reschedule** — "Remind me in 1 hour" from the notification. Every major reminder app has this. Consider as a fast-follow.
- **Category/tag system** — "Chores", "Dates", "Bills". Helpful when reminders grow but overkill for a couple's short list.
- **Calendar integration** — sync reminders to Google Calendar / Apple Calendar. Between does this. Good for power users but not essential.
- **Smart reminder suggestions** — AI-suggested reminders based on patterns ("You usually pay rent on the 1st"). DuoDo and Connected do this. Way too complex for v2.0.

### Anti-Features (things to avoid)

- **Recurring reminders in v2.0** — cron-like recurrence rules, timezone edge cases, DST handling, "every 3rd Friday" parsing. This is deceptively complex (see Complexity Notes). Ship one-time first.
- **Location-based reminders** — requires always-on geolocation, battery drain, iOS/Android permission complexity. Not worth it for v2.0.
- **Reminder permissions/assignment** — "You do this, I'll do that" turns reminders into a task management system. That's what to-do lists are for. Keep reminders simple and symmetric.
- **Shared reminder history/audit log** — no one needs to know who completed what and when. Just show done/undone.
- **Payment/bill splitting attached to reminders** — this is a finance app feature, not a reminder feature.

---

## Shared To-Do Lists

### Table Stakes (must-have for v2.0)

- **Shared checklist** — a single list both partners can add items to. Checkboxes to mark complete. This is the MVP. Think: shared grocery list, shared errand list.
- **Add/edit/delete items** — both partners can create, modify, and remove items. Real-time sync via Supabase Realtime.
- **Due dates** — optional date per item. Items with due dates should be visually sorted or highlighted. Cupla and Any.do both have this as core.
- **Assignee** — assign an item to "Me" or "Partner". This is the key differentiator from a generic to-do app. Shows accountability. OurHome and GoodBooks Life both emphasize this.
- **Completion state** — checkbox that both partners see in real-time. Completed items can be hidden or struck through.
- **Multiple lists** — "Groceries", "Home", "Date Night". Without this, everything becomes one overwhelming list. Todoist and Any.do both support multiple lists.

### Differentiators (nice-to-have, defer beyond v2.0)

- **Progress tracking** — "5 of 12 items done" progress bar or percentage. GoodBooks Life and OurHome gamify this with points/rewards.
- **Gamification/rewards system** — points for completing tasks, redeemable for "date night picks" or similar. OurHome does this with a points system. Fun but not essential.
- **Task notes/descriptions** — add context to a task ("Get the organic milk, not regular"). Any.do and Todoist support this. Low effort, consider including.
- **Subtasks** — break a task into smaller steps. Microsoft To Do and Todoist have this. Useful but adds UI complexity.
- **Photo proof** — attach a photo when marking a task done. DuoDo has this. Novel but not essential.
- **Priority levels** — High/Medium/Low. Todoist has this. Overkill for a couple's task list.
- **Kanban/board view** — columns like "To Do", "In Progress", "Done". Trello-style. Way too much for a couples app.
- **Grocery list mode** — auto-categorize items by aisle/store section. AnyList does this well. Could be a nice-to-have but adds categorization logic.
- **AI task suggestions** — "Based on your habits, you might need to..." DuoDo has this. Not for v2.0.

### Anti-Features (things to avoid)

- **Kanban boards/project management views** — this is a couples app, not Asana. Keep it simple: lists with checkboxes.
- **Complex priority systems** — no one is prioritizing chores like a sprint backlog. Assignee + due date is sufficient.
- **Time tracking on tasks** — this is a productivity app feature. Not relevant for couples.
- **Comments/discussion threads on tasks** — if you need to discuss a task, use the chat. Don't build a second messaging system inside to-do lists.
- **File attachments on tasks** — the shared photo album and chat already handle file sharing. Don't duplicate.
- **Task templates** — "Date Night Template", "Grocery Template". Sounds useful but couples rarely repeat the exact same task list. YAGNI.
- **Integration with external task managers** — Todoist sync, Trello sync. Couples don't need this. They need a simple shared list within their private space.

---

## Complexity Notes

### Deceptively Complex Features

1. **Push notifications** — Supabase doesn't have built-in push. You need Web Push API (VAPID keys), service worker registration, notification permissions on iOS (which is notoriously finicky for PWAs), and a server-side trigger. iOS Safari PWA push notification support is still limited in 2026. **This is the hardest feature in v2.0.** Budget accordingly.

2. **Online/last seen status** — requires a presence system. Options: Supabase Realtime presence (built-in), or a heartbeat-based system with a `last_seen` timestamp column. The "grace window" problem: a user goes offline but their status should show "online" for 30-60 seconds to avoid flickering. Simple to start, nuanced to get right.

3. **Avatar upload with crop** — image upload to Supabase Storage, client-side crop (canvas-based), EXIF rotation handling, HEIC conversion on iOS, responsive image serving (thumbnail vs full). The crop tool itself is the main complexity. Consider using `react-avatar-editor` or a similar library.

4. **Recurring reminders** — timezone edge cases, DST transitions, "every 3rd Friday" parsing, handling midnight crossings. This is a mini-calendar engine. Defer to v2.1.

5. **Assignee on to-do items** — the UX for "assign to me" vs "assign to partner" needs clear visual treatment. The RLS model is straightforward (both partners in a pair can see/update all items), but the UI needs to show ownership clearly.

### Dependencies Between Features

- **Push notifications** must ship before or with reminders — a reminder without a notification is just a note.
- **Online status** depends on Supabase Realtime presence or a heartbeat mechanism — this is independent of other features.
- **Avatar upload** is fully independent — can be built in parallel with reminders and to-dos.
- **To-do list assignee** depends on the partner's profile/display name being available — avatar + display name should ship first or simultaneously.
- **Reminders and to-do lists** are independent of each other — can be built in parallel.

---

## Recommended Scope

### Include in v2.0

| Feature | Priority | Complexity | Notes |
|---------|----------|------------|-------|
| Avatar upload with crop | P0 | Medium | Use `react-avatar-editor` or canvas-based crop. Store in Supabase Storage. |
| Display name editing | P0 | Low | Simple text field, update in `profiles` table. |
| Online/last seen status | P0 | Medium | Use Supabase Realtime presence. 60s grace window. |
| Default avatar (initials) | P0 | Low | Colored circle with first letter of name. |
| One-time shared reminders | P0 | Medium | Simple form: title + datetime. Both partners notified. |
| Push notifications (web) | P0 | **High** | VAPID + service worker. iOS PWA support is the risk. Test early. |
| Shared to-do lists | P0 | Medium | Multiple lists, checkboxes, real-time sync. |
| To-do due dates | P0 | Low | Optional date per item. |
| To-do assignee | P0 | Low | "Me" / "Partner" toggle per item. |

### Defer to v2.1+

| Feature | Why Defer |
|---------|-----------|
| Recurring reminders | Timezone/DST complexity, cron parsing. Ship one-time first, validate demand. |
| Location-based reminders | Geolocation API, battery drain, permission complexity. |
| Snooze/reschedule on notifications | Depends on push infrastructure being solid first. |
| Gamification/rewards for to-dos | Novelty feature, validate demand before building. |
| Subtasks on to-dos | Adds UI complexity, most couples don't need it. |
| Calendar integration | External API dependencies, not core value. |
| Relationship milestones on profile | Low effort but not blocking v2.0 launch. |
| Custom status/mood text | Layer on existing mood tracker later. |

### Key Risk: Push Notifications on iOS PWA

This is the single biggest technical risk in v2.0. As of 2026, iOS supports web push for PWAs added to home screen, but:
- Permission prompt must be triggered by a user gesture
- Notification behavior differs from native apps
- Background sync is limited

**Recommendation:** Spike the push notification infrastructure first (week 1 of v2.0). If iOS PWA push is unreliable, fall back to in-app notification badges + a "check reminders" nudge on app open. Don't let push notification blockers delay the rest of v2.0.
