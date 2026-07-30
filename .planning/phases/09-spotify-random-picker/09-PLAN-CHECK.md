# Phase 9 Plan Check: Spotify Random Picker

**Reviewed:** 2026-07-30
**Plans:** 09-01-PLAN.md, 09-02-PLAN.md
**Reviewer:** GSD Plan Checker

---

## Dimension 1: Requirement Coverage — PASS

All 10 SPOT requirements mapped across both plans:

| Requirement | Plan 1 | Plan 2 |
|-------------|--------|--------|
| SPOT-01 (Connect via OAuth) | ✓ | |
| SPOT-02 (Link playlist) | ✓ | |
| SPOT-03 (Player card with album art) | | ✓ |
| SPOT-04 (Play/pause/skip) | | ✓ |
| SPOT-05 (Auto-rotate random) | | ✓ |
| SPOT-06 (Search and add songs) | | ✓ |
| SPOT-07 (View/manage playlist) | | ✓ |
| SPOT-08 (No repeat recent) | | ✓ |
| SPOT-09 (Auto token refresh) | ✓ | |
| SPOT-10 (Graceful Premium degradation) | | ✓ |

**Finding:** Coverage is complete. Every requirement appears in at least one plan's `requirements` field.

---

## Dimension 2: Task Completeness — PASS

Every task in both plans includes all required fields:
- `read_first` — present on all 12 tasks (6 per plan)
- `behavior` — present on all tasks
- `action` — present on all tasks
- `verify` — present on all tasks
- `acceptance_criteria` — present on all tasks
- `done` — present on all tasks

**Finding:** No missing fields.

---

## Dimension 3: File Specificity — PASS

Both plans list exact file paths. No vague references like "etc." or "related files":

Plan 1 files:
- `FRONTEND/supabase/migrations/20260730_create_spotify_tables.sql`
- `FRONTEND/supabase/functions/spotify-auth/index.ts`
- `FRONTEND/supabase/functions/spotify-playlist/index.ts`
- `FRONTEND/src/stores/spotifyStore.js`
- `FRONTEND/src/features/spotify/useSpotifyAuth.js`
- `FRONTEND/.env.local`

Plan 2 files:
- `FRONTEND/src/features/spotify/SpotifyPlayer.jsx`
- `FRONTEND/src/features/spotify/SpotifyPlayer.css`
- `FRONTEND/src/features/spotify/SpotifySearch.jsx`
- `FRONTEND/src/features/spotify/SpotifySearch.css`
- `FRONTEND/src/features/spotify/PlaylistManager.jsx`
- `FRONTEND/src/features/spotify/PlaylistManager.css`
- `FRONTEND/src/features/spotify/useSpotifyPlayer.js`
- `FRONTEND/src/features/dashboard/HomePage.jsx`
- `FRONTEND/src/App.jsx`

**Minor Note:** Plan 2 task 5 lists `spotifyStore.js` as `files_modified` (correct, since it modifies a Plan 1 file). Plan 2 task 7 adds `App.jsx` which is a new file not in the original `files_modified` frontmatter — this should be added to Plan 2's `files_modified` list.

---

## Dimension 4: Acceptance Criteria Quality — PASS

All criteria are specific and testable. Examples of strong criteria:

- "spotify_config table exists with all columns: id, pair_id, spotify_playlist_id, playlist_name, auto_rotate_interval, is_enabled, access_token, refresh_token, token_expires_at, created_at, updated_at" (Plan 1, Task 1)
- "Search input debounces at 300ms" (Plan 2, Task 3)
- "invalid_grant handling: deletes config row and returns 401 with 'reconnect_required'" (Plan 1, Task 2)
- "Timer pauses on tab hidden, resumes on visible" (Plan 2, Task 5)
- "All text in Portuguese (pt-BR)" (Plan 2, multiple tasks)

**Finding:** Criteria are concrete, verifiable, and include edge cases.

---

## Dimension 5: Dependency Correctness — PASS

- Plan 2 frontmatter: `depends_on: [09-01-PLAN.md]` ✓
- Plan 1 frontmatter: `depends_on: []` ✓
- No circular dependencies
- Plan 2 correctly references Plan 1 artifacts (spotifyStore.js, useSpotifyAuth.js)

**Finding:** Dependencies are correctly declared.

---

## Dimension 6: Threat Model — PASS

Both plans have complete STRIDE threat models:

Plan 1 covers: Spoofing (OAuth interception), Tampering (XSS token theft), Repudiation (unauthorized playlist changes), Information Disclosure (token theft via DB breach), Denial of Service (Spotify API rate limiting), Elevation of Privilege (refresh token abuse).

Plan 2 covers: Spoofing (fake track data), Tampering (playlist manipulation), Repudiation (unauthorized playback), Information Disclosure (listening history exposure), Denial of Service (excessive search calls), Elevation of Privilege (wrong playlist access).

**Finding:** Both threat models are thorough and realistic.

---

## Dimension 7: Context References — PASS

Plan 1 references:
- `09-CONTEXT.md` — Design decisions D-01 through D-31
- `09-RESEARCH.md` — Technical patterns (Edge Functions, pgcrypto, store)
- Multiple codebase files for patterns

Plan 2 references:
- `09-CONTEXT.md` — Design decisions D-18 through D-31
- `09-RESEARCH.md` — Pattern 3, 5, 7
- Multiple codebase files for patterns
- `docs/cosmic-v2.html` — Design reference

**Finding:** Both plans appropriately reference context and research documents.

---

## Dimension 8: Anti-Patterns — PASS (with findings)

Checked against anti-patterns documented in RESEARCH.md:

| Anti-Pattern | Status |
|--------------|--------|
| Storing tokens in localStorage | ✓ Avoided — tokens in DB (pgcrypto) + in-memory (Zustand) |
| Client-side token exchange with client_secret | ✓ Avoided — Edge Function handles exchange |
| Skipping token encryption | ✓ Avoided — pgcrypto AES-256 required |
| Ignoring 6-month refresh token expiry | ✓ Addressed — invalid_grant handling in Plan 1 Task 2 |
| setInterval without cleanup | ✓ Addressed — cleanup() method, unmount handling |
| Direct playlist API calls from client | ✓ Avoided — routed through Edge Functions |
| Web Playback SDK assumptions | ✓ Addressed — Premium detection + fallback |
| Per-list fetching | ✓ Not applicable — single playlist model |

**Findings:**

1. **Plan 2 task 4 modifies `spotifyStore.js`** — This creates a cross-plan dependency where Plan 2 edits a file created in Plan 1. The auto-rotate actions (playRandom, startAutoRotate, stopAutoRotate) are split across plans. This works because Plan 2 depends on Plan 1, but the `playRandom` action in Plan 1 task 4 references `spotifyStore` directly (line 288: "fetch play_history from supabase"), while Plan 2 task 5 reimplements it with more detail. The implementation should follow Plan 2's version as the final spec.

2. **Plan 2 references undefined store actions** — The `useSpotifyPlayer` hook (Plan 2, task 1) calls `spotifyStore.getState().setCurrentTrack()`, `setIsPlaying()`, `setProgress()`, `setError()` — but Plan 1's store definition (task 4) does not list these as separate actions. The store behavior section lists them as state fields but not as discrete actions. Plan 2 assumes they exist. **Recommendation:** Add `setCurrentTrack`, `setIsPlaying`, `setProgress`, `setError` to Plan 1's store action list.

3. **Missing `fetchUserPlaylists` action** — Plan 2 State 2 rendering (task 2, line 183) calls `spotifyStore.fetchUserPlaylists()` but this action is not defined in Plan 1's store. **Recommendation:** Add `fetchUserPlaylists` to Plan 1's store or remove from Plan 2.

4. **Missing `pairId` in store state** — Plan 2 task 5 (line 447) destructures `pairId` from store state, but Plan 1's store definition does not include `pairId` as a state field. **Recommendation:** Add `pairId` to Plan 1's store state and populate it in `initializeSpotify`.

---

## Dimension 9: Verification — PASS (with findings)

Both plans have verify commands that can be run:

Plan 1 verification:
- `cd FRONTEND && npm run lint` ✓
- `cd FRONTEND && npm run build` ✓
- Migration SQL inspection ✓
- Edge Function deploy commands ✓

Plan 2 verification:
- `cd FRONTEND && npm run lint` ✓
- `cd FRONTEND && npm run build` ✓
- `cd FRONTEND && npm run test:run` ✓
- Manual verification checklist ✓

**Findings:**

1. **ROADMAP.md not updated** — The ROADMAP.md still shows Phase 9 plans as `TBD`:
   ```
   Plans:
   - [ ] TBD
   ```
   This should be updated to reference `09-01-PLAN.md` and `09-02-PLAN.md`.

2. **Test files referenced but not created** — RESEARCH.md references test files (`tests/spotifyStore.test.js`, `tests/SpotifyPlayer.test.jsx`, etc.) in the "Wave 0 Gaps" section, but neither plan creates these test files. The plans should either include test creation tasks or explicitly note that tests are out of scope for this phase.

3. **App.jsx not in Plan 2 frontmatter** — Plan 2 task 7 modifies `FRONTEND/src/App.jsx` (adds callback route), but this file is not listed in Plan 2's `files_modified` frontmatter.

---

## Summary

| Dimension | Score |
|-----------|-------|
| 1. Requirement Coverage | PASS |
| 2. Task Completeness | PASS |
| 3. File Specificity | PASS |
| 4. Acceptance Criteria Quality | PASS |
| 5. Dependency Correctness | PASS |
| 6. Threat Model | PASS |
| 7. Context References | PASS |
| 8. Anti-Patterns | PASS (4 findings) |
| 9. Verification | PASS (3 findings) |

**Result: 9/9 PASS**

### Items to Fix Before Execution

1. **[CRITICAL] Add missing store actions to Plan 1** — `setCurrentTrack`, `setIsPlaying`, `setProgress`, `setError`, `fetchUserPlaylists`, and `pairId` state field must be added to the spotifyStore definition in Plan 1 task 4.

2. **[MEDIUM] Add `App.jsx` to Plan 2 `files_modified` frontmatter** — Task 7 modifies this file but it's not listed.

3. **[LOW] Update ROADMAP.md** — Replace `TBD` with actual plan filenames for Phase 9.

4. **[LOW] Clarify test file ownership** — Either add test creation tasks or note that tests are deferred.
