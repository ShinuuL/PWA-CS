# Domain Pitfalls: CoupleSpace PWA

**Domain:** Couple-focused Progressive Web App  
**Researched:** 2026-07-24  
**Overall confidence:** HIGH (based on cross-domain analysis of couple apps, PWAs, and real-time chat systems)

## Executive Summary

CoupleSpace operates in a high-stakes domain where privacy failures are catastrophic, retention is uniquely challenging (requiring both partners to stay engaged), and real-time features demand robust architecture. The most dangerous pitfalls stem from the **dual-user dependency** (both partners must stay engaged), **extreme privacy sensitivity** (relationship data is intimate), and **PWA limitations** (offline-first expectations vs. real-time requirements). Failure to address these early will result in user churn, trust erosion, and potential data breaches.

## Critical Pitfalls

### Pitfall 1: The "Four Horsemen of Churn" in Couple Apps
**What goes wrong:** Both partners must stay engaged for the app to be useful. When one partner loses interest, the other leaves too. This creates a 4-way churn dynamic: both happy (stay), both unhappy (leave), one happy/one unhappy (leave), one likes/one doesn't (leave).
**Why it happens:** Couple apps solve specific problems (communication, planning) but lack ongoing utility once the immediate need is met.
**Consequences:** High churn rates, poor retention metrics, difficulty proving product-market fit.
**Prevention:** Design for **daily habits** not problem-solving. Make the app part of routine (morning dashboard, daily mood check, shared playlist). Avoid "fix-it" positioning—position as "daily connection tool."
**Detection:** Track both partners' engagement independently. Alert if one partner's activity drops >50% in a week.
**Phase:** Must be addressed in Phase 1 (Foundation) through core feature design.

### Pitfall 2: Privacy Breach Catastrophe
**What goes wrong:** Relationship data (chat logs, photos, mood patterns) is exposed. Unlike other apps, breach consequences include emotional harm, relationship damage, and potential blackmail.
**Why it happens:** Developers treat couple data like regular user data, skipping encryption, access controls, or proper data isolation.
**Consequences:** Irreparable trust loss, potential legal liability, negative press that kills the product.
**Prevention:** 
1. Encrypt all chat messages at rest (Supabase column-level encryption or app-level)
2. Implement strict pairID isolation (Row-Level Security policies)
3. Never log message content in server logs
4. Add data retention controls (allow couples to delete their entire space)
**Detection:** Security audits, penetration testing focused on data isolation.
**Phase:** Phase 1 (Foundation) - must be baked in from day one.

### Pitfall 3: Real-Time Chat Reliability Failure
**What goes wrong:** Messages don't sync, arrive out of order, or disappear. Users lose trust in the core feature.
**Why it happens:** Underestimating WebSocket complexity, improper state management, or relying on polling.
**Consequences:** Users revert to WhatsApp/SMS, core value proposition collapses.
**Prevention:**
1. Use Supabase Realtime (built-in) instead of custom WebSocket implementation
2. Implement message queue with optimistic updates and conflict resolution
3. Add offline message queuing with sync-on-reconnect
4. Use UUIDs for message IDs (not sequential) to avoid ordering issues
**Detection:** Monitor message delivery rates, latency, and sync conflicts.
**Phase:** Phase 2 (Core Features) - but architecture decisions in Phase 1.

### Pitfall 4: PWA Installation & Offline Expectations Gap
**What goes wrong:** Users expect native app experience but hit PWA limitations: no background sync, poor offline support, iOS Safari quirks.
**Why it happens:** Overpromising PWA capabilities or underestimating platform differences.
**Consequences:** Frustrated users, low install rates, "this feels like a website" perception.
**Prevention:**
1. Set clear expectations: "Install for the best experience" not "Works offline everywhere"
2. Prioritize offline for **viewing** not **sending** (cache messages, photos for viewing)
3. Test on actual iOS devices (not just Chrome DevTools)
4. Use Workbox for intelligent caching strategies
**Detection:** Track install rates, PWA vs browser usage, offline error reports.
**Phase:** Phase 1 (Foundation) - PWA configuration must be correct from start.

### Pitfall 5: Voice Message Processing Bottleneck
**What goes wrong:** Audio recording/upload fails, playback is buggy, or processing costs explode.
**Why it happens:** Browser audio APIs are inconsistent, file sizes are large, and server processing is expensive.
**Consequences:** Feature feels broken, high server costs, poor mobile experience.
**Prevention:**
1. Use MediaRecorder API with fallbacks (check browser support)
2. Compress audio client-side before upload (target 32kbps Opus)
3. Stream upload (not wait for full recording)
4. Set realistic size limits (e.g., 2 minutes max)
**Detection:** Monitor upload failure rates, processing times, storage costs.
**Phase:** Phase 2 (Core Features) - voice messages are table stakes.

## Moderate Pitfalls

### Pitfall 6: Google OAuth Complexity
**What goes wrong:** OAuth flow breaks on certain devices, token refresh fails, or session management is buggy.
**Why it happens:** OAuth is deceptively complex (token refresh, cross-device sessions, error handling).
**Consequences:** Users can't log in, lose access to their couple space.
**Prevention:**
1. Use Supabase Auth (handles OAuth complexity)
2. Implement proper token refresh logic
3. Add session timeout warnings
4. Test on multiple devices/browsers
**Detection:** Monitor auth failure rates, session duration, token refresh success.
**Phase:** Phase 1 (Foundation) - must work perfectly.

### Pitfall 7: PairID System Design Flaws
**What goes wrong:** Invite codes are guessable, pairing is confusing, or unpairing is impossible.
**Why it happens:** Overlooking edge cases (what if they break up? what if one loses their phone?).
**Consequences:** Security vulnerabilities, user frustration, support burden.
**Prevention:**
1. Use long random codes (8+ characters, alphanumeric)
2. Implement proper pairing flow with confirmation from both sides
3. Add unpairing with data retention options
4. Rate-limit pairing attempts
**Detection:** Monitor pairing success rates, support tickets about pairing.
**Phase:** Phase 1 (Foundation) - core to the product.

### Pitfall 8: Mobile-First Implementation Debt
**What goes wrong:** Desktop works great, mobile is clunky. Touch targets too small, gestures conflict, performance lags.
**Why it happens:** Developing on desktop first, testing on desktop first.
**Consequences:** Poor mobile experience (where 80%+ of usage will be).
**Prevention:**
1. Start every feature with mobile prototype
2. Use mobile-first CSS (min-width not max-width)
3. Test on real devices early and often
4. Implement touch-friendly interactions (swipe, pull-to-refresh)
**Detection:** Mobile user engagement metrics, touch target heatmaps.
**Phase:** Phase 1 (Foundation) - design system must be mobile-first.

### Pitfall 9: Spotify Integration Breaking Changes
**What goes wrong:** Spotify API changes, rate limits, or deprecates features.
**Why it happens:** Third-party APIs are unstable, especially for consumer apps.
**Consequences:** "Now Playing" feature breaks, shared playlist stops working.
**Prevention:**
1. Use Spotify Web API with proper error handling
2. Implement graceful degradation (show "Spotify unavailable")
3. Cache recent data (don't fetch every page load)
4. Monitor API status and deprecation notices
**Detection:** API error rates, feature availability reports.
**Phase:** Phase 3 (Integrations) - but design for resilience early.

### Pitfall 10: Calendar Sync Complexity
**What goes wrong:** Google Calendar integration fails, events don't sync, or timezone handling is wrong.
**Why it happens:** Calendar APIs are complex, timezone handling is error-prone.
**Consequences:** Missed events, frustrated users, feature abandonment.
**Prevention:**
1. Use Google Calendar API v3 with proper OAuth scopes
2. Store timezone with every event
3. Implement bidirectional sync with conflict resolution
4. Add manual event creation as fallback
**Detection:** Sync success rates, timezone-related bugs, user complaints.
**Phase:** Phase 3 (Integrations) - complex but valuable.

## Minor Pitfalls

### Pitfall 11: Emoji Reaction UX Confusion
**What goes wrong:** Users don't know they can react, reactions are hard to add/remove, or count is confusing.
**Why it happens:** Mobile gesture conflicts (swipe vs. long-press), small touch targets.
**Consequences:** Feature underused, poor engagement metrics.
**Prevention:**
1. Use long-press for reaction menu (standard pattern)
2. Show reaction count clearly
3. Allow multiple reactions per message
4. Add subtle animation when reaction is added
**Detection:** Feature usage rates, user testing feedback.
**Phase:** Phase 2 (Core Features) - important for engagement.

### Pitfall 12: Mood Tracker Engagement Drop-off
**What goes wrong:** Users log mood for a week, then stop. Data becomes stale.
**Why it happens:** Mood tracking feels like a chore, not a habit.
**Consequences:** Feature becomes unused, dashboard shows old data.
**Prevention:**
1. Make it effortless (one tap to log)
2. Show trends over time (motivating)
3. Integrate with other features (mood affects dashboard)
4. Add reminders (gentle, not pushy)
**Detection:** Daily/weekly active mood logging rates.
**Phase:** Phase 2 (Core Features) - habit formation is key.

### Pitfall 13: Photo Album Storage Costs
**What goes wrong:** Couples upload hundreds of photos, storage costs explode.
**Why it happens:** No limits, no compression, no cost awareness.
**Consequences:** Unexpected server bills, potential service disruption.
**Prevention:**
1. Set reasonable limits (e.g., 500 photos per couple)
2. Compress images on upload (WebP, max 2MB)
3. Use Supabase Storage with proper policies
4. Monitor storage usage per couple
**Detection:** Storage growth rate, cost alerts.
**Phase:** Phase 2 (Core Features) - must have cost controls.

### Pitfall 14: Notification Overload
**What goes wrong:** Too many notifications (new message, mood logged, event added), users disable them.
**Why it happens:** Each feature adds notifications without considering cumulative effect.
**Consequences:** Users disable all notifications, miss important updates.
**Prevention:**
1. Batch notifications (digest, not per-event)
2. Allow granular control (per-feature notification settings)
3. Use smart defaults (important notifications on, minor off)
4. Respect Do Not Disturb
**Detection:** Notification opt-out rates, notification open rates.
**Phase:** Phase 2 (Core Features) - must get notification strategy right.

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|---------------|------------|
| Phase 1: Foundation | OAuth/PairID bugs block entire app | Extensive testing on real devices, staged rollout |
| Phase 2: Core Features | Chat reliability issues surface | Load testing, monitoring, fallback mechanisms |
| Phase 3: Integrations | Third-party API failures | Graceful degradation, caching, error handling |
| Phase 4: Polish | Performance issues on low-end devices | Profiling, lazy loading, code splitting |
| Phase 5: Launch | Privacy compliance gaps | Pre-launch security audit, privacy policy review |

## Research Sources

- "Why I shelved my mobile app after 500k downloads" - Couply pivot story (retention challenges)
- "How to Build a Secure AI Relationship Coach App MVP" - Privacy/security patterns
- "GDPR Compliant App Development Guide" - Data protection requirements
- "Common Privacy by Design Mistakes SaaS Teams Still Make" - Operational privacy
- "Top Mistakes Founders Make While Building a Dating App" - Mobile UX patterns
- Supabase documentation - Realtime, Auth, Storage best practices
- PWA documentation - Offline support, installation patterns
- Real-time chat architecture patterns - WebSocket management, conflict resolution

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Couple app retention | HIGH | Based on Couply case study and industry patterns |
| Privacy requirements | HIGH | GDPR analysis, relationship data sensitivity research |
| PWA limitations | MEDIUM-HIGH | Platform-specific quirks require real-world testing |
| Real-time chat | HIGH | Established patterns, but implementation complexity varies |
| Third-party integrations | MEDIUM | APIs change, requires ongoing maintenance |

## Roadmap Implications

Based on pitfalls research, recommend:
1. **Phase 1 must be rock-solid** - OAuth, PairID, PWA config, privacy foundation
2. **Chat reliability is non-negotiable** - Invest in proper architecture early
3. **Design for daily habits** - Not problem-solving, but routine connection
4. **Privacy by design** - Encryption, access controls, data retention from day one
5. **Mobile-first testing** - Real devices, not just emulators

## Quality Gate

- [x] Pitfalls are specific to this domain (couple apps, PWAs, real-time chat)
- [x] Prevention strategies are actionable (specific technologies, patterns)
- [x] Phase mapping included (which phase addresses each pitfall)
- [x] Confidence levels assigned (based on research sources)
- [x] Sources documented (research papers, case studies, documentation)
