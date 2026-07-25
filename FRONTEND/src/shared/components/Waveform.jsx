import { useRef, useEffect, useCallback } from 'react'

function generateBars(count) {
  const bars = []
  for (let i = 0; i < count; i++) {
    const h = Math.abs(Math.sin(i * 0.8 + 0.5) * 0.7 + Math.sin(i * 1.3) * 0.3)
    bars.push(Math.max(0.1, h))
  }
  return bars
}

export function LiveWaveform({ waveformData, width = 200, height = 48, barWidth = 2, gap = 1, barColor = 'rgba(255,255,255,0.7)' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !waveformData) return

    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const barStep = barWidth + gap
    const barCount = Math.floor(width / barStep)
    const step = Math.max(1, Math.floor(waveformData.length / barCount))

    ctx.fillStyle = barColor

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.min(i * step, waveformData.length - 1)
      const value = waveformData[dataIndex] / 255
      const barHeight = Math.max(2, value * height)
      const x = i * barStep
      const y = (height - barHeight) / 2
      ctx.fillRect(x, y, barWidth, barHeight)
    }
  }, [waveformData, width, height, barWidth, gap, barColor])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
}

export function PlaybackWaveform({ audioRef, barCount = 40, width = 160, height = 40, barWidth = 2, gap = 1, barColor = 'rgba(184,124,255,0.4)', barPlayedColor = '#B87CFF' }) {
  const canvasRef = useRef(null)
  const barsRef = useRef(generateBars(barCount))
  const animRef = useRef(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const audio = audioRef?.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const bars = barsRef.current
    const barStep = barWidth + gap
    const progress = audio && audio.duration ? audio.currentTime / audio.duration : 0

    for (let i = 0; i < bars.length; i++) {
      const barHeight = Math.max(2, bars[i] * height)
      const x = i * barStep
      const y = (height - barHeight) / 2
      const barProgress = i / bars.length
      ctx.fillStyle = barProgress <= progress ? barPlayedColor : barColor
      ctx.fillRect(x, y, barWidth, barHeight)
    }
  }, [audioRef, width, height, barWidth, gap, barColor, barPlayedColor])

  useEffect(() => {
    let running = true

    const loop = () => {
      if (!running) return
      draw()
      animRef.current = requestAnimationFrame(loop)
    }

    loop()

    return () => {
      running = false
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <canvas
      ref={canvasRef}
      style={{ width, height, display: 'block' }}
    />
  )
}
