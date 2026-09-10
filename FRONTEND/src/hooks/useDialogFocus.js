import { useEffect, useRef } from 'react'

export function useDialogFocus(open, onClose) {
  const ref = useRef(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    if (!open || !ref.current) return
    const previous = document.activeElement
    const panel = ref.current
    const controls = () => [...panel.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(element => !element.hidden)
    ;(controls()[0] || panel).focus()
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current?.() }
      if (event.key !== 'Tab') return
      const elements = controls()
      const first = elements[0]
      const last = elements.at(-1)
      if (!first) { event.preventDefault(); panel.focus() }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    panel.addEventListener('keydown', onKey)
    return () => { panel.removeEventListener('keydown', onKey); if (previous?.isConnected) previous.focus() }
  }, [open])
  return ref
}
