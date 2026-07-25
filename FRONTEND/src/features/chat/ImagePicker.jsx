/**
 * Image picker component for chat image sharing.
 * Uses <input type="file" accept="image/*"> for universal PWA support.
 * Validates type and size, compresses via imageCompress, shows preview before send.
 */

import { useState, useRef, useCallback } from 'react'
import { Image, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { compressImage } from '../../shared/lib/imageCompress'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB before compression
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * ImagePicker component — gallery file selection with compression preview.
 *
 * @param {Object} props
 * @param {function} props.onSendImage - Callback receiving compressed Blob and metadata
 */
export default function ImagePicker({ onSendImage }) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [preview, setPreview] = useState(null) // { blob, width, height, originalSize, compressedSize, objectUrl }
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset error
    setError(null)

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image')
      return
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be under 20MB')
      return
    }

    // Compress the image
    setIsCompressing(true)
    try {
      const result = await compressImage(file)
      const objectUrl = URL.createObjectURL(result.blob)
      setPreview({
        ...result,
        objectUrl,
        fileName: file.name
      })
    } catch {
      setError('Failed to process image. Please try another.')
    } finally {
      setIsCompressing(false)
      // Reset the file input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [])

  const handleSend = useCallback(() => {
    if (!preview) return
    onSendImage?.(preview.blob, {
      width: preview.width,
      height: preview.height
    })
    // Clean up
    URL.revokeObjectURL(preview.objectUrl)
    setPreview(null)
  }, [preview, onSendImage])

  const handleCancel = useCallback(() => {
    if (preview?.objectUrl) {
      URL.revokeObjectURL(preview.objectUrl)
    }
    setPreview(null)
    setError(null)
  }, [preview])

  const handleClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="chat-image-input-hidden"
        aria-label="Select image"
      />

      {/* Image button */}
      <button
        className="chat-image-btn"
        onClick={handleClick}
        disabled={isCompressing}
        aria-label="Share image"
      >
        <Image size={20} />
      </button>

      {/* Compressing indicator */}
      {isCompressing && (
        <div className="chat-image-compressing">
          <span>Compressing...</span>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="chat-image-error">
          {error}
          <button onClick={() => setError(null)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="chat-image-preview"
            onClick={handleCancel}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="chat-image-preview__card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="chat-image-preview__header">
                <span className="chat-image-preview__title">Send image?</span>
                <span className="chat-image-preview__size">
                  {formatBytes(preview.compressedSize)}
                  {preview.compressedSize < preview.originalSize && (
                    <span className="chat-image-preview__savings">
                      ({Math.round((1 - preview.compressedSize / preview.originalSize) * 100)}% smaller)
                    </span>
                  )}
                </span>
              </div>

              <img
                src={preview.objectUrl}
                alt="Preview"
                className="chat-image-preview__img"
                style={{
                  aspectRatio: `${preview.width} / ${preview.height}`
                }}
              />

              <div className="chat-image-preview__actions">
                <button
                  className="chat-image-preview__cancel"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button
                  className="chat-image-preview__send"
                  onClick={handleSend}
                >
                  Send
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
