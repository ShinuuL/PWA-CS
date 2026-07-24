# Phase 1: Foundation & Pairing - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-24
**Phase:** 1-Foundation & Pairing
**Areas discussed:** Pairing flow design, Frontend app shell, Profile management

---

## Pairing flow design

### How should the invite mechanism work?

| Option | Description | Selected |
|--------|-------------|----------|
| Invite code only | Short numeric code. Partner enters it. Simple, familiar. | ✓ |
| Invite link only | Shareable URL that auto-pairs on click. Easier but less secure. | |
| Both code + link | Generate a code AND a user chooses which to share. More flexible. | |

**User's choice:** Invite code only

---

### What happens if the code expires or a user wants to re-pair?

| Option | Description | Selected |
|--------|-------------|----------|
| Code never expires | Code works until used. User generates new code anytime. | |
| Code expires after 24h | Time-limited code. More secure but adds complexity. | |
| Code expires after first use | One-time code. Must generate new code each time. | ✓ |

**User's choice:** Code expires after first use

---

### What happens when a user who is already paired enters a new code?

| Option | Description | Selected |
|--------|-------------|----------|
| Block — already paired | Show error. Must unpair first. Prevents accidental switching. | ✓ |
| Replace pairing | Auto-unpair and pair with new code. Risk of data loss. | |
| You decide | Let the agent decide based on best UX practices. | |

**User's choice:** Block — already paired

---

### Should there be an explicit unpair option?

| Option | Description | Selected |
|--------|-------------|----------|
| Block is enough for now | No unpair UI in v1. Keep it simple. | |
| Add unpair button | Settings page has unpair option. Clearer UX. | ✓ |

**User's choice:** Add unpair button

---

## Frontend app shell

### What should the navigation structure look like?

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom tab bar | Standard mobile pattern. Like WhatsApp/Instagram. | |
| Side drawer | More screen space but less discoverable. | ✓ |
| You decide | Let the agent decide based on mobile-first best practices. | |

**User's choice:** Side drawer

---

### Where should the user land after login?

| Option | Description | Selected |
|--------|-------------|----------|
| Homepage dashboard | Daily memory, mood, photos. Primary daily view. | ✓ |
| Chat view | Core value, most-used feature. | |
| You decide | Let the agent decide based on engagement. | |

**User's choice:** Homepage dashboard

---

### What should unpaired users see when they first log in?

| Option | Description | Selected |
|--------|-------------|----------|
| Guided onboarding | Onboarding flow: name, photo, then pairing screen. | |
| Pairing screen first | Skip onboarding, show pairing screen immediately. | ✓ |
| You decide | Let the agent decide based on smoothest first-time experience. | |

**User's choice:** Pairing screen first

---

### What should the header/title area show?

| Option | Description | Selected |
|--------|-------------|----------|
| Partner info | Partner's name + avatar. Personal, romantic feel. | ✓ |
| App name | App name 'CoupleSpace'. Branding-focused. | |
| Dynamic header | Context-dependent: partner info in chat, section name elsewhere. | |

**User's choice:** Partner info

---

### What items should appear in the side drawer?

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal (4 items) | Partner info, Chat, Homepage, Agenda, Settings. | ✓ |
| Complete list (7 items) | Partner info, Chat, Homepage, Agenda, Photos, Notes, Settings. | |
| You decide | Let the agent decide based on mobile UX best practices. | |

**User's choice:** Minimal (4 items)

---

### Should the drawer be accessible before pairing?

| Option | Description | Selected |
|--------|-------------|----------|
| Drawer with locked items | Drawer available but most items greyed out until paired. | ✓ |
| No drawer pre-pairing | No drawer before pairing. Just pairing screen and settings. | |
| You decide | Let the agent decide based on flow. | |

**User's choice:** Drawer with locked items

---

## Profile management

### How should profile editing work?

| Option | Description | Selected |
|--------|-------------|----------|
| Separate edit page | Dedicated profile page in settings. Tap partner name to view. | ✓ |
| Inline editing | Tap to edit, auto-save on blur. | |
| You decide | Let the agent decide based on mobile UX patterns. | |

**User's choice:** Separate edit page

---

### How should avatar/photo upload work?

| Option | Description | Selected |
|--------|-------------|----------|
| Camera/gallery picker | Tap avatar → camera/gallery → crop → upload. | ✓ |
| Gallery only | Simpler but less personal. | |
| You decide | Let the agent decide based on simplest for a PWA. | |

**User's choice:** Camera/gallery picker

---

### What profile fields are required vs optional?

| Option | Description | Selected |
|--------|-------------|----------|
| Name required, photo optional | Display name required at first login. Photo optional. | ✓ |
| Both required | Forces complete profile but may annoy users. | |
| You decide | Let the agent decide based on engagement without friction. | |

**User's choice:** Name required, photo optional

---

## Agent's Discretion

- Database schema design (table structure, RLS policies, constraints)
- Supabase client SDK configuration
- PWA manifest and service worker setup
- CSS framework/styling approach
- State management pattern

## Deferred Ideas

None — discussion stayed within phase scope.
