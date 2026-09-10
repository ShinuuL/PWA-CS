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

// @negrel/webpush imports JWK, while browser applicationServerKey uses base64url.
export function vapidKeysToJwk(publicKey: string | undefined, privateKey: string | undefined) {
  const normalized = normalizeVapidKeyPair(publicKey, privateKey)
  if (typeof normalized.publicKey === 'object' && typeof normalized.privateKey === 'object') {
    return normalized
  }
  const decode = (value: string) => {
    if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+={0,2}$/.test(value)) throw new Error('Invalid VAPID key encoding')
    const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    return Uint8Array.from(atob(base64 + '='.repeat((4 - base64.length % 4) % 4)), c => c.charCodeAt(0))
  }
  const encode = (value: Uint8Array) => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const publicBytes = decode(normalized.publicKey)
  const privateBytes = decode(normalized.privateKey)
  if (publicBytes.length !== 65 || publicBytes[0] !== 4 || privateBytes.length !== 32) throw new Error('Invalid VAPID P-256 key length or format')
  const common = { kty: 'EC', crv: 'P-256', x: encode(publicBytes.slice(1, 33)), y: encode(publicBytes.slice(33)), ext: true }
  return {
    publicKey: { ...common, key_ops: ['verify'] },
    privateKey: { ...common, d: encode(privateBytes), key_ops: ['sign'] },
  }
}
