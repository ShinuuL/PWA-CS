---
phase: data-isolation-audit
reviewed: 2026-07-27T00:00:00Z
depth: deep
files_reviewed: 20
files_reviewed_list:
  - FRONTEND/supabase/migrations/001_initial_schema.sql
  - FRONTEND/supabase/migrations/002_chat_schema.sql
  - FRONTEND/supabase/migrations/20260725_create_album_photos.sql
  - FRONTEND/supabase/migrations/20260725_extend_messages_for_media.sql
  - FRONTEND/supabase/migrations/20260727_create_moods_and_random_photo.sql
  - FRONTEND/supabase/migrations/20260727_add_custom_emoji_to_moods.sql
  - FRONTEND/supabase/migrations/20260727_create_notes_and_events.sql
  - FRONTEND/supabase/migrations/20260728_add_pairs_delete_policy.sql
  - FRONTEND/supabase/migrations/20260728_fix_cascade_delete.sql
  - FRONTEND/src/stores/authStore.js
  - FRONTEND/src/stores/chatStore.js
  - FRONTEND/src/stores/albumStore.js
  - FRONTEND/src/stores/notesStore.js
  - FRONTEND/src/stores/agendaStore.js
  - FRONTEND/src/stores/dashboardStore.js
  - FRONTEND/src/shared/lib/supabase.js
  - FRONTEND/src/features/profile/ProfilePage.jsx
  - FRONTEND/src/features/profile/PartnerProfile.jsx
  - FRONTEND/src/features/profile/AvatarUpload.jsx
  - FRONTEND/src/features/pairing/usePairing.js
findings:
  critical: 2
  warning: 4
  info: 2
  total: 8
status: issues_found
---

# Data Isolation Audit: CoupleSpace PWA

**Reviewed:** 2026-07-27
**Depth:** deep (cross-file: migrations + stores + components)
**Files Reviewed:** 20
**Status:** issues_found

## Summary

This audit verifies that each couple/pair sees **only their own data** across all tables, queries, realtime subscriptions, storage, and RPC functions. The overall RLS architecture is well-designed — most tables correctly scope access via `pair_id` membership checks. However, there are **2 critical gaps** that break data isolation or create security vulnerabilities, plus several warnings.

---

## Table-by-Table Audit

### 1. `profiles`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ⚠️ | Only `auth.uid() = id` — user can see ONLY their own profile |
| INSERT policy | ✅ | `auth.uid() = id` |
| UPDATE policy | ✅ | `auth.uid() = id` |
| Query isolation | ❌ | `PartnerProfile.jsx:28-32` queries partner's profile by ID — **blocked by RLS** |
| Storage (avatars) | ⚠️ | Public bucket — any authenticated user can read any avatar |

**Verdict: BROKEN** — Partner profile lookup will fail or return empty.

### 2. `pairs`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | `auth.uid() = user_one OR auth.uid() = user_two` |
| INSERT policy | ✅ | `auth.uid() = user_one` |
| UPDATE policy | ✅ | Both users |
| DELETE policy | ✅ | Both users |
| Query isolation | ✅ | All queries filter by user ID |

**Verdict: SECURE**

### 3. `messages`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Checks pair membership via subquery |
| INSERT policy | ✅ | Checks pair membership + `sender_id = auth.uid()` |
| UPDATE policy | ✅ | `sender_id = auth.uid()` (with implicit SELECT from pair membership) |
| DELETE policy | ✅ | `sender_id = auth.uid()` |
| Query isolation | ✅ | `chatStore.js:79` filters by `pair_id` |
| Realtime filter | ✅ | `filter: pair_id=eq.${pairId}` |

**Verdict: SECURE**

### 4. `reactions`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Joins through messages → pairs for membership check |
| INSERT policy | ✅ | `user_id = auth.uid()` + pair membership |
| DELETE policy | ⚠️ | Only `user_id = auth.uid()` — no pair membership re-check |
| Query isolation | ✅ | Reactions are always fetched as part of messages (which are pair-scoped) |

**Verdict: MINOR GAP** — DELETE lacks pair membership check (low risk since reactions only exist on messages the user can already see).

### 5. `typing_status`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Pair membership via subquery |
| INSERT policy | ✅ | `user_id = auth.uid()` |
| UPDATE policy | ✅ | `user_id = auth.uid()` |
| Query isolation | ✅ | `chatStore.js:542-547` upserts with `pair_id` + `user_id` |
| Realtime filter | ✅ | `filter: pair_id=eq.${pairId}` |

**Verdict: SECURE**

### 6. `album_photos`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Pair membership via subquery |
| INSERT policy | ✅ | Pair membership + `user_id = auth.uid()` |
| DELETE policy | ✅ | `user_id = auth.uid()` + pair membership |
| Query isolation | ✅ | `albumStore.js:26` filters by `pair_id` |
| Realtime filter | ✅ | `filter: pair_id=eq.${pairId}` |
| Storage isolation | ✅ | Files stored under `pairId/` folder, RLS checks pair membership |

**Verdict: SECURE**

### 7. `moods`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Pair membership |
| INSERT policy | ✅ | Pair membership + `user_id = auth.uid()` |
| UPDATE policy | ✅ | `user_id = auth.uid()` + pair membership (both USING and WITH CHECK) |
| DELETE policy | ✅ | `user_id = auth.uid()` + pair membership |
| Query isolation | ✅ | `dashboardStore.js:24-25` filters by `pair_id` + `user_id` |
| Realtime filter | ✅ | `filter: pair_id=eq.${pairId}` |

**Verdict: SECURE**

### 8. `shared_notes`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Pair membership |
| INSERT policy | ✅ | Pair membership + `user_id = auth.uid()` |
| UPDATE policy | ✅ | Pair membership (allows both partners to edit — intentional collaboration) |
| DELETE policy | ✅ | Pair membership (allows both partners to delete) |
| Query isolation | ✅ | `notesStore.js:24` filters by `pair_id` |
| Realtime filter | ✅ | `filter: pair_id=eq.${pairId}` |

**Verdict: SECURE** (collaborative editing by design)

### 9. `agenda_events`

| Check | Status | Notes |
|-------|--------|-------|
| RLS Enabled | ✅ | Yes |
| SELECT policy | ✅ | Pair membership |
| INSERT policy | ✅ | Pair membership + `user_id = auth.uid()` |
| UPDATE policy | ✅ | Pair membership |
| DELETE policy | ✅ | Pair membership |
| Query isolation | ✅ | `agendaStore.js:25` filters by `pair_id` |
| Realtime filter | ✅ | `filter: pair_id=eq.${pairId}` |

**Verdict: SECURE**

### 10. Storage Buckets

| Bucket | Public | Upload Policy | Read Policy | Delete Policy | Verdict |
|--------|--------|--------------|-------------|---------------|---------|
| `avatars` | ✅ true | User folder only | **ANY user** | User folder only | ⚠️ Public read |
| `album-photos` | ✅ true | Pair folder only | Pair members only | Pair members only | ✅ Secure |
| `chat-media` | ✅ true | Pair folder only | Pair members only | Pair members only | ✅ Secure |

**Avatars gap:** The `avatars` bucket SELECT policy (`001_initial_schema.sql:69-71`) uses `USING (bucket_id = 'avatars')` with no user/pair check. Any authenticated user can read any avatar. This may be intentional (avatars are semi-public within the app) but is worth noting.

### 11. RPC Functions

| Function | SECURITY DEFINER | Pair check | Verdict |
|----------|-----------------|------------|---------|
| `create_invite_code` | Yes | N/A (creates new pair) | ✅ Secure |
| `consume_invite_code` | Yes | Checks `user_one != p_user_id` + not already paired | ✅ Secure |
| `mark_messages_read` | Yes | **NONE** — accepts `p_pair_id` param without verifying user belongs to pair | ❌ **CRITICAL** |
| `get_random_album_photo` | No (SQL/STABLE) | Relies on RLS on `album_photos` table | ⚠️ Needs verification |

---

## Critical Issues

### CR-01: `profiles` table RLS prevents partner profile lookup

**File:** `FRONTEND/supabase/migrations/001_initial_schema.sql:29-30` + `FRONTEND/src/features/profile/PartnerProfile.jsx:28-32`
**Issue:** The `profiles` table has RLS policy `"Users can view own profile"` which only allows `SELECT WHERE auth.uid() = id`. This means a user can ONLY read their own profile row. However, `PartnerProfile.jsx` queries the partner's profile by their user ID:

```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', partnerId)  // partnerId is the OTHER user's ID
  .single()
```

This query will **return empty results or an error** because the RLS policy blocks access to other users' profiles. The partner's name and avatar will never display.

**Impact:** Partner profile page is broken. Users cannot see their partner's display name or avatar anywhere in the app (this also affects message sender names if they rely on the profiles join).

**Fix:** Add a permissive policy allowing authenticated users to read profiles of users who are their paired partner:

```sql
-- Allow users to view their partner's profile
CREATE POLICY "Users can view partner profile" ON profiles
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT CASE
        WHEN pairs.user_one = auth.uid() THEN pairs.user_two
        WHEN pairs.user_two = auth.uid() THEN pairs.user_one
      END
      FROM pairs
      WHERE pairs.user_one = auth.uid() OR pairs.user_two = auth.uid()
      WHERE pairs.code_used = TRUE
    )
  );
```

Or alternatively, make profiles world-readable for all authenticated users (simpler but more permissive):

```sql
CREATE POLICY "Authenticated users can view all profiles" ON profiles
  FOR SELECT TO authenticated
  USING (true);
```

---

### CR-02: `mark_messages_read` RPC has no authorization check

**File:** `FRONTEND/supabase/migrations/002_chat_schema.sql:139-151`
**Issue:** The `mark_messages_read` function is `SECURITY DEFINER` (runs as the function owner, bypassing RLS) and accepts `p_pair_id` and `p_user_id` as parameters. It does NOT verify that the authenticated user (`auth.uid()`) actually belongs to the specified pair:

```sql
CREATE OR REPLACE FUNCTION mark_messages_read(p_pair_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages
  SET read_at = NOW()
  WHERE pair_id = p_pair_id    -- ← No check that auth.uid() is in this pair
  AND sender_id != p_user_id
  AND read_at IS NULL;
END;
$$;
```

A malicious user could call this function with any `pair_id` and mark all messages in that pair as read, even if they don't belong to that pair. This is an **authorization bypass** — the function modifies data in pairs the caller has no access to.

**Impact:** Any authenticated user can mark messages in ANY pair as read. This could be used to interfere with other couples' read receipts.

**Fix:** Add an authorization check at the start of the function:

```sql
CREATE OR REPLACE FUNCTION mark_messages_read(p_pair_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify the caller belongs to this pair
  IF NOT EXISTS (
    SELECT 1 FROM pairs
    WHERE id = p_pair_id
    AND (user_one = auth.uid() OR user_two = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Unauthorized: not a member of this pair';
  END IF;

  UPDATE messages
  SET read_at = NOW()
  WHERE pair_id = p_pair_id
  AND sender_id != p_user_id
  AND read_at IS NULL;
END;
$$;
```

---

## Warnings

### WR-01: `reactions` DELETE policy lacks pair membership check

**File:** `FRONTEND/supabase/migrations/002_chat_schema.sql:99-101`
**Issue:** The DELETE policy for reactions only checks `user_id = auth.uid()`:

```sql
CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (user_id = auth.uid());
```

While the SELECT policy ensures users can only see reactions on messages they have access to (via pair membership), the DELETE policy itself doesn't re-verify pair membership. This is a defense-in-depth gap — if there's ever a bypass in the SELECT policy, reactions could be deleted across pairs.

**Fix:** Add pair membership check to the DELETE policy:

```sql
CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM messages
      JOIN pairs ON pairs.id = messages.pair_id
      WHERE messages.id = reactions.message_id
      AND (pairs.user_one = auth.uid() OR pairs.user_two = auth.uid())
    )
  );
```

---

### WR-02: `avatars` storage bucket is fully public for reads

**File:** `FRONTEND/supabase/migrations/001_initial_schema.sql:66-71`
**Issue:** The avatars bucket is created with `public = true` and the SELECT policy has no user check:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
```

Any authenticated user (or anyone with the URL) can read any avatar. While this may be intentional for a couples app, it means:
- A user can enumerate all avatar filenames
- Avatar URLs are guessable/accessible outside the app context

**Fix (if privacy desired):** Scope avatar reads to pair members or at minimum to authenticated users with a user-folder check.

---

### WR-03: `shared_notes` and `agenda_events` UPDATE/DELETE policies allow cross-user modification

**File:** `FRONTEND/supabase/migrations/20260727_create_notes_and_events.sql:35-50, 91-107`
**Issue:** Both tables allow any pair member to UPDATE or DELETE any record, regardless of who created it:

```sql
-- shared_notes UPDATE
CREATE POLICY "Pair members can update notes" ON shared_notes
  FOR UPDATE TO authenticated
  USING (pair_id IN (SELECT id FROM pairs WHERE user_one = auth.uid() OR user_two = auth.uid()));
```

This is documented as intentional ("D-07: true collaboration"), but it means one partner can delete notes/events created by the other. If this is not the desired behavior, the `user_id` check should be added.

**Impact:** Low — this is likely intentional for a couples app, but worth confirming.

---

### WR-04: `get_random_album_photo` RPC has no explicit pair membership check

**File:** `FRONTEND/supabase/migrations/20260727_create_moods_and_random_photo.sql:66-81`
**Issue:** The function queries `album_photos WHERE pair_id = p_pair_id` without SECURITY DEFINER, relying on RLS to enforce access. If the `album_photos` SELECT RLS policy is correct (it is), this works. However, if RLS is ever disabled or the policy changes, this function would expose photos from any pair.

**Fix:** Add an explicit check in the function body:

```sql
CREATE OR REPLACE FUNCTION get_random_album_photo(p_pair_id UUID)
RETURNS TABLE (id UUID, url TEXT, caption TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql STABLE
AS $$
  -- Verify caller belongs to this pair
  SELECT id, url, caption, created_at
  FROM album_photos
  WHERE pair_id = p_pair_id
  AND EXISTS (
    SELECT 1 FROM pairs
    WHERE id = p_pair_id
    AND (user_one = auth.uid() OR user_two = auth.uid())
  )
  ORDER BY random()
  LIMIT 1;
$$;
```

---

## Info

### IN-01: Realtime subscriptions for `reactions` lack filter

**File:** `FRONTEND/src/stores/chatStore.js:146-151`
**Issue:** The reactions subscription does not use a `filter` parameter:

```javascript
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'reactions'
  // ← no filter: pair_id or message_id
}, ...)
```

While RLS ensures only visible reactions are delivered, the subscription itself receives events for ALL reactions the user can see. For a user in multiple pairs (edge case — currently one pair per user), this could receive reactions from both pairs. The client-side handler does filter by `message_id` matching local state, so this is functionally safe but not optimally scoped.

---

### IN-02: No DELETE policy on `profiles` table

**File:** `FRONTEND/supabase/migrations/001_initial_schema.sql:28-34`
**Issue:** The profiles table has SELECT, INSERT, and UPDATE policies but no DELETE policy. Users cannot delete their profiles. This is likely intentional (profile lifecycle tied to auth user deletion), but worth documenting.

---

## Overall Assessment

**Data isolation is mostly well-implemented.** The core pattern of checking `pair_id` membership via subqueries against the `pairs` table is consistently applied across all tables. Realtime subscriptions are properly filtered by `pair_id`. Storage buckets use pair-scoped folder paths with RLS enforcement.

**Two critical issues must be fixed:**
1. **CR-01** breaks partner profile display (functional bug)
2. **CR-02** allows authorization bypass on message read receipts (security vulnerability)

**Recommended priority:** Fix CR-02 first (security), then CR-01 (functional), then address warnings for defense-in-depth.

---

_Reviewed: 2026-07-27_
_Reviewer: the agent (gsd-code-reviewer)_
_Depth: deep_
