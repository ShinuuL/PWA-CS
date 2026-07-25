# CoupleSpace

## What This Is

CoupleSpace is a mobile-first Progressive Web App for couples, designed to strengthen communication, preserve special moments, and share experiences intuitively. Two people connect via an invite code/link (pairID) and share a private, romantic digital space — chat, daily dashboard, shared memories, and agenda management.

## Core Value

Chat between couples — real-time private messaging is the foundation. If everything else fails, the couple must be able to communicate seamlessly.

## Current State

**Shipped:** v1.0 MVP (2026-07-25)
**Phases complete:** 3 of 5
**Requirements:** 19/27 v1 requirements done

v1.0 delivers: Google OAuth, couple pairing, real-time chat with replies/reactions/delete/typing, WhatsApp-style voice messages, image sharing, and a shared photo album.

## Requirements

### Validated (v1.0)

- ✓ Google OAuth authentication — v1.0
- ✓ Session persistence across refresh — v1.0
- ✓ Couple pairing via invite code/link — v1.0
- ✓ Profile management (name, avatar) — v1.0
- ✓ Real-time private text messaging — v1.0
- ✓ Message replies (quote) — v1.0
- ✓ Emoji reactions — v1.0
- ✓ Mobile-optimized chat — v1.0
- ✓ Voice messages (hold-to-record, waveform) — v1.0
- ✓ Image sharing in chat — v1.0
- ✓ Shared photo album — v1.0
- ✓ Mini photo album widget — v1.0

### Active (v1.1)

- [ ] Homepage random memory photo
- [ ] Daily mood tracker with quick-select emotions
- [ ] Mood status visible to both partners
- [ ] Shared notes/journal
- [ ] Event calendar with date-organized view
- [ ] Shared reminders

### Out of Scope

- Real-time location sharing — privacy complexity
- Virtual pet — not core value
- Minigames — not core value
- Flutter native app — React PWA first
- Email/password auth — Google OAuth only
- AI coaching/therapy — regulatory risk
- Video calling — high complexity, not core
- Social/community features — private couple space only

## Context

- Tech stack: React 19 + Vite + PWA, Supabase (auth/DB/storage), Zustand stores
- Supabase-first: all CRUD through client SDK
- FastAPI backend only for external API proxying (future: Spotify, Google Calendar)
- Hosted on Vercel (frontend + backend)
- Design reference: `cosmic-v2.html` (romantic, minimal, modern aesthetic)
- MCPs available: Supabase, GitHub

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Google OAuth only | Simplicity, most users have Google accounts | ✓ Good |
| Supabase + FastAPI hybrid | Supabase for core, FastAPI for complex logic | ✓ Good |
| React PWA first | Faster to ship, mobile-first, installable | ✓ Good |
| PairID as universal access key | Every table gets pair_id with RLS | ✓ Good |
| Custom Canvas Waveform | React 19 broke react-audio-visualize | ✓ Good |
| pendingTempIds for optimistic msgs | Supabase realtime doesn't include temp_id | ✓ Good |
| Supabase Realtime for chat | No custom WebSocket server needed | ✓ Good |

## Constraints

- **Tech Stack**: React + JavaScript frontend, Supabase services — pre-decided
- **Mobile First**: All UI must work perfectly on smartphones, tablets, and desktop
- **Design System**: Must follow `cosmic-v2.html` reference — romantic, minimal, modern
- **PairID System**: All features designed around two connected users
- **Hosting**: Vercel (frontend + backend as serverless functions)
- **PWA**: Must be installable, work offline where possible

---
*Last updated: 2026-07-25 after v1.0 milestone*
