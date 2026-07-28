/**
 * Voice recording utility using MediaRecorder API.
 * Provides a useVoiceRecorder custom hook with:
 * - Hold-to-record via startRecording/stopRecording
 * - Live waveform data via requestAnimationFrame
 * - Slide-to-cancel support via cancelRecording
 * - Auto-stop at MAX_DURATION seconds (5 min)
 */

import { useState, useRef, useCallback, useEffect } from 'react'

const MAX_DURATION = 300 // 5 minutes per D-07

/**
 * Determines the best supported MIME type for recording.
 * Prioritizes WebM/Opus, falls back to WebM, then MP4.
 * @returns {string|null} The supported MIME type or null
 */
function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ]
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }
  return null
}

/**
 * Custom hook for voice recording with waveform visualization.
 *
 * @returns {Object} Voice recorder state and methods
 * @returns {boolean} isRecording - Whether recording is active
 * @returns {number} duration - Recording duration in seconds
 * @returns {Uint8Array|null} waveformData - Live waveform byte data (0-255)
 * @returns {function} startRecording - Begin recording from microphone
 * @returns {function} stopRecording - Stop recording, returns Promise<Blob>
 * @returns {function} cancelRecording - Cancel recording without returning blob
 * @returns {string|null} mimeType - The MIME type being used for recording
 */
export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [waveformData, setWaveformData] = useState(null)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const animFrameRef = useRef(null)
  const stopResolveRef = useRef(null)
  const mimeTypeRef = useRef(null)

  // Waveform update loop
  const updateWaveform = useCallback(() => {
    if (!analyserRef.current) return
    const dataArray = new Uint8Array(analyserRef.current.fftSize)
    analyserRef.current.getByteTimeDomainData(dataArray)
    setWaveformData(new Uint8Array(dataArray))
    animFrameRef.current = requestAnimationFrame(updateWaveform)
  }, [])

  // Cleanup function — stops all tracks, clears timers, cancels animation frames
  const cleanup = useCallback(() => {
    // Stop all media tracks (critical — prevents persistent mic indicator, Pitfall 2)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    // Clear interval timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    // Cancel animation frame
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
    analyserRef.current = null
    mediaRecorderRef.current = null
    chunksRef.current = []
    stopResolveRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType

      // Create MediaRecorder
      const recorderOptions = mimeType ? { mimeType } : {}
      const recorder = new MediaRecorder(stream, recorderOptions)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        // Stop tracks in onstop handler AND cleanup (Pitfall 2)
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        const blob = new Blob(chunksRef.current, {
          type: mimeType || recorder.mimeType || 'audio/webm'
        })
        if (stopResolveRef.current) {
          stopResolveRef.current(blob)
          stopResolveRef.current = null
        }
      }

      // Set up AudioContext + AnalyserNode for waveform
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Start recording
      recorder.start(100) // collect data every 100ms for waveform responsiveness
      setIsRecording(true)
      setDuration(0)

      // Start duration timer
      let elapsed = 0
      timerRef.current = setInterval(() => {
        elapsed += 1
        setDuration(elapsed)
        if (elapsed >= MAX_DURATION) {
          // Auto-stop at max duration (D-07)
          stopRecording()
        }
      }, 1000)

      // Start waveform animation loop
      animFrameRef.current = requestAnimationFrame(updateWaveform)
    } catch (err) {
      // Permission denied or other error — clean up and rethrow
      cleanup()
      throw err
    }
  }, [cleanup, updateWaveform])

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') {
        cleanup()
        resolve(new Blob([], { type: 'audio/webm' }))
        return
      }
      stopResolveRef.current = resolve
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      // Cancel animation frame
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
        animFrameRef.current = null
      }
    })
  }, [cleanup])

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      // Stop without resolving the blob promise
      stopResolveRef.current = null
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setDuration(0)
    setWaveformData(null)
    cleanup()
  }, [cleanup])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    isRecording,
    duration,
    waveformData,
    mediaRecorder: mediaRecorderRef.current,
    startRecording,
    stopRecording,
    cancelRecording,
    mimeType: mimeTypeRef.current
  }
}

export default useVoiceRecorder
