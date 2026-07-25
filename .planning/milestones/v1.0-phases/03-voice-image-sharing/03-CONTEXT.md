# Phase 3: Voice & Image Sharing - Context

**Gathered:** 2026-07-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Couples can exchange voice messages and images within their chat, and build a shared photo album on the homepage. Voice messages follow WhatsApp-style recording UX with live waveform. Images display inline in chat. The shared album lives as a mini section on the homepage and as a dedicated album page.

</domain>

<decisions>
## Implementation Decisions

### Voice Recording UX
- **D-01:** Hold-to-record (WhatsApp-style): hold mic button, release to send, slide left to cancel
- **D-02:** Live waveform visualization during recording (real-time audio visualization)
- **D-03:** Recording UI replaces the input bar during recording (clean transition)
- **D-04:** Cancel gesture: slide left while holding (visual feedback shows cancel zone)

### Audio Storage & Format
- **D-05:** Store voice files in Supabase Storage bucket (integrates with existing auth/RLS)
- **D-06:** Format: WebM/Opus (modern, small file size, supported by MediaRecorder API)
- **D-07:** Max duration: 5 minutes (reasonable limit, prevents abuse)
- **D-08:** Client-side processing only (no FastAPI endpoint needed for audio)

### Image Sharing in Chat
- **D-09:** Inline thumbnails in chat bubbles (tap to view full-screen)
- **D-10:** Client-side compression before upload (reduces storage costs, faster uploads)
- **D-11:** Single image per message (matches WhatsApp default behavior)
- **D-12:** Gallery picker for image selection (standard mobile pattern)

### Shared Photo Album
- **D-13:** Album lives in two places: mini horizontal scrollable section on homepage (HOME-04) + dedicated album page accessible from drawer
- **D-14:** Direct upload to album from album page (separate from chat image sharing)
- **D-15:** Photos organized chronologically by upload date (simple, familiar pattern)
- **D-16:** No capacity limit (unlimited photos, storage managed via compression)

### the agent's Discretion
- Agent has flexibility on exact component structure, file organization, and implementation details
- Agent should follow existing project patterns from Phase 1-2 (auth, pairing, chat features)
- Agent decides waveform library/component implementation
- Agent decides image compression quality/settings
- Agent decides album page layout and navigation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` — CHAT-02, CHAT-03, CHAT-04, HOME-04, HOME-05 requirements
- `.planning/ROADMAP.md` — Phase 3 goals and success criteria

### Design Reference
- `cosmic-v2.html` — Design reference for romantic, minimal, modern aesthetic

### Existing Codebase
- `FRONTEND/src/features/chat/ChatView.jsx` — Existing chat component (extend with voice/image)
- `FRONTEND/src/stores/chatStore.js` — Chat state management (extend with voice/image state)
- `FRONTEND/src/features/` — Feature-based directory structure
- `FRONTEND/src/shared/` — Shared components and utilities

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Chat system (Phase 2): message bubbles, real-time sync, offline queue, typing indicators
- Auth system (Phase 1): Google OAuth, session persistence, user management
- Pairing system (Phase 1): pairID generation, partner connection
- Profile system (Phase 1): display names, avatars, partner visibility
- Settings system (Phase 1): app settings, user preferences

### Established Patterns
- Feature-based directory structure in `FRONTEND/src/features/`
- Zustand stores for state management
- Supabase client for database operations
- React Router for navigation
- Motion (framer-motion) for animations
- Lucide React for icons

### Integration Points
- Chat view (extend with voice/image message types)
- Homepage (add mini photo album section)
- App shell and navigation (add album page route)
- Supabase Storage (new bucket for voice/image files)

</code_context>

<specifics>
## Specific Ideas

- WhatsApp-style voice recording as reference implementation
- Live waveform visualization during recording
- Inline image thumbnails with tap-to-expand
- Mini photo album on homepage (horizontal scrollable)
- Dedicated album page for full photo management
- Client-side compression for both voice and images
- Supabase Storage for all media files

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 3-Voice & Image Sharing*
*Context gathered: 2026-07-25*
