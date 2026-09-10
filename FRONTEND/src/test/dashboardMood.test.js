import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  user: { id: 'user-a' },
  upsert: vi.fn()
}))

vi.mock('../shared/lib/supabase', () => ({
  supabase: {
    from: () => ({ upsert: mocks.upsert })
  }
}))

vi.mock('../stores/authStore', () => ({
  default: { getState: () => ({ user: mocks.user }) }
}))

import useDashboardStore from '../stores/dashboardStore'

describe('dashboard mood updates', () => {
  beforeEach(() => {
    useDashboardStore.getState().cleanup()
    useDashboardStore.setState({ pairId: 'pair-a', sessionUserId: 'user-a', myMood: null })
    mocks.upsert.mockReset()
  })

  it('updates the selected mood and finishes saving after persistence', async () => {
    mocks.upsert.mockResolvedValue({ error: null })

    const result = await useDashboardStore.getState().setMood('happy')

    expect(result).toEqual({ success: true })
    expect(useDashboardStore.getState().myMood.mood_type).toBe('happy')
    expect(useDashboardStore.getState().moodSaving).toBe(false)
    expect(useDashboardStore.getState().moodError).toBeNull()
  })

  it('restores the previous mood and exposes a persistence error', async () => {
    useDashboardStore.setState({ myMood: { id: 'mood-1', mood_type: 'sad' } })
    mocks.upsert.mockResolvedValue({ error: new Error('offline') })

    const result = await useDashboardStore.getState().setMood('happy')

    expect(result.error).toBe('offline')
    expect(useDashboardStore.getState().myMood.mood_type).toBe('sad')
    expect(useDashboardStore.getState().moodSaving).toBe(false)
    expect(useDashboardStore.getState().moodError).toBe('offline')
  })

  it('does not accept a mood before the pair is ready', async () => {
    useDashboardStore.setState({ pairId: null })

    const result = await useDashboardStore.getState().setMood('happy')

    expect(result.error).toContain('vínculo')
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
})
