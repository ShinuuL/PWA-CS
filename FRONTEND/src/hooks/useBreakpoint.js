import { useEffect, useState } from 'react'

// Breakpoints (in px)
const MOBILE_MAX = 420
const TABLET_MAX = 1024

export default function useBreakpoint() {
  const getBp = (w = typeof window !== 'undefined' ? window.innerWidth : 1024) => {
    if (w <= MOBILE_MAX) return 'mobile'
    if (w <= TABLET_MAX) return 'tablet'
    return 'desktop'
  }

  const [bp, setBp] = useState(getBp())

  useEffect(() => {
    function onResize() {
      const next = getBp()
      setBp(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return bp
}
