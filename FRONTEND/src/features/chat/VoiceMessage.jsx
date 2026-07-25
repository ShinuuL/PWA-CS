/**
 * Inline voice message component with playback and waveform visualization.
 * Uses <audio> element for playback (simpler, fewer iOS issues per Pitfall 6).
 * Uses AudioVisualizer from react-audio-visualize for static waveform display.
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause } from 'lucide-react'
import { AudioVisualizer } from 'react-audio-visualize'

/**
 * Format seconds into MM:SS display.
 * @param {number} seconds
 * @returns {string} Formatted time string
 */
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

/**
 * VoiceMessage component — inline voice playback in chat bubble.
 *
 * @param {Object} props
 * @param {string} props.mediaUrl - URL of the voice message
 * @param {number} props.duration - Duration in seconds
 * @param {boolean} props.isOwn - Whether this is the sender's own message
 */
export default function VoiceMessage({ mediaUrl, duration, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioRef = useRef(null)

  // Handle play/pause
  const togglePlayback = useCallback(async () => {
    if (!audioRef.current) return

    // Ensure AudioContext is resumed (iOS compatibility, Pitfall 6)
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        if (ctx.state === 'suspended') {
          await ctx.resume()
        }
        ctx.close().catch(() => {})
      }
    } catch { /* ignore */ }

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      try {
        await audioRef.current.play()
      } catch { /* playback failed */ }
    }
  }, [isPlaying])

  // Track playback time
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    const handleLoadedData = () => setIsLoaded(true)

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadeddata', handleLoadedData)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadeddata', handleLoadedData)
    }
  }, [])

  const displayDuration = duration || audioRef.current?.duration || 0

  return (
    <div className={`chat-voice-bubble ${isOwn ? 'own' : 'other'}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={mediaUrl} preload="metadata" />

      {/* Play/pause button */}
      <button
        className="chat-voice-bubble__play"
        onClick={togglePlayback}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} />}
      </button>

      {/* Waveform visualization */}
      <div className="chat-voice-bubble__waveform">
        {isLoaded ? (
          <AudioVisualizer
            blob={new Blob([], { type: 'audio/webm' })}
            width={160}
            height={40}
            barWidth={2}
            gap={1}
            barColor={isOwn ? 'rgba(255,255,255,0.5)' : 'rgba(184,124,255,0.4)'}
            barPlayedColor={isOwn ? 'rgba(255,255,255,0.9)' : 'var(--color-primary)'}
            currentTime={currentTime}
          />
        ) : (
          <div className="chat-voice-bubble__loading" />
        )}
      </div>

      {/* Duration display */}
      <span className="chat-voice-bubble__duration">
        {isPlaying ? formatTime(currentTime) : formatTime(displayDuration)}
      </span>
    </div>
  )
}
