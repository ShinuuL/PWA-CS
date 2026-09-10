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
      <h2>Convide seu par</h2>
      <p>Compartilhe este código para conectar vocês</p>

      {code ? (
        <div className="invite-code">
          <span className="code">{code}</span>
          <p className="code-hint">Use este código uma única vez para conectar</p>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={loading} className="generate-button">
          {loading ? 'Gerando…' : 'Gerar código de convite'}
        </button>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  )
}
