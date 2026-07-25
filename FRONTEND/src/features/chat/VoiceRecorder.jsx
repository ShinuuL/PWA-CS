/**
 * WhatsApp-style hold-to-record voice message component.
 * Replaces the chat input bar during recording (per D-03).
 * Features: live waveform, slide-to-cancel (D-04), duration display, auto-stop at 5min (D-07).
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { LiveAudioVisualizer } from 'react-audio-visualize'
import { useVoiceRecorder } from '../../shared/lib/mediaRecorder'

const CANCEL_SLIDE_THRESHOLD = 100 // pixels left from start to trigger cancel

/**
 * Format seconds into MM:SS display.
 * @param {number} seconds
 * @returns {string} Formatted time string
 */
function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * VoiceRecorder component — hold-to-record with waveform and slide-to-cancel.
 *
 * @param {Object} props
 * @param {function} props.onSendVoice - Callback receiving the recorded Blob
 * @param {function} props.onCancel - Callback when recording is cancelled
 */
export default function VoiceRecorder({ onSendVoice, onCancel }) {
  const {
    isRecording,
    duration,
    mediaRecorder,
    startRecording,
    stopRecording,
    cancelRecording
  } = useVoiceRecorder()

  const [isCancelled, setIsCancelled] = useState(false)
  const [permissionError, setPermissionError] = useState(false)
  const pointerStartRef = useRef({ x: 0, y: 0 })
  const slideXRef = useRef(0)
  const containerRef = useRef(null)
  const hasStartedRef = useRef(false)

  // Start recording on mount (pointerdown already happened on mic button)
  useEffect(() => {
    const start = async () => {
      try {
        await startRecording()
        hasStartedRef.current = true
      } catch {
        setPermissionError(true)
        // Auto-dismiss permission error after 3 seconds
        setTimeout(() => {
          onCancel()
        }, 3000)
      }
    }
    start()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount — cancel if still recording
  useEffect(() => {
    return () => {
      if (hasStartedRef.current && isRecording) {
        cancelRecording()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePointerDown = useCallback((e) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
    slideXRef.current = 0
  }, [])

  const handlePointerMove = useCallback((e) => {
    const dx = e.clientX - pointerStartRef.current.x
    // Only track leftward movement
    if (dx < 0) {
      slideXRef.current = Math.abs(dx)
    }
  }, [])

  const handlePointerUp = useCallback(async () => {
    if (!isRecording) return

    const slidPastThreshold = slideXRef.current >= CANCEL_SLIDE_THRESHOLD

    if (slidPastThreshold) {
      // Cancel recording
      setIsCancelled(true)
      cancelRecording()
      onCancel?.()
    } else {
      // Stop and send
      try {
        const blob = await stopRecording()
        if (blob && blob.size > 0) {
          onSendVoice?.(blob)
        } else {
          onCancel?.()
        }
      } catch {
        onCancel?.()
      }
    }
  }, [isRecording, cancelRecording, stopRecording, onSendVoice, onCancel])

  const showCancelZone = slideXRef.current >= CANCEL_SLIDE_THRESHOLD * 0.5
  const cancelProgress = Math.min(slideXRef.current / CANCEL_SLIDE_THRESHOLD, 1)

  if (permissionError) {
    return (
      <div className="chat-voice-recorder">
        <div className="chat-voice-recorder__error">
          Microphone permission required for voice messages
        </div>
      </div>
    )
  }

  if (isCancelled) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="chat-voice-recorder"
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Cancel zone indicator */}
      <div
        className={`chat-voice-recorder__cancel-zone ${showCancelZone ? 'active' : ''}`}
        style={{ opacity: cancelProgress }}
      >
        <Trash2 size={20} />
        <span className="chat-voice-recorder__cancel-text">Cancel</span>
      </div>

      {/* Recording indicator + timer */}
      <div className="chat-voice-recorder__indicator">
        <span className="chat-voice-recorder__dot" />
        <span className="chat-voice-recorder__timer">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Live waveform visualization */}
      <div className="chat-voice-recorder__waveform">
        {mediaRecorder && (
          <LiveAudioVisualizer
            mediaRecorder={mediaRecorder}
            width="100%"
            height={48}
            barWidth={2}
            gap={1}
            barColor="rgba(255, 255, 255, 0.7)"
            backgroundColor="transparent"
          />
        )}
      </div>

      {/* Slide hint */}
      <div className="chat-voice-recorder__hint">
        Slide left to cancel
      </div>
    </motion.div>
  )
}
