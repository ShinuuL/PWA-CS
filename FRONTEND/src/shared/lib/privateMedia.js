import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import useAuthStore from '../../stores/authStore'

// Old rows contain public URLs; new rows contain only an object path.
export function storageObjectPath(bucket, value) {
  if (typeof value !== 'string' || !value) return null
  let path = value
  if (/^https?:\/\//i.test(value)) {
    try {
      const pathname = new URL(value).pathname
      const prefix = `/storage/v1/object/public/${bucket}/`
      if (!pathname.startsWith(prefix)) return null
      path = decodeURIComponent(pathname.slice(prefix.length))
    } catch { return null }
  }
  if (path.startsWith('/') || path.includes('\\') || path.includes(':') || path.split('/').some(part => !part || part === '.' || part === '..')) return null
  return path
}

export function usePrivateMedia(bucket, value, storagePath) {
  const userId = useAuthStore(state => state.user?.id)
  const [result, setResult] = useState(null)
  const source = storagePath || value
  useEffect(() => {
    let active = true
    let objectUrl
    if (!userId || !source || source.startsWith('blob:')) return
    const path = storageObjectPath(bucket, source)
    if (!path) return
    supabase.storage.from(bucket).download(path).then(({ data, error }) => {
      if (!active) return
      if (error || !data) throw error || new Error('Mídia indisponível')
      objectUrl = URL.createObjectURL(data)
      setResult({ source, userId, bucket, url: objectUrl, error: null })
    }).catch(() => {
      if (active) setResult({ source, userId, bucket, url: null, error: 'Não foi possível carregar esta mídia.' })
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [bucket, source, userId])

  if (!userId || !source) return { url: null, error: null }
  if (source.startsWith('blob:')) return { url: source, error: null }
  if (!storageObjectPath(bucket, source)) return { url: null, error: 'Mídia indisponível.' }
  return result?.source === source && result.userId === userId && result.bucket === bucket
    ? result : { url: null, error: null }
}
