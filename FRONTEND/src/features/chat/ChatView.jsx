import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, ChevronDown, Reply, Trash2, X, SmilePlus, Settings } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import useAuthStore from '../../stores/authStore'
import useChatStore from '../../stores/chatStore'
import usePairing from '../pairing/usePairing'
import './chat.css'

const REACTION_EMOJIS = ['❤️', '😂', '👍', '👎', '😢', '🔥', '😍', '🎉']

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
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  )
}

function QuotePreview({ message, onCancel }) {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="chat-quote-preview"
    >
      <div className="chat-quote-content">
        <span className="chat-quote-name">{message.profiles?.display_name || 'Partner'}</span>
        <span className="chat-quote-text">{message.content}</span>
      </div>
      <button className="chat-quote-cancel" onClick={onCancel} aria-label="Cancel reply">
        <X size={16} />
      </button>
    </motion.div>
  )
}

function ContextMenu({ position, onClose, onReply, onReact, onDelete }) {
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [onClose])

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="chat-context-menu"
      style={{ top: position.y, left: position.x }}
    >
      <button className="chat-context-menu-item" onClick={onReply}>
        <Reply size={18} />
        <span>Reply</span>
      </button>
      <button className="chat-context-menu-item" onClick={onReact}>
        <SmilePlus size={18} />
        <span>React</span>
      </button>
      <button className="chat-context-menu-item chat-context-menu-item--delete" onClick={onDelete}>
        <Trash2 size={18} />
        <span>Delete</span>
      </button>
    </motion.div>
  )
}

function ReactionPicker({ messageId, onClose, onReact }) {
  const pickerRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('touchstart', handleClick)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('touchstart', handleClick)
    }
  }, [onClose])

  return (
    <motion.div
      ref={pickerRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="chat-reaction-picker"
    >
      {REACTION_EMOJIS.map(emoji => (
        <button
          key={emoji}
          className="chat-reaction-picker__emoji"
          onClick={() => { onReact(messageId, emoji); onClose() }}
        >
          {emoji}
        </button>
      ))}
    </motion.div>
  )
}

function DeleteConfirmDialog({ forEveryone, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="chat-delete-overlay"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="chat-delete-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Delete message?</h3>
        <p>
          {forEveryone
            ? 'This will remove the message for everyone. This cannot be undone.'
            : 'This will remove the message from your chat only.'}
        </p>
        <div className="chat-delete-dialog__actions">
          <button className="chat-delete-dialog__cancel" onClick={onCancel}>Cancel</button>
          <button className="chat-delete-dialog__delete" onClick={onConfirm}>Delete</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function ReactionChips({ reactions, messageId, isOwn }) {
  const { user } = useAuthStore()
  const { addReaction } = useChatStore()

  const groups = (reactions || []).reduce((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { emoji: r.emoji, count: 0, hasOwn: false }
    acc[r.emoji].count++
    if (r.user_id === user?.id) acc[r.emoji].hasOwn = true
    return acc
  }, {})

  if (Object.keys(groups).length === 0) return null

  return (
    <div className={`chat-reactions ${isOwn ? 'own' : 'other'}`}>
      {Object.values(groups).map(group => (
        <motion.button
          key={group.emoji}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className={`chat-reaction-chip ${group.hasOwn ? 'own' : ''}`}
          onClick={() => addReaction(messageId, group.emoji)}
        >
          {group.emoji} {group.count > 1 && group.count}
        </motion.button>
      ))}
    </div>
  )
}

function MessageBubble({ message, isOwn, showAvatar, onContextMenu, onSwipeReply }) {
  const [swipeX, setSwipeX] = useState(0)
  const touchStart = useRef({ x: 0, y: 0, time: 0 })
  const longPressTimer = useRef(null)

  const handleTouchStart = (e) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    }
    longPressTimer.current = setTimeout(() => {
      navigator.vibrate?.(50)
      const rect = e.currentTarget.getBoundingClientRect()
      onContextMenu(message, {
        x: rect.left + rect.width / 2,
        y: rect.top
      })
    }, 500)
  }

  const handleTouchMove = (e) => {
    const dx = e.touches[0].clientX - touchStart.current.x
    const dy = e.touches[0].clientY - touchStart.current.y

    if (Math.abs(dy) > 10) {
      clearTimeout(longPressTimer.current)
      setSwipeX(0)
      return
    }

    if (dx > 10) {
      clearTimeout(longPressTimer.current)
      setSwipeX(Math.min(dx, 120))
    }
  }

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current)
    if (swipeX > 80) {
      navigator.vibrate?.(50)
      onSwipeReply(message)
    }
    setSwipeX(0)
  }

  const handleContextMenu = (e) => {
    e.preventDefault()
    onContextMenu(message, { x: e.clientX, y: e.clientY })
  }

  if (message.deleted) {
    return (
      <div className={`chat-message-row ${isOwn ? 'own' : 'other'}`}>
        <div className="chat-bubble deleted">
          <span className="chat-deleted-text">This message was deleted</span>
        </div>
      </div>
    )
  }

  const quotedMessage = message.reply_to ? message._repliedMessage : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`chat-message-row ${isOwn ? 'own' : 'other'}`}
      style={{ transform: `translateX(${isOwn ? -swipeX : swipeX}px)` }}
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
          onContextMenu={handleContextMenu}
        >
          {quotedMessage && (
            <div className="chat-inline-quote">
              <span className="chat-inline-quote-name">{quotedMessage.profiles?.display_name || 'Partner'}</span>
              <span className="chat-inline-quote-text">{quotedMessage.content}</span>
            </div>
          )}
          <span className="chat-message-text">{message.content}</span>
          <span className="chat-message-time">{formatTime(message.created_at)}</span>
        </div>

        <ReactionChips reactions={message.reactions} messageId={message.id} isOwn={isOwn} />
      </div>
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
  const navigate = useNavigate()
  const { pairId } = usePairing()
  const { user } = useAuthStore()
  const {
    messages, loading, sending, error,
    partnerTyping, isAtBottom, offlineQueue,
    replyTo, showDeleteConfirm, deleteTarget, deleteForEveryone, showReactionPicker,
    settings,
    initializeChat, sendMessage,
    setReplyTo, cancelReply,
    openDeleteConfirm, closeDeleteConfirm, confirmDelete,
    setShowReactionPicker, addReaction,
    setTyping, setIsAtBottom, setIsInChat,
    syncOfflineQueue, cleanup
  } = useChatStore()

  const [inputValue, setInputValue] = useState('')
  const [contextMenu, setContextMenu] = useState(null)
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
    sendMessage(inputValue)
    setInputValue('')
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

  const handleContextMenuAction = (message, action) => {
    setContextMenu(null)
    if (action === 'reply') {
      setReplyTo(message)
    } else if (action === 'react') {
      setShowReactionPicker(message.id)
    } else if (action === 'delete') {
      const isOwn = message.sender_id === user?.id
      openDeleteConfirm(message, isOwn)
    }
  }

  const handleSwipeReply = (message) => {
    setReplyTo(message)
  }

  useEffect(() => {
    setIsInChat(true)
    return () => setIsInChat(false)
  }, [setIsInChat])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (settings.theme === 'system') {
        useChatStore.getState().applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [settings.theme])

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
        <button
          className="chat-header-settings"
          onClick={() => navigate('/chat/settings')}
          aria-label="Chat settings"
        >
          <Settings size={20} />
        </button>
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
                  onContextMenu={(m, pos) => setContextMenu({ message: m, position: pos })}
                  onSwipeReply={handleSwipeReply}
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

      <AnimatePresence>
        {replyTo && (
          <QuotePreview message={replyTo} onCancel={cancelReply} />
        )}
      </AnimatePresence>

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

      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            position={contextMenu.position}
            onClose={() => setContextMenu(null)}
            onReply={() => handleContextMenuAction(contextMenu.message, 'reply')}
            onReact={() => handleContextMenuAction(contextMenu.message, 'react')}
            onDelete={() => handleContextMenuAction(contextMenu.message, 'delete')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReactionPicker && (
          <ReactionPicker
            messageId={showReactionPicker}
            onClose={() => setShowReactionPicker(null)}
            onReact={addReaction}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && deleteTarget && (
          <DeleteConfirmDialog
            message={deleteTarget}
            forEveryone={deleteForEveryone}
            onConfirm={confirmDelete}
            onCancel={closeDeleteConfirm}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
