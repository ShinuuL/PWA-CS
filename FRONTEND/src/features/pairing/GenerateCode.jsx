import { useState } from 'react'
import { usePairing } from './usePairing'

export default function GenerateCode() {
  const [code, setCode] = useState(null)
  const { generateCode, loading, error } = usePairing()

  const handleGenerate = async () => {
    const result = await generateCode()
    if (result) setCode(result.code)
  }

  return (
    <div className="pairing-page">
      <h2>Invite Your Partner</h2>
      <p>Share this code with your partner to connect</p>

      {code ? (
        <div className="invite-code">
          <span className="code">{code}</span>
          <p className="code-hint">This code expires in 24 hours</p>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={loading} className="generate-button">
          {loading ? 'Generating...' : 'Generate Invite Code'}
        </button>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
