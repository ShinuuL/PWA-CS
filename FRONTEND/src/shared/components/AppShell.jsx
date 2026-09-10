import { useState } from 'react'
import { usePairing } from '../../features/pairing/usePairing'
import Header from './Header'
import Drawer from './Drawer'
import './appshell.css'

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { pair, statusLoading } = usePairing()
  const isPaired = statusLoading ? null : !!pair

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
