---
phase: quick-fix
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - FRONTEND/src/features/profile/AvatarCropModal.css
  - FRONTEND/src/features/profile/ProfilePage.jsx
  - FRONTEND/src/features/profile/AvatarUpload.jsx
autonomous: true
requirements: []
must_haves:
  truths:
    - Avatar crop modal displays circular crop handles, not square corners
    - Profile page shows correct display name matching the authenticated user
    - Avatar upload preview updates correctly after successful upload
  artifacts:
    - FRONTEND/src/features/profile/AvatarCropModal.css
    - FRONTEND/src/features/profile/ProfilePage.jsx
  key_links:
    - AvatarCropModal crop UI renders circular handles
    - ProfilePage displays user's actual display_name from profile
---

<objective>
Fix three UI bugs identified in session screenshots: broken avatar crop UI with square corners, profile name mismatch showing wrong display name, and avatar preview not updating correctly after upload.

Purpose: Restore visual correctness of the profile editing flow so users see proper circular crop handles and their actual display name.
Output: Fixed AvatarCropModal.css, ProfilePage.jsx, and AvatarUpload.jsx with correct behavior.
</objective>

<execution_context>
@C:/Users/kinga/.config/opencode/gsd-core/workflows/execute-plan.md
@C:/Users/kinga/.config/opencode/gsd-core/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

@FRONTEND/src/features/profile/AvatarCropModal.jsx
@FRONTEND/src/features/profile/AvatarCropModal.css
@FRONTEND/src/features/profile/ProfilePage.jsx
@FRONTEND/src/features/profile/AvatarUpload.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix avatar crop modal circular UI</name>
  <files>FRONTEND/src/features/profile/AvatarCropModal.css</files>
  <action>
Add CSS overrides to AvatarCropModal.css to make the ReactCrop component display circular crop handles instead of square corners. The ReactCrop library uses `.ReactCrop__crop-selection` for the crop area and `.ReactCrop__drag-handle` for the corner handles. Add styles to:

1. Round the crop selection corners to match the circularCrop prop behavior
2. Make drag handles circular (border-radius: 50%) and smaller (8px-10px)
3. Ensure the crop overlay outside the selection is properly masked

Reference the existing `.avatar-crop-crop-area .ReactCrop` selector (line 86-88) and add new rules below it. The crop area already has `max-width: 100%` set.
  </action>
  <verify>
    <automated>cd FRONTEND && npm run lint -- src/features/profile/AvatarCropModal.css 2>&1 | head -5</automated>
  </verify>
  <done>Crop handles appear circular in the avatar upload modal, matching the circularCrop prop behavior</done>
</task>

<task type="auto">
  <name>Task 2: Fix profile display name and avatar preview sync</name>
  <files>FRONTEND/src/features/profile/ProfilePage.jsx, FRONTEND/src/features/profile/AvatarUpload.jsx</files>
  <action>
Fix two related issues in the profile flow:

**ProfilePage.jsx:** The display name field shows incorrect value. Ensure the component properly initializes from `profile.display_name` and that the `handleBlur` save function correctly persists to Supabase. Check that `fetchProfile` is called after update to refresh local state. The current code at lines 14-18 initializes from profile correctly, but verify the profile object from `useAuth()` is being fetched on mount.

**AvatarUpload.jsx:** After avatar upload completes, the preview state and the profile's avatar_url may desync. The `handleAvatarUpdated` callback (line 15-18) sets preview and calls fetchProfile, but the component renders `avatarUrl = preview || profile?.avatar_url` (line 20). Ensure that after `fetchProfile` completes, the preview is cleared or the profile's new avatar_url takes precedence. Add a useEffect that clears the preview when profile.avatar_url changes to match or exceed the preview URL.
  </action>
  <verify>
    <automated>cd FRONTEND && npm run lint -- src/features/profile/ProfilePage.jsx src/features/profile/AvatarUpload.jsx 2>&1 | head -10</automated>
  </verify>
  <done>Profile page shows correct display name, avatar preview updates correctly after upload without stale state</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| client→Supabase Storage | Avatar image upload crosses untrusted input boundary |
| client→Supabase DB | Profile update crosses untrusted input boundary |

## STRIDE Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation Plan |
|-----------|----------|-----------|----------|-------------|-----------------|
| T-qf-01 | Tampering | AvatarCropModal upload | medium | mitigate | File size limit (15MB) and type validation already in place |
| T-qf-02 | Info Disclosure | Profile display name | low | accept | Display name is visible to paired partner by design |
</threat_model>

<verification>
- Run `npm run lint` from FRONTEND/ — no new warnings
- Run `npm run build` from FRONTEND/ — build succeeds
- Visual check: Avatar crop modal shows circular handles, not square corners
- Visual check: Profile page displays correct user name
- Visual check: Avatar preview updates immediately after successful upload
</verification>

<success_criteria>
- Avatar crop modal renders with circular crop handles matching the circularCrop prop
- Profile page shows the authenticated user's actual display_name
- Avatar upload flow has no stale preview state after successful upload
- Lint passes with no new warnings
- Build succeeds
</success_criteria>

<output>
Create `.planning/quick/260730-tso-fix-all-remaining-bugs-from-the-previous/260730-tso-01-SUMMARY.md` when done
</output>
