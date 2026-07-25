# Phase 2: Real-Time Chat - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-24
**Phase:** 2-Real-Time Chat
**Areas discussed:** Message sync strategy, Chat UI layout, Reply/quote UX, Emoji reactions, Chat settings, Chat notifications, Message deletion, Message search

---

## Message sync strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Realtime (Recommended) | Use Supabase Realtime (postgres_changes) - already in your stack, no custom WebSocket server needed, built-in presence and broadcasting | ✓ |
| Custom WebSocket | Custom WebSocket server via FastAPI - more control but adds complexity and a server to maintain | |
| HTTP Polling | Polling with short intervals - simpler but higher latency and more API calls | |

**User's choice:** Supabase Realtime
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Queue and sync (Recommended) | Queue locally, sync when back online with loading indicator - messages show as 'sending' until confirmed | ✓ |
| Show error | Show error immediately, user must retry manually - simpler but worse UX | |
| Block send when offline | Allow typing but block send button when offline - prevents confusion | |

**User's choice:** Queue and sync
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Show delivery + read status | Show delivery (single check) and read (double check) status - more work but familiar UX | ✓ |
| Delivery status only | Show delivery status only (sent to server) - simpler, still useful | |
| No status indicators | No status indicators for now - simplest, can add later | |

**User's choice:** Show delivery + read status
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Show typing indicator (Recommended) | Show 'Partner is typing...' with animated dots - requires Supabase Presence or custom channel, adds realism | ✓ |
| No typing indicator | No typing indicator - simpler implementation, less real-time feel | |

**User's choice:** Show typing indicator
**Notes:** None

---

## Chat UI layout

| Option | Description | Selected |
|--------|-------------|----------|
| WhatsApp-style (Recommended) | Messages on right (sent) and left (received), blue/gray bubbles, rounded corners - most familiar for couples messaging | ✓ |
| iMessage-style | Blue bubbles on right only, no sender distinction - cleaner but less context | |
| Minimalist chat | Clean, minimal design with no bubbles - modern but less familiar | |

**User's choice:** WhatsApp-style
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Group by sender + time gap (Recommended) | Group consecutive messages from same sender, show timestamp only when time gap > 5 minutes - reduces visual clutter | ✓ |
| Timestamp on every message | Show timestamp on every message - more info but more clutter | |
| No grouping | No grouping, just chronological list - simplest | |

**User's choice:** Group by sender + time gap
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Partner avatar + prompt (Recommended) | Show partner's avatar/name with a prompt like 'Start a conversation' - personal and encouraging | ✓ |
| Empty chat input only | Show empty chat with just the input field - minimal and direct | |
| Welcome screen | Show app logo with welcome message - branded but less personal | |

**User's choice:** Partner avatar + prompt
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed bottom (Recommended) | Fixed at bottom, always visible - standard mobile chat pattern | ✓ |
| Hidden on scroll up | Fixed at bottom, but hidden when scrolling up to see more messages | |
| Floating action button | Floating button that expands to input - more screen space for messages | |

**User's choice:** Fixed bottom
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Romantic purple/gray (Recommended) | Sent: light purple/pink, Received: white/gray - matches romantic aesthetic from cosmic-v2.html | ✓ |
| Standard WhatsApp green | Sent: green, Received: white - WhatsApp standard colors | |
| iMessage blue/gray | Sent: blue, Received: light gray - iMessage style | |

**User's choice:** Romantic purple/gray
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Time below message (Recommended) | Show time below message (e.g., '10:30 AM'), date separator for new days - clear and informative | ✓ |
| Time on hover/tap | Show time only on hover/tap - cleaner but less discoverable | |
| Relative time | Show relative time (e.g., '2 min ago') - familiar but changes over time | |

**User's choice:** Time below message
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-scroll + new message button (Recommended) | Auto-scroll to bottom if user is at bottom, show 'New messages' button if scrolled up - standard behavior | ✓ |
| Always auto-scroll | Always auto-scroll to bottom - forces user to see new messages | |
| No auto-scroll | Never auto-scroll, user manually scrolls - user has full control | |

**User's choice:** Auto-scroll + new message button
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Modern sans-serif (Recommended) | Clean, modern sans-serif like Inter or system font stack - readable and consistent | |
| Rounded friendly font | Slightly rounded, friendly font - matches romantic aesthetic | ✓ |
| System fonts | Use system default fonts - fastest loading, native feel | |

**User's choice:** Rounded friendly font
**Notes:** User specifically requested rounded friendly font to match romantic aesthetic

| Option | Description | Selected |
|--------|-------------|----------|
| 16px messages (Recommended) | 16px for message text, 14px for timestamps - readable on mobile, standard size | ✓ |
| 14px messages | 14px for message text, 12px for timestamps - more compact, shows more messages | |
| 18px messages | 18px for message text, 14px for timestamps - larger, easier to read | |

**User's choice:** 16px messages
**Notes:** None

---

## Reply/quote UX

| Option | Description | Selected |
|--------|-------------|----------|
| Inline quote (Recommended) | Show quoted message above reply text, with original message preview - WhatsApp/iMessage style | ✓ |
| Threaded replies | Thread replies under original message - Slack style, good for discussions | |
| Reply indicator only | Show reply indicator but no quote - minimal, less clutter | |

**User's choice:** Inline quote
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Swipe right / long-press (Recommended) | Swipe right on message or long-press to reveal reply option - standard mobile pattern | ✓ |
| Tap for context menu | Tap message to show context menu with reply option - simpler but less discoverable | |
| Always visible reply button | Reply button always visible on hover/tap - most discoverable but clutters UI | |

**User's choice:** Swipe right / long-press
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| 2-3 lines max (Recommended) | Show first 2-3 lines with ellipsis if longer - balances context and space | ✓ |
| Full message | Show full message regardless of length - complete context but takes space | |
| First line only | Show only first line - minimal but may lose context | |

**User's choice:** 2-3 lines max
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Left border + light bg (Recommended) | Left border with light background, distinct from message bubble - clear visual separation | ✓ |
| Small text in bubble | Smaller text inside message bubble - compact but less distinct | |
| Separate card | Separate card above reply - most distinct but takes more space | |

**User's choice:** Left border + light bg
**Notes:** None

---

## Emoji reactions

| Option | Description | Selected |
|--------|-------------|----------|
| Long-press picker (Recommended) | Long-press message to show reaction picker - standard mobile pattern | ✓ |
| Tap for reaction button | Tap message to show reaction button - simpler but less discoverable | |
| Swipe left | Swipe left on message - quick but may conflict with reply swipe | |

**User's choice:** Long-press picker
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Standard 6 emojis (Recommended) | ❤️ 😂 👍 👎 😢 🔥 - common reactions, covers most use cases | |
| 8 emojis | ❤️ 😂 👍 👎 😢 🔥 😍 🎉 - more options, more expressive | ✓ |
| Full emoji keyboard | Full emoji keyboard access - maximum choice but overwhelming | |

**User's choice:** 8 emojis
**Notes:** User wanted more expressive options than standard 6

| Option | Description | Selected |
|--------|-------------|----------|
| Below bubble with count (Recommended) | Small emoji icons below message bubble, with count if multiple - compact and clear | ✓ |
| Overlay on corner | Emoji overlay on message corner - less space but may obscure text | |
| Separate reaction bar | Separate reaction bar below message - most clear but takes more space | |

**User's choice:** Below bubble with count
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Pop-in animation (Recommended) | Pop-in animation when added, subtle bounce - adds delight without being distracting | ✓ |
| No animation | No animation, instant appearance - simpler, faster | |
| Full animation + sound | Full animation with sound - most delightful but may be annoying | |

**User's choice:** Pop-in animation
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Number next to emoji (Recommended) | Show number next to emoji (e.g., ❤️ 3) - clear and standard | ✓ |
| Multiple icons | Show multiple emoji icons if same reaction - visual but clutters | |
| Count on hover | Show count only on hover/tap - cleaner but less discoverable | |

**User's choice:** Number next to emoji
**Notes:** None

---

## Chat settings

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, with options (Recommended) | Yes, with notification sounds, theme, and font size options - gives users control | ✓ |
| Notification toggle only | Yes, but only notification toggle - minimal but useful | |
| No settings for v1 | No chat-specific settings - keep it simple for v1 | |

**User's choice:** Yes, with options
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Sounds, theme, font size (Recommended) | Notification sounds, theme (light/dark), font size - covers most user needs | |
| Notification sounds only | Notification sounds only - minimal for v1 | |
| All above + preview + receipts | All of above plus message preview, read receipts toggle - more control but more complexity | ✓ |

**User's choice:** All above + preview + receipts
**Notes:** User wanted comprehensive settings including message preview and read receipts toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Chat header icon (Recommended) | Settings icon in chat header - standard, easy to find | ✓ |
| Main settings | In main app settings under chat section - organized but less discoverable | |
| Both locations | Both places - most discoverable but redundant | |

**User's choice:** Chat header icon
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Light, dark, system (Recommended) | Light mode, dark mode, and system default - standard options | ✓ |
| Light and dark only | Light and dark only - simpler, system can be added later | |
| System default only | System default only - simplest, follows device settings | |

**User's choice:** Light, dark, system
**Notes:** None

---

## Chat notifications

| Option | Description | Selected |
|--------|-------------|----------|
| Push notifications with preview (Recommended) | Push notifications with message preview - standard for chat apps, requires browser notification permission | ✓ |
| Push without preview | Push notifications without preview - more privacy but less useful | |
| In-app only | No push notifications, only in-app - simpler but less engaging | |

**User's choice:** Push notifications with preview
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Custom chat sound (Recommended) | Yes, custom notification sound for chat - distinctive and recognizable | |
| System default | Use system default sound - simpler, less customization | ✓ |
| Vibration only | No sound, vibration only - less intrusive | |

**User's choice:** System default
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| No notification, real-time (Recommended) | No notification, messages appear in real-time - standard chat behavior | ✓ |
| Toast notification | Show in-app toast notification - useful if user is in another chat | |
| Vibration only | Vibration only - subtle but noticeable | |

**User's choice:** No notification, real-time
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Per-chat settings (Recommended) | Yes, per-chat notification settings - gives users control | |
| Global settings only | Global notification settings only - simpler for v1 | ✓ |
| No settings | No notification settings - use defaults | |

**User's choice:** Global settings only
**Notes:** None

---

## Message deletion

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, delete for self + everyone (Recommended) | Yes, both for self and for everyone - standard chat functionality | ✓ |
| Delete for self only | Yes, but only delete for self - simpler, less risky | |
| No deletion for v1 | No message deletion for v1 - simplest, can add later | |

**User's choice:** Yes, delete for self + everyone
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Long-press menu (Recommended) | Long-press message, select 'Delete' from context menu - standard pattern | ✓ |
| Swipe left | Swipe left on message to reveal delete button - quick but may conflict with other gestures | |
| Tap to select + header button | Tap message to select, then delete button in header - more steps but clearer | |

**User's choice:** Long-press menu
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder text (Recommended) | Show 'This message was deleted' placeholder - preserves conversation flow | ✓ |
| Remove completely | Remove message completely, no trace - cleaner but may confuse | |
| Placeholder with timestamp | Show 'Message deleted by sender' with timestamp - more informative | |

**User's choice:** Placeholder text
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, confirmation dialog (Recommended) | Yes, show confirmation dialog - prevents accidental deletion | ✓ |
| No confirmation | No confirmation, immediate deletion - faster but riskier | |
| Undo snackbar | Undo snackbar with 5-second delay - good balance of speed and safety | |

**User's choice:** Yes, confirmation dialog
**Notes:** None

---

## Message search

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, text search (Recommended) | Yes, search by text - standard feature, useful for finding old messages | |
| Text + date + sender | Yes, but also search by date and sender - more powerful but complex | |
| No search for v1 | No search for v1 - simplest, can add later | ✓ |

**User's choice:** No search for v1
**Notes:** User decided to defer search functionality to future phase

---

## the agent's Discretion

- Agent has flexibility on exact component structure, file organization, and implementation details
- Agent should follow existing project patterns from Phase 1 (auth, pairing, profile features)

## Deferred Ideas

None — discussion stayed within phase scope