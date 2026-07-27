import { useEffect, useState } from 'react'
import { Camera } from 'lucide-react'
import { usePairing } from '../pairing/usePairing'
import { supabase } from '../../shared/lib/supabase'
import { format } from 'date-fns'

export default function MemoryHero() {
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const { checkPairStatus } = usePairing()

  useEffect(() => {
    const loadRandomPhoto = async () => {
      const pair = await checkPairStatus()
      if (!pair) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase.rpc('get_random_album_photo', {
        p_pair_id: pair.id
      })

      if (!error && data) {
        setPhoto(data)
      }
      setLoading(false)
    }

    loadRandomPhoto()
  }, [checkPairStatus])

  if (loading) {
    return <div className="memory-hero memory-hero--skeleton" />
  }

  if (!photo) {
    return (
      <div className="memory-hero memory-hero--empty">
        <Camera size={48} />
        <p>Adicione sua primeira foto juntos</p>
      </div>
    )
  }

  const dateStr = photo.created_at ? format(new Date(photo.created_at), 'MMMM d, yyyy') : null

  return (
    <div className="memory-hero">
      <img
        className="memory-hero__image"
        src={photo.url}
        alt={photo.caption || 'Memory photo'}
      />
      <div className="memory-hero__caption">
        {photo.caption && (
          <div className="memory-hero__caption-text">{photo.caption}</div>
        )}
        {dateStr && (
          <div className="memory-hero__caption-date">{dateStr}</div>
        )}
      </div>
    </div>
  )
}
