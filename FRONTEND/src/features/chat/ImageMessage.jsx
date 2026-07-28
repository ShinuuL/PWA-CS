/**
 * Inline image message component for chat bubbles.
 * Lazy-loads thumbnail, click opens full-screen viewer.
 */

import { useState, useCallback } from 'react'
import { ImageIcon } from 'lucide-react'

/**
 * ImageMessage — renders an image inside a chat bubble.
 *
 * @param {Object} props
 * @param {string} props.src - Image URL (blob URL or Supabase Storage URL)
 * @param {string} [props.alt] - Image alt text
 * @param {Object} [props.dimensions] - { width, height }
 * @param {function} [props.onClick] - Called when image is clicked (opens viewer)
 */
export default function ImageMessage({ src, alt, dimensions, onClick }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleClick = useCallback(() => {
    onClick?.(src)
  }, [onClick, src])

  if (isError) {
    return (
      <div className="chat-image-msg chat-image-msg--error">
        <ImageIcon size={20} />
        <span>Failed to load image</span>
      </div>
    )
  }

  return (
    <div className="chat-image-msg" onClick={handleClick}>
      {!isLoaded && (
        <div className="chat-image-msg__placeholder" style={{
          aspectRatio: dimensions?.width && dimensions?.height
            ? `${dimensions.width} / ${dimensions.height}`
            : '1'
        }}>
          <ImageIcon size={24} className="chat-image-msg__loading-icon" />
        </div>
      )}
      <img
        src={src}
        alt={alt || 'Shared image'}
        className="chat-image-msg__img"
        style={{
          aspectRatio: dimensions?.width && dimensions?.height
            ? `${dimensions.width} / ${dimensions.height}`
            : '1',
          display: isLoaded ? 'block' : 'none'
        }}
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
      />
    </div>
  )
}
