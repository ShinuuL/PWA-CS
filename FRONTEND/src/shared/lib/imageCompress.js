/**
 * Image compression utility using Canvas API.
 * Compresses images client-side before upload — reduces storage usage
 * and bandwidth. Also strips EXIF data naturally (privacy benefit).
 *
 * @module imageCompress
 */

/**
 * Compress an image file using Canvas API.
 * Scales down if width exceeds maxWidth, then compresses to the specified quality.
 *
 * @param {File} file - The image file to compress
 * @param {Object} [options] - Compression options
 * @param {number} [options.maxWidth=1920] - Maximum width in pixels. Images wider
 *   than this are scaled down proportionally (per D-10).
 * @param {number} [options.quality=0.8] - JPEG/WebP quality (0.0 to 1.0).
 * @param {string} [options.outputType='image/jpeg'] - Output MIME type.
 * @returns {Promise<{blob: Blob, width: number, height: number, originalSize: number, compressedSize: number}>}
 *   Compressed image blob with dimension and size metadata.
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    quality = 0.8,
    outputType = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      try {
        let { width, height } = img

        // Scale down if width exceeds maxWidth (D-10: client-side compression)
        if (width > maxWidth) {
          const ratio = maxWidth / width
          width = maxWidth
          height = Math.round(height * ratio)
        }

        // Create offscreen canvas and draw
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            // Revoke the object URL to free memory
            URL.revokeObjectURL(objectUrl)

            if (!blob) {
              reject(new Error('Canvas toBlob returned null'))
              return
            }

            resolve({
              blob,
              width,
              height,
              originalSize: file.size,
              compressedSize: blob.size
            })
          },
          outputType,
          quality
        )
      } catch (err) {
        URL.revokeObjectURL(objectUrl)
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

export default compressImage
