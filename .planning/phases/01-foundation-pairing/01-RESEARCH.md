# Phase 1: Foundation & Pairing - Research

**Researched:** 2026-07-24
**Domain:** React PWA + Supabase Auth/DB/Storage + Vite
**Confidence:** HIGH

## Summary

Phase 1 builds the entire foundation of CoupleSpace: a React 19 + Vite PWA with Supabase for authentication (Google OAuth), database (users + pairs tables with RLS), storage (avatar uploads), and the app shell with side drawer navigation. This is a greenfield phase — no code exists yet. Every subsequent phase depends on this foundation being rock-solid.

The research confirms the pre-decided stack (React + Vite + Supabase + FastAPI) is the right combination, validated by multiple production couple apps (Supabase Kizuna, A.B.E.L, document-copilot). The Supabase-first architecture means Phase 1 can be fully functional without FastAPI — the React SPA talks directly to Supabase for auth, database queries, and storage. FastAPI is only needed later for external API proxying.

The two most critical architectural decisions in this phase are (1) the database schema design — users table, pairs table, and the `pair_id` as universal access key with RLS policies — and (2) the PWA configuration via `vite-plugin-pwa` which must be correct from the start. The side drawer navigation (not bottom tabs) is a locked design decision that needs careful mobile-first implementation with smooth animations.

**Primary recommendation:** Follow the Supabase official React user management example as the foundation pattern, extend it with a `pairs` table and pair-isolation RLS policies, and use `vite-plugin-pwa` with `generateSW` strategy for PWA configuration. Build the side drawer with CSS transitions + Motion for React animations — no external drawer library needed.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Invite code only (no link sharing). Short numeric code, partner enters it to pair.
- **D-02:** One-time use codes — expires after first successful use. User generates a new code to re-pair.
- **D-03:** Block already-paired users from entering new codes. Must unpair first.
- **D-04:** Explicit unpair button in settings. Confirm dialog before unpairing.
- **D-05:** Side drawer navigation (not bottom tabs). Minimal items: Chat, Homepage, Agenda, Settings.
- **D-06:** User lands on Homepage dashboard after login (primary daily view).
- **D-07:** Unpaired users see pairing screen first — no guided onboarding flow.
- **D-08:** Header shows partner's name + avatar (personal, romantic feel).
- **D-09:** Drawer accessible before pairing but most items locked/greyed out. Settings always available.
- **D-10:** Separate profile edit page (not inline editing). Tap partner name/avatar in drawer to view their profile (read-only).
- **D-11:** Avatar upload uses camera/gallery picker with crop. Standard mobile pattern.
- **D-12:** Display name required at first login. Profile picture optional.

### the agent's Discretion
- Database schema design (table structure, RLS policies, constraints)
- Supabase client SDK configuration
- PWA manifest and service worker setup
- CSS framework/styling approach
- State management pattern

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can sign in with Google OAuth | Supabase Auth + `signInWithOAuth({ provider: 'google' })` — well-documented official pattern |
| AUTH-02 | User session persists across browser refresh | Supabase-js manages session in localStorage automatically — built-in behavior |
| AUTH-03 | User can generate an invite code/link to pair with partner | Custom `invite_codes` table with random 6-digit numeric codes, one-time use, expiry |
| AUTH-04 | User can enter an invite code/link to connect with partner | Code lookup + atomic pair creation via Supabase DB function or RPC |
| AUTH-05 | Only two users can be paired per pairID | DB constraint: `pairs` table enforces max 2 users, RLS prevents unpaired access |
| PROF-01 | User can set display name | Profiles table with `display_name` column, required at first login |
| PROF-02 | User can upload profile picture | Supabase Storage `avatars` bucket + `<input type="file">` with crop |
| PROF-03 | User can customize profile icon/avatar | Avatar upload with camera/gallery picker + crop UI |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Google OAuth authentication | Browser (React SPA) | Supabase Auth (BaaS) | React calls `signInWithOAuth`, Supabase handles OAuth flow |
| Session persistence | Browser (localStorage) | Supabase Auth | supabase-js auto-manages JWT in localStorage |
| Invite code generation | Supabase (DB + RPC) | Browser (React SPA) | Code generation via DB function for atomicity |
| Pair creation | Supabase (DB + RLS) | Browser (React SPA) | Pair record + RLS policy enforcement at DB level |
| Profile display | Browser (React SPA) | Supabase (DB) | React renders profile data from Supabase query |
| Avatar upload | Browser (React SPA) | Supabase Storage | Browser picks file, uploads to Supabase Storage bucket |
| App shell / navigation | Browser (React SPA) | — | Side drawer + header + routing — pure frontend |
| PWA configuration | Vite build (vite-plugin-pwa) | Service Worker | Manifest + SW generated at build time |

## Standard Stack

### Core (Phase 1)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.8 | UI framework | Pre-decided by project. Latest stable. |
| Vite | 8.1.5 | Build tool & dev server | Pre-decided. Fastest React dev experience. |
| @supabase/supabase-js | 2.110.8 | Supabase client SDK | Auth, DB queries, Storage, Realtime — all via one client |
| react-router-dom | 7.18.1 | Client-side routing | Page navigation (auth, home, chat, settings) |
| vite-plugin-pwa | 1.3.0 | PWA generation | Generates service worker + manifest from Vite config |
| workbox-window | (via plugin) | SW registration | Included with vite-plugin-pwa |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | 5.0.14 | State management | Auth state, user session, pair info, UI state |
| motion | 12.42.2 | Animations | Drawer open/close, page transitions, micro-interactions |
| lucide-react | 1.26.0 | Icons | Nav items, buttons, UI icons — consistent icon set |
| react-hot-toast | 2.6.0 | Toast notifications | Success/error feedback for auth, pairing, profile updates |
| date-fns | 4.4.0 | Date utilities | Date formatting (not heavily used in Phase 1, but needed for timestamps) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| zustand | React Context + useReducer | Zustand is simpler, no provider boilerplate, better for cross-component state |
| motion | CSS transitions only | Motion provides spring physics, AnimatePresence for mount/unmount — worth the 33KB |
| lucide-react | heroicons / react-icons | lucide has best tree-shaking, consistent style, matches modern aesthetic |
| react-hot-toast | sonner / notistack | react-hot-toast is lighter, simpler API, sufficient for this use case |
| Custom drawer | react-burger-menu / drawer lib | Custom is ~50 lines with Motion, avoids dependency, full style control |

**Installation:**

```bash
# Frontend (in FRONTEND/ directory)
npm create vite@latest . -- --template react
npm install
npm install react-router-dom @supabase/supabase-js zustand date-fns lucide-react react-hot-toast
npm install -D vite-plugin-pwa workbox-window
npm install motion
```

**Version verification:** All versions confirmed via `npm view` on 2026-07-24.

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| react | npm | 13 yrs | 162M/wk | github.com/facebook/react | OK | Approved |
| vite | npm | 5 yrs | 158M/wk | github.com/vitejs/vite | OK | Approved |
| @supabase/supabase-js | npm | 4 yrs | 22M/wk | github.com/supabase/supabase-js | OK | Approved |
| zustand | npm | 5 yrs | 47M/wk | github.com/pmndrs/zustand | OK | Approved |
| react-router-dom | npm | 9 yrs | 43M/wk | github.com/remix-run/react-router | OK | Approved |
| motion | npm | 2 yrs | 16M/wk | github.com/motiondivision/motion | OK | Approved |
| vite-plugin-pwa | npm | 4 yrs | 4M/wk | github.com/vite-pwa/vite-plugin-pwa | OK | Approved |
| lucide-react | npm | 3 yrs | 97M/wk | github.com/lucide-icons/lucide | OK | Approved |
| date-fns | npm | 9 yrs | 95M/wk | github.com/date-fns/date-fns | OK | Approved |
| react-hot-toast | npm | 4 yrs | 4M/wk | github.com/timolins/react-hot-toast | OK | Approved |
| workbox-window | npm | 6 yrs | 8M/wk | github.com/googlechrome/workbox | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

*All packages verified via npm registry with high download counts and established source repositories.*

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CoupleSpace PWA (Vercel)                   │
│               React SPA + Service Worker + Workbox           │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Auth Module  │  │  Pair Module  │  │  Profile Module  │  │
│  │  (Google OAuth│  │  (invite code │  │  (display name,  │  │
│  │   login flow) │  │   pairing)    │  │   avatar upload) │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────────┘  │
│         │                 │                  │               │
│         └─────────────────┴──────────────────┘               │
│                            │                                 │
│                   ┌────────┴────────┐                        │
│                   │  Supabase Client │                        │
│                   │  (supabase-js)   │                        │
│                   └────────┬────────┘                        │
└────────────────────────────┼────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │  Supabase   │  │  Supabase   │  │  Supabase   │
    │  Auth       │  │  Database   │  │  Storage    │
    │  (OAuth)    │  │  (PG17+RLS) │  │  (avatars)  │
    └─────────────┘  └─────────────┘  └─────────────┘
```

### Recommended Project Structure

```
FRONTEND/
├── public/
│   ├── icons/              # PWA icons (192x192, 512x512)
│   └── favicon.ico
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx        # Google OAuth login button
│   │   │   ├── AuthCallback.jsx     # OAuth redirect handler
│   │   │   └── useAuth.js           # Auth state hook (session, user)
│   │   ├── pairing/
│   │   │   ├── PairingGate.jsx      # Redirects unpaired users
│   │   │   ├── GenerateCode.jsx     # Show invite code
│   │   │   ├── EnterCode.jsx        # Input invite code
│   │   │   └── usePairing.js        # Pairing state hook
│   │   └── profile/
│   │       ├── ProfilePage.jsx      # Edit own profile
│   │       ├── PartnerProfile.jsx   # View partner profile (read-only)
│   │       └── AvatarUpload.jsx     # Camera/gallery picker + crop
│   ├── shared/
│   │   ├── components/
│   │   │   ├── AppShell.jsx         # Layout: header + drawer + content
│   │   │   ├── Drawer.jsx           # Side drawer navigation
│   │   │   ├── Header.jsx           # Partner name + avatar header
│   │   │   └── ProtectedRoute.jsx   # Auth guard wrapper
│   │   ├── hooks/
│   │   │   └── useSupabase.js       # Supabase client singleton
│   │   └── lib/
│   │       ├── supabase.js          # createClient initialization
│   │       └── types.js             # Shared TypeScript/JSDoc types
│   ├── stores/
│   │   └── authStore.js             # Zustand store for auth/session state
│   ├── App.jsx                      # Router + route definitions
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles (CSS custom properties)
├── vite.config.js                   # Vite + PWA plugin config
├── index.html
└── package.json
```

### Pattern 1: Supabase Client Initialization

**What:** Create a single Supabase client instance used across the entire app.

**When:** App startup — every module imports from this one file.

**Why:** Single source of truth, env vars centralized, no duplicate clients.

```javascript
// Source: [CITED: supabase.com/docs/guides/getting-started/tutorials/with-react]
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Pattern 2: Google OAuth Sign-In

**What:** Call `signInWithOAuth` with Google provider, handle redirect callback.

**When:** User clicks "Sign in with Google" on login page.

**Why:** Supabase handles the entire OAuth flow — token exchange, session creation, user record creation.

```javascript
// Source: [CITED: supabase.com/docs/reference/javascript/auth-signinwithoauth]
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: window.location.origin + '/auth/callback'
  }
})
```

### Pattern 3: Auth State Management with onAuthStateChange

**What:** Subscribe to auth state changes to track login/logout across the app.

**When:** App mount — persistent listener that updates Zustand store.

**Why:** Reactive auth state — components re-render when user logs in/out.

```javascript
// Source: [CITED: supabase.com/docs/guides/getting-started/tutorials/with-react]
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    }
  )
  return () => subscription.unsubscribe()
}, [])
```

### Pattern 4: Row-Level Security for Pair Isolation

**What:** RLS policies that ensure users can only access data belonging to their pair.

**When:** Database schema setup — every table except `users` and `pairs` gets this pattern.

**Why:** Database-level security — even if frontend code has bugs, data stays isolated.

```sql
-- Source: [CITED: supabase.com/docs/guides/database/postgres/row-level-security]
-- Pattern: pair_members_can_read
CREATE POLICY "pair_members_can_read" ON messages
  FOR SELECT USING (
    pair_id IN (
      SELECT id FROM pairs
      WHERE user_one = auth.uid() OR user_two = auth.uid()
    )
  );
```

### Pattern 5: PWA Configuration with vite-plugin-pwa

**What:** Generate service worker + web manifest from Vite config.

**When:** Build time — `vite.config.js` configuration.

**Why:** Zero-config PWA with Workbox-powered caching, auto-update support.

```javascript
// Source: [CITED: vite-pwa-org.netlify.app]
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: {
    name: 'CoupleSpace',
    short_name: 'CoupleSpace',
    theme_color: '#B87CFF',
    background_color: '#0A0C14',
    display: 'standalone',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    navigateFallback: 'index.html',
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
        handler: 'StaleWhileRevalidate',
        options: { cacheName: 'supabase-storage' }
      }
    ]
  }
})
```

### Pattern 6: Avatar Upload with Supabase Storage

**What:** Upload avatar image to Supabase Storage, get public URL, update profile.

**When:** User taps avatar edit on profile page.

**Why:** Standard Supabase Storage pattern — upload file, get URL, store in DB.

```javascript
// Source: [CITED: supabase.com/docs/guides/getting-started/tutorials/with-react]
async function uploadAvatar(event) {
  const file = event.target.files[0]
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/avatar.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)

  await supabase.from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId)
}
```

### Anti-Patterns to Avoid

- **FastAPI as database proxy:** Don't route Supabase queries through FastAPI. Use supabase-js directly in React for all CRUD. FastAPI is only for external API proxying.
- **Storing secrets in frontend:** Never put Supabase service-role key, Google OAuth client secret, or any secret in React code. Only publishable keys (anon key, OAuth client ID) go in frontend.
- **Ignoring RLS:** Every table MUST have RLS enabled. Frontend filtering is for UX only, never for security. Without RLS, any user with the anon key can access all data.
- **Bottom tabs navigation:** D-05 locked side drawer navigation. Do not implement bottom tab navigation.
- **Inline profile editing:** D-10 locked separate profile edit page. Do not build inline editing.
- **Skip PWA config:** Don't treat PWA as an afterthought. Configure `vite-plugin-pwa` from the start — it affects the entire build pipeline.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OAuth flow | Custom OAuth implementation | Supabase Auth (`signInWithOAuth`) | Token exchange, session management, error handling already solved |
| Session persistence | Custom localStorage management | supabase-js (built-in) | Auto-refresh, secure storage, cross-tab sync |
| Database queries | Custom API endpoints for CRUD | Supabase client SDK | Direct DB access with RLS, no backend needed for CRUD |
| File upload/storage | Custom file server | Supabase Storage | CDN, access control, image transformations built-in |
| PWA service worker | Hand-written SW | vite-plugin-pwa + Workbox | Auto-generated SW, precaching, runtime caching strategies |
| Invitation code generation | Custom random code logic | PostgreSQL `gen_random_uuid()` or custom function | Atomic generation, uniqueness guaranteed by DB |
| Hamburger icon animation | Custom SVG animation | CSS transitions (3 bars → X) | ~10 lines of CSS, no library needed |
| Toast notifications | Custom notification system | react-hot-toast | Accessible, animated, lightweight, well-maintained |

**Key insight:** Supabase eliminates the need for a traditional backend for Phase 1. Auth, database, storage, and RLS are all handled by Supabase. The React SPA talks directly to Supabase via supabase-js. FastAPI is only needed in Phase 3+ for external API proxying.

## Common Pitfalls

### Pitfall 1: RLS Not Enabled on Tables
**What goes wrong:** Any user with the anon key can read/write all rows in the database. Massive security hole.
**Why it happens:** Developers forget to enable RLS or think frontend filtering is sufficient.
**How to avoid:** Enable RLS on EVERY table immediately after creation. Write at least one policy before testing. Test from the client SDK, not the SQL Editor (SQL Editor bypasses RLS).
**Warning signs:** Can query tables without being logged in; can see other users' data.

### Pitfall 2: OAuth Redirect URL Misconfiguration
**What goes wrong:** OAuth callback fails with "redirect_uri_mismatch" — users can't log in.
**Why it happens:** Google Cloud Console redirect URIs don't match Supabase callback URL. Common mistake: forgetting to add both localhost (dev) and production URL.
**How to avoid:** In Google Cloud Console, add `https://<project>.supabase.co/auth/v1/callback` AND `http://localhost:5173/auth/callback`. In Supabase Dashboard, add both URLs to Redirect URLs.
**Warning signs:** OAuth popup opens but closes without logging in; console shows redirect_uri_mismatch error.

### Pitfall 3: Session Not Persisting Across Refresh
**What goes wrong:** User logs in, refreshes page, and is logged out.
**Why it happens:** Supabase client not initialized correctly; or auth state not read on mount.
**How to avoid:** Call `supabase.auth.getSession()` on app mount to restore session. supabase-js stores tokens in localStorage by default — session persists automatically if client is initialized correctly.
**Warning signs:** Works in dev but not in production; works on first load but not after refresh.

### Pitfall 4: Invite Code Race Condition
**What goes wrong:** Two users try to use the same invite code simultaneously, causing duplicate pairs or errors.
**Why it happens:** No atomic operation for code consumption + pair creation.
**How to use:** Use a PostgreSQL database function (RPC) that atomically: (1) checks code is valid, (2) marks code as used, (3) creates the pair record. All in one transaction.
**Warning signs:** Duplicate pair records; user can use an already-consumed code.

### Pitfall 5: PWA Not Installable in Production
**What goes wrong:** PWA install prompt never appears; app doesn't work offline.
**Why it happens:** Missing manifest icons, missing service worker, or not served over HTTPS.
**How to avoid:** Configure `vite-plugin-pwa` with proper manifest (name, icons 192+512, theme_color). Deploy to Vercel (HTTPS by default). Test with `npm run build && npm run preview`.
**Warning signs:** DevTools > Application > Manifest shows errors; no service worker in DevTools.

### Pitfall 6: Avatar Upload Fails Silently
**What goes wrong:** User selects image but upload doesn't complete; no error shown.
**Why it happens:** Storage bucket doesn't exist; RLS policy blocks upload; file too large.
**How to avoid:** Create `avatars` bucket in Supabase Dashboard. Add upload policy. Set file size limit (e.g., 5MB). Show upload progress and errors via toast notifications.
**Warning signs:** Upload spinner never completes; avatar URL is null in profile.

## Code Examples

### Complete Auth Flow

```javascript
// Source: [CITED: supabase.com/docs/guides/getting-started/tutorials/with-react]
// src/features/auth/LoginPage.jsx
import { supabase } from '../../shared/lib/supabase'

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    })
    if (error) console.error('Login error:', error.message)
  }

  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  )
}

// src/features/auth/AuthCallback.jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../shared/lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/home')
      }
    })
  }, [navigate])

  return <div>Signing you in...</div>
}
```

### Database Schema (SQL)

```sql
-- Source: [CITED: supabase.com/docs/guides/getting-started/tutorials/with-react]
-- Extended for CoupleSpace pairing system

-- Users table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1)
);

-- Pairs table (the core pairing record)
CREATE TABLE pairs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_one UUID REFERENCES auth.users NOT NULL,
  user_two UUID REFERENCES auth.users,
  invite_code TEXT UNIQUE NOT NULL,
  code_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paired_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT unique_user_one UNIQUE (user_one),
  CONSTRAINT unique_user_two UNIQUE (user_two),
  CONSTRAINT no_self_pair CHECK (user_one != user_two)
);

-- RLS: Users can only see their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS: Users can see pairs they belong to
ALTER TABLE pairs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own pairs" ON pairs
  FOR SELECT USING (auth.uid() = user_one OR auth.uid() = user_two);
CREATE POLICY "Users can create invite codes" ON pairs
  FOR INSERT WITH CHECK (auth.uid() = user_one);
CREATE POLICY "Users can update own pairs" ON pairs
  FOR UPDATE USING (auth.uid() = user_one OR auth.uid() = user_two);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'New User'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars');
```

### Side Drawer Navigation

```javascript
// Source: Custom implementation using Motion for React
// src/shared/components/Drawer.jsx
import { motion, AnimatePresence } from 'motion/react'
import { MessageCircle, Home, Calendar, Settings } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Homepage', path: '/home', locked: false },
  { icon: MessageCircle, label: 'Chat', path: '/chat', locked: true },
  { icon: Calendar, label: 'Agenda', path: '/agenda', locked: true },
  { icon: Settings, label: 'Settings', path: '/settings', locked: false },
]

export default function Drawer({ isOpen, onClose, isPaired }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            className="drawer"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`drawer-item ${item.locked && !isPaired ? 'locked' : ''}`}
                onClick={item.locked && !isPaired ? (e) => e.preventDefault() : onClose}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </a>
            ))}
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
```

### Image Picker for Avatar (PWA-compatible)

```javascript
// Source: [CITED: web.dev/articles/media-capturing-images, MDN]
// Uses native <input type="file"> with capture attribute
// No external library needed for PWA

// Two approaches:
// 1. Camera only (capture attribute)
<input type="file" accept="image/*" capture="environment" />

// 2. Gallery or Camera (no capture attribute — shows file picker with camera option)
<input type="file" accept="image/*" />

// For crop: use CSS object-fit: cover on a canvas or
// a lightweight library like react-image-crop (if needed)
// Or use the native browser crop if available on the platform
```

## Runtime State Inventory

> This is a greenfield phase — no existing runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no database tables exist yet | Create all tables via migration |
| Live service config | None — no services running | Configure Supabase project + Google OAuth |
| OS-registered state | None | None |
| Secrets/env vars | None — will create .env.local | Set VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY |
| Build artifacts | None — no build configured yet | Set up Vite + vite-plugin-pwa |

**Nothing found in category:** All categories — this is a greenfield phase starting from scratch.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Create React App | Vite + @vitejs/plugin-react | CRA deprecated 2023 | Must use Vite for new React projects |
| framer-motion | motion (import from 'motion/react') | Renamed 2024 | Install `motion`, import from `motion/react` |
| Custom SW writing | vite-plugin-pwa + Workbox | Matured 2023-2024 | Zero-config PWA generation from Vite config |
| Redux for state | Zustand | Adopted widely 2023+ | Simpler, less boilerplate, no provider |
| @supabase/auth-helpers-react | @supabase/supabase-js built-in auth | Deprecation 2023 | Use supabase-js directly, no separate auth helper |
| Axios for HTTP | Native fetch + supabase-js | fetch standardized | No need for axios in modern React |

**Deprecated/outdated:**
- Create React App: Deprecated, no longer maintained. Use Vite.
- @supabase/auth-helpers-react: Deprecated. Use @supabase/supabase-js directly.
- framer-motion: Renamed to `motion`. Install `motion`, import from `motion/react`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase project URL and anon key can be exposed in frontend safely (RLS protects data) | Standard Stack | Low — this is how Supabase is designed to work |
| A2 | Google OAuth redirect URI for Supabase is `https://<project>.supabase.co/auth/v1/callback` | Common Pitfalls | Medium — need to verify exact format in Supabase Dashboard |
| A3 | Side drawer implementation with Motion is ~50 lines of code | Don't Hand-Roll | Low — straightforward with AnimatePresence |
| A4 | vite-plugin-pwa v1.3.0 is compatible with Vite 8.x | Standard Stack | Low — version verified on npm registry |
| A5 | Profile auto-creation trigger works with Supabase Auth signup flow | Code Examples | Low — follows official Supabase example pattern |

**If this table is empty:** Not applicable — 5 assumptions documented.

## Open Questions

1. **CSS Framework Decision (Agent's Discretion)**
   - What we know: Project has `cosmic-v2.html` design reference with specific CSS variables (colors, typography, spacing). AGENTS.md says "Styling: TBD."
   - What's unclear: Should we use CSS Modules, plain CSS with custom properties, or a utility framework like Tailwind?
   - Recommendation: Use plain CSS with CSS custom properties matching the `cosmic-v2.html` design tokens. This gives full control over the design system without utility class overhead. The design reference is very specific — Tailwind would fight it.

2. **Project Directory Structure**
   - What we know: PWA docs show `FRONTEND/` and `BACKEND/` directories. Vite typically scaffolds at root.
   - What's unclear: Should the React app live at root or inside `FRONTEND/`?
   - Recommendation: Follow project docs convention — create `FRONTEND/` directory and scaffold Vite inside it. Backend stays in `BACKEND/` for when FastAPI is needed.

3. **Supabase Local Development**
   - What we know: Supabase CLI can run local stack via Docker. Project docs mention Docker for backend.
   - What's unclear: Should we use Supabase local dev (Docker) or develop directly against the hosted Supabase project?
   - Recommendation: Start with hosted Supabase for speed. Add local dev setup as a separate task if needed. Phase 1 schema is simple enough to iterate via SQL Editor.

4. **Invite Code Length and Format**
   - What we know: D-01 says "short numeric code." D-02 says one-time use.
   - What's unclear: Exact length (4? 6? 8 digits?) and expiry time.
   - Recommendation: 6-digit numeric code (easy to type, 1M combinations — sufficient for a private couple app). 24-hour expiry. These can be adjusted.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Frontend build | ✓ | 24.16.0 | — |
| npm | Package management | ✓ | 11.13.0 | — |
| Python | Backend (not Phase 1) | ✓ | 3.14.6 | — |
| pip | Backend packages (not Phase 1) | ✓ | 26.1.2 | — |
| Supabase project | Auth/DB/Storage | ✗ | — | Create free tier project |
| Google Cloud Console | OAuth setup | ✗ | — | Manual setup required |

**Missing dependencies with no fallback:**
- Supabase project: Must create a free-tier Supabase project before implementation. No local fallback without Docker + Supabase CLI.
- Google Cloud Console: Must set up OAuth credentials before Google login works. Cannot test OAuth without this.

**Missing dependencies with fallback:**
- Supabase local dev: Can develop against hosted Supabase directly (no Docker needed for Phase 1).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest (ships with Vite) |
| Config file | vitest.config.js (create in Wave 0) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Google OAuth login flow | integration | `npx vitest run tests/auth.test.js` | ❌ Wave 0 |
| AUTH-02 | Session persistence across refresh | e2e/manual | Manual test: login → refresh → verify logged in | N/A |
| AUTH-03 | Generate invite code | unit | `npx vitest run tests/pairing.test.js` | ❌ Wave 0 |
| AUTH-04 | Enter invite code to pair | integration | `npx vitest run tests/pairing.test.js` | ❌ Wave 0 |
| AUTH-05 | Max 2 users per pair | unit | `npx vitest run tests/pairing.test.js` | ❌ Wave 0 |
| PROF-01 | Set display name | unit | `npx vitest run tests/profile.test.js` | ❌ Wave 0 |
| PROF-02 | Upload profile picture | integration | `npx vitest run tests/profile.test.js` | ❌ Wave 0 |
| PROF-03 | Camera/gallery picker + crop | manual | Manual test on mobile device | N/A |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual OAuth + pairing flow test

### Wave 0 Gaps
- [ ] `vitest.config.js` — test configuration
- [ ] `tests/auth.test.js` — covers AUTH-01, AUTH-02
- [ ] `tests/pairing.test.js` — covers AUTH-03, AUTH-04, AUTH-05
- [ ] `tests/profile.test.js` — covers PROF-01, PROF-02
- [ ] Vitest install: `npm install -D vitest @testing-library/react @testing-library/jest-dom`

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth (Google OAuth) — handles token issuance, refresh, session management |
| V3 Session Management | yes | supabase-js built-in session persistence (localStorage) |
| V4 Access Control | yes | PostgreSQL RLS policies — row-level isolation by pair_id |
| V5 Input Validation | yes | Profile display_name constraint (CHECK), file type/size validation on avatar upload |
| V6 Cryptography | no | No custom encryption in Phase 1 (deferred to v2+) |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized data access (accessing other pairs' data) | Tampering / Information Disclosure | RLS policies on every table — pair_id isolation |
| Session hijacking | Elevation of Privilege | Supabase handles JWT rotation, HTTPS-only cookies |
| OAuth redirect manipulation | Tampering | Whitelist redirect URLs in Supabase Dashboard |
| Upload malicious files | Tampering | File type validation (accept="image/*"), size limits, Supabase Storage RLS |
| Invite code brute-force | Information Disclosure | 6-digit code (1M combinations), rate limiting, 24-hour expiry |

## Sources

### Primary (HIGH confidence)
- [CITED: supabase.com/docs/guides/getting-started/tutorials/with-react] — Official React + Supabase user management example (auth, profiles, storage, RLS)
- [CITED: supabase.com/docs/reference/javascript/auth-signinwithoauth] — signInWithOAuth API reference
- [CITED: supabase.com/docs/guides/database/postgres/row-level-security] — RLS documentation and patterns
- [CITED: supabase.com/docs/guides/storage] — Storage documentation (buckets, policies, signed URLs)
- [CITED: vite-pwa-org.netlify.app] — vite-plugin-pwa documentation and configuration
- [CITED: web.dev/articles/media-capturing-images] — Native camera capture via file input
- [CITED: MDN - capture attribute] — HTML capture attribute for camera access

### Secondary (MEDIUM confidence)
- [WebSearch: Supabase RLS guide 2026] — Production RLS patterns, performance optimization
- [WebSearch: vite-plugin-pwa React setup 2026] — PWA configuration guides, Workbox caching
- [WebSearch: React hamburger menu animation] — Side drawer navigation patterns
- [WebSearch: React PWA camera picker] — Image picker patterns for PWAs

### Tertiary (LOW confidence)
- [ASSUMED] Exact Supabase OAuth redirect URI format — need to verify in Dashboard
- [ASSUMED] CSS framework choice — recommendation based on design reference specificity

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all packages verified on npm, official docs confirmed patterns
- Architecture: HIGH — Supabase-first pattern validated by production apps, official examples
- Pitfalls: HIGH — based on official documentation, RLS security guides, PWA best practices
- Code Examples: HIGH — based on official Supabase React example, extended for pairing

**Research date:** 2026-07-24
**Valid until:** 30 days (stable stack, well-documented technologies)
