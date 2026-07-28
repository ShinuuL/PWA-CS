# Phase 4: Homepage Dashboard - Research

**Researched:** 2026-07-27
**Domain:** React dashboard with Supabase Realtime, Zustand state management, CSS gradients
**Confidence:** HIGH

## Summary

Phase 4 transforms the placeholder HomePage into a full-featured dashboard with three core components: a memory photo hero (random photo from shared album with gradient overlay), a mood selector (5 predefined emotions + custom text with real-time sync), and a partner mood display. The implementation leverages existing patterns from the codebase: Zustand stores for state management, Supabase Realtime for live updates, and co-located CSS for styling.

**Primary recommendation:** Extend the existing `useAlbumStore` pattern to create a new `useDashboardStore` for mood management, use PostgreSQL RPC for random photo selection (not client-side filtering), and apply CSS pseudo-element overlays for the hero image gradient effect.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Random photo selection | Database/Storage (RPC) | Frontend | Supabase RPC with `ORDER BY random()` avoids fetching all rows |
| Hero image display | Browser/Client | — | CSS background-image with gradient overlay pseudo-element |
| Mood selection UI | Browser/Client | — | Zustand store + React component with motion animations |
| Mood data persistence | Database/Storage | API/Backend | Supabase table with RLS policies |
| Real-time mood sync | Database/Storage (Realtime) | Browser/Client | Supabase Realtime subscription via Zustand store |
| Partner mood display | Browser/Client | — | Reads from same Zustand store, filtered by partner ID |

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | ^2.110.8 | Database, auth, realtime | Project standard — all CRUD through Supabase |
| `zustand` | ^5.0.14 | State management | Project standard — stores call Supabase directly |
| `motion` | ^12.42.2 | Animations | Project standard — `AnimatePresence` for mood transitions |
| `lucide-react` | ^1.26.0 | Icons | Project standard — Camera, SmilePlus icons needed |
| `date-fns` | ^4.4.0 | Date formatting | Project standard — photo date display |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `react-hot-toast` | ^2.6.0 | User feedback | Show "Mood saved" confirmation on selection |

**Installation:** No new packages needed — all dependencies already in `package.json`.

**Version verification:** All packages verified in `FRONTEND/package.json` (lines 16-25).

## Package Legitimacy Audit

> No external packages to install — this phase uses only existing dependencies.

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| N/A | — | — | — | — | — | No new packages |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HomePage (Dashboard)                      │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MemoryHero.jsx                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Background Image (random photo from album)     │  │  │
│  │  │  + CSS ::before pseudo-element gradient overlay │  │  │
│  │  │  + Caption & Date (z-index: 2)                  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  PartnerMood.jsx                                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Avatar+Name │  │ Emoji Card  │  │ Custom Text │  │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MoodSelector.jsx                                     │  │
│  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │  │
│  │  │ 😊  │ │ 😴  │ │ 😢  │ │ 💕  │ │ 🥺  │ │ ✏️  │  │  │
│  │  │Happy│ │Tired│ │Sad  │ │Miss │ │Need │ │Custom│  │  │
│  │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MiniAlbum.jsx (existing)                             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ useDashboardStore│ │ useAlbumStore  │  │ usePairing     │
│ (NEW)           │  │ (EXISTING)     │  │ (EXISTING)     │
└────────────────┘  └────────────────┘  └────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Client                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   moods     │  │album_photos │  │   pairs     │        │
│  │   (NEW)     │  │  (EXISTING) │  │ (EXISTING)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                    │                    │         │
│         ▼                    ▼                    ▼         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Supabase Realtime (postgres_changes)               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure

```
FRONTEND/src/
├── features/
│   ├── dashboard/           # NEW feature directory
│   │   ├── HomePage.jsx     # Main dashboard container
│   │   ├── dashboard.css    # All dashboard styles
│   │   ├── MemoryHero.jsx   # Random photo hero with gradient
│   │   ├── MoodSelector.jsx # 5 emotions + custom grid
│   │   ├── PartnerMood.jsx  # Partner's mood display
│   │   └── MoodModal.jsx    # Custom mood text input modal
│   └── album/
│       └── MiniAlbum.jsx    # Existing — embed in dashboard
└── stores/
    └── dashboardStore.js    # NEW — mood state + realtime
```

### Pattern 1: Zustand Store with Supabase Realtime

**What:** Centralized state management with real-time subscription for mood updates
**When to use:** Any feature requiring live updates between partners
**Example:**

```javascript
// Source: Existing pattern in chatStore.js (lines 97-183)
import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import useAuthStore from './authStore'

const useDashboardStore = create((set, get) => ({
  myMood: null,
  partnerMood: null,
  randomPhoto: null,
  loading: false,
  subscription: null,

  initializeDashboard: async (pairId) => {
    const { user } = useAuthStore.getState()
    if (!user || !pairId) return

    set({ loading: true })

    // Fetch my mood
    const { data: myMood } = await supabase
      .from('moods')
      .select('*')
      .eq('pair_id', pairId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Fetch partner's mood
    const { data: partnerMood } = await supabase
      .from('moods')
      .select('*')
      .eq('pair_id', pairId)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    set({ myMood, partnerMood, loading: false })

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`moods:${pairId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'moods',
        filter: `pair_id=eq.${pairId}`
      }, (payload) => {
        const { new: newMood } = payload
        const state = get()
        if (newMood.user_id === user.id) {
          set({ myMood: newMood })
        } else {
          set({ partnerMood: newMood })
        }
      })
      .subscribe()

    set({ subscription: channel })
  },

  setMood: async (moodType, customText = null) => {
    const { user } = useAuthStore.getState()
    const { myMood } = get()
    if (!user) return

    // Optimistic update
    const optimisticMood = {
      id: myMood?.id || `temp-${Date.now()}`,
      mood_type: moodType,
      custom_text: customText,
      user_id: user.id,
      created_at: new Date().toISOString()
    }
    set({ myMood: optimisticMood })

    // Upsert to database (one mood per user per day)
    const { error } = await supabase
      .from('moods')
      .upsert({
        pair_id: get().pairId,
        user_id: user.id,
        mood_type: moodType,
        custom_text: customText,
        updated_at: new Date().toISOString()
      }, { onConflict: 'pair_id,user_id' })

    if (error) {
      // Revert optimistic update on error
      set({ myMood })
    }
  },

  cleanup: () => {
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({ subscription: null, myMood: null, partnerMood: null })
  }
}))
```

### Pattern 2: CSS Gradient Overlay for Hero Image

**What:** Full-width hero with gradient fading from transparent to background color
**When to use:** Any full-bleed image needing text overlay at bottom
**Example:**

```css
/* Source: Cloudinary guide + existing album.css patterns */
.memory-hero {
  position: relative;
  width: 100%;
  height: 50vh;
  min-height: 300px;
  max-height: 500px;
  overflow: hidden;
}

.memory-hero__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Gradient overlay — fades from transparent at top to dark at bottom */
.memory-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(10, 12, 20, 0.3) 50%,
    rgba(10, 12, 20, 0.85) 100%
  );
  z-index: 1;
  pointer-events: none;
}

/* Caption and date — positioned at bottom over gradient */
.memory-hero__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5rem;
  z-index: 2;
  color: white;
}

.memory-hero__caption-text {
  font-size: 1.125rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.memory-hero__caption-date {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.7);
}
```

### Pattern 3: Emoji Grid Layout for Mood Selector

**What:** 2x3 grid of card-style items with emojis and labels
**When to use:** Any selection grid with icons and text
**Example:**

```css
/* Source: Design system cosmic-v2.html card patterns */
.mood-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0.5rem;
}

.mood-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem 0.5rem;
  background: var(--color-bg-card);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 80px;
}

.mood-card:hover {
  border-color: var(--color-border);
  transform: translateY(-2px);
}

.mood-card--selected {
  border-color: var(--color-primary);
  box-shadow: 0 0 20px rgba(184, 124, 255, 0.3);
}

.mood-card__emoji {
  font-size: 1.75rem;
  margin-bottom: 0.375rem;
}

.mood-card__label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.mood-card--selected .mood-card__label {
  color: var(--color-primary);
}
```

### Anti-Patterns to Avoid

- **Client-side random selection:** Don't fetch all photos and pick random in JS — use PostgreSQL RPC with `ORDER BY random() LIMIT 1` for efficiency
- **Polling for mood updates:** Don't use `setInterval` to check partner's mood — use Supabase Realtime subscription
- **Separate mood records per day:** Don't create new rows daily — use upsert with `pair_id,user_id` conflict to update in place
- **Opacity on parent element:** Don't apply `opacity` to hero container — use `::before` pseudo-element for gradient overlay to avoid affecting text readability

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Random photo selection | Client-side array shuffle | PostgreSQL RPC `ORDER BY random() LIMIT 1` | Avoids fetching all rows; scales with album size |
| Real-time partner updates | Polling with `setInterval` | Supabase Realtime subscription | WebSocket efficiency; instant updates |
| Gradient overlay on image | Multiple div layers | CSS `::before` pseudo-element | Single element, better performance |
| Mood persistence | New row per mood change | Supabase upsert with conflict resolution | One mood per user per pair; clean data |

**Key insight:** The existing `chatStore.js` (lines 97-183) already implements the exact Realtime subscription pattern needed for mood updates. Copy that pattern, not a custom solution.

## Common Pitfalls

### Pitfall 1: Random Photo Performance
**What goes wrong:** Fetching all album photos and picking random in JavaScript causes slow initial load
**Why it happens:** Developers default to `.select('*')` then `Math.random()`
**How to avoid:** Create a Supabase RPC function: `get_random_album_photo(pair_id)` with `ORDER BY random() LIMIT 1`
**Warning signs:** Console shows large array in state; initial dashboard load > 2 seconds

### Pitfall 2: Mood Realtime Subscription Leaks
**What goes wrong:** Subscriptions accumulate when component remounts without cleanup
**Why it happens:** Missing `cleanup()` in useEffect return or store cleanup
**How to avoid:** Follow existing pattern: check `if (current.subscription) return` before creating new channel; always call `cleanup()` in useEffect return
**Warning signs:** Multiple WebSocket connections in Network tab; memory usage grows

### Pitfall 3: Gradient Overlay Blocks Clicks
**What goes wrong:** Gradient overlay intercepts touch/click events on hero image
**Why it happens:** Missing `pointer-events: none` on pseudo-element
**How to avoid:** Always add `pointer-events: none` to `::before` overlay
**Warning signs:** Hero image not clickable; tap does nothing

### Pitfall 4: Mood Upsert Conflict
**What goes wrong:** Multiple mood records created for same user instead of updating
**Why it happens:** Missing `onConflict` parameter in upsert call
**How to avoid:** Use `.upsert({ ... }, { onConflict: 'pair_id,user_id' })` and ensure unique constraint exists
**Warning signs:** Multiple mood records per user in database; partner sees stale mood

### Pitfall 5: Hero Image Layout Shift
**What goes wrong:** Page jumps when image loads because dimensions unknown
**Why it happens:** No aspect-ratio or min-height set on container
**How to avoid:** Set `min-height: 300px; max-height: 500px;` on `.memory-hero` container
**Warning signs:** CLS warnings in Lighthouse; visual jank on load

## Code Examples

### Random Photo RPC (PostgreSQL)

```sql
-- Source: Supabase community discussion (github.com/orgs/supabase/discussions/34315)
CREATE OR REPLACE FUNCTION get_random_album_photo(p_pair_id UUID)
RETURNS TABLE (
  id UUID,
  url TEXT,
  caption TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT id, url, caption, created_at
  FROM album_photos
  WHERE pair_id = p_pair_id
  ORDER BY random()
  LIMIT 1;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_random_album_photo(UUID) TO authenticated;
```

### Memory Hero Component

```jsx
// Source: Cloudinary CSS gradient guide + existing album.css patterns
import { useEffect, useState } from 'react'
import { usePairing } from '../pairing/usePairing'
import { supabase } from '../../shared/lib/supabase'
import { format } from 'date-fns'

export default function MemoryHero() {
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const { checkPairStatus } = usePairing()

  useEffect(() => {
    const loadRandomPhoto = async () => {
      const pair = await checkPairStatus()
      if (!pair) return

      const { data } = await supabase.rpc('get_random_album_photo', {
        p_pair_id: pair.id
      })

      if (data) setPhoto(data)
      setLoading(false)
    }

    loadRandomPhoto()
  }, [checkPairStatus])

  if (loading) {
    return <div className="memory-hero memory-hero--skeleton" />
  }

  if (!photo) {
    return (
      <div className="memory-hero memory-hero--empty">
        <Camera size={48} />
        <p>Add your first photo together</p>
      </div>
    )
  }

  return (
    <div className="memory-hero">
      <img
        className="memory-hero__image"
        src={photo.url}
        alt={photo.caption || 'Memory photo'}
      />
      <div className="memory-hero__caption">
        {photo.caption && (
          <div className="memory-hero__caption-text">{photo.caption}</div>
        )}
        <div className="memory-hero__caption-date">
          {format(new Date(photo.created_at), 'MMMM d, yyyy')}
        </div>
      </div>
    </div>
  )
}
```

### Mood Selector Component

```jsx
// Source: Design system cosmic-v2.html card patterns + motion docs
import { motion, AnimatePresence } from 'motion/react'
import useDashboardStore from '../../stores/dashboardStore'

const MOODS = [
  { type: 'happy', emoji: '😊', label: 'Happy' },
  { type: 'tired', emoji: '😴', label: 'Tired' },
  { type: 'sad', emoji: '😢', label: 'Sad' },
  { type: 'missing', emoji: '💕', label: 'Missing' },
  { type: 'needy', emoji: '🥺', label: 'Needy' },
  { type: 'custom', emoji: '✏️', label: 'Custom' }
]

export default function MoodSelector() {
  const { myMood, setMood } = useDashboardStore()
  const [showCustomModal, setShowCustomModal] = useState(false)

  const handleMoodSelect = (moodType) => {
    if (moodType === 'custom') {
      setShowCustomModal(true)
    } else {
      setMood(moodType)
    }
  }

  return (
    <div className="mood-section">
      <h3 className="mood-section__title">How are you feeling?</h3>
      <div className="mood-grid">
        {MOODS.map((mood) => (
          <motion.button
            key={mood.type}
            className={`mood-card ${myMood?.mood_type === mood.type ? 'mood-card--selected' : ''}`}
            onClick={() => handleMoodSelect(mood.type)}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="mood-card__emoji">{mood.emoji}</span>
            <span className="mood-card__label">{mood.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {showCustomModal && (
          <MoodModal onClose={() => setShowCustomModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
```

### Partner Mood Display

```jsx
// Source: Existing patterns in chatStore.js (lines 172-182)
import { motion, AnimatePresence } from 'motion/react'
import useDashboardStore from '../../stores/dashboardStore'
import useAuthStore from '../../stores/authStore'

export default function PartnerMood() {
  const { partnerMood } = useDashboardStore()
  const { profile } = useAuthStore()

  return (
    <div className="partner-mood">
      <AnimatePresence mode="wait">
        {partnerMood ? (
          <motion.div
            key={partnerMood.mood_type}
            className="partner-mood__content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="partner-mood__header">
              <img
                className="partner-mood__avatar"
                src={partnerMood.avatar_url}
                alt={partnerMood.display_name}
              />
              <span className="partner-mood__name">
                {partnerMood.display_name} is feeling
              </span>
            </div>
            <div className="partner-mood__emoji">
              {getMoodEmoji(partnerMood.mood_type)}
            </div>
            {partnerMood.custom_text && (
              <div className="partner-mood__text">
                "{partnerMood.custom_text}"
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            className="partner-mood__empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="partner-mood__empty-emoji">💭</span>
            <span>Ask how they're feeling...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getMoodEmoji(type) {
  const moods = {
    happy: '😊',
    tired: '😴',
    sad: '😢',
    missing: '💕',
    needy: '🥺'
  }
  return moods[type] || '😊'
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side random selection | PostgreSQL RPC with `ORDER BY random()` | 2024 (Supabase community) | Better performance for large albums |
| Polling for updates | Supabase Realtime subscriptions | 2023 (project established) | Instant updates, lower bandwidth |
| New row per mood change | Upsert with conflict resolution | Best practice | Cleaner data, one mood per user |

**Deprecated/outdated:**
- `Math.random()` for photo selection — use PostgreSQL RPC instead
- `setInterval` for live updates — use Supabase Realtime

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `album_photos` table already has `pair_id` column | Random Photo RPC | RPC won't work; need to verify schema |
| A2 | Supabase Realtime is enabled for the project | Realtime subscription | Subscriptions will fail silently |
| A3 | `date-fns` format function works with ISO date strings | Memory Hero | Date display will show raw ISO string |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **Database Schema for Moods Table**
   - What we know: Need `moods` table with `pair_id`, `user_id`, `mood_type`, `custom_text`, `created_at`
   - What's unclear: Exact column types, indexes, and RLS policies
   - Recommendation: Create migration with UUID primary key, foreign keys to `pairs` and `profiles`, unique constraint on `(pair_id, user_id)` for upsert

2. **Supabase Realtime Configuration**
   - What we know: Project uses Supabase hosted service
   - What's unclear: Whether Realtime is enabled for new `moods` table
   - Recommendation: Enable Realtime via Supabase dashboard or migration SQL

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI | Migrations | ✓ | — | Manual SQL in dashboard |
| Node.js | Dev server | ✓ | — | — |
| npm | Package management | ✓ | — | — |

**Missing dependencies with no fallback:** None

**Missing dependencies with fallback:** None

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.10 |
| Config file | `FRONTEND/vitest.config.js` (assumed) |
| Quick run command | `cd FRONTEND && npm run test:run` |
| Full suite command | `cd FRONTEND && npm run test:run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-01 | Random photo displays from album | unit | `npm run test:run -- dashboard` | ❌ Wave 0 |
| HOME-02 | User can select mood from grid | unit | `npm run test:run -- MoodSelector` | ❌ Wave 0 |
| HOME-03 | Partner mood visible in real-time | integration | `npm run test:run -- PartnerMood` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test:run`
- **Per wave merge:** `npm run test:run`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `FRONTEND/src/features/dashboard/__tests__/MemoryHero.test.jsx` — covers HOME-01
- [ ] `FRONTEND/src/features/dashboard/__tests__/MoodSelector.test.jsx` — covers HOME-02
- [ ] `FRONTEND/src/features/dashboard/__tests__/PartnerMood.test.jsx` — covers HOME-03
- [ ] `FRONTEND/src/stores/__tests__/dashboardStore.test.js` — covers store logic

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V4 Access Control | yes | RLS policies on `moods` table — users can only read/write own pair |
| V5 Input Validation | yes | Mood type validation (enum check), custom text length limit |

### Known Threat Patterns for Supabase Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Mood spoofing | Tampering | RLS policy: `auth.uid() = user_id` on INSERT/UPDATE |
| Partner mood manipulation | Elevation of Privilege | RLS policy: SELECT only for users in same pair |

## Sources

### Primary (HIGH confidence)
- Supabase Docs: Subscribing to Database Changes — https://supabase.com/docs/guides/realtime/subscribing-to-database-changes
- Motion.dev: Layout Animations — https://motion.dev/docs/react-layout-animations
- Existing codebase: `chatStore.js`, `albumStore.js`, `album.css`

### Secondary (MEDIUM confidence)
- Supabase Community: Random row selection RPC — https://github.com/orgs/supabase/discussions/34315
- Cloudinary: CSS Gradient Over Image — https://cloudinary.com/guides/image-effects/css-gradient-over-image

### Tertiary (LOW confidence)
- DBA StackExchange: PostgreSQL random row performance — https://dba.stackexchange.com/questions/259205

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages already in project, patterns established in existing code
- Architecture: HIGH — follows existing Zustand + Supabase Realtime patterns exactly
- Pitfalls: MEDIUM — based on common Supabase/React issues, verified against existing code patterns

**Research date:** 2026-07-27
**Valid until:** 2026-08-27 (30 days — stable stack, no fast-moving dependencies)
