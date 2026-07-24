# Architecture Patterns

**Domain:** Couple-focused PWA (React + FastAPI + Supabase)
**Researched:** 2026-07-24
**Overall confidence:** HIGH — stack is well-established with strong community examples

## Recommended Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    CoupleSpace PWA (Vercel)                      │
│                React SPA + Service Worker + Workbox              │
│                                                                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │  Auth    │ │   Chat   │ │Homepage  │ │     Agenda       │   │
│  │  Module  │ │  Module  │ │ Module   │ │     Module       │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │
│       │            │            │                  │              │
│       └────────────┴────────────┴──────────────────┘              │
│                            │                                     │
│                   ┌────────┴────────┐                            │
│                   │  API Client      │                            │
│                   │  (Auth + Fetch)  │                            │
│                   └───┬─────────┬───┘                            │
└───────────────────────┼─────────┼────────────────────────────────┘
                        │         │
            ┌───────────┘         └───────────┐
            ▼                                 ▼
┌───────────────────────┐       ┌──────────────────────────────────┐
│   Supabase Services   │       │      FastAPI Backend (Vercel)    │
│                       │       │                                  │
│  ┌─────────────┐      │       │  ┌──────────────────────────┐   │
│  │  Postgres   │      │       │  │  Auth Middleware          │   │
│  │  + RLS      │      │       │  │  (verify Supabase JWT)   │   │
│  ├─────────────┤      │       │  ├──────────────────────────┤   │
│  │  Auth       │◄─────┼───────┼──│  Business Logic           │   │
│  │  (OAuth)    │      │       │  │  - Audio processing       │   │
│  ├─────────────┤      │       │  │  - Spotify integration    │   │
│  │  Realtime   │◄─────┼───────┼──│  - Calendar sync          │   │
│  │  (postgres  │      │       │  │  - Notification dispatch  │   │
│  │   changes)  │      │       │  ├──────────────────────────┤   │
│  ├─────────────┤      │       │  │  External API Proxies     │   │
│  │  Storage    │◄─────┼───────┼──│  - Spotify Web API        │   │
│  │  (buckets)  │      │       │  │  - Google Calendar API    │   │
│  └─────────────┘      │       │  └──────────────────────────┘   │
│                       │       └──────────────────────────────────┘
└───────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Auth Model |
|-----------|---------------|-------------------|------------|
| **React SPA** | UI rendering, routing, PWA shell, service worker | FastAPI, Supabase (direct client) | Supabase anon key (client-side) |
| **Service Worker** | Offline caching, asset precaching, background sync | Cache Storage, IndexedDB | None (browser-only) |
| **Supabase Auth** | Google OAuth, session management, JWT issuance | Google OAuth, React SPA | OAuth tokens → JWT |
| **Supabase Postgres** | All persistent data (users, pairs, messages, events, moods) | FastAPI (service-role), React (anon + RLS) | RLS policies enforce pair isolation |
| **Supabase Realtime** | Live chat messages, mood updates, presence | React SPA (WebSocket) | JWT-authenticated channel subscriptions |
| **Supabase Storage** | Voice messages, images, shared photos | React SPA (signed URLs), FastAPI (upload) | Bucket-level policies per pair |
| **FastAPI Backend** | Complex business logic, API proxying, audio processing | Supabase (service-role), external APIs | Supabase JWT verification |

### Data Flow

#### Authentication Flow
```
User → Google OAuth → Supabase Auth → JWT issued → Stored in browser
    ↓
React SPA holds JWT in memory (supabase-js manages session)
    ↓
All Supabase client calls include JWT → RLS policies enforce access
All FastAPI calls include JWT → FastAPI verifies via Supabase Admin API
```

#### Real-Time Chat Flow
```
User A sends message → React SPA calls Supabase Realtime channel
    ↓
Message inserted into `messages` table (RLS: only pair members)
    ↓
Supabase Realtime broadcasts `postgres_changes` event
    ↓
User B's React SPA receives event → UI updates instantly
    ↓
(No FastAPI involvement for basic text messages)
```

#### Voice Message Flow
```
User records audio → Browser MediaRecorder API captures blob
    ↓
React SPA uploads blob to Supabase Storage (voice-messages bucket)
    ↓
FastAPI processes: transcode to opus, generate waveform metadata
    ↓
Storage URL + metadata saved to messages table
    ↓
Other user receives Realtime notification → plays from signed URL
```

#### Spotify Integration Flow
```
User authorizes Spotify → React SPA stores refresh token
    ↓
FastAPI polls Spotify API periodically (server-side token refresh)
    ↓
Current track data cached in Supabase (last_played table)
    ↓
React SPA reads from Supabase via Realtime subscription
    ↓
Homepage displays "Now Playing" widget
```

#### Agenda/Calendar Flow
```
User creates event → React SPA calls FastAPI endpoint
    ↓
FastAPI validates, writes to Supabase events table
    ↓
FastAPI syncs to Google Calendar (if connected) via Calendar API
    ↓
Supabase Realtime notifies partner's device
    ↓
Both devices show updated agenda
```

## Patterns to Follow

### Pattern 1: Supabase-First for CRUD + Realtime

**What:** Let Supabase handle all direct database operations and real-time subscriptions. RLS policies enforce that users can only access their pair's data.

**When:** Every data operation that maps to a single table read/write.

**Why:** Reduces FastAPI surface area, leverages Supabase's optimized connection pooling, and Realtime works out of the box with postgres_changes.

```typescript
// React SPA — direct Supabase client call
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('pair_id', pairId)
  .order('created_at', { ascending: true });

// Realtime subscription
supabase
  .channel(`pair:${pairId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `pair_id=eq.${pairId}`
  }, (payload) => {
    addMessage(payload.new);
  })
  .subscribe();
```

### Pattern 2: FastAPI as Business Logic + API Proxy Layer

**What:** FastAPI handles operations that require external API calls, complex transformations, or privileged access. It never stores data that Supabase can store.

**When:** Spotify API calls, Google Calendar sync, audio transcoding, notification dispatch.

**Why:** Keeps secrets server-side, handles rate limiting, processes heavy payloads without burdening the client.

```python
# FastAPI endpoint — proxies Spotify API
@app.get("/api/spotify/now-playing")
async def now_playing(user = Depends(verify_supabase_jwt)):
    # Get user's Spotify tokens from Supabase
    tokens = await get_spotify_tokens(user["id"])
    if not tokens:
        raise HTTPException(404, "Spotify not connected")
    
    # Call Spotify API server-side
    track = await spotify_client.get_now_playing(tokens.access_token)
    return {"track": track.name, "artist": track.artist, "album_art": track.album_art_url}
```

### Pattern 3: PairID as Universal Access Key

**What:** Every data table includes a `pair_id` column. RLS policies filter by `pair_id IN (SELECT pair_id FROM pairs WHERE user_id = auth.uid())`.

**When:** All tables except `users` and `pairs`.

**Why:** Simplest authorization model — if you're in the pair, you see everything. No per-resource permission checks needed.

```sql
-- RLS policy example
CREATE POLICY "pair_members_can_read" ON messages
  FOR SELECT USING (
    pair_id IN (
      SELECT id FROM pairs 
      WHERE user_one = auth.uid() OR user_two = auth.uid()
    )
  );
```

### Pattern 4: Optimistic UI with Supabase Realtime Reconciliation

**What:** Show changes immediately in the UI, then reconcile when Supabase confirms via Realtime.

**When:** Chat messages, mood updates, event creation.

**Why:** Instant perceived performance even on slow networks. Supabase Realtime acts as the source of truth confirmation.

```typescript
// Optimistic send
const tempId = crypto.randomUUID();
addMessage({ id: tempId, text, status: 'sending' });

const { data, error } = await supabase.from('messages').insert({ ... }).select().single();
if (error) {
  updateMessage(tempId, { status: 'error' });
} else {
  replaceMessage(tempId, { ...data, status: 'sent' });
}
// Realtime will deliver the canonical version to partner
```

### Pattern 5: PWA Shell with Workbox Offline Strategy

**What:** Cache the app shell (HTML, CSS, JS, assets) via Workbox. Use stale-while-revalidate for API data.

**When:** Service worker registration, asset caching, offline fallback.

**Why:** Instant load on repeat visits, graceful offline degradation, installable on mobile home screens.

```typescript
// vite-plugin-pwa config
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage/,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'supabase-storage' }
          }
        ]
      }
    })
  ]
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: FastAPI as Database Proxy

**What:** Routing all Supabase queries through FastAPI instead of using the client SDK directly.

**Why bad:** Adds unnecessary latency, doubles connection pool usage, duplicates RLS logic, and makes real-time subscriptions harder to wire.

**Instead:** Use `@supabase/supabase-js` client directly in React for all CRUD. Only route through FastAPI when you need server-side secrets or processing.

### Anti-Pattern 2: Storing Secrets in Frontend

**What:** Putting Spotify client secrets, Google Calendar service account keys, or Supabase service-role keys in React code.

**Why bad:** Visible in browser DevTools, bundled into JS files, trivially extractable.

**Instead:** All secrets live in FastAPI environment variables or Supabase Edge Function secrets. Frontend only holds publishable keys (Supabase anon key, Spotify client ID).

### Anti-Pattern 3: Ignoring RLS and Relying on Frontend Filtering

**What:** Trusting the frontend to filter data by pair_id without server-side RLS enforcement.

**Why bad:** Any user can call the Supabase API directly and access other couples' data. Security by obscurity is not security.

**Instead:** Every table has RLS policies. Frontend filtering is for UX only, never for security.

### Anti-Pattern 4: Monolithic Component Structure

**What:** Building all features in a single large component or flat component directory.

**Why bad:** Hard to maintain, test, and reason about. Couples' apps have distinct domains (chat, calendar, memories).

**Instead:** Feature-based folder structure. Each feature owns its components, hooks, and types. Shared UI components in a common directory.

```
src/
├── features/
│   ├── chat/        # ChatPage, MessageList, MessageInput, VoiceRecorder
│   ├── homepage/    # DashboardPage, MoodTracker, MiniAlbum, NowPlaying
│   ├── agenda/      # AgendaPage, EventForm, CalendarIntegration
│   └── auth/        # LoginPage, AuthCallback
├── shared/
│   ├── components/  # Button, Card, Avatar, BottomNav
│   ├── hooks/       # usePairId, useRealtime, useSupabaseAuth
│   └── lib/         # supabase.ts, api.ts, types.ts
├── App.tsx
└── main.tsx
```

### Anti-Pattern 5: Skipping Offline Support

**What:** Building a PWA without service worker configuration or offline fallbacks.

**Why bad:** PWA install prompt is meaningless without offline capability. Users on poor networks get blank screens.

**Instead:** Cache the app shell. Show a meaningful offline state. Queue writes for background sync when connectivity returns.

## Component Dependency Graph

```
                    ┌─────────────┐
                    │  Supabase   │
                    │  (Auth +    │
                    │   DB +      │
                    │   Storage + │
                    │   Realtime) │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │  Auth    │ │  Chat    │ │  Data    │
        │  Module  │ │  Module  │ │  Module  │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             ▼            ▼            ▼
        ┌─────────────────────────────────────┐
        │          React SPA Core             │
        │  (Router, Layout, PWA, State)       │
        └──────────────┬──────────────────────┘
                       │
                       ▼
        ┌─────────────────────────────────────┐
        │        FastAPI Backend               │
        │  (Audio processing, Spotify,        │
        │   Calendar, Notifications)          │
        └─────────────────────────────────────┘
```

## Build Order Implications

Based on the dependency graph, here's the natural build order:

1. **Supabase project setup** (schema, RLS, auth) — everything depends on this
2. **React SPA shell** (routing, layout, PWA config, auth flow) — foundation for all features
3. **Chat module** (core value, uses only Supabase client SDK + Realtime) — no FastAPI needed
4. **FastAPI scaffold** (JWT verification, CORS, basic endpoints) — needed for integrations
5. **Homepage module** (reads from Supabase, may use FastAPI for Spotify)
6. **Agenda module** (writes to Supabase, may use FastAPI for Google Calendar)
7. **Media features** (voice messages, image sharing — need Supabase Storage + FastAPI processing)

### Why This Order

- **Phase 1-3** (Supabase + React shell + Chat) can be fully functional without FastAPI. This gets a usable product in users' hands fastest.
- **Phase 4** (FastAPI scaffold) is thin — just JWT verification + CORS. Unblocks Phase 5-6.
- **Phase 5-7** (Homepage, Agenda, Media) add features on top of the working foundation.
- Each phase produces a deployable artifact. No "big bang" integration.

## Scalability Considerations

| Concern | At 100 couples | At 10K couples | At 1M couples |
|---------|---------------|----------------|---------------|
| **Database** | Supabase free tier handles easily | Supabase Pro plan, connection pooling | Dedicated Postgres, read replicas |
| **Realtime** | Supabase Realtime handles all | Monitor channel count, may need separate WS server | FastAPI WebSocket fanout + Redis pub/sub |
| **Storage** | Supabase Storage free tier | Supabase Pro (100GB) | S3 + CloudFront CDN |
| **FastAPI** | Vercel serverless handles load | Same — serverless scales | Consider dedicated compute for heavy processing |
| **Offline** | Service worker + IndexedDB | Same | IndexedDB size limits may need pruning strategy |

## PWA-Specific Architecture Notes

### Service Worker Responsibilities
- **Precache:** App shell (HTML, CSS, JS), static assets (icons, fonts)
- **Runtime cache:** Supabase Storage responses (images, voice messages) via stale-while-revalidate
- **Offline fallback:** Show cached chat messages, display offline banner, queue outgoing messages
- **Background sync:** Retry failed writes when connectivity returns (if supported)

### Install Flow
- Detect `beforeinstallprompt` event → show custom install banner
- On iOS: show "Add to Home Screen" instructions (no automatic prompt)
- Track install status for analytics

### Push Notifications (Future)
- Use Web Push API with VAPID keys
- Supabase Edge Functions dispatch push when new message arrives
- Handle notification clicks → deep link to chat

## Sources

- Supabase Kizuna (supabase/kizuna) — production React + Supabase PWA with Realtime chat, RLS, Workbox offline
- Intimately (Devpost) — couple-focused PWA with Supabase + React + push notifications
- sahith14/Couples-app — couple app with Supabase Realtime chat, pairing, voice notes, E2E encryption
- document-copilot (daveebbelaar) — React + FastAPI + Supabase architecture with JWT auth flow
- A.B.E.L (Adam-Blf) — React PWA + FastAPI + Supabase with Zustand state management
- ClipSync (Mintlify docs) — Supabase Realtime + offline handling patterns
- pg18-chat (v0id-user) — FastAPI WebSocket + Postgres LISTEN/NOTIFY real-time patterns
- Discord clone (Maheshnath09) — FastAPI + WebSocket + Redis pub/sub architecture
- hermes-pwa (stasstepv) — Core/Shell split pattern for PWA portability
- better-pwa (0xMilord) — PWA layered architecture with offline data consistency
- Mayfly (jay23606) — PWA with Supabase + WebRTC for real-time couple communication
- John Apollos Olal (Medium) — Offline-first PWA with Supabase + Dexie.js mutation queue
