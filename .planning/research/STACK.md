# Technology Stack

**Project:** CoupleSpace
**Researched:** 2026-07-24
**Overall confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.2.x (latest: 19.2.8) | UI framework | Pre-decided by project. Latest stable with full Server Components support, Actions API, and improved Suspense. The React 19.2 line is production-ready and actively maintained. |
| Vite | 6.x | Build tool & dev server | Fastest React dev experience. Replaces CRA (deprecated). Native ESM, instant HMR, optimized builds. PWA plugin ecosystem is built around Vite. |
| Motion (for React) | 12.42.x | Animations | Pre-decided by project docs. Formerly `framer-motion`; now install as `motion` with import from `motion/react`. Production-grade, 154M+ monthly npm downloads. |

### Backend

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Python | 3.12+ | Runtime | Required by FastAPI. 3.12 is the recommended stable version for production. |
| FastAPI | 0.139.x (latest: 0.139.2) | API framework | Pre-decided by project. High-performance async Python framework. Handles complex logic (audio processing, Google Calendar integration) that Supabase alone can't do. |
| Uvicorn | Latest standard | ASGI server | Pre-decided by project. Lightweight, production-grade ASGI server. Use `pip install "fastapi[standard]"` which includes uvicorn. |

### Database & Auth (Supabase)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | v1.26.x (latest: 1.26.07) | Backend-as-a-Service | Pre-decided by project. Provides: |
| — Supabase Auth | Built-in | Google OAuth | Google OAuth integration out of the box, session management, JWT tokens |
| — Supabase Database | Postgres 17 | Data storage | Relational DB with real-time capabilities for chat |
| — Supabase Storage | Built-in | File uploads | Voice messages, images, shared photos |
| — Supabase Realtime | Built-in | Live chat | WebSocket-based real-time messaging between paired couples |
| — supabase-js | Latest | Client SDK | Type-safe client for React frontend |

### Hosting

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vercel | — | Frontend + Backend hosting | Pre-decided. React PWA frontend + FastAPI as serverless functions. Zero-config deploy, auto-scaling, global CDN. |
| Docker | — | Local development | Docker Compose for local backend development and testing (per project docs). |

### PWA Infrastructure

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vite-plugin-pwa | 0.21.x+ | PWA generation | Generates service worker + manifest from config. Workbox-based. Auto-update support. Zero-config for basic PWA. |
| Workbox | 7.x (via plugin) | Service worker caching | Pre-caches app shell, implements caching strategies for offline support. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-router-dom | 7.x | Client-side routing | Always — for page navigation (chat, homepage, agenda) |
| @supabase/supabase-js | 2.x | Supabase client | Always — for auth, DB queries, storage, realtime |
| @supabase/ssr | Latest | Supabase SSR integration | If using server-side rendering features |
| zustand | 5.x | State management | For complex client state (chat messages, user session). Lightweight, no boilerplate. |
| date-fns | 4.x | Date utilities | For agenda/calendar views, date formatting |
| react-hot-toast | 2.x | Toast notifications | Lightweight feedback notifications |
| lucide-react | Latest | Icons | Clean, consistent icon set. Better than mixing icon libraries |

## What NOT to Use

| Technology | Why Not | What to Use Instead |
|------------|---------|-------------------|
| Create React App | Deprecated, no longer maintained | Vite with `@vitejs/plugin-react` |
| Next.js | Project specifies React PWA first with FastAPI backend; Next.js adds unnecessary complexity and SSR overhead for a mobile-first PWA | Plain React + Vite |
| Firebase | Project uses Supabase; two BaaS platforms = confusion | Supabase for everything |
| Tailwind CSS (controversial) | Not in project docs; project has specific design system via `cosmic-v2.html`. Consider only if design system maps well to utility classes. | Follow the `cosmic-v2.html` design system; CSS modules or styled-components |
| Redux | Overkill for this app size | Zustand (simpler, less boilerplate) |
| Axios | Unnecessary — `fetch` API is sufficient for modern React | Native `fetch` + supabase-js handles HTTP |
| Socket.io | Supabase Realtime handles WebSocket connections natively | Supabase Realtime channels |
| express.js | Backend is FastAPI, not Node.js | FastAPI |

## Installation

```bash
# Frontend (in FRONTEND/ directory)
npm create vite@latest . -- --template react
npm install
npm install react-router-dom @supabase/supabase-js zustand date-fns lucide-react
npm install -D vite-plugin-pwa workbox-window

# Backend (in BACKEND/ directory)
pip install "fastapi[standard]"
pip install python-multipart aiofiles  # for file uploads
pip install google-api-python-client google-auth-oauthlib  # for Google Calendar
pip install pydantic-settings  # for env config

# Supabase client (already included above)
# supabase-js is installed via npm
```

## Architecture Summary

```
Frontend (React/Vite)          Backend (FastAPI)           Supabase
┌─────────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│ React 19.2 SPA      │◄─────►│ FastAPI 0.139.x  │◄─────►│ Auth (OAuth)    │
│ vite-plugin-pwa     │       │ Uvicorn           │       │ Database (PG17) │
│ supabase-js         │◄─────────────────────────────────│ Storage         │
│ zustand             │       │ Audio processing  │       │ Realtime        │
│ react-router        │       │ Google Calendar   │       │                 │
└─────────────────────┘       └──────────────────┘       └─────────────────┘
         │                                                         │
         └─────────────────── Vercel ─────────────────────────────┘
```

**Data flow:**
1. Frontend uses `supabase-js` directly for auth, realtime chat, and storage
2. Frontend calls FastAPI for complex operations (audio processing, Google Calendar API)
3. FastAPI can also query Supabase directly using `supabase-py`
4. All hosted on Vercel (frontend as static, backend as serverless functions)

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Build tool | Vite | CRA is dead. Vite is the standard for React PWA. |
| PWA plugin | vite-plugin-pwa | Only maintained PWA solution for Vite. Workbox-powered. |
| State management | Zustand | Minimal boilerplate, perfect for mobile chat app. No provider wrapper needed. |
| Real-time | Supabase Realtime | Built into the stack. No extra service. Handles chat channels via presence and broadcast. |
| Icons | lucide-react | Consistent, lightweight, tree-shakeable. Matches modern UI aesthetic. |
| HTTP client | fetch + supabase-js | No need for axios. supabase-js handles all Supabase communication. |

## Sources

- React releases: https://github.com/react/react/releases (19.2.8, Jul 21 2026)
- FastAPI PyPI: https://pypi.org/project/fastapi/ (0.139.2, Jul 16 2026)
- Supabase GitHub: https://github.com/supabase/supabase/releases (v1.26.07, Jul 9 2026)
- Motion for React: https://www.npmjs.com/package/motion (12.42.2, Jun 2026)
- vite-plugin-pwa: https://vite-pwa-org.netlify.app/
- Vercel deployment: https://vercel.com/docs
