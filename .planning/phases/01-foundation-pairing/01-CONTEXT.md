# Phase 1: Foundation & Pairing - Context

**Gathered:** 2026-07-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Two users can authenticate via Google OAuth, pair via invite code, and see each other's profiles in a shared private space. This is the foundational layer — everything else depends on pairing being established.

</domain>

<decisions>
## Implementation Decisions

### Pairing Flow Design
- **D-01:** Invite code only (no link sharing). Short numeric code, partner enters it to pair.
- **D-02:** One-time use codes — expires after first successful use. User generates a new code to re-pair.
- **D-03:** Block already-paired users from entering new codes. Must unpair first.
- **D-04:** Explicit unpair button in settings. Confirm dialog before unpairing.

### Frontend App Shell
- **D-05:** Side drawer navigation (not bottom tabs). Minimal items: Chat, Homepage, Agenda, Settings.
- **D-06:** User lands on Homepage dashboard after login (primary daily view).
- **D-07:** Unpaired users see pairing screen first — no guided onboarding flow.
- **D-08:** Header shows partner's name + avatar (personal, romantic feel).
- **D-09:** Drawer accessible before pairing but most items locked/greyed out. Settings always available.

### Profile Management
- **D-10:** Separate profile edit page (not inline editing). Tap partner name/avatar in drawer to view their profile (read-only).
- **D-11:** Avatar upload uses camera/gallery picker with crop. Standard mobile pattern.
- **D-12:** Display name required at first login. Profile picture optional.

### Agent's Discretion
- Database schema design (table structure, RLS policies, constraints)
- Supabase client SDK configuration
- PWA manifest and service worker setup
- CSS framework/styling approach
- State management pattern

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `docs/cosmic-v2.html` — Visual identity reference (colors, typography, spacing, components). MUST validate before implementation.
- `docs/UIUX.md` — UI/UX guidelines (mobile-first, card-based, consistent design system)
- `docs/Features.md` — Feature definitions (chat, homepage, agenda)

### Architecture
- `docs/DOCUMENTÇÃO PWA(Progressive Web App.md` — PWA development standards
- `docs/Roadmap.md` — Phase details and success criteria

### Requirements
- `.planning/REQUIREMENTS.md` — Full requirements list (AUTH-01..05, PROF-01..03 for this phase)
- `.planning/PROJECT.md` — Project context, constraints, key decisions

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — this is Phase 1, starting from scratch.

### Established Patterns
- None yet — patterns will be established in this phase.

### Integration Points
- Google OAuth → Supabase Auth
- Pairing codes → Supabase database (users, pairs tables)
- Profile data → Supabase Storage (avatars)
- App shell → React Router / navigation
- PWA → vite-plugin-pwa manifest

</code_context>

<specifics>
## Specific Ideas

- Design reference is `cosmic-v2.html` — romantic, minimal, modern aesthetic. All UI must follow this identity.
- Mobile-first approach — every feature must work perfectly on smartphones before desktop.
- No broken components — every feature fully implemented and navigable before shipping.
- PairID as universal access key — every table (except users/pairs) gets pair_id column with RLS.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Foundation & Pairing*
*Context gathered: 2026-07-24*
