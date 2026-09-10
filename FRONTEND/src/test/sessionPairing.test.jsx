import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ from: vi.fn(), rpc: vi.fn(), signOut: vi.fn(), invoke: vi.fn(), unsubscribe: vi.fn(), getSession: vi.fn(), onAuthStateChange: vi.fn() }))
vi.mock('../shared/lib/supabase', () => ({ supabase: { from: mocks.from, rpc: mocks.rpc, functions: { invoke: mocks.invoke }, auth: { signOut: mocks.signOut, getSession: mocks.getSession, onAuthStateChange: mocks.onAuthStateChange } } }))
vi.mock('../shared/lib/pushSubscription', () => ({ subscribeToPush: vi.fn(), unsubscribeFromPush: mocks.unsubscribe, cancelPushSubscription: vi.fn() }))
import useAuthStore from '../stores/authStore'
import useSpotifyStore from '../stores/spotifyStore'
import { usePairing } from '../features/pairing/usePairing'
import { usePairingStore } from '../stores/pairingStore'

function query(result) {
  const builder = { select: vi.fn(), or: vi.fn(), not: vi.fn(), eq: vi.fn(), delete: vi.fn(), maybeSingle: vi.fn(), single: vi.fn() }
  Object.keys(builder).forEach(key => builder[key].mockReturnValue(builder))
  builder.maybeSingle.mockImplementation(() => Promise.resolve(result))
  builder.single.mockImplementation(() => Promise.resolve(result))
  builder.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject)
  return builder
}

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
  usePairingStore.getState().reset()
  useAuthStore.setState({ user: { id: 'a' }, profile: null, session: { user: { id: 'a' } } })
  mocks.from.mockImplementation(() => query({ data: null, error: null }))
  mocks.unsubscribe.mockResolvedValue(true)
})
afterEach(() => vi.useRealTimers())

describe('session isolation', () => {
  it('clears account A credentials immediately when auth emits account B', async () => {
    let onAuth
    const unsubscribe = vi.fn()
    mocks.onAuthStateChange.mockImplementation(callback => {
      onAuth = callback
      return { data: { subscription: { unsubscribe } } }
    })
    mocks.getSession.mockResolvedValue({ data: { session: { user: { id: 'a' } } }, error: null })
    const cleanup = await useAuthStore.getState().initialize()
    useSpotifyStore.getState().setAccessToken('account-a-token', 3600)
    localStorage.setItem('spotify_code_verifier', 'account-a-verifier')
    onAuth('SIGNED_IN', { user: { id: 'b' } })
    expect(useAuthStore.getState().user.id).toBe('b')
    expect(useSpotifyStore.getState().accessToken).toBeNull()
    expect(localStorage.getItem('spotify_code_verifier')).toBeNull()
    expect(mocks.unsubscribe).toHaveBeenCalledWith('a')
    cleanup()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
  it('does not publish a profile response from the previous account', async () => {
    let resolve
    mocks.from.mockReturnValue(query(new Promise(r => { resolve = r })))
    const pending = useAuthStore.getState().fetchProfile('a')
    useAuthStore.setState({ user: { id: 'b' }, profile: { id: 'b' } })
    resolve({ data: { id: 'a' }, error: null })
    await pending
    expect(useAuthStore.getState().profile.id).toBe('b')
  })
  it('reports signout failure while preserving the authenticated user', async () => {
    mocks.signOut.mockResolvedValue({ error: new Error('offline') })
    await expect(useAuthStore.getState().signOut()).rejects.toThrow('offline')
    expect(useAuthStore.getState().user.id).toBe('a')
  })
  it('clears local Spotify credentials on logout without removing remote configuration', async () => {
    useSpotifyStore.getState().setAccessToken('secret', 3600)
    useSpotifyStore.setState({ pairId: 'pair-a', deviceId: 'device', currentTrack: { name: 'private' } })
    mocks.signOut.mockResolvedValue({ error: null })
    await useAuthStore.getState().signOut()
    expect(useSpotifyStore.getState().accessToken).toBeNull()
    expect(useSpotifyStore.getState().deviceId).toBeNull()
    expect(sessionStorage.getItem('spotify_access_token')).toBeNull()
    expect(mocks.from).not.toHaveBeenCalledWith('spotify_config')
    expect(mocks.unsubscribe).toHaveBeenCalled()
  })
  it('ignores a token refresh that finishes after local cleanup', async () => {
    let resolve
    mocks.invoke.mockReturnValue(new Promise(r => { resolve = r }))
    useSpotifyStore.setState({ pairId: 'pair-a', tokenExpiresAt: null, _refreshPromise: null })
    const pending = useSpotifyStore.getState().refreshTokenIfNeeded()
    useSpotifyStore.getState().resetLocalSession()
    resolve({ data: { access_token: 'late-secret', expires_in: 3600 }, error: null })
    await pending
    expect(useSpotifyStore.getState().accessToken).toBeNull()
    expect(sessionStorage.getItem('spotify_access_token')).toBeNull()
  })
})

describe('shared pairing', () => {
  it('observes remote acceptance on focus without reloading', async () => {
    const hook = renderHook(() => usePairing())
    await act(async () => { await hook.result.current.checkPairStatus() })
    expect(hook.result.current.pair).toBeNull()
    mocks.from.mockImplementation(() => query({ data: { id: 'accepted-remotely' }, error: null }))
    await act(async () => { window.dispatchEvent(new Event('focus')) })
    expect(hook.result.current.pair?.id).toBe('accepted-remotely')
    hook.unmount()
  })
  it('stops polling when the final consumer unmounts', async () => {
    vi.useFakeTimers()
    const hook = renderHook(() => usePairing())
    await act(async () => {})
    hook.unmount()
    const calls = mocks.from.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(15000) })
    expect(mocks.from).toHaveBeenCalledTimes(calls)
  })
  it('does not clear the pair when the delete request fails', async () => {
    const hook = renderHook(() => usePairing())
    mocks.from.mockImplementation(() => {
      const builder = query({ data: { id: 'pair-a' }, error: null })
      builder.delete.mockReturnValue(query({ data: null, error: new Error('permission denied') }))
      return builder
    })
    await act(async () => { await expect(hook.result.current.unpair()).rejects.toThrow('permission denied') })
    expect(hook.result.current.pair?.id).toBe('pair-a')
    hook.unmount()
  })
  it('updates independent consumers after accepting an invite', async () => {
    const first = renderHook(() => usePairing())
    const second = renderHook(() => usePairing())
    await act(async () => { await first.result.current.checkPairStatus() })
    mocks.rpc.mockResolvedValue({ data: { pair_id: 'pair-a' }, error: null })
    mocks.from.mockImplementation(table => query({ data: table === 'pairs' ? { id: 'pair-a', user_one: 'a', user_two: 'b', code_used: true } : { id: 'a' }, error: null }))
    await act(async () => { await second.result.current.consumeCode('123456') })
    await waitFor(() => expect(first.result.current.pair?.id).toBe('pair-a'))
    first.unmount(); second.unmount()
  })
  it('propagates check and deletion errors without clearing the shared pair', async () => {
    const hook = renderHook(() => usePairing())
    mocks.from.mockImplementation(() => query({ data: { id: 'pair-a' }, error: null }))
    await act(async () => { await hook.result.current.checkPairStatus() })
    mocks.from.mockImplementation(() => query({ data: null, error: new Error('offline') }))
    await act(async () => { await expect(hook.result.current.unpair()).rejects.toThrow('offline') })
    expect(hook.result.current.pair?.id).toBe('pair-a')
    hook.unmount()
  })
})
