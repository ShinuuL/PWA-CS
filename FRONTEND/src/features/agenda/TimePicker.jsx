import { useRef, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import './TimePicker.css'

const ITEM_HEIGHT = 40

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}))

const MINUTES = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0')
}))

function WheelColumn({ items, selected, onSelect, label }) {
  const containerRef = useRef(null)
  const isScrolling = useRef(false)
  const scrollTimeout = useRef(null)

  const scrollToIndex = useCallback((index, smooth = true) => {
    const container = containerRef.current
    if (!container) return
    const offset = index * ITEM_HEIGHT
    container.scrollTo({
      top: offset,
      behavior: smooth ? 'smooth' : 'instant'
    })
  }, [])

  useEffect(() => {
    const idx = items.findIndex(item => item.value === selected)
    if (idx >= 0) {
      scrollToIndex(idx, false)
    }
  }, [selected, items, scrollToIndex])

  const handleScroll = useCallback(() => {
    if (isScrolling.current) return

    if (scrollTimeout.current) clearTimeout(scrollTimeout.current)

    scrollTimeout.current = setTimeout(() => {
      const container = containerRef.current
      if (!container) return

      const scrollTop = container.scrollTop
      const index = Math.round(scrollTop / ITEM_HEIGHT)
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1))

      if (items[clampedIndex]?.value !== selected) {
        onSelect(items[clampedIndex].value)
      }

      const targetScroll = clampedIndex * ITEM_HEIGHT
      if (Math.abs(scrollTop - targetScroll) > 1) {
        isScrolling.current = true
        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        })
        setTimeout(() => { isScrolling.current = false }, 300)
      }
    }, 80)
  }, [items, selected, onSelect])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const delta = Math.sign(e.deltaY) * ITEM_HEIGHT
    const newScroll = Math.max(0, Math.min(
      container.scrollTop + delta,
      (items.length - 1) * ITEM_HEIGHT
    ))
    container.scrollTo({ top: newScroll, behavior: 'smooth' })
  }, [items.length])

  const handleTouchStart = useCallback(() => {
    isScrolling.current = false
  }, [])

  return (
    <div className="time-picker__column">
      <span className="time-picker__column-label">{label}</span>
      <div className="time-picker__highlight" />
      <div
        ref={containerRef}
        className="time-picker__items"
        onScroll={handleScroll}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
      >
        <div className="time-picker__spacer" />
        {items.map(item => (
          <motion.div
            key={item.value}
            className={`time-picker__item ${item.value === selected ? 'time-picker__item--selected' : ''}`}
            onClick={() => {
              isScrolling.current = true
              onSelect(item.value)
              const idx = items.findIndex(i => i.value === item.value)
              scrollToIndex(idx, true)
              setTimeout(() => { isScrolling.current = false }, 300)
            }}
            whileTap={{ scale: 0.95 }}
          >
            {item.label}
          </motion.div>
        ))}
        <div className="time-picker__spacer" />
      </div>
    </div>
  )
}

export default function TimePicker({ value = { hour: '09', minute: '00' }, onChange }) {
  const handleHourChange = useCallback((newHour) => {
    onChange({ ...value, hour: newHour })
  }, [value, onChange])

  const handleMinuteChange = useCallback((newMinute) => {
    onChange({ ...value, minute: newMinute })
  }, [value, onChange])

  return (
    <div className="time-picker">
      <WheelColumn
        items={HOURS}
        selected={value.hour}
        onSelect={handleHourChange}
        label="Hora"
      />
      <div className="time-picker__separator">:</div>
      <WheelColumn
        items={MINUTES}
        selected={value.minute}
        onSelect={handleMinuteChange}
        label="Min"
      />
    </div>
  )
}
