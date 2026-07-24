# Project Research Summary

**Project:** CoupleSpace
**Domain:** Couple-focused Progressive Web App (PWA)
**Researched:** 2026-07-24
**Confidence:** HIGH

## Executive Summary

CoupleSpace is a mobile-first PWA that gives couples a private shared space — chat, photos, mood tracking, agenda, and Spotify integration — all in one place. The couple app market is crowded (Between, Paired, Amora, futari) but fragmented: most apps are either messaging hubs or relationship growth tools. CoupleSpace occupies a unique "daily dashboard" middle ground that no single app owns yet. The critical insight from research is that **daily rituals and ambient presence** (seeing your partner's mood, a shared photo, a countdown timer) drive retention far better than utility features. This must inform every design decision.

The recommended stack is React 19.2 + Vite + Supabase (Auth, Postgres 17, Realtime, Storage) for the frontend and FastAPI for complex backend operations (audio processing, Spotify/Google Calendar APIs). All hosted on Vercel. The architecture follows a "Supabase-first" pattern: the React SPA talks directly to Supabase for CRUD and real-time chat, while FastAPI handles only operations requiring server-side secrets or heavy processing. This minimizes latency, leverages built-in RLS for security, and keeps the codebase simple.

The two most dangerous risks are (1) **dual-user churn** — both partners must stay engaged or both leave, creating a fragile retention dynamic that killed Couply at 500K downloads — and (2) **privacy breach catastrophe** — relationship data exposure causes emotional harm beyond typical data breaches. Both must be addressed from day one: daily habit design for retention, and strict RLS + encryption for privacy. PWA limitations on iOS (no background sync, limited push notifications) are the third major risk that must be managed with smart offline-first design rather than overpromising.

## Key Findings

### Recommended Stack

The stack is pre-decided (React + FastAPI + Supabase + Vercel) with strong community precedent. Research confirms this is the right combination — multiple production couple apps use this exact pattern (Supabase Kizuna, A.B.E.L, document-copilot).

**Core technologies:**
- **React 19.2.8 + Vite 6.x:** UI framework and build tool — CRA is dead, Vite is the standard
- **Supabase v1.26.07:** Auth (Google OAuth), Postgres 17, Realtime, Storage — all built-in
- **FastAPI 0.139.2 (Python 3.12+):** Business logic layer for audio processing, Spotify, Google Calendar
- **vite-plugin-pwa 0.21.x:** PWA generation with Workbox — only maintained PWA solution for Vite
- **Zustand 5.x:** State management — minimal boilerplate, no provider wrapper needed
- **Motion 12.42.x:** Animations — formerly framer-motion, 154M+ monthly npm downloads

**What NOT to use:** No Redux (overkill), no Axios (fetch suffices), no Socket.io (Supabase Realtime handles it), no Firebase (two BaaS = confusion), no Next.js (unnecessary SSR overhead for a PWA).

See [STACK.md](STACK.md) for full details, installation commands, and source links.

### Expected Features

**Must have (table stakes) — missing these = incomplete product:**
- Private real-time chat (text, images, voice messages, reactions)
- Couple pairing system (invite code/link)
- Anniversary/days counter (THE universal couple app feature)
- Shared photo album (mini-album on homepage)
- Shared calendar with event creation
- Daily mood check-in (one-tap, visible to partner)
- Important date reminders with notifications

**Should have (competitive differentiators):**
- Homepage dashboard as primary view — unique "relationship at a glance" approach
- Spotify now-playing integration — ambient presence without texting (no couple app does this well)
- Random memory highlight — daily ritual that drives emotional engagement
- 24-hour photo stories — ephemeral sharing creates daily anticipation
- Daily question of the day — THE engagement driver in couple apps (Paired, Amora, futari all use this)

**Explicitly NOT building (anti-features):**
- AI relationship coaching (requires clinical disclaimers, liability, expensive AI)
- Relationship quizzes (churn after completion — Couply's lesson)
- Video calling (WhatsApp/FaceTime already win)
- Social features/community (breaks the private space contract)
- Complex minigames (retention gimmick, not core value)

**Defer to v2+:** Location sharing, home screen widgets, connection streaks, virtual pet, minigames, E2E encryption (important but high complexity — add after core is solid).

See [FEATURES.md](FEATURES.md) for full feature landscape, dependencies, and MVP recommendation.

### Architecture Approach

The architecture follows a three-tier pattern: React SPA (UI + PWA shell) → Supabase (Auth + DB + Realtime + Storage, accessed directly by the SPA) → FastAPI (business logic proxy for external APIs). Every data table includes a `pair_id` column with RLS policies enforcing pair isolation — this is the universal access key. The React SPA talks directly to Supabase for all CRUD and real-time subscriptions. FastAPI is only invoked for operations requiring server-side secrets or heavy processing (Spotify polling, Google Calendar sync, audio transcoding).

**Major components:**
1. **React SPA** — UI rendering, routing, PWA shell, service worker. Uses supabase-js directly for auth, chat, storage.
2. **Supabase Services** — Postgres 17 with RLS, Auth (Google OAuth), Realtime (postgres_changes for chat), Storage (voice messages, images).
3. **FastAPI Backend** — JWT verification, Spotify API proxy, Google Calendar sync, audio processing. Never stores data Supabase can store.
4. **Service Worker** — Workbox-powered app shell caching, stale-while-revalidate for Supabase Storage, offline fallback.

**Key patterns to follow:**
- Supabase-First for CRUD + Realtime (Pattern 1)
- FastAPI as Business Logic + API Proxy only (Pattern 2)
- PairID as Universal Access Key with RLS (Pattern 3)
- Optimistic UI with Supabase Realtime Reconciliation (Pattern 4)
- PWA Shell with Workbox Offline Strategy (Pattern 5)

**Anti-patterns to avoid:** FastAPI as database proxy (adds latency, duplicates RLS), storing secrets in frontend, ignoring RLS and relying on frontend filtering, monolithic component structure, skipping offline support.

See [ARCHITECTURE.md](ARCHITECTURE.md) for full data flows, code examples, and scalability considerations.

### Critical Pitfalls

1. **The "Four Horsemen of Churn"** — Both partners must stay engaged or both leave. Couply had 500K downloads but couldn't retain. Prevention: design for daily habits (morning dashboard, mood check, shared playlist), not problem-solving. Track both partners' engagement independently.

2. **Privacy Breach Catastrophe** — Relationship data exposure causes emotional harm, relationship damage, and potential blackmail. Prevention: encrypt messages at rest, strict pairID isolation via RLS, never log message content, allow couples to delete their entire space.

3. **Real-Time Chat Reliability** — Messages that don't sync or disappear cause users to revert to WhatsApp. Prevention: use Supabase Realtime (not custom WebSockets), optimistic updates with conflict resolution, offline message queuing, UUID message IDs.

4. **PWA Installation & Offline Gap** — Users expect native experience but hit PWA limitations (especially iOS). Prevention: set clear expectations, prioritize offline for viewing not sending, test on actual iOS devices, use Workbox for intelligent caching.

5. **Voice Message Processing** — Browser audio APIs are inconsistent, file sizes large, processing expensive. Prevention: MediaRecorder API with fallbacks, client-side compression (32kbps Opus target), stream uploads, 2-minute max limit.

See [PITFALLS.md](PITFALLS.md) for full pitfalls analysis with prevention strategies and phase mapping.

## Implications for Roadmap

Based on combined research, suggested phase structure:

### Phase 1: Foundation & Auth
**Rationale:** Everything depends on Supabase setup, Google OAuth, and the pair system. This phase produces a deployable shell that validates the core architecture works. Must be rock-solid — OAuth/PairID bugs block the entire app.
**Delivers:** Supabase schema + RLS, Google OAuth login, couple pairing flow, React SPA shell with routing, PWA configuration (vite-plugin-pwa), mobile-first layout.
**Addresses:** Couple pairing, auth flow, PWA installability foundation.
**Avoids:** Pitfall 1 (design for daily habits from day one), Pitfall 2 (privacy by design via RLS), Pitfall 4 (PWA config correct from start), Pitfall 7 (PairID edge cases), Pitfall 8 (mobile-first CSS from start).
**Uses:** Vite + React 19.2, Supabase Auth + Postgres, vite-plugin-pwa, react-router-dom.
**Implements:** React SPA shell, Supabase setup, Auth module.

### Phase 2: Chat Core
**Rationale:** Private real-time chat is the foundation of every couple app — Between's entire value prop is private messaging. This phase uses only Supabase client SDK + Realtime — no FastAPI needed. Gets a usable product in users' hands fastest.
**Delivers:** Real-time text chat, message history, message reply/quote, emoji reactions, optimistic UI with Supabase Realtime reconciliation, offline message viewing.
**Addresses:** Private real-time chat, message reply, emoji reactions.
**Avoids:** Pitfall 3 (use Supabase Realtime, not custom WebSockets), Pitfall 11 (long-press reaction menu, clear count display).
**Uses:** Supabase Realtime channels, @supabase/supabase-js, Zustand for chat state.
**Implements:** Chat module, Realtime subscriptions, optimistic UI pattern.

### Phase 3: Media & Voice
**Rationale:** Voice messages and image sharing are table stakes for couple chat apps (WhatsApp-standard UX). Requires Supabase Storage + FastAPI processing. Grouping media together keeps Storage configuration cohesive.
**Delivers:** Voice message recording + playback (MediaRecorder API), image sharing in chat (inline display), shared photo album (mini-album on homepage), Supabase Storage integration.
**Addresses:** Voice messages, image sharing in chat, shared photo album.
**Avoids:** Pitfall 5 (client-side compression, size limits, stream uploads), Pitfall 13 (storage limits, compression, cost monitoring).
**Uses:** Supabase Storage, FastAPI (audio transcoding), MediaRecorder API.
**Implements:** Media features, Supabase Storage bucket policies, FastAPI audio processing endpoint.

### Phase 4: Homepage Dashboard
**Rationale:** The homepage dashboard is CoupleSpace's core differentiator — a single view showing the relationship at a glance. This requires chat + media to be working (for photo album, mood display). This is where daily habit design happens.
**Delivers:** Anniversary/days counter, mood tracker (one-tap logging), random memory highlight (daily ritual), mini photo album display, homepage layout as primary view.
**Addresses:** Anniversary counter, mood tracker, random memory highlight, mini photo album, homepage dashboard.
**Avoids:** Pitfall 1 (daily rituals = retention), Pitfall 12 (effortless mood logging, show trends).
**Uses:** Supabase (mood data, photo metadata), Zustand for dashboard state.
**Implements:** Homepage module, MoodTracker, MiniAlbum, NowPlaying (placeholder for Phase 6).

### Phase 5: Shared Life (Agenda)
**Rationale:** Shared calendar adds practical utility that drives daily opens beyond emotional features. Requires FastAPI for Google Calendar integration. Natural progression after homepage is established.
**Delivers:** Shared calendar (create/browse events), Google Calendar integration (OAuth + sync), important date reminders, event creation with partner notifications.
**Addresses:** Shared calendar, Google Calendar integration, important date reminders.
**Avoids:** Pitfall 10 (timezone handling, bidirectional sync, manual fallback).
**Uses:** FastAPI (Google Calendar API v3), Supabase (events table), Supabase Realtime (partner sync).
**Implements:** Agenda module, FastAPI calendar endpoints, notification dispatch.

### Phase 6: Polish & Delight
**Rationale:** Spotify integration and push notifications are the final differentiators. They require established infrastructure (FastAPI for Spotify polling, Supabase Edge Functions for push). This phase also handles PWA install prompts and performance optimization.
**Delivers:** Spotify now-playing integration, shared playlist display, push notifications (Web Push API + VAPID), PWA install prompt (custom banner), performance profiling for low-end devices.
**Addresses:** Spotify integration, shared playlist, push notifications, PWA installability.
**Avoids:** Pitfall 9 (graceful degradation, caching, error handling for Spotify API).
**Uses:** FastAPI (Spotify Web API proxy), Supabase Edge Functions (push dispatch), Workbox (caching).
**Implements:** Spotify module, notification system, PWA install flow.

### Phase Ordering Rationale

- **Phase 1-2** (Foundation + Chat) are fully functional without FastAPI — this gets a usable product in users' hands fastest, validating the core architecture
- **Phase 3** (Media) adds Storage + FastAPI processing — natural progression after chat works
- **Phase 4** (Homepage) is the differentiator — requires Phase 2-3 data to display meaningfully
- **Phase 5** (Agenda) adds practical utility — requires FastAPI already scaffolded from Phase 3
- **Phase 6** (Polish) adds the final ambient features — requires all infrastructure in place
- Each phase produces a deployable artifact. No "big bang" integration.
- Privacy (RLS) and daily habit design are baked in from Phase 1, not bolted on later.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 3 (Media & Voice):** Browser audio API inconsistencies across devices, Opus encoding feasibility in browser, Supabase Storage pricing at scale — needs spike/prototype
- **Phase 5 (Agenda):** Google Calendar API v3 complexity, OAuth scope requirements, timezone handling edge cases — needs API research
- **Phase 6 (Polish):** Spotify Web API rate limits and deprecation patterns, Web Push API iOS support status, PWA widget API maturity — needs current-state research

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Well-documented Supabase + React + Vite setup, established patterns
- **Phase 2 (Chat):** Supabase Realtime chat is well-documented with production examples
- **Phase 4 (Homepage):** Standard dashboard layout, no exotic integrations

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Pre-decided by project, all technologies production-ready with strong community examples |
| Features | HIGH | Comprehensive competitor analysis across 15+ couple apps, clear table stakes vs differentiators |
| Architecture | HIGH | Supabase-first pattern validated by multiple production apps (Kizuna, A.B.E.L), well-documented |
| Pitfalls | HIGH | Based on Couply case study (500K downloads, retention failure), GDPR analysis, PWA documentation |

**Overall confidence:** HIGH

### Gaps to Address

- **Spotify API stability:** Spotify deprecates API versions regularly. Need to verify current API status during Phase 6 planning and design for graceful degradation from Phase 4 (placeholder when unavailable).
- **iOS PWA limitations:** iOS Safari still has significant PWA gaps (limited push notification support, no background sync). Need real-device testing in Phase 1 and set honest expectations.
- **Supabase Realtime scaling:** At scale (10K+ concurrent couples), Supabase Realtime may need supplementing with dedicated WebSocket infrastructure. Monitor during Phase 2.
- **E2E encryption timing:** Deferred to v2+ but increasingly expected by privacy-conscious users. Should plan the architectural hooks in Phase 1 (message table schema) even if encryption is added later.
- **Offline-first message queue:** Workbox background sync is limited. May need IndexedDB + manual sync implementation. Prototype in Phase 2.

## Sources

### Primary (HIGH confidence)
- Supabase documentation — Auth, Realtime, Storage, RLS patterns
- vite-plugin-pwa official docs — PWA configuration, Workbox integration
- FastAPI documentation — ASGI deployment, JWT verification patterns
- React 19.2 release notes — Server Components, Actions API, Suspense

### Secondary (MEDIUM confidence)
- Supabase Kizuna (supabase/kizuna) — Production React + Supabase PWA with Realtime chat
- Couply pivot story (dev.to) — Retention challenges, "four horsemen of churn" in couple apps
- Connected Couples app comparison (2026) — Feature landscape across 15+ couple apps
- A.B.E.L (Adam-Blf) — React PWA + FastAPI + Supabase with Zustand architecture
- document-copilot (daveebbelaar) — React + FastAPI + Supabase JWT auth flow

### Tertiary (LOW confidence)
- PWA widget API documentation — Limited browser support, needs validation
- Spotify Web API deprecation history — Pattern analysis, not guaranteed future behavior
- Web Push API iOS support status — Rapidly evolving, verify during Phase 6 planning

---
*Research completed: 2026-07-24*
*Ready for roadmap: yes*
