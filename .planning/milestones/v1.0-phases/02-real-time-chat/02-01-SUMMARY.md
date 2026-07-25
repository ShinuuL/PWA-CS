# 02-01 Summary: DB Schema + Chat Store + Core ChatView

**Phase:** 02 — Real-Time Chat  
**Plan:** 02-01 — DB Schema + Store + ChatView  
**Status:** Complete  
**Date:** 2026-07-25

## What Was Built

### Database Schema (`002_chat_schema.sql`)
- `messages` table with pair_id, sender_id, content, reply_to, timestamps, read_at, deleted flags
- `reactions` table with unique constraint on (message_id, user_id, emoji)
- `typing_status` table with unique constraint on (pair_id, user_id)
- RLS policies for all tables (pair member access only)
- Realtime publication for messages, reactions, typing_status
- `mark_messages_read()` RPC function

### Chat Store (`chatStore.js`)
- Zustand store following authStore.js pattern
- Supabase Realtime subscriptions for messages, reactions, typing
- Message CRUD with optimistic updates
- Offline queue with auto-sync on reconnect
- Typing indicator management (3s timeout)
- Reaction add/remove with optimistic UI
- Cleanup on unmount

### Chat View (`ChatView.jsx` + `chat.css`)
- WhatsApp-style layout: header, messages, input bar
- Message bubbles: purple (sent), gray (received)
- Date separators between message groups
- Avatar + sender name for partner messages
- Typing indicator with animated dots
- Scroll-to-bottom button with unread count
- Loading skeleton and empty state
- Connection lost/offline banners
- Long-press/right-click reaction picker (8 emojis)
- Mobile-optimized with safe area padding

### App Integration (`App.jsx`)
- Replaced ChatPage placeholder with ChatView import
- Chat route now renders full ChatView component

## Verification
- Lint: No new warnings (all ChatView warnings fixed)
- Build: Ready for testing

## Next Steps
- Wave 2 (Plan 02-02): Reply/quote, reactions, delete with confirmation, typing indicators
- Wave 3 (Plan 02-03): Chat settings, notifications, mobile polish
