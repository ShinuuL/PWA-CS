# Phase 6: Profile Enhancement + Infrastructure Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-28
**Phase:** 6-Profile Enhancement + Infrastructure Fixes
**Areas discussed:** Avatar crop tool, Online status display, Avatar compression & caching, Database tables & RLS, Service worker cleanup, Display name sync, Partner profile view, Upload error handling

---

## Avatar Crop Tool

### Crop Implementation

| Option | Description | Selected |
|--------|-------------|----------|
| Library (react-image-crop) | Battle-tested, accessible, adds ~15KB dependency | ✓ |
| Custom canvas crop | No dependency, full control, more code to maintain | |
| You decide | Pick the approach that fits the codebase best | |

**User's choice:** You decide
**Notes:** Agent chose react-image-crop for reliability and accessibility

### Crop UI Interaction

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed circle overlay | User moves/resizes image behind static circular mask | |
| Pinch-to-zoom + pan | User pinch-zooms and drags to position, circle stays fixed | ✓ |
| You decide | Pick the approach that fits mobile-first best | |

**User's choice:** Pinch-to-zoom + pan
**Notes:** Feels native on mobile

### Crop Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| After photo selection | Pick photo → crop screen → confirm → upload | |
| Inline on profile page | Tap avatar → photo picker + crop in modal/sheet | ✓ |
| You decide | Pick what feels most natural | |

**User's choice:** Inline on profile page
**Notes:** Less disruptive, keeps user in context

### Crop Shape

| Option | Description | Selected |
|--------|-------------|----------|
| Strictly circular | Fixed circle, user just positions the image | ✓ |
| Adjustable circle | User can resize the circle before confirming | |
| You decide | Pick what fits the minimal design | |

**User's choice:** You decide
**Notes:** Agent chose strictly circular for simplicity and consistency

---

## Online Status Display

### Dot Location

| Option | Description | Selected |
|--------|-------------|----------|
| Chat header only | Shows when viewing partner's chat | ✓ |
| Header + drawer + profile | Visible everywhere partner's avatar appears | |
| You decide | Pick what fits the minimal design | |

**User's choice:** Chat header only
**Notes:** Minimal, focused

### Last Seen Format

| Option | Description | Selected |
|--------|-------------|----------|
| Relative time | "5 minutes ago", "2 hours ago" | ✓ |
| Absolute time | "14:32" or "2:32 PM" | |
| Relative + absolute | "5 minutes ago (14:32)" | |

**User's choice:** Relative time
**Notes:** Feels alive, but can be imprecise

### Dot Color

| Option | Description | Selected |
|--------|-------------|----------|
| Green/gray | Standard pattern (WhatsApp, Messenger) | ✓ |
| App accent/gray | Use purple accent (#B87CFF) for online | |
| You decide | Pick what fits the cosmic design | |

**User's choice:** Green/gray
**Notes:** Users already understand this pattern

### Offline Text Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always show text | "last seen 5m ago" whenever offline | |
| Text only if stale | Gray dot if <1h, "last seen X ago" if >1h | ✓ |
| You decide | Pick the right balance | |

**User's choice:** You decide
**Notes:** Agent chose text only if stale to reduce noise

---

## Avatar Compression & Caching

### Compression Location

| Option | Description | Selected |
|--------|-------------|----------|
| Client-side before upload | Compress in browser using canvas | ✓ |
| Server-side via Edge Function | Upload full image, compress in Supabase | |
| You decide | Pick what fits the Supabase-first architecture | |

**User's choice:** You decide
**Notes:** Agent chose client-side for faster uploads on mobile

### Compression Quality

| Option | Description | Selected |
|--------|-------------|----------|
| ~200KB, 80% JPEG | Good balance of quality and size | ✓ |
| ~100KB, 60% JPEG | Smaller files, more artifacts on large screens | |
| You decide | Pick the right balance for a PWA | |

**User's choice:** ~200KB, 80% JPEG
**Notes:** Meets the requirement target

### Cache Busting Method

| Option | Description | Selected |
|--------|-------------|----------|
| Query param (?v=timestamp) | Append ?v=1234567890 to avatar URL | ✓ |
| Storage path versioning | Upload to avatars/user_id_v2.jpg | |
| You decide | Pick what fits the existing pattern | |

**User's choice:** Query param (?v=timestamp)
**Notes:** Simple, works everywhere

### Avatar Display Spots

| Option | Description | Selected |
|--------|-------------|----------|
| Profile page + chat header + drawer | All three locations | ✓ |
| Profile page + chat only | Skip drawer to keep it minimal | |
| You decide | Pick what fits the minimal design | |

**User's choice:** Profile page + chat header + drawer
**Notes:** Consistent everywhere the user sees their avatar

---

## Database Tables & RLS

### Partner Visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, full visibility | Both partners can see everything in shared lists | ✓ |
| Owner + assigned only | Each partner sees own items + assigned items | |
| You decide | Pick what fits a couples app | |

**User's choice:** Yes, full visibility
**Notes:** Trust-based, simple

### Online Status Tracking

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Realtime Presence | Use Supabase's built-in presence (no table needed) | ✓ |
| Database table + polling | Store last_seen in table, update via heartbeat | |
| Both | Realtime Presence for live, table for history | |

**User's choice:** Supabase Realtime Presence
**Notes:** Real-time, ephemeral, no extra infrastructure

### Reminder Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal | id, pair_id, title, reminder_at, created_by, completed_at | |
| Extended | Add notes, priority, category | ✓ |
| You decide | Pick what fits v2 scope | |

**User's choice:** Extended
**Notes:** More features for future flexibility

### Todo Schema

| Option | Description | Selected |
|--------|-------------|----------|
| Two tables | todo_lists + todo_items (proper normalization) | |
| One table with list_id | Single todos table with list_id foreign key | ✓ |
| You decide | Pick what fits the existing patterns | |

**User's choice:** One table with list_id
**Notes:** Simpler queries

---

## Service Worker Cleanup

### Cleanup Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Remove manual SW only | Delete navigator.serviceWorker.register in main.jsx | |
| Remove SW + cleanup old files | Remove registration AND delete public/sw.js | ✓ |
| You decide | Pick the cleanest approach | |

**User's choice:** You decide
**Notes:** Agent chose full cleanup for a clean slate

---

## Display Name Sync

### Real-time Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, Realtime sync | Partner sees name change immediately via Supabase Realtime | ✓ |
| No, refresh on next load | Partner sees updated name on next page load | |
| You decide | Pick what fits the couples communication vibe | |

**User's choice:** Yes, Realtime sync
**Notes:** More responsive, fits couples communication

### Name Update Locations

| Option | Description | Selected |
|--------|-------------|----------|
| Chat header + messages | Both header and all past messages update | ✓ |
| Chat header only | Only header updates immediately | |
| You decide | Pick what's technically feasible | |

**User's choice:** Chat header + messages
**Notes:** Most responsive

### Name Validation

| Option | Description | Selected |
|--------|-------------|----------|
| 1-30 chars, no special rules | Simple length limit | ✓ |
| 1-30 chars, letters/numbers/spaces only | Prevents emoji or special characters | |
| You decide | Pick what fits the app's personality | |

**User's choice:** 1-30 chars, no special rules
**Notes:** Users can type anything

### Name Save Method

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-save on blur | User taps out of field and it saves automatically | ✓ |
| Explicit save button | User taps 'Save' to confirm | |
| You decide | Pick what feels most natural | |

**User's choice:** You decide
**Notes:** Agent chose auto-save for less friction

---

## Partner Profile View

### Profile Access

| Option | Description | Selected |
|--------|-------------|----------|
| Tap avatar in chat header | Tap partner's avatar in chat header to see profile | |
| Dedicated button in drawer | Add 'View Partner Profile' button in navigation drawer | |
| Both | Tap avatar in chat header AND button in drawer | ✓ |

**User's choice:** Both
**Notes:** Maximum discoverability

### Profile Information

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar + name + online status | Basic info only | ✓ |
| Avatar + name + status + last seen | Include last seen time | |
| You decide | Pick what fits the minimal design | |

**User's choice:** Avatar + name + online status
**Notes:** Clean, focused

### Profile Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Full page (like own profile) | Dedicated route, full screen | |
| Modal/sheet overlay | Slides up over current screen | ✓ |
| You decide | Pick what fits the mobile-first flow | |

**User's choice:** You decide
**Notes:** Agent chose modal/sheet for less disruption

### Profile Actions

| Option | Description | Selected |
|--------|-------------|----------|
| View only | Just display info, no actions | |
| View + message button | Add a 'Message' button to jump to chat | ✓ |
| You decide | Pick what adds value without complexity | |

**User's choice:** View + message button
**Notes:** Useful shortcut

---

## Upload Error Handling

### Error Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Toast with retry | Show error toast with 'Retry' button | ✓ |
| Toast only | Show error toast, user must manually re-initiate | |
| You decide | Pick what provides good UX without complexity | |

**User's choice:** You decide
**Notes:** Agent chose toast with retry for better UX

### File Size Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Reject if >5MB | Show error before compression | |
| Compress regardless | Always compress, no rejection | |
| Reject if >15MB | Reject unnecessarily large uploads | ✓ |

**User's choice:** Reject if >15MB
**Notes:** Prevents wasting CPU on huge files

### Upload Progress

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, spinner on avatar | Show loading spinner over avatar while uploading | ✓ |
| Yes, progress bar | Show upload progress percentage | |
| No indicator | Silent upload, user sees result when done | |

**User's choice:** Yes, spinner on avatar
**Notes:** Clear feedback

### Success Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Toast + immediate update | Show success toast, avatar updates immediately | ✓ |
| Just update, no toast | Avatar updates silently | |
| You decide | Pick what feels right | |

**User's choice:** Toast + immediate update
**Notes:** Clear confirmation

---

## Agent's Discretion

Areas where user said "you decide" — agent made the call:
- Library choice for crop tool → react-image-crop
- Crop UI interaction → pinch-to-zoom + pan
- Crop shape → strictly circular
- Online dot color → green/gray
- "last seen" visibility threshold → >1h
- Compression location → client-side
- Compression quality → 80% JPEG
- Cache busting method → query param
- Avatar display spots → all three
- Partner visibility → full
- Online status tracking → Realtime Presence
- Reminder fields → extended
- Todo schema → one table with list_id
- SW cleanup scope → remove + delete file
- Name validation → 1-30 chars, no rules
- Name save method → auto-save on blur
- Partner profile layout → modal/sheet
- Profile actions → view + message
- Error handling → toast with retry
- File size validation → reject >15MB
- Upload progress → spinner on avatar
- Success feedback → toast + immediate update

## Deferred Ideas

None — discussion stayed within phase scope
