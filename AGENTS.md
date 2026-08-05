# AGENTS.md — CoupleSpace

## Project Context

CoupleSpace is a mobile-first PWA for couples to communicate, share moments, and manage experiences together. **Core value:** real-time private chat between couples.

## Repository Structure

The repo root is **not** the app. The frontend lives in `FRONTEND/`.

```
D:\Dev\PWA CS\
├── FRONTEND/          # React app (all source, deps, config)
│   ├── src/
│   │   ├── features/  # auth, chat, album, pairing, profile, settings
│   │   ├── shared/    # components/ (AppShell, ProtectedRoute, Header, Drawer), lib/ (supabase.js)
│   │   ├── stores/    # Zustand stores (authStore, chatStore, albumStore)
│   │   └── test/      # Vitest setup + tests
│   ├── supabase/migrations/  # SQL migrations (run against Supabase project)
│   └── .env.local     # Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
├── docs/              # cosmic-v2.html design ref, Features.md, Roadmap.md, UIUX.md
├── .planning/         # GSD workflow state (ROADMAP.md, phases/, milestones/)
├── .ai/               # Agent role definitions (planner, coder, verifier, reviewer)
├── fixs/              # Bug fix logs and temporary fix artifacts
├── planning/          # Planning documents (legacy, prefer .planning/)
└── graphify-out/      # Output from graphify knowledge graph tool
```

## Developer Commands

All commands run from `FRONTEND/` directory:

```bash
cd FRONTEND
npm run dev          # Vite dev server with HMR
npm run build        # Production build → dist/
npm run lint         # oxlint (React + oxc plugins)
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
npm run preview      # Preview production build locally
```

There is **no TypeScript** — the project uses plain JSX. There is **no backend** in this repo yet (FastAPI is planned but not scaffolded).

## Gotchas for Agents

- **Always `cd FRONTEND` first.** Running `npm` from repo root will fail or do nothing useful.
- **No TypeScript.** Never create `.tsx` files or add type annotations. All components are `.jsx`.
- **Linter is oxlint, not eslint.** Don't run `eslint`. Use `npm run lint` from `FRONTEND/`.
- **The animation package is `framer-motion`, not `motion`.**
- **React Router is v7, not v6.** Route syntax differs — check existing routes before adding new ones.
- **No backend here.** There are no API endpoints, no Express, no server code. Everything goes through Supabase client.
- **CSS is co-located, not global.** Each component gets its own `.css` file imported in the component. Don't create shared CSS files.
- **PWA config lives in `vite.config.js`.** If you modify caching, manifest, or service worker behavior, edit the `VitePWA` plugin config there.
- **Test setup is in `src/test/setup.js`.** Vitest config is in `vite.config.js`, not a separate vitest config file.
- **`.env.local` is required but gitignored.** Copy from `.env.example`. Never commit `.env.local`.
- **Supabase migrations are in `FRONTEND/supabase/migrations/`.** These are SQL files applied via Supabase dashboard/CLI — they are not run by the app.

## Environment Setup

Copy `FRONTEND/.env.example` to `FRONTEND/.env.local` and fill in:
- `VITE_SUPABASE_URL` — your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — your Supabase anon/public key

Supabase CLI migrations live in `FRONTEND/supabase/migrations/`. Apply them via the Supabase dashboard or CLI against your project.

## Architecture

- **Supabase-first**: All CRUD and realtime go through the Supabase JS client (`src/shared/lib/supabase.js`). No custom API layer.
- **Zustand stores**: Auth, chat, and album state managed via Zustand (`src/stores/`). Stores call Supabase directly.
- **Feature-based organization**: Each feature (`auth/`, `chat/`, `album/`, `pairing/`, `profile/`, `settings/`) has its own directory with component(s), CSS, and hooks.
- **Protected routes**: `ProtectedRoute` wraps all authenticated views. `PairingGate` wraps features requiring a paired partner.
- **PWA**: Configured via `vite-plugin-pwa` in `vite.config.js`. Service worker registered in `main.jsx`. Workbox caches Supabase storage with `StaleWhileRevalidate`.

## Code Conventions

- **JSX, not TSX**: All components are `.jsx` files
- **CSS files co-located**: Each component has a matching `.css` file (e.g., `chat.css`, `auth.css`)
- **lucide-react** for icons
- **motion** (framer-motion) for animations
- **date-fns** for date formatting
- **react-router-dom v7** for routing
- **oxlint** for linting (React hooks rules enforced)
- **vitest + @testing-library/react** for testing

## Current State

- **v1.0 MVP shipped** (Phases 1-3 complete): Foundation, pairing, real-time chat, voice/image sharing
- **Next up**: Phase 4 (Homepage Dashboard), Phase 5 (Shared Notes & Agenda)
- See `.planning/ROADMAP.md` for full roadmap

## GSD Workflow

This project uses GSD for structured development. Key commands:

- `/gsd-progress` — Check current progress
- `/gsd-plan-phase N` — Plan a phase
- `/gsd-execute-phase N` — Execute a phase
- `/gsd-verify-work` — Validate completed work
- `/gsd-ship` — Create PR

## Component Fix Workflow

Whenever asked to fix a component, follow this order:
1. **Inspect the DOM** — use Playwright or DevTools MCP to take a snapshot of the element and its ancestors.
2. **Identify applied CSS** — check which rules are actually computed (not just authored). Distinguish whether the problem comes from Flexbox, Grid, margin, padding, position, width, height, or z-index.
3. **Explain the root cause** in one sentence before touching any file.
4. **Apply the smallest possible fix** — prefer adding/adjusting a single CSS property over restructuring markup.
5. **Validate visually** — take a screenshot or snapshot after the change to confirm the fix worked.

## Documentation

- `docs/Features.md` — Feature definitions
- `docs/Roadmap.md` — Future features (v2+)
- `docs/UIUX.md` — UI/UX guidelines
- `docs/deploy.md` — Deployment guide for all platforms
- `docs/cosmic-v2.html` — Design reference (validate before implementing new UI)
