---
status: complete
phase: 06-profile-enhancement-infrastructure-fixes
source: 06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md
started: 2026-07-28T17:15:00Z
updated: 2026-07-28T17:15:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 10
name: Migrations Ready for Future Phases
expected: |
  SQL migration files for shared_reminders and todo_lists/todo_items exist in supabase/migrations/. Tables have RLS policies for paired users.
awaiting: [testing complete]

## Tests

### 1. Avatar Crop Modal Opens
expected: Tapping the avatar circle on the Profile page opens a modal with a circular crop tool and an "Upload Photo" button.
result: pass

### 2. Circular Crop and Upload
expected: Selecting a photo shows it inside a circular crop overlay. Confirming the crop compresses the image and uploads it. A toast says "Profile photo updated" and the avatar updates with a cache-busted URL.
result: [pending]

### 3. Large File Rejection
expected: Selecting a file over 15MB shows an inline error: "File too large. Maximum size is 15MB."
result: pass

### 4. Display Name Auto-Save
expected: Typing a new display name and clicking away (blur) saves it silently. No save button is present. The name field has a 30-character max.
result: pass

### 5. StatusDot Shows Online/Offline
expected: A small dot appears next to the partner's avatar. It is green (#22C55E) when the partner is online and gray (#8B8FA3) when offline.
result: pass

### 6. Chat Header Dynamic Status
expected: In the chat header, the partner's status shows "Online" with a green dot when online. When offline for over 1 hour, it shows "last seen X ago" using relative time.
result: pass

### 7. PartnerProfileModal Bottom-Sheet
expected: Tapping the partner avatar in the Header opens a bottom-sheet modal showing the partner's avatar, display name, status dot, and a "Message" button. Tapping "Message" navigates to /chat.
result: pass

### 8. Drawer Partner Profile
expected: The Drawer shows a partner profile section (avatar + name) above the nav items. Tapping it opens PartnerProfileModal.
result: pass

### 9. Service Worker No Duplicate Registration
expected: No manual service worker registration code exists in main.jsx. The app boots without SW-related console errors.
result: pass

### 10. Migrations Ready for Future Phases
expected: SQL migration files for shared_reminders and todo_lists/todo_items exist in supabase/migrations/. Tables have RLS policies for paired users.
result: pass

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- gap_id: G-06-1
  truth: "Avatar crop modal opens when tapping avatar circle without crashing"
  status: resolved
  resolved_by: usePresence.js fix
  resolved_at: 2026-07-28

- gap_id: G-06-2
  truth: "PartnerProfileModal is clickable — Message button and overlay work correctly"
  status: failed
  reason: "User reported: PartnerProfileModal not clickable (não é clicavel). Clicks on modal content bubble to overlay close handler."
  severity: major
  test: 7
  root_cause: "Modal content div missing onClick stopPropagation, causing clicks to bubble to overlay's close handler"
  artifacts:
    - path: "FRONTEND/src/features/profile/PartnerProfileModal.jsx"
      issue: "partner-modal-content missing onClick stopPropagation"
  missing:
    - "Add onClick={(e) => e.stopPropagation()} to partner-modal-content"
  debug_session: ""
