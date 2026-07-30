import { useState, useEffect } from 'react'
import { HexColorPicker } from 'react-colorful'
import './ColorPicker.css'

export default function ColorPicker({ value, onChange }) {
  const [hexInput, setHexInput] = useState(value || '#B87CFF')

  useEffect(() => {
    setHexInput(value || '#B87CFF')
  }, [value])

  const handleHexChange = (e) => {
    const raw = e.target.value
    setHexInput(raw)

    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    if (hexRegex.test(raw)) {
      onChange(raw)
    }
  }

  const handleHexBlur = () => {
    const hexRegex = /^#[0-9A-Fa-f]{6}$/
    if (!hexRegex.test(hexInput)) {
      setHexInput(value || '#B87CFF')
    }
  }

  return (
    <div className="color-picker">
      <HexColorPicker color={value || '#B87CFF'} onChange={onChange} />
      <input
        type="text"
        className="color-picker__hex"
        value={hexInput}
        onChange={handleHexChange}
        onBlur={handleHexBlur}
        maxLength={7}
        placeholder="#000000"
      />
    </div>
  )
}
