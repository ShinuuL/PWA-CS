# CoupleSpace

## What This Is

CoupleSpace is a mobile-first Progressive Web App for couples, designed to strengthen communication, preserve special moments, and share experiences intuitively. Two people connect via an invite code/link (pairID) and share a private, romantic digital space — chat, daily dashboard, shared memories, and agenda management.

## Core Value

Chat between couples — real-time private messaging is the foundation. If everything else fails, the couple must be able to communicate seamlessly.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Couple pairing via invite code/link system
- [ ] Google OAuth authentication
- [ ] Real-time private chat between paired couple
- [ ] WhatsApp-style voice messages (record, upload, inline playback with waveform)
- [ ] Image sharing in chat
- [ ] Message reply (quote) functionality
- [ ] Emoji reactions on messages
- [ ] Mobile-optimized chat interface
- [ ] Homepage dashboard as primary view after login
- [ ] Random memory highlight (photo from shared album)
- [ ] Mood tracker with quick-select emotions
- [ ] Spotify now playing preview
- [ ] Shared playlist display
- [ ] Mini photo album (horizontal scrollable) on homepage
- [ ] Agenda with event creation
- [ ] Google Calendar integration
- [ ] Shared reminders for both partners
- [ ] Date-organized agenda view

### Out of Scope

- Real-time location sharing — deferred to future version
- Virtual pet — deferred to future version
- Minigames — deferred to future version
- Flutter native app — React PWA first, Flutter later
- Email/password authentication — using Google OAuth only
- Desktop-optimized layout — mobile-first, desktop secondary

## Context

- Existing documentation defines features (Chat, Homepage, Agenda), UI/UX guidelines, and PWA development standards
- Design reference: `cosmic-v2.html` (to be validated before implementation)
- Project uses an existing AI agent workflow (Planner → Coder → Verifier → Reviewer)
- Tech stack: React (frontend), Python/FastAPI (backend), Supabase (auth/DB/storage)
- Future roadmap: real-time location, virtual pet, minigames
- MCPs available: Supabase, GitHub, Vercel

## Constraints

- **Tech Stack**: React + JavaScript frontend, Python/FastAPI backend, Supabase services — all pre-decided
- **Mobile First**: All UI must work perfectly on smartphones, tablets, and desktop
- **Design System**: Must follow `cosmic-v2.html` reference — romantic, minimal, modern aesthetic
- **No Broken Components**: Every feature must be fully implemented and navigable before shipping
- **PairID System**: All features designed around two connected users sharing a private space
- **Hosting**: Full Vercel (frontend + backend as serverless functions)
- **PWA**: Must be installable, work offline where possible, follow PWA standards

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google OAuth only | Simplicity, most users have Google accounts | — Pending |
| Supabase + FastAPI hybrid | Supabase for core services, FastAPI for complex logic (audio processing, etc.) | — Pending |
| React PWA first | Faster to ship, mobile-first, installable without app stores | — Pending |
| Flutter later | Native app experience when PWA proves the concept | — Pending |
| Full Vercel hosting | Simplifies deployment, serverless scaling | — Pending |
| Invite code/link pairing | Simplest flow for two people to connect | — Pending |
| WhatsApp-style voice messages | Familiar UX pattern, users expect this in chat | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-24 after initialization*
