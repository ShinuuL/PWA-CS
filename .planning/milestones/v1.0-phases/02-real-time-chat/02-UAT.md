# Phase 2 UAT — Real-Time Chat

**Feature:** CHAT-01, CHAT-05, CHAT-06, CHAT-07
**Date:** 2026-07-25
**Status:** IN PROGRESS

## Wave 1 — DB Schema + Chat Store + Core ChatView

- [ ] 1. **DB Migration:** Run `002_chat_schema.sql` — verify `messages`, `reactions`, `typing_status` tables created
- [ ] 2. **RLS Policies:** Verify RLS is enabled on all chat tables (SELECT/INSERT/UPDATE/DELETE only for pair members)
- [ ] 3. **Realtime:** Verify Supabase Realtime publication includes `messages`, `reactions`, `typing_status`
- [ ] 4. **mark_messages_read:** Verify the `mark_messages_read()` RPC function exists and works
- [ ] 5. **Chat View:** Open `/chat` — verify WhatsApp-style layout with header, messages area, input bar
- [ ] 6. **Message Bubbles:** Send messages — verify sent = purple, received = gray
- [ ] 7. **Date Separators:** Send messages across different days — verify date separator appears between groups
- [ ] 8. **Partner Avatar:** Receive a message — verify partner avatar + sender name displays
- [ ] 9. **Empty State:** When no messages — verify empty state message shows
- [ ] 10. **Offline Banner:** Disconnect network — verify "connection lost" banner appears

## Wave 2 — Replies, Reactions, Delete & Typing

- [ ] 11. **Reply (Context Menu):** Long-press/right-click a message → tap Reply — verify QuotePreview appears above input
- [ ] 12. **Reply (Swipe):** Swipe right on a message — verify it triggers reply mode
- [ ] 13. **Inline Quote:** Send a reply — verify quoted message appears inline with left border, name, truncated text
- [ ] 14. **Cancel Reply:** Tap X on QuotePreview — verify it clears
- [ ] 15. **Delete (Context Menu):** Long-press/right-click → tap Delete — verify DeleteConfirmDialog modal opens
- [ ] 16. **Delete Confirm:** Tap "Delete" in dialog — verify message replaced with "This message was deleted"
- [ ] 17. **Delete Cancel:** Tap Cancel in dialog — verify message remains
- [ ] 18. **Reaction Picker:** Long-press/right-click a message → tap React — verify 8-emoji picker appears with spring animation
- [ ] 19. **Reaction Add:** Tap an emoji — verify reaction chip appears below the message with emoji + count
- [ ] 20. **Reaction Toggle:** Tap same reaction again — verify it removes (not duplicates)
- [ ] 21. **Reaction Highlight:** Verify own reactions are highlighted differently from partner's
- [ ] 22. **Typing Indicator:** Have partner type — verify typing indicator with animated dots appears
- [ ] 23. **Typing Timeout:** Wait 3 seconds after partner stops typing — verify indicator disappears

## Wave 3 — Settings, Notifications & Mobile Polish

- [ ] 24. **Chat Settings Route:** Navigate to `/chat/settings` — verify settings page loads
- [ ] 25. **Theme Selector:** Switch between Light/Dark/System — verify theme applies
- [ ] 26. **Font Size:** Change font size — verify message text size changes
- [ ] 27. **Notification Toggle:** Toggle notification sounds — verify setting persists after refresh
- [ ] 28. **Read Receipts Toggle:** Toggle read receipts — verify setting persists
- [ ] 29. **Touch Targets:** On mobile — verify all buttons (send, scroll, reaction picker) are at least 44px
- [ ] 30. **Word Break:** Send a very long word — verify it wraps correctly
- [ ] 31. **Mobile 320px:** Resize to 320px width — verify layout doesn't break
- [ ] 32. **Safe Area:** On mobile — verify input bar respects safe area padding

## All Tests Passed

- [ ] **UAT Approved:** All above tests confirmed working
