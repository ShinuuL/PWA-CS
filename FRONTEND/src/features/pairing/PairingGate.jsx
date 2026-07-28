import { useEffect, useState } from 'react'
import { usePairing } from './usePairing'
import GenerateCode from './GenerateCode'
import EnterCode from './EnterCode'
import './pairing.css'

export default function PairingGate({ children }) {
  const [isPaired, setIsPaired] = useState(null)
  const [showGenerate, setShowGenerate] = useState(false)
  const { checkPairStatus } = usePairing()

  useEffect(() => {
    checkPairStatus().then((pair) => {
      setIsPaired(!!pair)
    })
  }, [])

  if (isPaired === null) return <div className="loading">Checking pairing status...</div>

  if (!isPaired) {
    return (
      <div className="pairing-gate">
        {showGenerate ? (
          <>
            <GenerateCode />
            <button className="toggle-button" onClick={() => setShowGenerate(false)}>
              Have a code? Enter it
            </button>
          </>
        ) : (
          <>
            <EnterCode />
            <button className="toggle-button" onClick={() => setShowGenerate(true)}>
              Don't have a code? Generate one
            </button>
          </>
        )}
      </div>
    )
  }

  return children
}
