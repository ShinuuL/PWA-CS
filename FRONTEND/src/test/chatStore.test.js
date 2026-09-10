import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  from: vi.fn()
}))

vi.mock('../shared/lib/supabase', () => ({
  supabase: { from: mocks.from }
}))

vi.mock('../stores/authStore', () => ({
  default: { getState: () => ({ user: { id: 'user-a' } }) }
}))

import useChatStore from '../stores/chatStore'

function deferred() {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

describe('chat reactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useChatStore.setState({
      messages: [],
      generation: 0,
      error: null
    })
  })

  it('keeps realtime message changes while saving a reaction', async () => {
    const request = deferred()
    const insert = vi.fn(() => ({
      select: () => ({ single: () => request.promise })
    }))
    mocks.from.mockReturnValue({ insert })

    const firstMessage = { id: 'message-a', reactions: [] }
    const secondMessage = { id: 'message-b', reactions: [] }
    useChatStore.setState({ messages: [firstMessage] })

    const pending = useChatStore.getState().addReaction('message-a', '❤️')
    useChatStore.setState({ messages: [firstMessage, secondMessage] })
    request.resolve({
      data: { id: 'reaction-a', message_id: 'message-a', user_id: 'user-a', emoji: '❤️' },
      error: null
    })

    await pending

    expect(useChatStore.getState().messages).toEqual([
      { ...firstMessage, reactions: [{ id: 'reaction-a', message_id: 'message-a', user_id: 'user-a', emoji: '❤️' }] },
      secondMessage
    ])
  })

  it('does not duplicate a reaction already delivered by realtime', async () => {
    const request = deferred()
    mocks.from.mockReturnValue({
      insert: () => ({ select: () => ({ single: () => request.promise }) })
    })

    const message = { id: 'message-a', reactions: [] }
    const reaction = { id: 'reaction-a', message_id: 'message-a', user_id: 'user-a', emoji: '❤️' }
    useChatStore.setState({ messages: [message] })

    const pending = useChatStore.getState().addReaction('message-a', '❤️')
    useChatStore.setState({ messages: [{ ...message, reactions: [reaction] }] })
    request.resolve({ data: reaction, error: null })
    await pending

    expect(useChatStore.getState().messages[0].reactions).toEqual([reaction])
  })
})
