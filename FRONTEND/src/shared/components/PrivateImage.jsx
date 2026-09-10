import { usePrivateMedia } from '../lib/privateMedia'

export default function PrivateImage({ bucket = 'album-photos', src, storagePath, alt, ...props }) {
  const media = usePrivateMedia(bucket, src, storagePath)
  if (media.error) return <span role="status" className={props.className}>{media.error}</span>
  return <img {...props} src={media.url || undefined} alt={alt} aria-busy={!media.url} />
}
