# Roadmap: CoupleSpace

## Overview

CoupleSpace ships as a mobile-first PWA that gives couples a private shared space. The roadmap follows a vertical MVP approach: each phase delivers an end-to-end user capability.

## Milestones

- ✅ **v1.0 MVP** — Phases 1-3 (shipped 2026-07-25)
- ✅ **v1.1 Complete** — Phases 4-5 (shipped 2026-07-28)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-3) — SHIPPED 2026-07-25</summary>

- [x] Phase 1: Foundation & Pairing (3/3 plans) — completed 2026-07-24
- [x] Phase 2: Real-Time Chat (3/3 plans) — completed 2026-07-25
- [x] Phase 3: Voice & Image Sharing (2/2 plans) — completed 2026-07-25

</details>

### 📋 v1.1 Complete (Planned)

- [x] Phase 4: Homepage Dashboard (2/2 plans) — completed 2026-07-27
- [x] Phase 5: Shared Notes & Agenda (3/3 plans) — completed 2026-07-28

## Phase Details

### Phase 4: Homepage Dashboard

**Goal**: Couples have a single view showing their relationship at a glance — the daily ritual that drives retention
**Depends on**: Phase 3
**Requirements**: HOME-01, HOME-02, HOME-03
**Success Criteria** (what must be TRUE):

  1. Homepage displays a random photo from the shared album as a daily memory highlight
  2. User can tap to select a daily mood from predefined emotions
  3. Partner's mood status is visible on the dashboard in real-time
  4. Homepage is the primary view after login with a clear, mobile-first layout

**Plans**: 2 plans

Plans:
**Wave 1**

- [ ] 04-01-PLAN.md — Database foundation (moods table + random photo RPC) and MemoryHero component

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 04-02-PLAN.md — Mood system (store, selector, partner display, modal) and dashboard assembly

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

**Plans**: 3 plans

Plans:

- [x] 05-01-PLAN.md — Database migration (shared_notes + agenda_events tables), Zustand stores (notesStore, agendaStore), AgendaPage with SegmentedTabs
- [x] 05-02-PLAN.md — EventsTab (CalendarGrid with swipe, EventRow, EventForm), NotesTab (NoteCard, NoteEditor), full agenda.css
- [x] 05-GAP-01-PLAN.md — Calendar swipe animation smoothing (gap closure)

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Pairing | v1.0 | 3/3 | Complete | 2026-07-24 |
| 2. Real-Time Chat | v1.0 | 3/3 | Complete | 2026-07-25 |
| 3. Voice & Image Sharing | v1.0 | 2/2 | Complete | 2026-07-25 |
| 4. Homepage Dashboard | v1.1 | 2/2 | Complete | 2026-07-27 |
| 5. Shared Notes & Agenda | v1.1 | 3/3 | Complete | 2026-07-28 |
