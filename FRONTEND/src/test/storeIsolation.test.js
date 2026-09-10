import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ user: { id: 'a' }, responses: [], callbacks: [], from: vi.fn(), removeChannel: vi.fn() }))
vi.mock('../shared/lib/supabase', () => ({ supabase: {
  from: (...args) => mocks.from(...args), removeChannel: mocks.removeChannel,
  channel: () => { const channel = { on: (_type, _filter, callback) => { mocks.callbacks.push(callback); return channel }, subscribe: () => channel }; return channel },
} }))
vi.mock('../stores/authStore', () => ({ default: { getState: () => ({ user: mocks.user }) } }))
import dashboard from '../stores/dashboardStore'
import agenda from '../stores/agendaStore'
import notes from '../stores/notesStore'
import reminders from '../stores/reminderStore'
import todos from '../stores/todoStore'

const cases = [
  ['dashboard', dashboard, 'initializeDashboard', 'myMood', null],
  ['agenda', agenda, 'initializeAgenda', 'events', []],
  ['notes', notes, 'initializeNotes', 'notes', []],
  ['reminders', reminders, 'initializeReminders', 'reminders', []],
  ['todos', todos, 'initializeTodos', 'lists', []],
]
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r }); return { promise, resolve } }
beforeEach(() => {
  cases.forEach(([, store]) => store.getState().cleanup())
  mocks.user = { id: 'a' }; mocks.responses = []; mocks.callbacks = []
  mocks.from.mockImplementation(() => {
    const response = mocks.responses.shift() || Promise.resolve({ data: [] })
    const query = { select: () => query, eq: () => query, neq: () => query, order: () => query, limit: () => query, in: () => query, update: () => query, delete: () => query, maybeSingle: () => response, then: (...args) => response.then(...args) }
    return query
  })
})

describe.each(cases)('%s session isolation', (_name, store, initialize, field, empty) => {
  it('discards a load resolved after cleanup and a new pair', async () => {
    const old = deferred(); mocks.responses.push(old.promise)
    const pending = store.getState()[initialize]('pair-a')
    store.getState().cleanup(); mocks.user = { id: 'b' }
    await store.getState()[initialize]('pair-b')
    const stateB = store.getState()[field]
    old.resolve({ data: [{ id: 'private-a', title: 'secret', status: 'pending_send' }] })
    await pending
    expect(store.getState()[field]).toEqual(stateB)
    expect(store.getState().pairId).toBe('pair-b')
  })
  it('ignores realtime callbacks after cleanup', async () => {
    await store.getState()[initialize]('pair-a')
    const callbacks = [...mocks.callbacks]
    store.getState().cleanup()
    callbacks.forEach(callback => callback({ eventType: 'INSERT', new: { id: 'private-a', user_id: 'a' } }))
    expect(store.getState()[field]).toEqual(empty)
    expect(store.getState().subscription).toBeNull()
  })
  it('invalidates an old load even when the same account and pair reopen', async () => {
    const old = deferred(); mocks.responses.push(old.promise)
    const pending = store.getState()[initialize]('pair-a')
    store.getState().cleanup()
    await store.getState()[initialize]('pair-a')
    const freshState = store.getState()[field]
    old.resolve({ data: [{ id: 'stale' }] })
    await pending
    expect(store.getState()[field]).toEqual(freshState)
  })
  it('clears the previous pair immediately while the next pair loads', async () => {
    await store.getState()[initialize]('pair-a')
    store.setState({ [field]: field === 'myMood' ? { id: 'private-a' } : [{ id: 'private-a' }] })
    const next = deferred(); mocks.responses.push(next.promise)
    const pending = store.getState()[initialize]('pair-b')
    expect(store.getState()[field]).toEqual(empty)
    next.resolve({ data: [] })
    await pending
  })
})

it.each([[agenda, 'deleteEvent', 'events'], [notes, 'deleteNote', 'notes'], [reminders, 'deleteReminder', 'reminders'], [todos, 'deleteList', 'lists']])('does not restore old records after a failed mutation', async (store, method, field) => {
  store.setState({ pairId: 'pair-a', [field]: [{ id: 'private-a' }] })
  const old = deferred(); mocks.responses.push(old.promise)
  const pending = store.getState()[method]('private-a')
  store.getState().cleanup(); mocks.user = { id: 'b' }
  old.resolve({ error: new Error('late failure') })
  await pending
  expect(store.getState()[field]).toEqual([])
})
