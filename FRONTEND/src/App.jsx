import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './stores/authStore'
import ProtectedRoute from './shared/components/ProtectedRoute'
import PairingGate from './features/pairing/PairingGate'

import LoginPage from './features/auth/LoginPage'
import AuthCallback from './features/auth/AuthCallback'

// Placeholder pages
const HomePage = () => <div>Home (Phase 4)</div>
const ChatPage = () => <div>Chat (Phase 2)</div>
const AgendaPage = () => <div>Agenda (Phase 5)</div>
const SettingsPage = () => <div>Settings</div>

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
              <PairingGate>
                <HomePage />
              </PairingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <PairingGate>
                <ChatPage />
              </PairingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/agenda"
          element={
            <ProtectedRoute>
              <PairingGate>
                <AgendaPage />
              </PairingGate>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
