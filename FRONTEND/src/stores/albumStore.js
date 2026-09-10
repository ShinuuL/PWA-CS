import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import { compressImage } from '../shared/lib/imageCompress'
import useAuthStore from './authStore'

const useAlbumStore = create((set, get) => ({
  photos: [],
  generation: 0,
  sessionUserId: null,
  loading: false,
  uploading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeAlbum: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.sessionUserId === user.id && current.subscription) return

    get().cleanup()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user.id

    set({ loading: true, sessionUserId: user.id, pairId, error: null })

    try {
      const { data: photos, error } = await supabase
        .from('album_photos')
        .select('*')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: false })

      if (!isCurrent()) return
      if (error) throw error

      set({ photos: photos || [], loading: false })

      if (!isCurrent()) return
      // Clean up any existing subscription first
      const oldChannel = get().subscription
      if (oldChannel) {
        supabase.removeChannel(oldChannel)
      }

      // Subscribe to real-time changes on album_photos
      const channel = supabase
        .channel(`album:${pairId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'album_photos',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          if (!isCurrent()) return
          const { new: newPhoto } = payload
          const state = get()

          // Skip if already present (optimistic update)
          const alreadyPresent = state.photos.some(p => p.id === newPhoto.id)
          if (!alreadyPresent) {
            set({ photos: [newPhoto, ...state.photos] })
          }
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'album_photos',
          filter: `pair_id=eq.${pairId}`
        }, (payload) => {
          if (!isCurrent()) return
          const { old: deletedPhoto } = payload
          const state = get()
          set({ photos: state.photos.filter(p => p.id !== deletedPhoto.id) })
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      if (!isCurrent()) return
      set({ error: err.message, loading: false })
    }
  },

  uploadAlbumPhoto: async (file, caption = '') => {
    const { user } = useAuthStore.getState()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user?.id
    const { pairId } = get()
    if (!user || !pairId || !file) return false

    set({ uploading: true, error: null })

    // Compress image before upload (D-10)
    let compressed
    try {
      compressed = await compressImage(file)
    } catch (err) {
      if (!isCurrent()) return false
      set({ error: `Não foi possível preparar a imagem: ${err.message}`, uploading: false })
      return false
    }

    if (!isCurrent()) return false
    const { blob, width, height } = compressed

    // Optimistic update with local blob URL
    const tempId = `temp-${Date.now()}`
    const tempBlobUrl = URL.createObjectURL(blob)
    const optimisticPhoto = {
      id: tempId,
      temp_id: tempId,
      pair_id: pairId,
      user_id: user.id,
      url: tempBlobUrl,
      storage_path: '',
      caption,
      width,
      height,
      file_size: blob.size,
      created_at: new Date().toISOString(),
      _isOptimistic: true
    }

    set({ photos: [optimisticPhoto, ...get().photos] })

    if (!navigator.onLine) {
      set({ error: 'Não é possível enviar fotos offline. Tente novamente quando estiver online.', uploading: false })
      // Remove optimistic update
      set({ photos: get().photos.filter(p => p.id !== tempId) })
      URL.revokeObjectURL(tempBlobUrl)
      return false
    }

    try {
      // Upload to Supabase Storage
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const filePath = `${pairId}/${timestamp}-${random}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('album-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg' })

      if (!isCurrent()) return false
      if (uploadError) throw uploadError

      // Insert record into album_photos table
      const { data: insertedPhoto, error: insertError } = await supabase
        .from('album_photos')
        .insert({
          pair_id: pairId,
          user_id: user.id,
          url: filePath,
          storage_path: filePath,
          caption,
          width,
          height,
          file_size: blob.size
        })
        .select()
        .single()

      if (!isCurrent()) return false
      if (insertError) throw insertError

      // Revoke blob URL and replace optimistic with real data
      URL.revokeObjectURL(tempBlobUrl)
      set({
        photos: get().photos.map(p =>
          p.id === tempId ? { ...insertedPhoto, _isOptimistic: false } : p
        )
      })
      return true
    } catch (err) {
      if (!isCurrent()) return false
      // Remove optimistic update on failure
      URL.revokeObjectURL(tempBlobUrl)
      set({
        photos: get().photos.filter(p => p.id !== tempId),
        error: err.message
      })
      return false
    } finally {
      if (isCurrent()) set({ uploading: false })
    }
  },

  deletePhoto: async (photoId, storagePath) => {
    const { user } = useAuthStore.getState()
    const generation = get().generation
    const isCurrent = () => get().generation === generation && useAuthStore.getState().user?.id === user?.id
    const { photos } = get()
    if (!user) return

    // Optimistic removal
    set({ photos: photos.filter(p => p.id !== photoId) })

    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('album_photos')
        .delete()
        .eq('id', photoId)
        .eq('user_id', user.id)

      if (!isCurrent()) return
      if (dbError) throw dbError

      // Delete from storage
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('album-photos')
          .remove([storagePath])

        if (storageError) console.error('Storage delete error:', storageError)
      }
    } catch (err) {
      if (!isCurrent()) return
      // Re-fetch on error to restore state
      const { pairId } = get()
      if (pairId) {
        get().initializeAlbum(pairId)
      }
      set({ error: err.message })
    }
  },

  cleanup: () => {
    set({ generation: get().generation + 1, sessionUserId: null })
    get().photos.forEach(photo => {
      if (photo.url?.startsWith('blob:')) URL.revokeObjectURL(photo.url)
    })
    const { subscription } = get()
    if (subscription) {
      supabase.removeChannel(subscription)
    }
    set({
      subscription: null,
      photos: [],
      pairId: null,
      loading: false,
      uploading: false,
      error: null
    })
  }
}))

export default useAlbumStore
