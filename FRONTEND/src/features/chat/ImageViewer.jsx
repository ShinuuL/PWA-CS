/**
 * Full-screen image viewer with pinch-to-zoom support.
 * Dark overlay, X to close, download button.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react'

/**
 * ImageViewer — modal overlay for viewing chat images full-screen.
 *
 * @param {Object} props
 * @param {string|null} props.src - Image URL to display (null to close)
 * @param {string} [props.alt] - Image alt text
 * @param {function} [props.onClose] - Called when viewer should close
 */
export default function ImageViewer({ src, alt, onClose }) {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })

  // Reset state when src changes
  useEffect(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [src])

  // Close on Escape
  useEffect(() => {
    if (!src) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
      if (e.key === '+' || e.key === '=') setScale(s => Math.min(s + 0.25, 4))
      if (e.key === '-') setScale(s => Math.max(s - 0.25, 0.25))
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [src, onClose])

  const handleZoomIn = useCallback(() => {
    setScale(s => Math.min(s + 0.25, 4))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(s => Math.max(s - 0.25, 0.25))
  }, [])

  const handleDownload = useCallback(async () => {
    if (!src) return
    try {
      const response = await fetch(src)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = alt || 'image'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank')
    }
  }, [src, alt])

  return (
    <AnimatePresence>
      {src && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="chat-image-viewer"
          onClick={onClose}
        >
          {/* Header controls */}
          <div className="chat-image-viewer__header" onClick={(e) => e.stopPropagation()}>
            <button
              className="chat-image-viewer__btn"
              onClick={handleZoomOut}
              aria-label="Zoom out"
            >
              <ZoomOut size={20} />
            </button>
            <span className="chat-image-viewer__zoom">
              {Math.round(scale * 100)}%
            </span>
            <button
              className="chat-image-viewer__btn"
              onClick={handleZoomIn}
              aria-label="Zoom in"
            >
              <ZoomIn size={20} />
            </button>
            <div className="chat-image-viewer__spacer" />
            <button
              className="chat-image-viewer__btn"
              onClick={handleDownload}
              aria-label="Download image"
            >
              <Download size={20} />
            </button>
            <button
              className="chat-image-viewer__btn chat-image-viewer__close"
              onClick={onClose}
              aria-label="Close viewer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Image container */}
          <motion.div
            className="chat-image-viewer__container"
            onClick={(e) => e.stopPropagation()}
            drag={scale > 1}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            onDrag={(e, info) => {
              setTranslate(prev => ({
                x: prev.x + info.delta.x,
                y: prev.y + info.delta.y
              }))
            }}
          >
            <motion.img
              src={src}
              alt={alt || 'Full-screen image'}
              className="chat-image-viewer__img"
              style={{
                transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`
              }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                if (scale === 1) {
                  handleZoomIn()
                } else {
                  setScale(1)
                  setTranslate({ x: 0, y: 0 })
                }
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
