import { useEffect, useState } from 'react'
import { Camera, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePairing } from '../pairing/usePairing'
import { supabase } from '../../shared/lib/supabase'
import { format } from 'date-fns'
import './memory-hero.css'

export default function MemoryHero() {
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(true)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
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

      if (!error && data?.length) {
        setPhoto(data[0])
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

  const dateStr = photo.created_at
    ? format(new Date(photo.created_at), 'MMMM d, yyyy')
    : null

  if (imgError || !photo.url) {
    return (
      <div className="memory-hero memory-hero--empty">
        <Camera size={48} />
        <p>Falha ao carregar foto</p>
      </div>
    )
  }

  return (
    <motion.div
      className="memory-hero memory-hero--card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="memory-hero__header">
        <div className="memory-hero__header-left">
          <Clock size={18} className="memory-hero__icon" />
          <span className="memory-hero__title">Ultima Lembranca</span>
        </div>
        <span className="memory-hero__badge">Recente</span>
      </div>

      <div className="memory-hero__image-container">
        {!imgLoaded && <div className="memory-hero__image-placeholder" />}
        <motion.img
          className="memory-hero__image"
          src={photo.url}
          alt={photo.caption || 'Memory photo'}
          onLoad={() => setImgLoaded(true)}
          onError={() => setImgError(true)}
          initial={{ scale: 1.05 }}
          animate={{ scale: imgLoaded ? 1 : 1.05 }}
          transition={{ duration: 10, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence>
        {imgLoaded && (photo.caption || dateStr) && (
          <motion.div
            className="memory-hero__caption"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {photo.caption && (
              <p className="memory-hero__quote">&quot;{photo.caption}&quot;</p>
            )}
            {dateStr && (
              <span className="memory-hero__date">{dateStr}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
