# Feature Landscape

**Domain:** Couple-focused PWA (CoupleSpace)
**Researched:** 2026-07-24
**Overall confidence:** HIGH

## Executive Summary

The couple app ecosystem in 2026 is crowded but fragmented. Most apps fall into two camps: (1) private communication spaces (Between, Couple, DearUs) that serve as a couple's dedicated messaging hub, and (2) relationship growth tools (Paired, Lasting, Connected) focused on daily questions, quizzes, and coaching. CoupleSpace's vision — a **homepage dashboard** combining chat, photos, mood, music, and agenda — occupies a unique middle ground that doesn't yet exist as a clear category winner. The "everything in one place" angle is powerful, but the execution risk is real: feature creep killed Couply (500k downloads but unsustainble retention) and many "all-in-one" apps become "nothing well." The key insight from research: **daily rituals and ambient presence** (seeing your partner's mood, a shared photo, a countdown) drive retention better than utility features.

## Table Stakes

Features users expect in a couple app. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Private real-time chat** | Core of every couple app; Between's entire value prop is private messaging | High | Text, images, voice messages, emoji reactions. Already planned. |
| **Photo sharing in chat** | Universal across Between, Couple, DearUs, futari | Low-Med | Image upload + inline display. Already planned. |
| **Voice messages** | WhatsApp-style audio is standard UX for intimate chat | Med | Record, upload, waveform playback. Already planned. |
| **Message reply/quote** | Standard messaging expectation (WhatsApp, Telegram) | Low | Quote a message with context. Already planned. |
| **Emoji reactions** | Every modern chat has this; absence feels broken | Low | Tap to react with emoji. Already planned. |
| **Anniversary/days counter** | THE universal couple app feature; LoveDays, Coupled, futari, Amorelle all lead with this | Low | "X days together" prominently displayed. Already planned. |
| **Shared photo album** | Between, Coupled, DearUs, futari all have shared albums | Med | Organized photos both partners can browse. Already planned (homepage mini-album). |
| **Shared calendar** | Between, Raccoon Couple, OurCouple, futari all have this | Med | Create events, see partner's schedule. Already planned. |
| **Daily check-in/mood** | Amora, Bloom, InnerBond, Raccoon Couple — daily mood is table stakes | Low | Quick mood selection visible to partner. Already planned. |
| **Important date reminders** | Anniversaries, birthdays, upcoming events with notifications | Low-Med | Push notifications for key dates. Already planned (agenda). |
| **Couple pairing** | Every app needs a way to connect two users | Low | Invite code/link system. Already planned. |

## Differentiators

Features that set CoupleSpace apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Homepage dashboard as primary view** | Most apps have separate tabs; a single "home" that shows your relationship at a glance is unique | Med | Amorelle and futari do this well — "Home" tab showing photos, counter, mood, question, plans. CoupleSpace's core differentiator. |
| **Spotify now-playing integration** | No couple app does this well; music is deeply personal and romantic | Med | Real-time "what partner is listening to" — ambient presence without texting. Unique to CoupleSpace. |
| **Shared playlist display** | Extension of Spotify integration; shows musical compatibility | Low | Display shared playlist on homepage. |
| **Random memory highlight** | Amora does "daily question"; CoupleSpace can do "photo from our album" as the daily ritual | Low | Algorithmically picks a memory photo. Simple but emotionally powerful. |
| **24-hour photo stories** | Amora and futari have this; ephemeral sharing feels alive | Med | Photos that appear for 24h then archive. Creates daily anticipation. |
| **Connection streak** | Amora, Bloom, InnerBond all track daily engagement streaks | Low | Gamification that drives daily opens. |
| **Daily question of the day** | Paired, Amora, futari, Amorelle — this is THE engagement driver in 2026 | Low | One question daily, both answer, then see each other's response. |
| **Home/lock screen widgets** | Bloom (7 widgets), LoveDays, Adeux — widgets are a major retention tool | Med | Shows partner's mood, countdown, daily question. Limited in PWA but possible with PWA widget API. |
| **End-to-end encryption** | OurCouple, DearUs lead with this; privacy is a growing differentiator | High | "Your private space" promise. Worth considering for trust. |
| **Shared to-do/task list** | SameWave, Raccoon Couple, Coupled all have this | Med | "Buy milk" to "plan vacation" — practical utility. |
| **Love notes/letters** | Bloom (future letters), DearUs (love notes), Amorelle (letters) | Low-Med | Asynchronous romantic messages. Simple but emotional. |
| **Location sharing** | Between, DearUs, Adeux have this (premium) | High | Deferred in roadmap — correct call for MVP. |
| **Relationship timeline** | Coupled, futari, Amorelle — visual timeline of milestones | Med | Auto-generated from shared events and photos. |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **AI relationship coaching/therapy** | Requires clinical disclaimers, moderation, liability, expensive AI costs. Paired and Lasting own this space. CoupleSpace is a *space*, not a *coach*. | Focus on the private space; let users have their own conversations. |
| **Relationship quizzes/tests** | Paired, Connected, Amora all do this. Couples churn after completing quizzes (Couply's "four horsemen of churn"). | Instead, use daily questions (one at a time) for sustained engagement. |
| **Shared finances/budgeting** | Honeydue owns this. Money is a sensitive topic that kills romance. | Out of scope entirely. |
| **Complex minigames** | futari has 10+ games, but they're a retention gimmick, not core value. High dev effort for low differentiation. | Deferred to roadmap. If added later, keep it simple (1-2 games max). |
| **Social features/community** | Couple apps are private by nature. Any social element (likes, profiles, discovery) breaks the trust contract. | Never. This is a private space for two. |
| **Video calling** | WhatsApp, FaceTime, Zoom already do this perfectly. Competing here is futile. | Instead, integrate with existing calling apps if needed. |
| **Virtual pet** | OurCouple has this but it's a gimmick. Adds complexity without solving a real problem. | Deferred to roadmap. Only add if user research demands it. |
| **Notification spam** | "Check in with your partner!" every hour kills engagement. Respect attention. | Gentle nudges only. Quality over quantity. |
| **Desktop-first design** | Couple apps are used on phones, often in bed or on the couch. Desktop is a secondary view at best. | Mobile-first with responsive desktop. Already decided. |
| **Email/password auth** | Password fatigue is real. Google OAuth is simpler and more secure. | Already decided: Google OAuth only. |
| **Complex onboarding** | Multiple screens before first value = high dropoff. Show the magic fast. | Pair → Dashboard in under 60 seconds. |

## Feature Dependencies

```
Couple Pairing → All features (everything requires a paired couple)
Chat → Voice messages (voice is a chat feature)
Chat → Image sharing (images are a chat feature)
Chat → Message reply (reply is a chat feature)
Chat → Emoji reactions (reactions are a chat feature)
Homepage → Random memory highlight (needs shared album)
Homepage → Mood tracker (mood display needs mood input)
Homepage → Spotify integration (needs Spotify OAuth)
Homepage → Mini photo album (needs shared album)
Homepage → Anniversary counter (needs pairing date)
Agenda → Google Calendar integration (needs OAuth)
Agenda → Shared reminders (needs calendar + notifications)
Agenda → Date-organized view (needs event creation)
```

## MVP Recommendation

### Phase 1: Core Communication
Prioritize:
1. **Couple pairing** — gate to everything
2. **Private real-time chat** — the foundation
3. **Voice messages** — WhatsApp-style, already planned
4. **Image sharing in chat** — essential media
5. **Message reply + reactions** — chat completeness

### Phase 2: Homepage Dashboard
6. **Anniversary counter** — simple but emotionally powerful
7. **Mood tracker** — quick daily check-in
8. **Random memory highlight** — the daily ritual
9. **Mini photo album** — visual presence
10. **Homepage layout** — the unifying dashboard

### Phase 3: Shared Life
11. **Shared calendar** — agenda management
12. **Google Calendar integration** — sync with existing
13. **Shared reminders** — practical utility
14. **Event creation** — couple planning

### Phase 4: Polish & Delight
15. **Spotify integration** — ambient presence differentiator
16. **Shared playlist** — music as connection
17. **Push notifications** — engagement triggers
18. **PWA installability** — home screen presence

### Defer:
- **Daily question**: Add after Phase 2 if engagement data shows users want more daily rituals
- **24-hour stories**: Add after chat is solid; needs careful UX to not feel gimmicky
- **Connection streaks**: Add after daily rituals are established
- **Home screen widgets**: PWA widget API is limited; wait for Flutter native
- **Location sharing**: Already deferred in roadmap
- **Virtual pet**: Already deferred in roadmap
- **Minigames**: Already deferred in roadmap

## Feature Complexity Summary

| Complexity | Features |
|------------|----------|
| **Low** | Emoji reactions, message reply, anniversary counter, mood tracker, random memory highlight, connection streaks |
| **Medium** | Voice messages, image sharing, shared calendar, mini photo album, Spotify integration, daily questions, shared to-do |
| **High** | Real-time chat infrastructure, Google Calendar integration, E2E encryption, home screen widgets, video calling, location sharing |

## Sources

- Connected Couples app comparison (2026): https://www.connectedcouples.app/blog/best-couples-apps-2026
- Amora app features and pricing (2026): https://tryamora.app/blog/best-apps-for-couples-2026
- OurCouple vs Paired comparison (2026): https://ourcouple.app/blog/ourcouple-vs-paired
- SameWave feature comparison (2026): https://same-wave.app/blog/best-couples-apps-2026-honest-comparison
- Orbs couples app features: https://orbsapp.ai/
- DearUs app features: https://www.dearusapp.com/
- Raccoon Couple features: https://www.raccooncouple.com/
- Amorelle AI couples app: https://amorelle.ai/
- futari couples calendar app: https://apps.apple.com/us/app/futari-couples-calendar-app/id6740544157
- Bloom Together features: https://www.bloomcouples.app/
- Coupled relationship tracker: https://coupled.app/
- InnerBond relationship app: https://innerbondapp.com/
- My Better Half features: https://mybetterhalf.io/
- Adeux app features: https://adeux.app/en/features
- LoveDays couple tracker: https://apps.apple.com/lc/app/lovedays-couple-tracker/id6760181380
- Couply pivot story (retention insights): https://dev.to/charlie_brinicombe/from-500k-downloads-to-profitable-side-project-the-couply-pivot-story-4inn
- Growing Us relationship app comparison: https://www.growingus.coach/blog/best-relationship-apps-couples-comparison-2026/
