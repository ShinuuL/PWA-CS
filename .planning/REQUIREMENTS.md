# Requirements: CoupleSpace

**Defined:** 2026-07-24
**Core Value:** Chat between couples — real-time private messaging is the foundation

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Auth & Pairing

- [ ] **AUTH-01**: User can sign in with Google OAuth
- [ ] **AUTH-02**: User session persists across browser refresh
- [ ] **AUTH-03**: User can generate an invite code/link to pair with partner
- [ ] **AUTH-04**: User can enter an invite code/link to connect with partner
- [ ] **AUTH-05**: Only two users can be paired per pairID

### Profile

- [ ] **PROF-01**: User can set display name
- [ ] **PROF-02**: User can upload profile picture
- [ ] **PROF-03**: User can customize profile icon/avatar

### Chat

- [ ] **CHAT-01**: User can send and receive real-time text messages
- [ ] **CHAT-02**: User can record and send voice messages (WhatsApp-style: hold to record, slide to cancel)
- [ ] **CHAT-03**: Voice messages play inline with waveform display
- [ ] **CHAT-04**: User can send images in chat
- [ ] **CHAT-05**: User can reply to (quote) a specific message
- [ ] **CHAT-06**: User can react to messages with emojis
- [ ] **CHAT-07**: Chat interface is optimized for mobile devices

### Homepage Dashboard

- [ ] **HOME-01**: Homepage displays random memory photo from shared album
- [ ] **HOME-02**: User can select daily mood from predefined emotions (happy, tired, sad, missing, needy)
- [ ] **HOME-03**: Mood status is visible to both partners
- [ ] **HOME-04**: Mini photo album displays horizontally scrollable photos
- [ ] **HOME-05**: User can upload photos to shared album

### Shared Notes

- [ ] **NOTE-01**: User can create shared notes/journal entries
- [ ] **NOTE-02**: Both partners can read and edit shared notes
- [ ] **NOTE-03**: Notes are organized chronologically

### Agenda

- [ ] **AGND-01**: User can create events with title, date, and description
- [ ] **AGND-02**: Events are displayed in date-organized view
- [ ] **AGND-03**: Both partners can see and create events
- [ ] **AGND-04**: User can set reminders for events

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Spotify Integration

- **SPOT-01**: User can connect Spotify account
- **SPOT-02**: Homepage shows now-playing preview from both partners
- **SPOT-03**: Shared playlist display on homepage

### Agenda Advanced

- **AGND-05**: Google Calendar integration (bidirectional sync)
- **AGND-06**: Shared reminders with notifications

### Notifications

- **NOTF-01**: Push notifications for new messages
- **NOTF-02**: Push notifications for event reminders
- **NOTF-03**: In-app notification center

### Photo Stories

- **PSTR-01**: User can post 24-hour ephemeral photo stories
- **PSTR-02**: Partner can view and react to stories

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time location sharing | Deferred to future version — privacy complexity |
| Virtual pet | Deferred to future version — not core value |
| Minigames | Deferred to future version — not core value |
| Flutter native app | React PWA first, Flutter later |
| Email/password auth | Google OAuth only — simplicity |
| AI coaching/therapy | Regulatory risk + retention trap (Couply case study) |
| Relationship quizzes | Kills retention ( Couply evidence) |
| Shared finances | Out of scope for couple communication app |
| Video calling | High complexity, not core to value prop |
| Social/community features | Private couple space only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| PROF-01 | — | Pending |
| PROF-02 | — | Pending |
| PROF-03 | — | Pending |
| CHAT-01 | — | Pending |
| CHAT-02 | — | Pending |
| CHAT-03 | — | Pending |
| CHAT-04 | — | Pending |
| CHAT-05 | — | Pending |
| CHAT-06 | — | Pending |
| CHAT-07 | — | Pending |
| HOME-01 | — | Pending |
| HOME-02 | — | Pending |
| HOME-03 | — | Pending |
| HOME-04 | — | Pending |
| HOME-05 | — | Pending |
| NOTE-01 | — | Pending |
| NOTE-02 | — | Pending |
| NOTE-03 | — | Pending |
| AGND-01 | — | Pending |
| AGND-02 | — | Pending |
| AGND-03 | — | Pending |
| AGND-04 | — | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 0
- Unmapped: 27 ⚠️

---
*Requirements defined: 2026-07-24*
*Last updated: 2026-07-24 after initial definition*
