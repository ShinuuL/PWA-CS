import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ user: { id: 'a' }, responses: [], callbacks: [], from: vi.fn(), upload: vi.fn(), compress: vi.fn(), rpc: vi.fn() }))
vi.mock('../shared/lib/supabase', () => ({ supabase: {
  from: (...args) => mocks.from(...args), rpc: (...args) => mocks.rpc(...args), removeChannel: vi.fn(),
  storage: { from: () => ({ upload: (...args) => mocks.upload(...args) }) },
  channel: () => { const c = { on: (_t, _f, cb) => { mocks.callbacks.push(cb); return c }, subscribe: () => c }; return c },
} }))
vi.mock('../shared/lib/imageCompress', () => ({ compressImage: (...args) => mocks.compress(...args) }))
vi.mock('../stores/authStore', () => ({ default: { getState: () => ({ user: mocks.user }) } }))
import chat from '../stores/chatStore'
import album from '../stores/albumStore'
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { resolve, promise } }
beforeEach(() => {
  chat.getState().cleanup(); album.getState().cleanup()
  mocks.user = { id: 'a' }; mocks.responses = []; mocks.callbacks = []
  mocks.from.mockReset(); mocks.rpc.mockReset(); mocks.upload.mockReset()
  mocks.from.mockImplementation(() => {
    const response = mocks.responses.shift() || Promise.resolve({ data: [] })
    const q = { select: () => q, insert: () => q, eq: () => q, order: () => q, single: () => response, then: (...args) => response.then(...args) }; return q
  })
  mocks.compress.mockResolvedValue({ blob: new Blob(['photo']), width: 1, height: 1 })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:private-a')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
it.each([[chat, 'initializeChat', 'messages'], [album, 'initializeAlbum', 'photos']])('ignores old loads and realtime after cleanup', async (store, init, field) => {
  const old = deferred(); mocks.responses.push(old.promise)
  const pending = store.getState()[init]('pair-a')
  store.getState().cleanup(); mocks.user = { id: 'b' }
  old.resolve({ data: [{ id: 'secret' }] }); await pending
  expect(store.getState()[field]).toEqual([])
  expect(mocks.callbacks).toHaveLength(0)
  expect(mocks.rpc).not.toHaveBeenCalled()
  await store.getState()[init]('pair-b')
  const callbacks = [...mocks.callbacks]; store.getState().cleanup()
  callbacks.forEach(cb => cb({ eventType: 'INSERT', new: { id: 'secret', sender_id: 'a', user_id: 'a' }, old: {} }))
  expect(store.getState()[field]).toEqual([])
})
it.each(['sendVoiceMessage', 'sendImageMessage'])('stops %s after upload when identity changes', async method => {
  chat.setState({ pairId: 'pair-a' })
  const old = deferred(); mocks.upload.mockReturnValue(old.promise)
  const pending = chat.getState()[method](new Blob(['private']))
  chat.getState().cleanup(); mocks.user = { id: 'b' }
  chat.setState({ sending: true })
  old.resolve({}); await pending
  expect(mocks.from).not.toHaveBeenCalled()
  expect(chat.getState().sending).toBe(true)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-a')
})
it('stops album compression before upload after cleanup', async () => {
  album.setState({ pairId: 'pair-a' })
  const old = deferred(); mocks.compress.mockReturnValue(old.promise)
  const pending = album.getState().uploadAlbumPhoto(new Blob(['private']))
  album.getState().cleanup(); mocks.user = { id: 'b' }
  old.resolve({ blob: new Blob(['private']), width: 1, height: 1 }); await pending
  expect(mocks.upload).not.toHaveBeenCalled()
  expect(album.getState().photos).toEqual([])
})
it('stops album upload before inserting a record for the old identity', async () => {
  album.setState({ pairId: 'pair-a' })
  const old = deferred(); mocks.upload.mockReturnValue(old.promise)
  const pending = album.getState().uploadAlbumPhoto(new Blob(['private']))
  await vi.waitFor(() => expect(mocks.upload).toHaveBeenCalledTimes(1))
  album.getState().cleanup(); mocks.user = { id: 'b' }
  album.setState({ uploading: true })
  old.resolve({}); await pending
  expect(mocks.from).not.toHaveBeenCalled()
  expect(album.getState().uploading).toBe(true)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-a')
})
it('does not sync queue entries belonging to a different user or pair', async () => {
  chat.setState({ pairId: 'pair-a', offlineQueue: [{ pair_id: 'pair-b', sender_id: 'a', content: 'secret' }, { pair_id: 'pair-a', sender_id: 'b', content: 'secret' }] })
  await chat.getState().syncOfflineQueue()
  expect(mocks.from).not.toHaveBeenCalled()
  expect(chat.getState().offlineQueue).toEqual([])
})
it('stops the remaining offline batch when the session changes', async () => {
  chat.setState({ pairId: 'pair-a', offlineQueue: [{ pair_id: 'pair-a', sender_id: 'a', content: 'one' }, { pair_id: 'pair-a', sender_id: 'a', content: 'two' }] })
  const old = deferred(); mocks.responses.push(old.promise)
  const pending = chat.getState().syncOfflineQueue()
  chat.getState().cleanup(); mocks.user = { id: 'b' }
  old.resolve({}); await pending
  expect(mocks.from).toHaveBeenCalledTimes(1)
  expect(chat.getState().offlineQueue).toEqual([])
})
