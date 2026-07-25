import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import ProtectedRoute from './shared/components/ProtectedRoute'
import PairingGate from './features/pairing/PairingGate'
import AppShell from './shared/components/AppShell'

import LoginPage from './features/auth/LoginPage'
import AuthCallback from './features/auth/AuthCallback'
import ProfilePage from './features/profile/ProfilePage'
import PartnerProfile from './features/profile/PartnerProfile'
import SettingsPage from './features/settings/SettingsPage'
import ChatView from './features/chat/ChatView'
import ChatSettings from './features/chat/ChatSettings'
import AlbumPage from './features/album/AlbumPage'
import MiniAlbum from './features/album/MiniAlbum'

const HomePage = () => (
  <div style={{ padding: '1.5rem' }}>
    <h2 style={{ color: 'var(--color-text-primary)', marginBottom: '1rem' }}>Home</h2>
    <MiniAlbum />
  </div>
)
const AgendaPage = () => <div style={{ padding: '1.5rem' }}>Agenda (Phase 5)</div>

function App() {
  const { initialize, loading } = useAuthStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (loading) return <div className="loading">Loading...</div>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
