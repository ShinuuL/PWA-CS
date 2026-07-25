import { create } from 'zustand'
import { supabase } from '../shared/lib/supabase'
import { compressImage } from '../shared/lib/imageCompress'
import useAuthStore from './authStore'

const useAlbumStore = create((set, get) => ({
  photos: [],
  loading: false,
  uploading: false,
  error: null,
  pairId: null,
  subscription: null,

  initializeAlbum: async (pairId) => {
    const { user } = useAuthStore.getState()
    const current = get()
    if (!user || !pairId) return
    if (current.pairId === pairId && current.subscription) return

    set({ loading: true, pairId, error: null })

    try {
      const { data: photos, error } = await supabase
        .from('album_photos')
        .select('*')
        .eq('pair_id', pairId)
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ photos: photos || [], loading: false })

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
          const { old: deletedPhoto } = payload
          const state = get()
          set({ photos: state.photos.filter(p => p.id !== deletedPhoto.id) })
        })
        .subscribe()

      set({ subscription: channel })
    } catch (err) {
      set({ error: err.message, loading: false })
    }
  },

  uploadAlbumPhoto: async (file, caption = '') => {
    const { user } = useAuthStore.getState()
    const { pairId, photos } = get()
    if (!user || !pairId || !file) return

    set({ uploading: true, error: null })

    // Compress image before upload (D-10)
    let compressed
    try {
      compressed = await compressImage(file)
    } catch (err) {
      set({ error: `Compression failed: ${err.message}`, uploading: false })
      return
    }

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

    set({ photos: [optimisticPhoto, ...photos] })

    if (!navigator.onLine) {
      set({ error: 'Cannot upload photos offline. Please try again when online.', uploading: false })
      // Remove optimistic update
      set({ photos: get().photos.filter(p => p.id !== tempId) })
      return
    }

    try {
      // Upload to Supabase Storage
      const timestamp = Date.now()
      const random = Math.random().toString(36).slice(2, 8)
      const filePath = `${pairId}/${timestamp}-${random}.jpg`

      const { error: uploadError } = await supabase.storage
        .from('album-photos')
        .upload(filePath, blob, { contentType: 'image/jpeg' })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('album-photos')
        .getPublicUrl(filePath)

      const publicUrl = urlData?.publicUrl
      if (!publicUrl) throw new Error('Failed to get public URL')

      // Insert record into album_photos table
      const { data: insertedPhoto, error: insertError } = await supabase
        .from('album_photos')
        .insert({
          pair_id: pairId,
          user_id: user.id,
          url: publicUrl,
          storage_path: filePath,
          caption,
          width,
          height,
          file_size: blob.size
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Revoke blob URL and replace optimistic with real data
      URL.revokeObjectURL(tempBlobUrl)
      set({
        photos: get().photos.map(p =>
          p.id === tempId ? { ...insertedPhoto, _isOptimistic: false } : p
        )
      })
    } catch (err) {
      // Remove optimistic update on failure
      URL.revokeObjectURL(tempBlobUrl)
      set({
        photos: get().photos.filter(p => p.id !== tempId),
        error: err.message
      })
    } finally {
      set({ uploading: false })
    }
  },

  deletePhoto: async (photoId, storagePath) => {
    const { user } = useAuthStore.getState()
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

      if (dbError) throw dbError

      // Delete from storage
      if (storagePath) {
        const { error: storageError } = await supabase.storage
          .from('album-photos')
          .remove([storagePath])

        if (storageError) console.error('Storage delete error:', storageError)
      }
    } catch (err) {
      // Re-fetch on error to restore state
      const { pairId } = get()
      if (pairId) {
        get().initializeAlbum(pairId)
      }
      set({ error: err.message })
    }
  },

  cleanup: () => {
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
