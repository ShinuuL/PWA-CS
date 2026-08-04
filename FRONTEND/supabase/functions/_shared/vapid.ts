export function normalizeVapidKeyPair(publicKey: string | undefined, privateKey: string | undefined) {
  const normalizedPublicKey = (publicKey || '').trim()
  const normalizedPrivateKey = (privateKey || '').trim()

  if (!normalizedPublicKey && !normalizedPrivateKey) {
    throw new Error('Missing VAPID public/private keys')
  }

  const parseJsonObject = (value: string) => {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }

  const parsedJson = parseJsonObject(normalizedPublicKey) || parseJsonObject(normalizedPrivateKey)
  const parsedPublic = parsedJson?.publicKey || parsedJson?.public_key || parsedJson?.public || null
  const parsedPrivate = parsedJson?.privateKey || parsedJson?.private_key || parsedJson?.private || null

  if (parsedPublic && parsedPrivate) {
    return { publicKey: parsedPublic, privateKey: parsedPrivate }
  }

  if (!normalizedPublicKey || !normalizedPrivateKey) {
    throw new Error('Missing VAPID public/private keys')
  }

  return { publicKey: normalizedPublicKey, privateKey: normalizedPrivateKey }
}
