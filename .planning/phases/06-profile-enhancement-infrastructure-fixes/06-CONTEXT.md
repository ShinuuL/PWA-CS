# Phase 6: Profile Enhancement + Infrastructure Fixes - Context

**Gathered:** 2026-07-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Personalize user identity (avatar upload/crop, display name, online status) and fix foundational infrastructure (service worker cleanup, new database tables, RLS policies). This phase delivers user-facing profile features and prepares database schema for future phases.

</domain>

<decisions>
## Implementation Decisions

### Avatar Crop Tool
- **D-01:** Use `react-image-crop` library for circular crop tool (battle-tested, accessible)
- **D-02:** Pinch-to-zoom + pan interaction (feels native on mobile)
- **D-03:** Inline on profile page — tap avatar opens modal with photo picker + crop
- **D-04:** Strictly circular crop (fixed circle, user positions image)

### Online Status Display
- **D-05:** Green/gray dot in chat header only
- **D-06:** Relative time format ("5 minutes ago")
- **D-07:** Show "last seen" text only if offline >1h (reduces noise)

### Avatar Compression & Caching
- **D-08:** Client-side compression before upload (reduces upload time)
- **D-09:** ~200KB target at 80% JPEG quality
- **D-10:** Cache busting via query param (`?v=timestamp`)
- **D-11:** Display avatars in profile page + chat header + drawer

### Database Tables & RLS
- **D-12:** Full visibility for partners on shared tables (trust-based, simple)
- **D-13:** Supabase Realtime Presence for live status (no separate online_status table)
- **D-14:** Extended fields for reminders: id, pair_id, title, reminder_at, created_by, completed_at, notes, priority, category
- **D-15:** One todos table with `list_id` foreign key (simpler queries)

### Service Worker Cleanup
- **D-16:** Remove manual `navigator.serviceWorker.register` call in `main.jsx`
- **D-17:** Delete `public/sw.js` file if it exists
- **D-18:** Let `vite-plugin-pwa` handle all service worker registration

### Display Name Sync
- **D-19:** Real-time sync via Supabase Realtime
- **D-20:** Updates appear in chat header + all past messages immediately
- **D-21:** 1-30 characters, no special character restrictions
- **D-22:** Auto-save on blur (no explicit save button)

### Partner Profile View
- **D-23:** Tap avatar in chat header AND button in navigation drawer
- **D-24:** Show avatar + name + online status (basic info only)
- **D-25:** Modal/sheet overlay (less disruptive than full page)
- **D-26:** View only + "Message" button to jump to chat

### Upload Error Handling
- **D-27:** Toast with retry button on failure
- **D-28:** Reject files >15MB before compression
- **D-29:** Spinner on avatar during upload
- **D-30:** Success toast + immediate update everywhere

### Agent's Discretion
Areas where user said "you decide" — agent has flexibility:
- Library choice for crop tool (decided: react-image-crop)
- Crop UI interaction (decided: pinch-to-zoom + pan)
- Crop shape (decided: strictly circular)
- Online dot color (decided: green/gray)
- "last seen" visibility threshold (decided: >1h)
- Compression location (decided: client-side)
- Compression quality (decided: 80% JPEG)
- Cache busting method (decided: query param)
- Avatar display spots (decided: all three)
- Partner visibility (decided: full)
- Online status tracking (decided: Realtime Presence)
- Reminder fields (decided: extended)
- Todo schema (decided: one table with list_id)
- SW cleanup scope (decided: remove + delete file)
- Name validation (decided: 1-30 chars, no rules)
- Name save method (decided: auto-save on blur)
- Partner profile layout (decided: modal/sheet)
- Profile actions (decided: view + message)
- Error handling (decided: toast with retry)
- File size validation (decided: reject >15MB)
- Upload progress (decided: spinner on avatar)
- Success feedback (decided: toast + immediate update)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements
- `.planning/REQUIREMENTS.md` §Profile & Avatar — PROF-01 through PROF-07 requirements
- `.planning/REQUIREMENTS.md` §Infrastructure — INFRA-01 through INFRA-06 requirements

### Design Reference
- `docs/cosmic-v2.html` — Design reference for UI implementation (romantic, minimal, modern aesthetic)

### Architecture
- `.planning/PROJECT.md` §Key Decisions — Supabase-first, PairID system, tech stack decisions
- `FRONTEND/src/shared/lib/supabase.js` — Supabase client configuration

### Existing Code
- `FRONTEND/src/features/profile/ProfilePage.jsx` — Current profile page (to be enhanced)
- `FRONTEND/src/features/profile/AvatarUpload.jsx` — Current avatar upload (to be replaced)
- `FRONTEND/src/features/profile/PartnerProfile.jsx` — Current partner profile (to be enhanced)
- `FRONTEND/src/main.jsx` — Service worker registration (to be removed)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ProfilePage.jsx`: Existing profile page with display name editing — can be enhanced with crop tool
- `AvatarUpload.jsx`: Current avatar upload to Supabase storage `avatars` bucket — replace with crop-enabled version
- `PartnerProfile.jsx`: Basic partner profile view — enhance with online status and modal layout
- `useAuth` hook: Provides `user`, `profile`, `fetchProfile` — reuse for profile state management

### Established Patterns
- **CSS co-located**: Each component has matching `.css` file (e.g., `profile.css`)
- **Zustand stores**: Use `useAuthStore` for auth/profile state
- **Supabase client**: All CRUD through `supabase` from `src/shared/lib/supabase.js`
- **lucide-react icons**: Use for UI icons (e.g., Camera, Edit, Check)
- **motion (framer-motion)**: Use for animations (import from `"motion/react"`)

### Integration Points
- `FRONTEND/src/App.jsx`: Routes for `/profile` and `/partner-profile`
- `FRONTEND/src/shared/components/Header.jsx`: Partner avatar display in header
- `FRONTEND/src/shared/components/Drawer.jsx`: Navigation drawer (add partner profile button)
- `FRONTEND/src/features/chat/ChatView.jsx`: Chat header with partner avatar
- `FRONTEND/vite.config.js`: PWA configuration (vite-plugin-pwa)

</code_context>

<specifics>
## Specific Ideas

- **Pinch-to-zoom feel**: The crop tool should feel native on mobile — user pinch-zooms and drags to position the image behind a fixed circular mask
- **Inline modal flow**: Tapping avatar on profile page opens a modal with photo picker + crop tool, not a separate route
- **Chat header as status source**: The green/gray dot in chat header is the primary indicator — no separate "status page"
- **Trust-based visibility**: Partners see everything in shared lists — no granular permissions for v2.0

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 6-Profile Enhancement + Infrastructure Fixes*
*Context gathered: 2026-07-28*
