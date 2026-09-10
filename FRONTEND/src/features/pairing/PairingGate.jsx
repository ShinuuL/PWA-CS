import { useState } from 'react'
import { usePairing } from './usePairing'
import GenerateCode from './GenerateCode'
import EnterCode from './EnterCode'
import './pairing.css'

export default function PairingGate({ children }) {
  const [showGenerate, setShowGenerate] = useState(false)
  const { pair, statusLoading, statusError, checkPairStatus } = usePairing()

  if (statusLoading) return <div className="loading">Verificando vínculo...</div>

  if (statusError && !pair) return (
    <div className="pairing-gate" role="alert">
      <p>Não foi possível verificar seu vínculo: {statusError}</p>
      <button className="toggle-button" onClick={() => { void checkPairStatus().catch(() => {}) }}>Tentar novamente</button>
    </div>
  )

  if (!pair) {
    return (
      <div className="pairing-gate">
        {showGenerate ? (
          <>
            <GenerateCode />
            <button className="toggle-button" onClick={() => setShowGenerate(false)}>
              Já tem um código? Digite-o
            </button>
          </>
        ) : (
          <>
            <EnterCode />
            <button className="toggle-button" onClick={() => setShowGenerate(true)}>
              Ainda não tem um código? Gere um
            </button>
          </>
        )}
      </div>
    )
  }

  return children
}
