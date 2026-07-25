# Phase 2: Real-Time Chat - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Paired couples can exchange real-time messages with rich interaction including text, replies, and emoji reactions. This is the core value proposition of CoupleSpace.

</domain>

<decisions>
## Implementation Decisions

### Message sync strategy
- **D-01:** Use Supabase Realtime (postgres_changes) for real-time message synchronization
- **D-02:** Queue messages locally when offline, sync when back online with loading indicator
- **D-03:** Show delivery (single check) and read (double check) status indicators
- **D-04:** Show typing indicators when partner is composing a message

### Chat UI layout
- **D-05:** WhatsApp-style chat interface with messages on right (sent) and left (received)
- **D-06:** Group consecutive messages from same sender with timestamp only when time gap > 5 minutes
- **D-07:** Empty state shows partner's avatar/name with "Start a conversation" prompt
- **D-08:** Message input field fixed at bottom, always visible
- **D-09:** Romantic purple/gray color scheme for message bubbles
- **D-10:** Show time below message, date separator for new days
- **D-11:** Auto-scroll to bottom if user is at bottom, show "New messages" button if scrolled up
- **D-12:** Rounded friendly font style (e.g., Nunito, Poppins)
- **D-13:** 16px font size for message text, 14px for timestamps

### Reply/quote UX
- **D-14:** Inline quote display with quoted message above reply text
- **D-15:** Swipe right or long-press to initiate reply
- **D-16:** Show first 2-3 lines of original message in quote preview with ellipsis if longer
- **D-17:** Left border with light background for quote preview styling

### Emoji reactions
- **D-18:** Long-press message to show reaction picker
- **D-19:** Reaction picker shows 8 emojis: ❤️ 😂 👍 👎 😢 🔥 😍 🎉
- **D-20:** Display reactions below message bubble with count
- **D-21:** Pop-in animation when reaction is added
- **D-22:** Show number next to emoji for reaction count (e.g., ❤️ 3)

### Chat settings
- **D-23:** Chat-specific settings accessible from chat header icon
- **D-24:** Settings include: notification sounds, theme (light/dark/system), font size, message preview toggle, read receipts toggle
- **D-25:** Light, dark, and system default theme options

### Chat notifications
- **D-26:** Push notifications with message preview when app is in background/closed
- **D-27:** System default notification sounds (no custom sounds for v1)
- **D-28:** No notification when app is open and in chat, messages appear in real-time
- **D-29:** Global notification settings only (no per-chat settings for v1)

### Message deletion
- **D-30:** Users can delete messages for self and for everyone
- **D-31:** Long-press message, select "Delete" from context menu
- **D-32:** Show "This message was deleted" placeholder when deleted for everyone
- **D-33:** Show confirmation dialog before deletion

### Message search
- **D-34:** No message search for v1 (can add in future phase)

### the agent's Discretion
- Agent has flexibility on exact component structure, file organization, and implementation details
- Agent should follow existing project patterns from Phase 1 (auth, pairing, profile features)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Reference
- `cosmic-v2.html` — Design reference for romantic, minimal, modern aesthetic

### Requirements
- `.planning/REQUIREMENTS.md` — CHAT-01, CHAT-05, CHAT-06, CHAT-07 requirements
- `.planning/ROADMAP.md` — Phase 2 goals and success criteria

### Existing Codebase
- `FRONTEND/src/features/` — Existing feature structure (auth, pairing, profile, settings)
- `FRONTEND/src/shared/` — Shared components and utilities
- `FRONTEND/src/stores/` — State management patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Auth system (Phase 1): Google OAuth, session persistence, user management
- Pairing system (Phase 1): pairID generation, partner connection
- Profile system (Phase 1): display names, avatars, partner visibility
- Settings system (Phase 1): app settings, user preferences

### Established Patterns
- Feature-based directory structure in `FRONTEND/src/features/`
- Zustand stores for state management
- Supabase client for database operations
- React Router for navigation

### Integration Points
- App shell and navigation from Phase 1
- User authentication and pairing context
- Supabase project setup and configuration

</code_context>

<specifics>
## Specific Ideas

- WhatsApp-style chat as reference implementation
- Romantic purple/gray color palette matching cosmic-v2.html aesthetic
- Mobile-first design with proper touch targets
- Real-time sync using Supabase Realtime (no custom WebSocket)
- Offline message queue with sync indicator

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 2-Real-Time Chat*
*Context gathered: 2026-07-24*