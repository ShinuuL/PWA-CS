# Phase 4: Homepage Dashboard - Context

**Gathered:** 2026-07-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Couples have a single view showing their relationship at a glance — the daily ritual that drives retention. This phase delivers: a random memory photo hero, daily mood selection for both partners, and a clean dashboard layout.

</domain>

<decisions>
## Implementation Decisions

### Memory Photo Hero
- **D-01:** Display as full-width hero image with gradient overlay fading into background. Caption and date sit at bottom over gradient.
- **D-02:** Photo changes once per page load (stays same all day for consistency).
- **D-03:** Show the date the photo was taken below the caption.
- **D-04:** When album is empty, show upload prompt with camera icon (like MiniAlbum empty state).

### Mood Selector Design
- **D-05:** 5 predefined emotions: Happy, Tired, Sad, Missing, Needy + custom text option.
- **D-06:** Emoji grid layout (2x3 grid of card-style items with emojis and labels).
- **D-07:** Custom mood uses modal popup for text input.
- **D-08:** Mood selection is instant save (no confirmation needed).
- **D-09:** Selected mood indicated with purple border and glow effect.

### Partner Mood Display
- **D-10:** Partner's mood appears above your own mood selector for clear comparison.
- **D-11:** Show full mood info: partner's name, avatar, emoji, and custom text if provided.
- **D-12:** Updates via Supabase Realtime subscription (no refresh needed).
- **D-13:** When partner hasn't set mood, show gentle prompt like "Ask how they're feeling" with subtle animation.

### Dashboard Layout
- **D-14:** Vertical stack: Photo hero → Partner mood → Your mood → MiniAlbum.
- **D-15:** Each section has subtle card background with rounded corners (matches cosmic design system).
- **D-16:** Both partners' moods shown with name + avatar above their respective mood sections.
- **D-17:** First-time users see welcome message with their name, then empty states for each section.

### The Agent's Discretion
- Exact gradient colors and opacity for photo hero overlay
- Animation timing and easing for mood selection
- Empty state icon sizes and spacing
- Responsive breakpoints for mobile vs desktop layout

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design System
- `docs/cosmic-v2.html` — Design reference with color palette, typography, card styles, and component patterns

### Requirements
- `.planning/REQUIREMENTS.md` §Homepage Dashboard — HOME-01, HOME-02, HOME-03 requirements
- `.planning/ROADMAP.md` §Phase 4 — Goal, success criteria, and phase details

### Project Context
- `.planning/PROJECT.md` — Tech stack, constraints, and key decisions
- `FRONTEND/src/App.jsx` — Current routing and HomePage placeholder
- `FRONTEND/src/features/album/MiniAlbum.jsx` — Existing mini album component to reuse

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MiniAlbum` component: Already fetches photos, handles empty state, shows horizontal scroll. Can be embedded directly in dashboard.
- `useAlbumStore`: Zustand store with photo fetching, real-time subscription, and upload logic. Can be extended for random photo selection.
- `usePairing` hook: Provides pair status and pair_id for scoped data queries.

### Established Patterns
- Zustand stores call Supabase directly (no API layer)
- Real-time subscriptions via `supabase.channel()` for live updates
- CSS co-located with components (e.g., `album.css`)
- lucide-react for icons, motion for animations

### Integration Points
- `App.jsx` line 18-23: `HomePage` is placeholder — will be replaced with dashboard
- `AppShell.jsx`: Provides header and drawer navigation
- `PairingGate`: Wraps homepage — ensures user is paired before accessing dashboard

</code_context>

<specifics>
## Specific Ideas

- The full-width hero should feel romantic and immersive — like opening a photo album
- Mood selector should be tactile and fun — tapping an emoji should feel satisfying
- Partner's mood appearing above yours creates a "how are you?" conversation starter
- Empty states should feel inviting, not empty — encourage couples to add their first photos

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 4-Homepage Dashboard*
*Context gathered: 2026-07-26*
