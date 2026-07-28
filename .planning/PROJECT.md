# CoupleSpace

## What This Is

CoupleSpace is a mobile-first Progressive Web App for couples, designed to strengthen communication, preserve special moments, and share experiences intuitively. Two people connect via an invite code/link (pairID) and share a private, romantic digital space — chat, daily dashboard, shared memories, and agenda management.

## Core Value

Chat between couples — real-time private messaging is the foundation. If everything else fails, the couple must be able to communicate seamlessly.

## Current State

**Shipped:** v1.0 MVP (2026-07-25), v1.1 Homepage Dashboard (2026-07-27), v1.2 Shared Notes & Agenda (2026-07-28)
**Phases complete:** 5
**Requirements:** 17/17 v1 requirements done

v1.0 delivers: Google OAuth, couple pairing, real-time chat with replies/reactions/delete/typing, WhatsApp-style voice messages, image sharing, and a shared photo album. v1.1 adds homepage dashboard with memory hero, mood tracking, and mini album. v1.2 adds shared notes and event calendar.

## Current Milestone: v2.0 Profile & Shared Utilities

**Goal:** Let users personalize their identity and manage shared life together.

**Target features:**
- Avatar upload with crop, display name editing, online/last seen status
- One-time shared reminders with push notifications
- Shared to-do lists with due dates and partner assignment

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
- ✓ Homepage random memory photo — v1.1
- ✓ Daily mood tracker with quick-select emotions — v1.1
- ✓ Mood status visible to both partners — v1.1
- ✓ Shared notes/journal — v1.2
- ✓ Event calendar with date-organized view — v1.2

### Active (v2.0)

- [ ] Avatar upload with crop tool
- [ ] Display name editing
- [ ] Online/last seen status visible to partner
- [ ] One-time shared reminders
- [ ] Push notification delivery for reminders
- [ ] Shared to-do lists with checkboxes
- [ ] To-do items with due dates
- [ ] To-do items assignable to either partner

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
*Last updated: 2026-07-28 after v2.0 milestone start*
