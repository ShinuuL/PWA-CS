import { act, renderHook, waitFor } from '@testing-library/react'
import { vi, beforeEach, it, expect } from 'vitest'
import { usePrivateMedia, storageObjectPath } from '../shared/lib/privateMedia'

const mocks = vi.hoisted(() => ({ download: vi.fn(), user: { id: 'user-a' } }))
vi.mock('../shared/lib/supabase', () => ({ supabase: { storage: { from: () => ({ download: mocks.download }) } } }))
vi.mock('../stores/authStore', () => ({ default: (selector) => selector({ user: mocks.user }) }))

beforeEach(() => {
  mocks.user = { id: 'user-a' }
  mocks.download.mockReset()
  URL.createObjectURL = vi.fn(() => 'blob:private-photo')
  URL.revokeObjectURL = vi.fn()
})

it('downloads legacy public URLs through authenticated storage and revokes the local URL', async () => {
  mocks.download.mockResolvedValue({ data: new Blob(['photo']), error: null })
  const { result, unmount } = renderHook(() => usePrivateMedia('album-photos', 'https://project.supabase.co/storage/v1/object/public/album-photos/pair/photo.jpg'))
  await waitFor(() => expect(result.current.url).toBe('blob:private-photo'))
  expect(mocks.download).toHaveBeenCalledWith('pair/photo.jpg')
  unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-photo')
})

it('never falls back to the public URL when authorization fails', async () => {
  mocks.download.mockResolvedValue({ data: null, error: new Error('Forbidden') })
  const { result } = renderHook(() => usePrivateMedia('chat-media', 'pair/audio.webm'))
  await waitFor(() => expect(result.current.error).toBeTruthy())
  expect(result.current.url).toBeNull()
})

it('discards an in-flight private download after account changes', async () => {
  let finish
  mocks.download.mockReturnValue(new Promise(resolve => { finish = resolve }))
  const { result, rerender } = renderHook(() => usePrivateMedia('album-photos', 'pair/photo.jpg'))
  mocks.user = null
  rerender()
  await act(async () => finish({ data: new Blob(['photo']), error: null }))
  expect(result.current.url).toBeNull()
  expect(URL.createObjectURL).not.toHaveBeenCalled()
})

it('rejects arbitrary external URLs and traversal paths', () => {
  expect(storageObjectPath('chat-media', 'https://other.test/image.png')).toBeNull()
  expect(storageObjectPath('chat-media', '../private.png')).toBeNull()
  expect(storageObjectPath('chat-media', 'pair/photo.jpg')).toBe('pair/photo.jpg')
})
