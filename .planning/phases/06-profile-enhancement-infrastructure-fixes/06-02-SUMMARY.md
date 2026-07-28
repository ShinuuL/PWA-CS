---
phase: 06-profile-enhancement-infrastructure-fixes
plan: 02
subsystem: ui
tags: [react-image-crop, canvas-api, avatar, profile, auto-save, pwa, sw]

requires:
  - phase: 06-01
    provides: database migrations for profiles table, presence hook
provides:
  - AvatarCropModal with circular crop and Canvas compression
  - Refactored AvatarUpload delegating to AvatarCropModal
  - Auto-save display name on blur
  - CSS tokens for online/offline status colors
  - Service worker registration cleanup
affects: [06-03, 06-04, 06-05]

tech-stack:
  added: [react-image-crop]
  patterns: [canvas-blob-compression, autosave-on-blur, modal-animated-with-motion]

key-files:
  created:
    - FRONTEND/src/features/profile/AvatarCropModal.jsx
    - FRONTEND/src/features/profile/AvatarCropModal.css
  modified:
    - FRONTEND/package.json
    - FRONTEND/src/features/profile/AvatarUpload.jsx
    - FRONTEND/src/features/profile/ProfilePage.jsx
    - FRONTEND/src/features/profile/profile.css
    - FRONTEND/src/index.css
    - FRONTEND/src/main.jsx
    - FRONTEND/src/features/auth/useAuth.js

key-decisions:
  - "Used react-image-crop with circularCrop prop for strictly circular avatar crop (per D-04)"
  - "Canvas API toBlob at JPEG quality 0.8 produces ~200KB output (per D-08, D-09)"
  - "Auto-save on blur instead of explicit save button for display name (per D-22)"
  - "15MB file size limit with inline error (per D-28), replacing old 5MB limit"
  - "Fixed useAuth to expose fetchProfile (pre-existing bug blocking profile features)"

patterns-established:
  - "Modal pattern: motion/react AnimatePresence with overlay click-to-close"
  - "Auto-save pattern: onBlur + silent save, brief checkmark feedback"

requirements-completed: [INFRA-01, INFRA-06, PROF-01, PROF-02, PROF-03, PROF-04]

coverage:
  - id: D1
    description: AvatarCropModal with circular crop, Canvas compression, and upload flow"
    requirement: PROF-01
    verification:
      - kind: automated_ui
        ref: "grep circularCrop AvatarCropModal.jsx"
        status: pass
      - kind: automated_ui
        ref: "grep toBlob AvatarCropModal.jsx"
        status: pass
    human_judgment: false
  - id: D2
    description: AvatarUpload delegates to AvatarCropModal for crop+upload
    requirement: PROF-02
    verification:
      - kind: automated_ui
        ref: "grep AvatarCropModal AvatarUpload.jsx"
        status: pass
    human_judgment: false
  - id: D3
    description: Display name auto-saves on blur with maxLength=30
    requirement: PROF-03
    verification:
      - kind: automated_ui
        ref: "grep onBlur ProfilePage.jsx"
        status: pass
      - kind: automated_ui
        ref: "grep maxLength ProfilePage.jsx"
        status: pass
    human_judgment: false
  - id: D4
    description: Service worker registration removed from main.jsx
    requirement: INFRA-01
    verification:
      - kind: automated_ui
        ref: "grep -c serviceWorker main.jsx returns 0"
        status: pass
    human_judgment: false
  - id: D5
    description: CSS tokens --color-online and --color-offline added
    requirement: INFRA-06
    verification:
      - kind: automated_ui
        ref: "grep color-online index.css"
        status: pass
    human_judgment: false

duration: 4 min
completed: 2026-07-28
status: complete
---

# Phase 6 Plan 2: Avatar Crop & Profile Auto-Save Summary

**Circular avatar crop modal with react-image-crop + Canvas compression, auto-save display name on blur, CSS status tokens, and service worker registration cleanup**

## Performance

- **Duration:** 4 min
- **Started:** 2026-07-28T16:56:49Z
- **Completed:** 2026-07-28T17:01:43Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created AvatarCropModal with react-image-crop circularCrop, Canvas API compression to JPEG 0.8, 15MB file validation, and Supabase Storage upload with cache-busted URL
- Refactored AvatarUpload to delegate crop+upload to AvatarCropModal instead of inline file handling
- Refactored ProfilePage to auto-save display name on blur (no save button), with maxLength=30 enforcement
- Added --color-online and --color-offline CSS tokens for status dot colors
- Removed manual service worker registration from main.jsx (vite-plugin-pwa handles it)
- Fixed useAuth hook to expose fetchProfile (pre-existing bug)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AvatarCropModal with react-image-crop and Canvas compression** - `9dcb3ad` (feat)
2. **Task 2: Refactor AvatarUpload and ProfilePage with auto-save and CSS tokens** - `68b7056` (feat)

## Files Created/Modified
- `FRONTEND/src/features/profile/AvatarCropModal.jsx` - Modal component: file pick → circular crop → Canvas compress → Supabase upload → cache bust → toast
- `FRONTEND/src/features/profile/AvatarCropModal.css` - Styles for crop modal overlay, actions, spinner
- `FRONTEND/package.json` - Added react-image-crop dependency
- `FRONTEND/src/features/profile/AvatarUpload.jsx` - Refactored to delegate to AvatarCropModal
- `FRONTEND/src/features/profile/ProfilePage.jsx` - Auto-save on blur, removed form/save button
- `FRONTEND/src/features/profile/profile.css` - Added saved checkmark animation
- `FRONTEND/src/index.css` - Added --color-online and --color-offline tokens
- `FRONTEND/src/main.jsx` - Removed manual service worker registration
- `FRONTEND/src/features/auth/useAuth.js` - Exposed fetchProfile in return value

## Decisions Made
- Used react-image-crop with circularCrop prop for strictly circular avatar crop (per D-04)
- Canvas API toBlob at JPEG quality 0.8 produces ~200KB output (per D-08, D-09)
- Auto-save on blur instead of explicit save button for display name (per D-22)
- 15MB file size limit with inline error (per D-28), replacing old 5MB limit
- Fixed useAuth to expose fetchProfile (pre-existing bug blocking profile features)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Fixed useAuth to expose fetchProfile**
- **Found during:** Task 1 (AvatarCropModal creation)
- **Issue:** useAuth.js did not expose fetchProfile in its return value, but both AvatarUpload and ProfilePage call useAuth() expecting fetchProfile
- **Fix:** Added fetchProfile to useAuth destructuring and return value
- **Files modified:** FRONTEND/src/features/auth/useAuth.js
- **Verification:** Both AvatarUpload and ProfilePage import fetchProfile from useAuth successfully
- **Committed in:** 9dcb3ad (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Bug fix necessary for profile features to function. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Avatar upload with crop is complete, ready for integration into chat/album features
- CSS tokens ready for StatusDot component in Plan 3
- Service worker cleanup complete, ready for push notification features

---
*Phase: 06-profile-enhancement-infrastructure-fixes*
*Completed: 2026-07-28*

## Self-Check: PASSED

- AvatarCropModal.jsx exists: FOUND
- AvatarCropModal.css exists: FOUND
- Commit 9dcb3ad exists: FOUND
- Commit 68b7056 exists: FOUND
