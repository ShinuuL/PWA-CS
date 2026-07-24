# AGENTS.md — CoupleSpace

## Project Context

CoupleSpace is a mobile-first PWA for couples to communicate, share moments, and manage experiences together. Built with React (frontend), Python/FastAPI (backend), Supabase (auth/DB/storage), hosted on Vercel.

**Core value:** Chat between couples — real-time private messaging is the foundation.

## GSD Workflow

This project uses the GSD (Get Stuff Done) workflow for structured development.

### Current State

- **Phase:** 1 — Foundation & Pairing
- **Roadmap:** 5 phases total
- **Requirements:** 27 v1 requirements defined

### Commands

- `/gsd-progress` — Check current progress and next steps
- `/gsd-discuss-phase N` — Gather context for phase N
- `/gsd-plan-phase N` — Create detailed plan for phase N
- `/gsd-execute-phase N` — Execute plans in phase N
- `/gsd-verify-work` — Validate completed work
- `/gsd-ship` — Create PR and prepare for merge

### Workflow Rules

1. Every task follows: Planner → Coder → Verifier → Reviewer
2. Never invent APIs, parameters, or libraries — use official docs
3. All implementations must compile, respect architecture, follow project patterns
4. Never expose credentials, remove validations, or ignore critical errors
5. Never change requirements or implement unsolicited features
6. Prioritize stability always

## Tech Stack

- **Frontend:** React 19.2 + Vite + vite-plugin-pwa
- **Backend:** Python 3.12+ / FastAPI 0.139+
- **Database/Auth/Storage:** Supabase
- **Hosting:** Vercel (full stack)
- **Styling:** TBD (based on cosmic-v2.html design reference)
- **Animations:** Motion for React 12.42+

## Architecture

- Supabase-first: All CRUD and real-time operations go through Supabase client SDK
- FastAPI only for: external API proxying (Spotify, Google Calendar), audio processing, server-side secrets
- PairID as universal access key: every table (except users/pairs) gets pair_id column with RLS
- Chat uses Supabase Realtime (postgres_changes) — no custom WebSocket server needed

## Design System

- Reference: `cosmic-v2.html` (to be validated before implementation)
- Mobile-first approach
- Romantic, minimal, modern aesthetic
- Card-based components with rounded borders, shadows, smooth animations

## Documentation

- `docs/Features.md` — Feature definitions
- `docs/Roadmap.md` — Future features (v2+)
- `docs/UIUX.md` — UI/UX guidelines
- `docs/DOCUMENTÇÃO PWA(Progressive Web App.md` — PWA development standards
