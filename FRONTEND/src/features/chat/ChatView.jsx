import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, ChevronDown, Reply } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../stores/authStore'
import useChatStore from '../../stores/chatStore'
import usePairing from '../pairing/usePairing'
import './chat.css'

const REACTION_EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🔥', '👏', '💯']

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(date) {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
}

function shouldShowDateSeparator(messages, index) {
  if (index === 0) return true
  const prev = new Date(messages[index - 1].created_at)
  const curr = new Date(messages[index].created_at)
  return prev.toDateString() !== curr.toDateString()
}

function DateSeparator({ date }) {
  return (
    <div className="chat-date-separator">
      <span>{formatDate(date)}</span>
    </div>
  )
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="chat-typing-indicator"
    >
      <div className="chat-typing-dots">
        <span /><span /><span />
      </div>
    </motion.div>
  )
}

function MessageBubble({ message, isOwn, showAvatar, onLongPress }) {
  const [showReactions, setShowReactions] = useState(false)
  const longPressTimer = useRef(null)
  const touchStart = useRef({ x: 0, y: 0 })

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    longPressTimer.current = setTimeout(() => {
      setShowReactions(true)
    }, 500)
  }

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current)
  }

  if (message.deleted && !message.deleted_for_everyone) {
    return (
      <div className={`chat-message-row ${isOwn ? 'own' : 'other'}`}>
        <div className="chat-bubble deleted">
          <span className="chat-deleted-text">Message deleted</span>
        </div>
      </div>
    )
  }

  if (message.deleted && message.deleted_for_everyone) {
    return (
      <div className={`chat-message-row ${isOwn ? 'own' : 'other'}`}>
        <div className="chat-bubble deleted">
          <span className="chat-deleted-text">This message was deleted</span>
        </div>
      </div>
    )
  }

  const reactionGroups = (message.reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, users: [] }
    acc[r.emoji].count++
    acc[r.emoji].users.push(r.user_id)
    return acc
  }, {})

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`chat-message-row ${isOwn ? 'own' : 'other'}`}
    >
      {!isOwn && showAvatar && (
        <div className="chat-avatar">
          {message.profiles?.avatar_url
            ? <img src={message.profiles.avatar_url} alt="" />
            : <div className="chat-avatar-placeholder">
                {message.profiles?.display_name?.[0]?.toUpperCase() || '?'}
              </div>
          }
        </div>
      )}
      {!isOwn && !showAvatar && <div className="chat-avatar-spacer" />}

      <div className="chat-message-content">
        {!isOwn && showAvatar && (
          <span className="chat-sender-name">{message.profiles?.display_name || 'Partner'}</span>
        )}

        <div
          className={`chat-bubble ${isOwn ? 'own' : 'other'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => { e.preventDefault(); setShowReactions(!showReactions) }}
        >
          {message.reply_to && (
            <div className="chat-reply-preview">
              <Reply size={12} />
              <span>Reply</span>
            </div>
          )}
          <span className="chat-message-text">{message.content}</span>
          <span className="chat-message-time">{formatTime(message.created_at)}</span>
        </div>

        {Object.keys(reactionGroups).length > 0 && (
          <div className="chat-reactions">
            {Object.values(reactionGroups).map(group => (
              <button key={group.emoji} className="chat-reaction-badge">
                {group.emoji} {group.count > 1 && group.count}
              </button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showReactions && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="chat-reaction-picker"
            onMouseLeave={() => setShowReactions(false)}
          >
            {REACTION_EMOJIS.map(emoji => (
              <button key={emoji} onClick={() => {
                onLongPress(message.id, emoji)
                setShowReactions(false)
              }}>
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function ScrollToBottomButton({ onClick, count }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="chat-scroll-to-bottom"
      onClick={onClick}
    >
      <ChevronDown size={20} />
      {count > 0 && <span className="chat-new-count">{count > 99 ? '99+' : count}</span>}
    </motion.button>
  )
}

function LoadingSkeleton() {
  return (
    <div className="chat-loading">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className={`chat-skeleton-row ${i % 2 === 0 ? 'own' : 'other'}`}>
          <div className="chat-skeleton-bubble" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="chat-empty">
      <div className="chat-empty-icon">💬</div>
      <h3>No messages yet</h3>
      <p>Start a conversation with your partner!</p>
    </div>
  )
}

export default function ChatView() {
  const { pairId } = usePairing()
  const { user } = useAuthStore()
  const {
    messages, loading, sending, error,
    partnerTyping, isAtBottom, offlineQueue,
    initializeChat, sendMessage,
    addReaction, setTyping, setIsAtBottom,
    syncOfflineQueue, cleanup
  } = useChatStore()

  const [inputValue, setInputValue] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const messagesEndRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const typingTimerRef = useRef(null)

  useEffect(() => {
    if (pairId) initializeChat(pairId)
    return () => cleanup()
  }, [pairId, initializeChat, cleanup])

  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      setUnreadCount(0)
    }
  }, [messages, isAtBottom])

  useEffect(() => {
    const handleOnline = () => syncOfflineQueue()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [syncOfflineQueue])

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50
    setIsAtBottom(atBottom)
    if (!atBottom) {
      setUnreadCount(prev => prev + 1)
    }
  }, [setIsAtBottom])

  const handleSend = () => {
    if (!inputValue.trim() || sending) return
    sendMessage(inputValue, replyTo)
    setInputValue('')
    setReplyTo(null)
    setTyping(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
    setTyping(true)
    typingTimerRef.current = setTimeout(() => setTyping(false), 3000)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setUnreadCount(0)
    setIsAtBottom(true)
  }

  if (!pairId) return null

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {user?.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="" />
              : <div className="chat-header-avatar-placeholder">
                  {user?.user_metadata?.display_name?.[0]?.toUpperCase() || '?'}
                </div>
            }
          </div>
          <div>
            <h2 className="chat-header-name">Chat</h2>
            <span className="chat-header-status">
              {partnerTyping ? 'Typing...' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="chat-error-banner">
          {error}
        </div>
      )}

      {offlineQueue.length > 0 && (
        <div className="chat-offline-banner">
          Messages will be sent when you're back online
        </div>
      )}

      <div
        className="chat-messages"
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        {loading ? (
          <LoadingSkeleton />
        ) : messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg, i) => {
            const isOwn = msg.sender_id === user?.id
            const nextMsg = messages[i + 1]
            const isLast = !nextMsg || nextMsg.sender_id !== msg.sender_id
            const showDate = shouldShowDateSeparator(messages, i)

            return (
              <div key={msg.id || msg.temp_id}>
                {showDate && <DateSeparator date={msg.created_at} />}
                <MessageBubble
                  message={msg}
                  isOwn={isOwn}
                  showAvatar={isLast && !isOwn}
                  onLongPress={addReaction}
                />
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {partnerTyping && (
          <div className="chat-typing-wrapper">
            <TypingIndicator />
          </div>
        )}
      </AnimatePresence>

      {!isAtBottom && (
        <ScrollToBottomButton onClick={scrollToBottom} count={unreadCount} />
      )}

      {replyTo && (
        <div className="chat-reply-bar">
          <Reply size={14} />
          <span>Replying to message</span>
          <button onClick={() => setReplyTo(null)}>×</button>
        </div>
      )}

      <div className="chat-input-bar">
        <div className="chat-input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="chat-input"
            disabled={sending}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            aria-label="Send message"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
