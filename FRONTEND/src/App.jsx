import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import ProtectedRoute from './shared/components/ProtectedRoute'
import PairingGate from './features/pairing/PairingGate'
import AppShell from './shared/components/AppShell'
import { clearPrivateState } from './shared/lib/privateState'
import { usePairingStore } from './stores/pairingStore'

import LoginPage from './features/auth/LoginPage'
import AuthCallback from './features/auth/AuthCallback'
const ProfilePage = lazy(() => import('./features/profile/ProfilePage'))
const PartnerProfile = lazy(() => import('./features/profile/PartnerProfile'))
const SettingsPage = lazy(() => import('./features/settings/SettingsPage'))
const ChatView = lazy(() => import('./features/chat/ChatView'))
const ChatSettings = lazy(() => import('./features/chat/ChatSettings'))
const AlbumPage = lazy(() => import('./features/album/AlbumPage'))
const HomePage = lazy(() => import('./features/dashboard/HomePage'))
const AgendaPage = lazy(() => import('./features/agenda/AgendaPage'))
const SpotifyCallback = lazy(() => import('./features/spotify/SpotifyCallback'))

function App() {
  const { initialize, loading, user } = useAuthStore()

  useEffect(() => {
    let disposed = false
    let cleanup
    const unsubscribeAuth = useAuthStore.subscribe((state, previous) => {
      if (state.user?.id !== previous.user?.id) clearPrivateState()
    })
    const unsubscribePair = usePairingStore.subscribe((state, previous) => {
      if (previous.pair?.id && state.pair?.id !== previous.pair.id) clearPrivateState()
    })
    clearPrivateState()
    initialize().then(stop => { if (disposed) stop?.(); else cleanup = stop })
    return () => { disposed = true; cleanup?.(); unsubscribeAuth(); unsubscribePair() }
  }, [initialize])

  if (loading) return <div className="loading" role="status">Carregando…</div>

  return (
    <BrowserRouter key={user?.id || 'guest'}>
      <Suspense fallback={<div className="loading" role="status">Carregando…</div>}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/spotify/callback" element={<SpotifyCallback />} />
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppShell>
                <PairingGate>
                  <HomePage />
                </PairingGate>
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <AppShell>
                <PairingGate>
                  <ChatView />
                </PairingGate>
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <ChatSettings />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/album"
          element={
            <ProtectedRoute>
              <AppShell>
                <PairingGate>
                  <AlbumPage />
                </PairingGate>
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <AppShell>
                <PairingGate>
                  <AgendaPage />
                </PairingGate>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <SettingsPage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppShell>
                <ProfilePage />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/partner"
          element={
            <ProtectedRoute>
              <AppShell>
                <PairingGate>
                  <PartnerProfile />
                </PairingGate>
              </AppShell>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<div className="login-page"><h1>Página não encontrada</h1><p>Este endereço não está disponível.</p><Link className="login-button" to="/home">Voltar ao início</Link></div>} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
