import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: 'var(--color-bg-card)',
          color: 'var(--color-text-primary)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
        },
      }}
    />
    <App />
  </StrictMode>,
)
