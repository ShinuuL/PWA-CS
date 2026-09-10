import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi, it, expect, beforeEach } from 'vitest'
import LoginPage from '../features/auth/LoginPage'

const mocks = vi.hoisted(() => ({ login: vi.fn() }))
vi.mock('../shared/lib/supabase', () => ({ supabase: { auth: { signInWithOAuth: mocks.login } } }))
beforeEach(() => { sessionStorage.clear(); mocks.login.mockReset() })

it('shows a recoverable error and preserves the original internal destination', async () => {
  mocks.login.mockResolvedValue({ error: new Error('Provider unavailable') })
  render(<MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/chat' } } }]}><LoginPage /></MemoryRouter>)
  fireEvent.click(screen.getByRole('button'))
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível'))
  expect(screen.getByRole('button')).toBeEnabled()
  expect(sessionStorage.getItem('couplespace-login-next')).toBe('/chat')
})
