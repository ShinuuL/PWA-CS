# Phase 4: Homepage Dashboard - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-26
**Phase:** 4-Homepage Dashboard
**Areas discussed:** Memory Photo Hero, Mood Selector Design, Partner Mood Display, Dashboard Layout

---

## Memory Photo Hero

### Display Style

| Option | Description | Selected |
|--------|-------------|----------|
| Full-width hero image | Photo fills top section with gradient overlay. Text/mood below. Very visual, romantic feel. | ✓ |
| Card with rounded corners | Photo inside a rounded card with shadow, caption below. Consistent with other cards. | |
| Overlay layout | Large photo with mood and partner info overlaid directly on the image. | |

**User's choice:** Full-width hero image
**Notes:** User requested HTML mockup comparing first two options before deciding.

### Change Frequency

| Option | Description | Selected |
|--------|-------------|----------|
| Once per page load | Pick one random photo when page loads. Stays same all day. | ✓ |
| Every visit | Each time you visit, a new random photo appears. | |
| Daily rotation | Changes once per day at midnight. Consistent for both partners. | |

**User's choice:** Once per page load

### Information Display

| Option | Description | Selected |
|--------|-------------|----------|
| Show date | Show the date the photo was taken below the caption. | ✓ |
| Caption only | Just the caption, no date. Cleaner look. | |
| Relative time | Show romantic relative time like '3 months ago'. | |

**User's choice:** Show date

### Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Upload prompt | Show an upload prompt with camera icon, like MiniAlbum empty state. | ✓ |
| Hide section | Hide the hero section entirely when no photos exist. | |
| Placeholder image | Show a placeholder image with text 'Add your first photo together'. | |

**User's choice:** Upload prompt

---

## Mood Selector Design

### Emotions Available

| Option | Description | Selected |
|--------|-------------|----------|
| 5 emotions | Happy, Tired, Sad, Missing, Needy — from REQUIREMENTS.md | |
| 8 emotions | Happy, Tired, Sad, Missing, Needy, Excited, Grateful, Loved | |
| 5 + custom text | Happy, Tired, Sad, Missing, Needy + custom text input | ✓ |

**User's choice:** 5 + custom text

### Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Emoji row | Large emoji/icon in a horizontal row. Tap to select. Simple and visual. | |
| Emoji grid | 2x3 grid of emoji cards with labels. More structured, takes more space. | ✓ |
| Text buttons | Text buttons with subtle icons. Cleaner, more minimal. | |

**User's choice:** Emoji grid
**Notes:** User requested HTML mockup comparing all three options before deciding.

### Custom Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| Inline text input | Tap custom button, text input appears inline. Quick and contained. | |
| Modal popup | A small modal/popup appears for custom text. More space for typing. | ✓ |
| Full page | Tap custom, navigate to a full page to type. Most space but breaks flow. | |

**User's choice:** Modal popup

### Selection Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Instant save | Tapping a new mood immediately saves it. No confirm button needed. | ✓ |
| Tap + confirm | Tap mood, then tap a checkmark to confirm. More deliberate. | |

**User's choice:** Instant save

### Visual Indication

| Option | Description | Selected |
|--------|-------------|----------|
| Border + glow | Selected mood gets a purple border and glow. Subtle but clear. | ✓ |
| Scale animation | Selected mood scales up slightly with a bounce animation. | |
| Color tint | Background color changes to a tinted version of the mood. | |

**User's choice:** Border + glow

---

## Partner Mood Display

### Position

| Option | Description | Selected |
|--------|-------------|----------|
| Above your mood | Partner's mood appears directly above your own mood selector. Clear comparison. | ✓ |
| Near avatar | Partner's mood shows as a small badge near their profile photo/avatar. | |
| Separate section | Partner's mood appears in a separate section with their name and emoji. | |

**User's choice:** Above your mood

### Information Shown

| Option | Description | Selected |
|--------|-------------|----------|
| Full mood info | Show partner's name, emoji, and custom text if they wrote one. | ✓ |
| Emoji + name only | Just the emoji and name. Minimal and clean. | |
| Emoji only | Just the emoji. Very minimal but may be unclear. | |

**User's choice:** Full mood info

### Update Method

| Option | Description | Selected |
|--------|-------------|----------|
| Realtime update | Changes appear instantly via Supabase Realtime subscription. | ✓ |
| Poll every 30s | Check for updates every 30 seconds. Less real-time but simpler. | |
| Page refresh only | Refresh only when the page is reloaded. Simplest but not live. | |

**User's choice:** Realtime update

### Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle prompt | Show a subtle prompt like 'Ask how they're feeling' with gentle animation. | ✓ |
| Default state | Show a default emoji (like 😊) with 'No mood set yet'. | |
| Hide section | Hide the partner mood section entirely until they set one. | |

**User's choice:** Gentle prompt

---

## Dashboard Layout

### Section Arrangement

| Option | Description | Selected |
|--------|-------------|----------|
| Vertical stack | Photo hero → Partner mood → Your mood → MiniAlbum. Simple vertical stack. | ✓ |
| Two-column below hero | Photo hero at top, mood section and mini-album side by side below. | |
| Sticky mood bar | Photo hero, then mood in a sticky bar, mini-album scrolls below. | |

**User's choice:** Vertical stack

### Section Separation

| Option | Description | Selected |
|--------|-------------|----------|
| Card sections | Each section has a subtle card background with rounded corners. | ✓ |
| No cards, just spacing | No card backgrounds, just spacing between sections. Very minimal. | |
| Dividers between sections | Sections separated by subtle dividers. Clean but structured. | |

**User's choice:** Card sections

### Both Partners' Moods

| Option | Description | Selected |
|--------|-------------|----------|
| Name + avatar | Show partner's name and avatar above their mood. Personal and clear. | ✓ |
| Generic label | Just 'Your partner' or 'They feel'. Less personal but simpler. | |
| Both names side by side | Show both names side by side with emojis. Symmetric design. | |

**User's choice:** Name + avatar

### First-Time User Experience

| Option | Description | Selected |
|--------|-------------|----------|
| Welcome + empty states | Show a welcome message with their name, then empty states for each section. | ✓ |
| Empty states only | Just show empty states with prompts. No welcome message. | |
| Onboarding tour | Show a brief onboarding tour of the dashboard features. | |

**User's choice:** Welcome + empty states

---

## The Agent's Discretion

- Exact gradient colors and opacity for photo hero overlay
- Animation timing and easing for mood selection
- Empty state icon sizes and spacing
- Responsive breakpoints for mobile vs desktop layout

## Deferred Ideas

None — discussion stayed within phase scope
