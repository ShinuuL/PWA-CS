# Roadmap: CoupleSpace

## Overview

CoupleSpace ships as a mobile-first PWA that gives couples a private shared space. The roadmap follows a vertical MVP approach: each phase delivers an end-to-end user capability. Foundation and auth come first (everything depends on pairing), then real-time chat (the core value), then media features, then the homepage dashboard (the differentiator), and finally shared notes and agenda. Each phase produces a deployable artifact — no big-bang integration.

## Phases

- [x] **Phase 1: Foundation & Pairing** - App shell, Supabase setup, Google OAuth, couple pairing, profiles
- [ ] **Phase 2: Real-Time Chat** - Private messaging with text, replies, and emoji reactions
- [ ] **Phase 3: Voice & Image Sharing** - Voice messages, image sharing in chat, shared photo album
- [ ] **Phase 4: Homepage Dashboard** - Random memory, mood tracker, mini photo album, daily ritual view
- [ ] **Phase 5: Shared Notes & Agenda** - Collaborative notes, event calendar, date reminders

## Phase Details

### Phase 1: Foundation & Pairing
**Goal**: Two users can authenticate, pair, and see each other's profiles in a shared private space
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):
  1. User can sign in with Google and stay logged in across browser refreshes
  2. User can generate an invite code/link and share it with their partner
  3. Partner can enter the invite code to connect, and the pair is established
  4. User can set display name and upload a profile picture visible to their partner
  5. Each user can see their partner's profile within the paired space
**Plans**: 3 plans created

Plans:
- [x] 01-01: Project Scaffold & Supabase Foundation (Vite + PWA, Supabase client, DB schema, auth store, app shell)
- [x] 01-02: Authentication & Pairing System (Google OAuth, auth callback, invite codes, pairing UI, session persistence)
- [x] 01-03: Profile Management & App Shell (profile edit, avatar upload, partner view, drawer navigation, settings)

### Phase 2: Real-Time Chat
**Goal**: Paired couples can exchange real-time messages with rich interaction
**Depends on**: Phase 1
**Requirements**: CHAT-01, CHAT-05, CHAT-06, CHAT-07
**Success Criteria** (what must be TRUE):
  1. User can send a text message and partner receives it in real-time
  2. User can reply to a specific message and the quoted context is visible
  3. User can react to any message with an emoji and partner sees the reaction
  4. Chat interface works smoothly on mobile devices with proper sizing and touch targets
  5. Messages persist and load full history when reopening chat
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Voice & Image Sharing
**Goal**: Couples can exchange voice messages and images within their chat, and build a shared photo album
**Depends on**: Phase 2
**Requirements**: CHAT-02, CHAT-03, CHAT-04, HOME-04, HOME-05
**Success Criteria** (what must be TRUE):
  1. User can hold to record a voice message, see waveform, and send it inline in chat
  2. Partner can tap to play voice message with waveform visualization
  3. User can send images in chat that display inline as thumbnails
  4. User can upload photos to a shared album accessible from the homepage
  5. Mini photo album displays horizontally scrollable thumbnails on homepage
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Homepage Dashboard
**Goal**: Couples have a single view showing their relationship at a glance — the daily ritual that drives retention
**Depends on**: Phase 3
**Requirements**: HOME-01, HOME-02, HOME-03
**Success Criteria** (what must be TRUE):
  1. Homepage displays a random photo from the shared album as a daily memory highlight
  2. User can tap to select a daily mood from predefined emotions
  3. Partner's mood status is visible on the dashboard in real-time
  4. Homepage is the primary view after login with a clear, mobile-first layout
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Shared Notes & Agenda
**Goal**: Couples can collaborate on notes and manage a shared calendar of events
**Depends on**: Phase 4
**Requirements**: NOTE-01, NOTE-02, NOTE-03, AGND-01, AGND-02, AGND-03, AGND-04
**Success Criteria** (what must be TRUE):
  1. User can create a shared note and partner can read and edit it
  2. Notes are organized chronologically and both partners see the same list
  3. User can create an event with title, date, and description
  4. Events display in a date-organized view visible to both partners
  5. User can set a reminder for an event
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Pairing | 3/3 | Complete | 2026-07-24 |
| 2. Real-Time Chat | 0/2 | Not started | - |
| 3. Voice & Image Sharing | 0/2 | Not started | - |
| 4. Homepage Dashboard | 0/2 | Not started | - |
| 5. Shared Notes & Agenda | 0/2 | Not started | - |
