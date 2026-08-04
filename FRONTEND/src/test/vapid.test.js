import { describe, expect, it } from 'vitest'
import { normalizeVapidKeyPair } from '../../supabase/functions/_shared/vapid'

describe('normalizeVapidKeyPair', () => {
  it('accepts exported VAPID keys from JSON', () => {
    const result = normalizeVapidKeyPair('', '{"publicKey":"pub123","privateKey":"priv123"}')

    expect(result).toEqual({
      publicKey: 'pub123',
      privateKey: 'priv123'
    })
  })

  it('accepts raw base64url VAPID keys', () => {
    const result = normalizeVapidKeyPair('pub456', 'priv456')

    expect(result).toEqual({
      publicKey: 'pub456',
      privateKey: 'priv456'
    })
  })

  it('throws when keys are missing', () => {
    expect(() => normalizeVapidKeyPair('', '')).toThrow('Missing VAPID public/private keys')
  })
})
