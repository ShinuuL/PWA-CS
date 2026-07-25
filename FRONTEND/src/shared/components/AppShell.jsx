import { useState, useEffect } from 'react'
import { useAuth } from '../../features/auth/useAuth'
import { usePairing } from '../../features/pairing/usePairing'
import Header from './Header'
import Drawer from './Drawer'
import './appshell.css'

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isPaired, setIsPaired] = useState(null)
  const { user } = useAuth()
  const { checkPairStatus } = usePairing()

  useEffect(() => {
    if (!user) return
    checkPairStatus().then((pair) => {
      setIsPaired(!!pair)
    })
  }, [user])

  return (
    <div className="appshell">
      <Header onMenuClick={() => setDrawerOpen(true)} />
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        isPaired={isPaired}
      />
      <main className="appshell-content">
        {children}
      </main>
    </div>
  )
}
