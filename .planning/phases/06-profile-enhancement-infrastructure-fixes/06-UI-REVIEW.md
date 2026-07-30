# Phase 6 — UI Review

**Audited:** 2026-07-28
**Baseline:** 06-UI-SPEC.md design contract
**Screenshots:** not captured (no dev server)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | All Phase 6 CTA labels, empty states, and error messages match the Copywriting Contract exactly |
| 2. Visuals | 2/4 | Header partner avatar tap is non-functional (empty onClick placeholder); ChatView shows current user's avatar instead of partner's |
| 3. Color | 3/4 | StatusDot and CSS tokens correct; profile.css success checkmark uses hardcoded #22c55e instead of var(--color-online) |
| 4. Typography | 2/4 | 10+ distinct font sizes in Phase 6 files vs. declared 4-size scale; labels use 0.85rem instead of declared Caption 12px |
| 5. Spacing | 3/4 | Mostly on 4px grid; 0.75rem (12px), 0.875rem (14px), 1.25rem (20px) are used but outside declared spacing scale tokens |
| 6. Experience Design | 2/4 | Header avatar tap does nothing; PartnerProfileModal lacks swipe-down gesture; no ErrorBoundary wrapping |

**Overall: 16/24**

---

## Top 3 Priority Fixes

1. **Header partner avatar tap is non-functional** — Users tapping the partner avatar in the header see nothing happen; the onClick is an empty placeholder (`{/* PartnerProfileModal will be wired in Task 2 */}`) — BLOCKER: Wire PartnerProfileModal into Header.jsx with proper state management and rendering, matching the Drawer integration pattern.

2. **ChatView header shows current user's avatar and name instead of partner's** — The chat header displays `user?.user_metadata?.avatar_url` and `user?.user_metadata?.display_name` (current user), not the partner. Plan 3 Task 1 Part C explicitly required this fix. — BLOCKER: Fetch partner profile data from the pair (same pattern as Header.jsx) and render partner avatar/name in the chat header.

3. **Typography uses 10+ font sizes instead of declared 4-size scale** — UI-SPEC declares exactly 4 sizes (12px, 16px, 20px, 24px) but Phase 6 files use 0.8rem, 0.85rem, 0.875rem, 0.9rem, 1.1rem, 1.125rem, 1.25rem, 1.5rem, plus the declared sizes. Labels specifically use 0.85rem (~13.6px) instead of the declared Caption 12px. — WARNING: Audit all Phase 6 CSS and migrate non-standard sizes to the nearest declared token.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)

All Phase 6 copy matches the UI-SPEC Copywriting Contract:

| Element | Contract | Actual | Status |
|---------|----------|--------|--------|
| Primary CTA (avatar crop) | "Upload Photo" | "Upload Photo" (AvatarCropModal.jsx:181, AvatarUpload.jsx:66) | PASS |
| File picker button | "Select Photo" | "Select Photo" (AvatarCropModal.jsx:201) | PASS |
| Error (file too large) | "File too large. Maximum size is 15MB." | "File too large. Maximum size is 15MB." (AvatarCropModal.jsx:83) | PASS |
| Error (upload failed) | "Upload failed. Tap to retry." | "Upload failed. Tap to retry." (AvatarCropModal.jsx:115, 132, 143) | PASS |
| Success (avatar uploaded) | Toast: "Profile photo updated" | "Profile photo updated" (AvatarCropModal.jsx:138) | PASS |
| Display name save | auto-save on blur — no explicit button | onBlur handler, no Save button (ProfilePage.jsx:20-33) | PASS |
| Empty state (no partner) | Heading: "No partner paired yet" / Body: "Pair with your partner to see their profile" | Matches in both PartnerProfileModal.jsx:92-93 and PartnerProfile.jsx:55-59 | PASS |
| Destructive (partner profile) | "Message" button | "Message" (PartnerProfileModal.jsx:117) | PASS |

No generic labels ("Submit", "Click Here", "OK") found in Phase 6 components. No Portuguese strings in new code (Portuguese exists in pre-existing agenda/album components).

### Pillar 2: Visuals (2/4)

**BLOCKER — Header.jsx:63 — Empty onClick placeholder**
```jsx
onClick={() => {/* PartnerProfileModal will be wired in Task 2 */}
```
The partner avatar in the header has `cursor: pointer` styling (line 62) and looks tappable, but the onClick handler is a no-op comment. PartnerProfileModal is never rendered or opened from Header. Users expect tapping the avatar to open the partner profile modal. The Drawer correctly wires PartnerProfileModal (Drawer.jsx:114, 159-162) but Header does not.

**BLOCKER — ChatView.jsx:542-547 — Shows current user's avatar in chat header**
```jsx
{user?.user_metadata?.avatar_url
  ? <img src={user.user_metadata.avatar_url} alt="" />
  : <div className="chat-header-avatar-placeholder">
      {user?.user_metadata?.display_name?.[0]?.toUpperCase() || '?'}
    </div>
}
```
This renders the current user's avatar and initials in the chat header. Plan 3 Task 1 Part C (line 145) explicitly stated: "The chat header currently shows `user?.user_metadata?.avatar_url` — this should actually show the PARTNER's avatar and name, not the current user's. Fix this to use the partner profile data fetched from the pair." This fix was not applied.

**WARNING — PartnerProfile.jsx:70-103 — Heavy inline styles**
The standalone PartnerProfile page uses inline styles for avatar (96px circle), name layout, and spacing. While functional, this violates the co-located CSS convention established in AGENTS.md and makes visual iteration harder. The modal version (PartnerProfileModal) correctly uses CSS classes from profile.css.

**Positive findings:**
- AvatarCropModal has clear visual hierarchy: header → crop area → actions
- StatusDot is positioned correctly at bottom-right of avatars (Header.jsx:74-76, PartnerProfileModal.jsx:105-107)
- AvatarUpload hover overlay with "Upload Photo" text works correctly
- PartnerProfileModal layout is clean: avatar → name → status → Message button

### Pillar 3: Color (3/4)

**CSS tokens added correctly:**
- `--color-online: #22C55E` (index.css:9) ✅
- `--color-offline: #8B8FA3` (index.css:10) ✅
- StatusDot uses `var(--color-online)` / `var(--color-offline)` (StatusDot.jsx:10) ✅

**Color usage audit for Phase 6 components:**

| File | Hardcoded Color | Should Use |
|------|----------------|------------|
| profile.css:49 | `color: #22c55e` (saved checkmark) | `var(--color-online)` |
| profile.css:115 | `color: #22c55e` (success message) | `var(--color-online)` |
| profile.css:120 | `color: #ef4444` (error message) | `var(--color-destructive)` or accept |
| AvatarCropModal.css:94 | `color: #ef4444` (error text) | Acceptable — matches UI-SPEC destructive #EF4444 |
| drawer.css:81 | `color: #ef4444` (sign out) | Acceptable — destructive action |

**UI-SPEC compliance:** "Accent reserved for: primary CTA buttons only. Never used for status dots, badges, or secondary actions." ✅ StatusDot correctly uses green/gray, not accent purple.

**60/30/10 distribution:** Background uses --color-bg-dark (60%), cards/panels use --color-bg-card (30%), accent --color-primary used sparingly on buttons and active nav (10%). Distribution is correct.

### Pillar 4: Typography (2/4)

**UI-SPEC declares 4 sizes:** 12px (Caption), 16px (Body), 20px (Subheading), 24px (Heading)

**Actual font sizes found in Phase 6 CSS files:**

| Size (rem) | Pixels | Nearest Declared | Used In |
|------------|--------|------------------|---------|
| 0.75rem | 12px | Caption ✅ | header.css:74, chat.css:83 |
| 0.8rem | 12.8px | ❌ Off-spec | AvatarCropModal.css:76 |
| 0.85rem | 13.6px | ❌ Off-spec | profile.css:21, 49, AvatarCropModal.css:97 |
| 0.875rem | 14px | ❌ Off-spec | drawer.css:103, 139, 190, profile.css:109, 223, 269 |
| 0.9rem | 14.4px | ❌ Off-spec | AvatarCropModal.css:115, 136, 162, profile.css:109 |
| 1rem | 16px | Body ✅ | header.css:80, 86, drawer.css:46, profile.css:33, 75, 97, 232 |
| 1.1rem | 17.6px | ❌ Off-spec | AvatarCropModal.css:32 |
| 1.125rem | 18px | ❌ Off-spec | profile.css:156 |
| 1.25rem | 20px | Subheading ✅ | drawer.css:27, profile.css:99, 213 |
| 1.5rem | 24px | Heading ✅ | profile.css:9 |

**10 unique font sizes** in Phase 6 files vs. declared 4. The 0.85rem label size (profile.css:21) explicitly contradicts the checker note: "Label role (13.6px) removed; all label-level text uses Caption (12px)."

### Pillar 5: Spacing (3/4)

**UI-SPEC declares:** xs=4px, sm=8px, md=16px, lg=24px, xl=32px, 2xl=48px. "Exceptions: None — project uses rem-based spacing aligned to 4px grid."

**Spacing values found in Phase 6 files:**

| Value (rem) | Pixels | On 4px grid? | In declared scale? |
|-------------|--------|--------------|---------------------|
| 0.25rem | 4px | ✅ | ✅ xs |
| 0.5rem | 8px | ✅ | ✅ sm |
| 0.625rem | 10px | ✅ | ❌ |
| 0.75rem | 12px | ✅ | ❌ Not in declared tokens |
| 0.875rem | 14px | ❌ | ❌ |
| 1rem | 16px | ✅ | ✅ md |
| 1.25rem | 20px | ✅ | ❌ Not in declared tokens |
| 1.5rem | 24px | ✅ | ✅ lg |

0.75rem (12px) is the most frequently used non-token value across header.css, drawer.css, and chat.css. 0.875rem (14px) is the most common off-grid value, used for padding in drawer.css and profile.css. While 12px is on the 4px grid, it's not in the declared scale — suggesting the scale should either be expanded or values should migrate to 8px or 16px.

### Pillar 6: Experience Design (2/4)

**Loading states:** ✅
- AvatarCropModal: Spinner during upload (AvatarCropModal.jsx:247-249, AvatarCropModal.css:171-183)
- PartnerProfileModal: "Loading..." text while fetching partner (PartnerProfileModal.jsx:88-89)
- ChatView: Skeleton loading (ChatView.jsx:378-388)

**Error states:** ✅
- AvatarCropModal: File size validation error (AvatarCropModal.jsx:82-84), upload failure toast (lines 115, 132, 143)
- ChatView: Error banner (ChatView.jsx:575-578)

**Empty states:** ✅
- PartnerProfileModal: "No partner paired yet" / "Pair with your partner to see their profile" (PartnerProfileModal.jsx:91-94)
- PartnerProfile: Updated empty state (PartnerProfile.jsx:50-63)

**Disabled states:** ✅
- AvatarCropModal buttons disabled during upload (AvatarCropModal.jsx:238, 245)

**BLOCKER — Header avatar tap does nothing (Header.jsx:63)**
The onClick is a no-op. Tapping the partner avatar should open PartnerProfileModal per the interaction contract (UI-SPEC line 178: "Tap partner avatar in chat header OR partner profile button in drawer → modal opens").

**WARNING — PartnerProfileModal lacks swipe-down gesture**
UI-SPEC line 183 states: "Close on overlay tap or swipe down." Overlay tap works (PartnerProfileModal.jsx:54-58) but there is no swipe-down implementation. The modal uses scale animation (0.95→1) rather than a bottom-sheet slide-up, contradicting the spec's "Bottom-sheet style: slides up from bottom" (UI-SPEC line 179). The motion animation is a centered scale, not a bottom-sheet translateY.

**WARNING — No ErrorBoundary for new modal components**
AvatarCropModal and PartnerProfileModal have no error boundary wrapping. If the Supabase query or Canvas API throws, the entire app could crash.

**Positive findings:**
- Auto-save on blur with brief checkmark feedback is well-implemented (ProfilePage.jsx:20-33, profile.css:48-58)
- usePresence hook properly cleans up channels on unmount (usePresence.js:79-86)
- PartnerProfileModal correctly navigates to /chat on Message button click (PartnerProfileModal.jsx:61-63)

---

## Files Audited

| File | Phase 6 New/Modified | Lines |
|------|---------------------|-------|
| FRONTEND/src/features/profile/AvatarCropModal.jsx | New | 268 |
| FRONTEND/src/features/profile/AvatarCropModal.css | New | 184 |
| FRONTEND/src/features/profile/AvatarUpload.jsx | Modified | 81 |
| FRONTEND/src/features/profile/ProfilePage.jsx | Modified | 69 |
| FRONTEND/src/features/profile/profile.css | Modified | 241 |
| FRONTEND/src/shared/components/StatusDot.jsx | New | 15 |
| FRONTEND/src/shared/components/Header.jsx | Modified | 88 |
| FRONTEND/src/shared/components/header.css | Modified | 89 |
| FRONTEND/src/shared/components/Drawer.jsx | Modified | 165 |
| FRONTEND/src/shared/components/drawer.css | Modified | 200 |
| FRONTEND/src/features/chat/ChatView.jsx | Modified | 722 |
| FRONTEND/src/features/chat/chat.css | Modified | 1179 |
| FRONTEND/src/features/profile/PartnerProfileModal.jsx | New | 126 |
| FRONTEND/src/features/profile/PartnerProfile.jsx | Modified | 106 |
| FRONTEND/src/hooks/usePresence.js | New | 92 |
| FRONTEND/src/index.css | Modified | 36 |
| FRONTEND/src/main.jsx | Modified | 22 |
