# Phase 6: Profile Enhancement + Infrastructure Fixes - Research

**Researched:** 2026-07-28
**Domain:** User identity, image processing, real-time presence, database schema, PWA infrastructure
**Confidence:** HIGH

## Summary

Phase 6 delivers user-facing profile features (avatar upload with circular crop, display name editing, online status) and foundational infrastructure fixes (service worker cleanup, database tables for future phases). The research covers five key technical domains: image cropping with `react-image-crop`, client-side image compression using Canvas API, Supabase Realtime Presence for live status tracking, vite-plugin-pwa service worker registration, and database schema design with RLS policies for shared couple data.

**Primary recommendation:** Use `react-image-crop` v11.1.2 for circular avatar cropping, Canvas API for client-side compression (no external dependency needed), Supabase Realtime Presence for online status, and remove the manual service worker registration in `main.jsx` since `vite-plugin-pwa` handles it automatically.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Use `react-image-crop` library for circular crop tool (battle-tested, accessible)
- **D-02:** Pinch-to-zoom + pan interaction (feels native on mobile)
- **D-03:** Inline on profile page — tap avatar opens modal with photo picker + crop
- **D-04:** Strictly circular crop (fixed circle, user positions image)
- **D-05:** Green/gray dot in chat header only
- **D-06:** Relative time format ("5 minutes ago")
- **D-07:** Show "last seen" text only if offline >1h (reduces noise)
- **D-08:** Client-side compression before upload (reduces upload time)
- **D-09:** ~200KB target at 80% JPEG quality
- **D-10:** Cache busting via query param (`?v=timestamp`)
- **D-11:** Display avatars in profile page + chat header + drawer
- **D-12:** Full visibility for partners on shared tables (trust-based, simple)
- **D-13:** Supabase Realtime Presence for live status (no separate online_status table)
- **D-14:** Extended fields for reminders: id, pair_id, title, reminder_at, created_by, completed_at, notes, priority, category
- **D-15:** One todos table with `list_id` foreign key (simpler queries)
- **D-16:** Remove manual `navigator.serviceWorker.register` call in `main.jsx`
- **D-17:** Delete `public/sw.js` file if it exists
- **D-18:** Let `vite-plugin-pwa` handle all service worker registration
- **D-19:** Real-time sync via Supabase Realtime
- **D-20:** Updates appear in chat header + all past messages immediately
- **D-21:** 1-30 characters, no special character restrictions
- **D-22:** Auto-save on blur (no explicit save button)
- **D-23:** Tap avatar in chat header AND button in navigation drawer
- **D-24:** Show avatar + name + online status (basic info only)
- **D-25:** Modal/sheet overlay (less disruptive than full page)
- **D-26:** View only + "Message" button to jump to chat
- **D-27:** Toast with retry button on failure
- **D-28:** Reject files >15MB before compression
- **D-29:** Spinner on avatar during upload
- **D-30:** Success toast + immediate update everywhere

### the agent's Discretion
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Fix dual service worker registration (remove manual SW, use vite-plugin-pwa) | vite-plugin-pwa auto-registers by default; remove manual code in main.jsx |
| INFRA-02 | New `online_status` table with RLS | Using Realtime Presence instead (D-13) — no table needed |
| INFRA-03 | New `shared_reminders` table with pair_id RLS | Schema design with pair_id foreign key and RLS policies |
| INFRA-04 | New `todo_lists` and `todo_items` tables with pair_id RLS | Schema design with list_id foreign key pattern |
| INFRA-05 | `profiles` table partner-read policy (paired users can view partner profile) | Already implemented in 20260728_fix_security_and_profiles_rls.sql |
| INFRA-06 | Avatar cache busting after upload (append ?v=timestamp) | Query param pattern for cache invalidation |
| PROF-01 | User can upload a photo from device gallery or camera | File input with accept="image/*" attribute |
| PROF-02 | User can crop uploaded photo with circular crop tool | react-image-crop with circularCrop prop and aspect={1} |
| PROF-03 | Uploaded avatar is compressed before storage (target ~200KB) | Canvas API toBlob with quality 0.8 |
| PROF-04 | User can edit display name (shown in chat, profile, drawer) | Auto-save on blur with Supabase update |
| PROF-05 | Partner can see user's online status (green/gray dot) | Supabase Realtime Presence track/untrack |
| PROF-06 | Partner can see "last seen X ago" when user is offline | Date-fns formatDistanceToNow for relative time |
| PROF-07 | Online status updates via Supabase Realtime Presence | Presence channel with sync/join/leave events |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Avatar upload & crop | Browser / Client | API / Backend | Client-side crop + compression, then upload to Supabase storage |
| Display name editing | Browser / Client | API / Backend | Local state + Supabase update on blur |
| Online status tracking | Browser / Client | — | Realtime Presence is client-to-client via Supabase channel |
| Online status display | Browser / Client | — | UI rendering in header and partner profile |
| Service worker cleanup | Browser / Client | CDN / Static | Remove manual registration, let vite-plugin-pwa handle it |
| Database schema (reminders, todos) | Database / Storage | API / Backend | SQL migrations with RLS policies |
| Avatar cache busting | Browser / Client | CDN / Static | Query param on avatar URLs |
| Partner profile modal | Browser / Client | — | UI overlay triggered from header/drawer |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-image-crop | 11.1.2 | Circular crop tool for avatar | Battle-tested, accessible, circularCrop prop built-in |
| date-fns | 4.4.0 | Relative time formatting | Already in project, formatDistanceToNow for "5 min ago" |
| react-hot-toast | 2.6.0 | Error/success notifications | Already in project, toast with retry pattern |
| motion (framer-motion) | 12.42.2 | Modal animations | Already in project, AnimatePresence for modal transitions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Canvas API | built-in | Client-side image compression | Before upload to Supabase storage |
| Supabase Realtime Presence | built-in | Online status tracking | No additional library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-image-crop | react-easy-crop | react-image-crop has better circular crop support and more mature API |
| Canvas API compression | compressorjs | Canvas API is zero-dependency; compressorjs adds 7KB for similar functionality |
| Realtime Presence | online_status table | Presence is simpler, no polling, automatic cleanup on disconnect |

**Installation:**
```bash
cd FRONTEND
npm install react-image-crop
```

**Version verification:** Before writing the Standard Stack table, verify each recommended package exists and is current using the ecosystem-appropriate command:
```bash
npm view react-image-crop version          # 11.1.2 ✓
npm view date-fns version                  # 4.4.0 ✓
npm view react-hot-toast version           # 2.6.0 ✓
npm view motion version                    # 12.42.2 ✓
```
Document the verified version and publish date. Training data versions may be months stale — always confirm against the correct ecosystem registry.

## Package Legitimacy Audit

> **Required** whenever this phase installs external packages. Run the Package Legitimacy Gate protocol before completing this section.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react-image-crop | npm | 9+ years | 150K+/week | github.com/dominictobias/react-image-crop | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*Packages discovered via WebSearch or training data that have not been verified against an authoritative source are tagged `[ASSUMED]` and the planner must gate each install behind a `checkpoint:human-verify` task.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser / Client                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ ProfilePage  │    │  ChatHeader  │    │    Drawer    │      │
│  │  (Avatar +   │    │  (Partner    │    │  (Partner    │      │
│  │   Name Edit) │    │   Avatar +   │    │   Profile    │      │
│  └──────┬───────┘    │   Status)    │    │   Button)    │      │
│         │            └──────┬───────┘    └──────┬───────┘      │
│         │                   │                   │               │
│  ┌──────▼───────┐          │                   │               │
│  │  CropModal   │          │                   │               │
│  │ (react-image-│          │                   │               │
│  │  crop + Canvas│         │                   │               │
│  │  Compression)│          │                   │               │
│  └──────┬───────┘          │                   │               │
│         │                  │                   │               │
│  ┌──────▼──────────────────▼───────────────────▼───────┐      │
│  │              Supabase Client SDK                     │      │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │      │
│  │  │   Storage   │  │  Realtime   │  │   Database  │ │      │
│  │  │  (avatars)  │  │ (Presence)  │  │ (profiles)  │ │      │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │      │
│  └─────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Backend                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Storage   │  │  Realtime   │  │  Postgres   │            │
│  │  (avatars)  │  │ (Presence)  │  │  (RLS)      │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
FRONTEND/src/
├── features/
│   ├── profile/
│   │   ├── ProfilePage.jsx      # Enhanced with crop modal
│   │   ├── AvatarUpload.jsx     # Replaced with crop-enabled version
│   │   ├── AvatarCropModal.jsx  # NEW: react-image-crop modal
│   │   ├── PartnerProfile.jsx   # Enhanced with online status
│   │   ├── PartnerProfileModal.jsx  # NEW: modal/sheet overlay
│   │   └── profile.css          # Enhanced styles
│   └── chat/
│       └── ChatView.jsx         # Enhanced with partner status
├── shared/
│   ├── components/
│   │   ├── Header.jsx           # Enhanced with online status dot
│   │   ├── Drawer.jsx           # Enhanced with partner profile button
│   │   └── header.css           # Enhanced with status dot styles
│   └── lib/
│       └── supabase.js          # Existing client
├── hooks/
│   └── usePresence.js           # NEW: Realtime Presence hook
├── stores/
│   └── authStore.js             # Enhanced with profile sync
└── main.jsx                     # Remove manual SW registration
```

### Pattern 1: Avatar Upload with Crop + Compression
**What:** User taps avatar → modal opens with photo picker → crop tool → compress → upload → update profile
**When to use:** Any time user wants to change their avatar
**Example:**
```jsx
// Source: react-image-crop documentation + Canvas API
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function AvatarCropModal({ isOpen, onClose, onCropComplete }) {
  const [imgSrc, setImgSrc] = useState(null)
  const [crop, setCrop] = useState(null)
  const [completedCrop, setCompletedCrop] = useState(null)

  const onSelectFile = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Reject files > 15MB (D-28)
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File too large. Max 15MB.')
        return
      }
      const reader = new FileReader()
      reader.onload = () => setImgSrc(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = (e) => {
    const { naturalWidth: width, naturalHeight: height } = e.currentTarget
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width, height
    )
    setCrop(crop)
  }

  const handleUpload = async () => {
    if (!completedCrop || !imgSrc) return

    // Compress using Canvas API (D-08, D-09)
    const compressedBlob = await compressImage(imgSrc, completedCrop, 0.8)

    // Upload to Supabase storage
    const filePath = `${user.id}/avatar.${Date.now()}.jpg`
    await supabase.storage.from('avatars').upload(filePath, compressedBlob, { upsert: true })

    // Get public URL with cache busting (D-10)
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath)
    const avatarUrl = `${urlData.publicUrl}?v=${Date.now()}`

    // Update profile
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
    onCropComplete(avatarUrl)
    onClose()
  }

  return (
    <ReactCrop crop={crop} onChange={setCrop} circularCrop aspect={1}>
      <img src={imgSrc} onLoad={onImageLoad} />
    </ReactCrop>
  )
}

// Canvas compression helper (D-08, D-09)
async function compressImage(imgSrc, crop, quality = 0.8) {
  const img = await createImageBitmap(await fetch(imgSrc).then(r => r.blob()))
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // Apply crop coordinates
  canvas.width = crop.width
  canvas.height = crop.height
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
}
```

### Pattern 2: Online Status via Realtime Presence
**What:** Track user online/offline status using Supabase Realtime Presence
**When to use:** When you need to show partner's online status
**Example:**
```jsx
// Source: Supabase Realtime Presence documentation
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function usePresence(pairId, userId) {
  const [isOnline, setIsOnline] = useState(false)
  const [lastSeen, setLastSeen] = useState(null)

  useEffect(() => {
    if (!pairId || !userId) return

    const channel = supabase.channel(`pair:${pairId}`, {
      config: { presence: { key: userId } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const partnerPresences = Object.values(state).flat()
        if (partnerPresences.length > 0) {
          setIsOnline(true)
          setLastSeen(new Date(partnerPresences[0].online_at))
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setIsOnline(false)
        if (leftPresences.length > 0) {
          setLastSeen(new Date(leftPresences[0].online_at))
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [pairId, userId])

  return { isOnline, lastSeen }
}

// Usage in Header.jsx
function Header({ onMenuClick }) {
  const { isOnline, lastSeen } = usePresence(pairId, partnerId)

  return (
    <header className="header">
      {/* ... */}
      <div className="header-center">
        <div className="header-avatar">
          <img src={partner.avatar_url} alt="" />
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
        </div>
        <span className="header-partner-name">{partner.display_name}</span>
        {!isOnline && lastSeen && (
          <span className="header-last-seen">
            {formatLastSeen(lastSeen)}
          </span>
        )}
      </div>
    </header>
  )
}

// Helper for relative time (D-06, D-07)
import { formatDistanceToNow } from 'date-fns'

function formatLastSeen(lastSeen) {
  const diff = Date.now() - lastSeen.getTime()
  const hours = diff / (1000 * 60 * 60)

  // D-07: Show "last seen" only if offline >1h
  if (hours < 1) return null

  return `last seen ${formatDistanceToNow(lastSeen, { addSuffix: true })}`
}
```

### Pattern 3: Service Worker Cleanup
**What:** Remove manual service worker registration, let vite-plugin-pwa handle it
**When to use:** When vite-plugin-pwa is configured with registerType: 'autoUpdate'
**Example:**
```jsx
// BEFORE (main.jsx) - REMOVE THIS CODE
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

// AFTER (main.jsx) - Just remove the above block
// vite-plugin-pwa handles registration automatically
// when registerType: 'autoUpdate' is set in vite.config.js
```

### Anti-Patterns to Avoid
- **Hand-rolling image compression:** Use Canvas API toBlob() — it's built into browsers and handles edge cases like EXIF orientation
- **Polling for online status:** Use Supabase Realtime Presence — it's push-based and automatically handles disconnects
- **Separate online_status table:** Presence is ephemeral by nature; a table would require cleanup logic
- **Manual SW registration with vite-plugin-pwa:** Causes dual registration conflicts — let the plugin handle it

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image cropping UI | Custom canvas crop tool | react-image-crop | Handles edge cases, accessibility, touch events |
| Image compression | Custom encoder | Canvas API toBlob() | Built-in, handles format conversion |
| Online status tracking | Polling + database table | Supabase Realtime Presence | Push-based, automatic cleanup |
| Relative time display | Custom date formatting | date-fns formatDistanceToNow | Handles edge cases, locale support |
| Service worker registration | Manual navigator.serviceWorker.register | vite-plugin-pwa | Handles updates, caching strategies |

**Key insight:** Browser APIs (Canvas, Realtime Presence) are sufficient for this phase — no external libraries needed beyond react-image-crop for the crop UI.

## Common Pitfalls

### Pitfall 1: Dual Service Worker Registration
**What goes wrong:** App registers both `/sw.js` (manual) and vite-plugin-pwa's generated SW, causing conflicts
**Why it happens:** Manual registration code in main.jsx was added before vite-plugin-pwa was configured
**How to avoid:** Remove the manual registration block in main.jsx; vite-plugin-pwa with `registerType: 'autoUpdate'` handles it automatically
**Warning signs:** Console warnings about SW already registered, update loops

### Pitfall 2: Avatar Cache Not Busting
**What goes wrong:** Partner sees old avatar after user uploads new one
**Why it happens:** Browser caches avatar URLs; Supabase storage URLs don't change with upsert
**How to avoid:** Append `?v=timestamp` query param to avatar URL after upload (D-10)
**Warning signs:** Partner reports seeing stale avatar

### Pitfall 3: Presence Channel Not Cleaned Up
**What goes wrong:** Memory leak from orphaned presence channels
**Why it happens:** Channel not removed when component unmounts
**How to avoid:** Return cleanup function in useEffect that calls `supabase.removeChannel(channel)`
**Warning signs:** Increasing memory usage, presence events after user leaves

### Pitfall 4: Crop Coordinates Not Applied to Compression
**What goes wrong:** Uploaded image is uncropped (full original image)
**Why it happens:** Canvas drawImage uses wrong coordinates
**How to avoid:** Pass completedCrop to compression function, apply crop.x/y/width/height in drawImage
**Warning signs:** Avatar shows full uncropped image

### Pitfall 5: Display Name Auto-Save on Every Keystroke
**What goes wrong:** Excessive database writes while user types
**Why it happens:** Saving on onChange instead of onBlur
**How to avoid:** Use onBlur handler for save, not onChange (D-22)
**Warning signs:** High database write count, laggy input

## Code Examples

Verified patterns from official sources:

### react-image-crop Circular Crop
```jsx
// Source: https://github.com/dominictobias/react-image-crop
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

function CropDemo({ src }) {
  const [crop, setCrop] = useState()
  const [completedCrop, setCompletedCrop] = useState()

  return (
    <ReactCrop
      crop={crop}
      onChange={(c) => setCrop(c)}
      onComplete={(c) => setCompletedCrop(c)}
      circularCrop
      aspect={1}
    >
      <img src={src} />
    </ReactCrop>
  )
}
```

### Supabase Realtime Presence
```javascript
// Source: https://supabase.com/docs/guides/realtime/presence
const channel = supabase.channel('room_01')

channel
  .on('presence', { event: 'sync' }, () => {
    const newState = channel.presenceState()
    console.log('sync', newState)
  })
  .on('presence', { event: 'join' }, ({ key, newPresences }) => {
    console.log('join', key, newPresences)
  })
  .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
    console.log('leave', key, leftPresences)
  })
  .subscribe()

channel.subscribe(async (status) => {
  if (status !== 'SUBSCRIBED') { return }
  const presenceTrackStatus = await channel.track({
    user: 'user-1',
    online_at: new Date().toISOString(),
  })
})
```

### Canvas Image Compression
```javascript
// Source: https://pqina.nl/blog/compress-image-before-upload/
const compressImage = async (file, { quality = 0.8, type = 'image/jpeg' }) => {
  const imageBitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = imageBitmap.width
  canvas.height = imageBitmap.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(imageBitmap, 0, 0)

  return await new Promise((resolve) =>
    canvas.toBlob(resolve, type, quality)
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual SW registration | vite-plugin-pwa auto-registration | Phase 6 | Simplifies main.jsx, prevents dual registration |
| No avatar compression | Canvas API client-side compression | Phase 6 | Reduces upload time, saves storage |
| No online status | Supabase Realtime Presence | Phase 6 | Real-time status without polling |
| Manual avatar upload | Crop + compress + upload flow | Phase 6 | Better UX, smaller file sizes |

**Deprecated/outdated:**
- Manual `navigator.serviceWorker.register('/sw.js')`: Replaced by vite-plugin-pwa auto-registration
- Separate `online_status` table: Replaced by Realtime Presence (ephemeral, no cleanup needed)

## Assumptions Log

> List all claims tagged `[ASSUMED]` in this research. The planner and discuss-phase use this
> section to identify decisions that need user confirmation before execution.

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | react-image-crop v11.1.2 supports React 19 | Standard Stack | May need to check compatibility |
| A2 | Canvas API toBlob quality 0.8 produces ~200KB for typical avatar | Common Pitfalls | Actual size depends on image content |
| A3 | Supabase Realtime Presence works with RLS-protected channels | Architecture Patterns | May need channel config adjustments |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **react-image-crop React 19 compatibility**
   - What we know: Package exists on npm (v11.1.2), last published recently
   - What's unclear: Whether it's been tested with React 19
   - Recommendation: Install and test; fall back to react-easy-crop if issues

2. **Canvas compression performance on mobile**
   - What we know: Canvas API works in all modern browsers
   - What's unclear: Performance on low-end mobile devices
   - Recommendation: Test on target devices; consider Web Worker if needed

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | npm install | ✓ | v24.16.0 | — |
| npm | Package management | ✓ | — | — |
| Supabase project | Backend services | ✓ | — | — |

**Missing dependencies with no fallback:**
- None

**Missing dependencies with fallback:**
- None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | vite.config.js (test section) |
| Quick run command | `npm run test` |
| Full suite command | `npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | No manual SW registration | unit | `grep -r "serviceWorker.register" FRONTEND/src/` | ❌ Wave 0 |
| PROF-01 | File input accepts images | unit | `npm run test:run -- --grep "avatar"` | ❌ Wave 0 |
| PROF-02 | Circular crop renders | unit | `npm run test:run -- --grep "crop"` | ❌ Wave 0 |
| PROF-03 | Compression produces <300KB | unit | `npm run test:run -- --grep "compress"` | ❌ Wave 0 |
| PROF-04 | Name saves on blur | unit | `npm run test:run -- --grep "display"` | ❌ Wave 0 |
| PROF-05 | Online dot renders | unit | `npm run test:run -- --grep "presence"` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `FRONTEND/src/test/AvatarUpload.test.jsx` — covers PROF-01, PROF-02, PROF-03
- [ ] `FRONTEND/src/test/usePresence.test.js` — covers PROF-05, PROF-06, PROF-07
- [ ] `FRONTEND/src/test/ProfilePage.test.jsx` — covers PROF-04

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (existing) |
| V3 Session Management | yes | Supabase Auth (existing) |
| V4 Access Control | yes | RLS policies on all tables |
| V5 Input Validation | yes | File type/size validation, name length limits |
| V6 Cryptography | no | No encryption needed for this phase |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Large file DoS | Denial of Service | Reject files >15MB before processing |
| Avatar URL manipulation | Tampering | RLS policies, storage folder restrictions |
| Presence spoofing | Tampering | Supabase channel auth, presence key = user ID |
| Name injection | Tampering | 1-30 char limit, no special char restrictions |

## Sources

### Primary (HIGH confidence)
- [react-image-crop GitHub](https://github.com/dominictobias/react-image-crop) - circularCrop prop, API documentation
- [Supabase Realtime Presence](https://supabase.com/docs/guides/realtime/presence) - track/untrack, sync/join/leave events
- [Canvas API toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - compression quality parameter
- [vite-plugin-pwa](https://github.com/vite-pwa/vite-plugin-pwa) - auto-registration behavior

### Secondary (MEDIUM confidence)
- [Image compression tutorial](https://pqina.nl/blog/compress-image-before-upload/) - Canvas compression pattern
- [Supabase RLS Guide](https://designrevision.com/blog/supabase-row-level-security) - pair_id pattern

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH - react-image-crop and Canvas API well-documented
- Architecture: HIGH - Supabase Realtime Presence is official feature
- Pitfalls: HIGH - Common issues documented in official docs

**Research date:** 2026-07-28
**Valid until:** 2026-08-28 (30 days for stable APIs)
