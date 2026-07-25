import { useState } from 'react'
import { usePairing } from './usePairing'

export default function EnterCode() {
  const [inputCode, setInputCode] = useState('')
  const { consumeCode, loading, error } = usePairing()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (inputCode.length !== 6) return

    const result = await consumeCode(inputCode)
    if (result?.success) {
      window.location.href = '/home'
    }
  }

  return (
    <div className="pairing-page">
      <h2>Enter Invite Code</h2>
      <p>Enter the code your partner shared with you</p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className="code-input"
          maxLength={6}
        />
        <button
          type="submit"
          disabled={loading || inputCode.length !== 6}
          className="connect-button"
        >
          {loading ? 'Connecting...' : 'Connect'}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  )
}
