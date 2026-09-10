// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { authorizePair, requireInternal, readBody } from '../../supabase/functions/_shared/security.js'
import * as security from '../../supabase/functions/_shared/security.js'
import * as vapid from '../../supabase/functions/_shared/vapid.ts'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'

function loadHandler(name, createClient, fetch = vi.fn(), adapters = {}) {
  let handler
  const serve = (fn) => { handler = fn }
  const source = readFileSync(new URL(`../../supabase/functions/${name}/index.ts`, import.meta.url), 'utf8')
  runInNewContext(stripTypeScriptTypes(source.replace(/^import .*;\r?\n/gm, '')), {
    ...security, ...vapid, createClient, fetch, serve, Request, Response, URL, URLSearchParams, btoa, atob, crypto,
    console: { log() {}, error() {} },
    Deno: { serve, env: { get: (key) => key === 'PUSH_INTERNAL_SECRET' ? 'private-secret' : 'test-config' } },
    ...adapters,
  })
  return handler
}

const pairId = '11111111-1111-4111-8111-111111111111'
const request = (headers = {}, body = {}) => new Request('https://local.test', { method: 'POST', headers, body: JSON.stringify(body) })

describe('Edge authorization boundaries', () => {
  it('rejects missing bearer before constructing a client', async () => {
    const create = vi.fn()
    await expect(authorizePair(request(), pairId, create, () => '')).rejects.toMatchObject({ status: 401 })
    expect(create).not.toHaveBeenCalled()
  })
  it('verifies the token and denies a different couple before privileged access', async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { user_one: 'other', user_two: 'partner' } }) }
    const client = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'me' } } }) }, from: vi.fn(() => query) }
    const create = vi.fn(() => client)
    await expect(authorizePair(request({ Authorization: 'Bearer verified-token' }), pairId, create, () => 'public-key')).rejects.toMatchObject({ status: 403 })
    expect(client.auth.getUser).toHaveBeenCalledWith('verified-token')
    expect(client.from).toHaveBeenCalledExactlyOnceWith('pairs')
    expect(create).toHaveBeenCalledTimes(1)
  })
  it('allows either member only with a verified live user', async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: { user_one: 'partner', user_two: 'me' } }) }
    const create = () => ({ auth: { getUser: async () => ({ data: { user: { id: 'me' } } }) }, from: () => query })
    await expect(authorizePair(request({ authorization: 'Bearer valid' }), pairId, create, () => 'public')).resolves.toMatchObject({ id: 'me' })
  })
  it.each([undefined, '', 'wrong', 'public-anon-key'])('rejects internal caller secret %s', (secret) => {
    expect(() => requireInternal(request(secret ? { 'x-internal-secret': secret } : {}), 'a-long-private-secret')).toThrow()
  })
  it('fails closed when internal secret is unconfigured', () => {
    expect(() => requireInternal(request(), undefined)).toThrow()
  })
  it('accepts the configured internal caller', () => {
    expect(() => requireInternal(request({ 'x-internal-secret': 'a-long-private-secret' }), 'a-long-private-secret')).not.toThrow()
  })
  it('rejects malformed JSON as a client error', async () => {
    await expect(readBody(new Request('https://local.test', { method: 'POST', body: '{' }))).rejects.toMatchObject({ status: 400 })
  })
})

describe('actual Edge handlers with isolated service adapters', () => {
  it.each([
    ['send-chat-push', 'base64url'], ['send-push-notification', 'base64url'],
    ['send-chat-push', 'jwk'], ['send-push-notification', 'jwk'],
  ])('%s delivers the saved content with %s VAPID keys', async (name, format) => {
    const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
    const publicBytes = await crypto.subtle.exportKey('raw', keys.publicKey)
    const privateJwk = await crypto.subtle.exportKey('jwk', keys.privateKey)
    const env = { PUSH_INTERNAL_SECRET: 'private-secret', VAPID_PUBLIC_KEY: Buffer.from(publicBytes).toString('base64url'), VAPID_PRIVATE_KEY: privateJwk.d }
    if (format === 'jwk') {
      env.VAPID_PUBLIC_KEY = ''
      env.VAPID_PRIVATE_KEY = JSON.stringify({ publicKey: await crypto.subtle.exportKey('jwk', keys.publicKey), privateKey: privateJwk })
    }
    const pushTextMessage = vi.fn().mockResolvedValue(undefined)
    const importVapidKeys = async ({ publicKey, privateKey }) => ({
      publicKey: await crypto.subtle.importKey('jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']),
      privateKey: await crypto.subtle.importKey('jwk', privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']),
    })
    const ApplicationServer = { new: vi.fn(async (options) => {
      if (options.crypto) expect(typeof options.crypto.generateKey).toBe('function')
      return { subscribe: () => ({ pushTextMessage }) }
    }) }
    const updates = []
    const records = {
      messages: { pair_id: pairId, sender_id: 'a', content: 'Saved chat' },
      shared_reminders: { pair_id: pairId, created_by: 'a', title: 'Saved reminder', status: 'pending', reminder_at: '2020-01-01T00:00:00Z', completed_at: null },
      pairs: { user_one: 'a', user_two: 'b' }, profiles: { display_name: 'A' },
      push_subscriptions: [{ user_id: 'b', endpoint: 'https://push.invalid', p256dh: 'test', auth: 'test' }],
    }
    const from = (table) => ({ select() { return this }, eq() { return this }, in() { return this }, update(value) { updates.push([table, value]); return this },
      maybeSingle: async () => ({ data: records[table] }), single: async () => ({ data: records[table] }), then(resolve) { resolve({ data: records[table] }) } })
    const handler = loadHandler(name, () => ({ from }), vi.fn(), {
      webpush: { importVapidKeys, ApplicationServer }, importVapidKeys, ApplicationServer,
      Deno: { serve: () => {}, env: { get: (key) => env[key] || 'test-config' } },
    })
    const response = await handler(request({ 'x-internal-secret': 'private-secret' }, { message_id: pairId, reminder_id: pairId, title: 'Forged', message_text: 'Forged' }))
    expect(response.status).toBe(200)
    expect(pushTextMessage).toHaveBeenCalledTimes(1)
    expect(JSON.parse(pushTextMessage.mock.calls[0][0]).body).toBe(name === 'send-chat-push' ? 'Saved chat' : 'Saved reminder')
    if (name === 'send-push-notification') expect(updates).toEqual([['shared_reminders', { status: 'sent' }]])
  })
  it.each(['spotify-auth', 'spotify-playlist', 'send-chat-push', 'send-push-notification'])('%s denies anonymous requests with no service or provider calls', async (name) => {
    const create = vi.fn()
    const fetch = vi.fn()
    const result = await loadHandler(name, create, fetch)(request({}, { pair_id: pairId, action: 'refresh', reminder_id: pairId }))
    expect(result.status).toBe(401)
    expect(create).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each(['spotify-auth', 'spotify-playlist'])('%s rejects another pair before service role or Spotify', async (name) => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: async () => ({ data: null }) }
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'a' } } }) }, from: vi.fn(() => query) }
    const create = vi.fn(() => client)
    const fetch = vi.fn()
    const result = await loadHandler(name, create, fetch)(request({ authorization: 'Bearer user-a' }, { pair_id: pairId, action: 'refresh' }))
    expect(result.status).toBe(403)
    expect(create).toHaveBeenCalledTimes(1)
    expect(client.from).toHaveBeenCalledExactlyOnceWith('pairs')
    expect(fetch).not.toHaveBeenCalled()
  })
  it.each(['send-chat-push', 'send-push-notification'])('%s rejects an ordinary JWT as internal authorization', async (name) => {
    const create = vi.fn()
    const result = await loadHandler(name, create)(request({ authorization: 'Bearer valid-user' }, { reminder_id: pairId, message_id: pairId }))
    expect(result.status).toBe(401)
    expect(create).not.toHaveBeenCalled()
  })
  it('refuses an inconsistent message sender before subscriptions or delivery', async () => {
    const from = vi.fn((table) => ({ select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: table === 'messages' ? { pair_id: pairId, sender_id: 'outsider' } : { user_one: 'a', user_two: 'b' } }) }))
    const result = await loadHandler('send-chat-push', () => ({ from }))(request({ 'x-internal-secret': 'private-secret' }, { message_id: pairId }))
    expect(result.status).toBe(403)
    expect(from.mock.calls.map(([table]) => table)).toEqual(['messages', 'pairs'])
  })
  it('refuses an already sent reminder without changing status', async () => {
    const from = vi.fn(() => ({ select() { return this }, eq() { return this }, maybeSingle: async () => ({ data: { status: 'sent' } }) }))
    const result = await loadHandler('send-push-notification', () => ({ from }))(request({ 'x-internal-secret': 'private-secret' }, { reminder_id: pairId }))
    expect(result.status).toBe(409)
    expect(from).toHaveBeenCalledExactlyOnceWith('shared_reminders')
  })
  it('does not call Spotify when refresh-token decryption fails', async () => {
    const query = (data) => ({ select() { return this }, eq() { return this }, maybeSingle: async () => ({ data }), single: async () => ({ data }) })
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'a' } } }) }, from: (table) => query(table === 'pairs' ? { user_one: 'a', user_two: 'b' } : { refresh_token: 'ciphertext' }), rpc: async () => ({ error: new Error('decrypt failed'), data: null }) }
    const fetch = vi.fn(async () => new Response('{}'))
    const result = await loadHandler('spotify-auth', () => client, fetch)(request({ authorization: 'Bearer a' }, { pair_id: pairId, action: 'refresh' }))
    expect(result.status).toBe(500)
    expect(fetch).not.toHaveBeenCalled()
  })
  it('derives chat recipient and pair from the saved message, ignoring forged payload fields', async () => {
    const filters = []
    const records = { messages: { pair_id: pairId, sender_id: 'a', content: 'saved' }, pairs: { user_one: 'a', user_two: 'b' }, profiles: { display_name: 'A' }, push_subscriptions: [] }
    const from = (table) => ({ select() { return this }, eq(key, value) { filters.push([table, key, value]); return this }, maybeSingle: async () => ({ data: records[table] }), then(resolve) { resolve({ data: records[table] }) } })
    const result = await loadHandler('send-chat-push', () => ({ from }))(request({ 'x-internal-secret': 'private-secret' }, { message_id: pairId, recipient_id: 'victim', message_text: 'forged' }))
    expect(result.status).toBe(200)
    expect(filters).toContainEqual(['push_subscriptions', 'user_id', 'b'])
    expect(filters).toContainEqual(['push_subscriptions', 'pair_id', pairId])
  })
  it('allows a legitimate member to refresh without exposing encrypted tokens', async () => {
    const query = (data) => ({ select() { return this }, eq() { return this }, update() { return this }, maybeSingle: async () => ({ data }), single: async () => ({ data }), then(resolve) { resolve({ data }) } })
    const client = { auth: { getUser: async () => ({ data: { user: { id: 'a' } } }) }, from: (table) => query(table === 'pairs' ? { user_one: 'a', user_two: 'b' } : { refresh_token: 'encrypted' }), rpc: async (name) => ({ data: name === 'decrypt_token' ? 'refresh-secret' : 'encrypted-new' }) }
    const fetch = vi.fn(async () => new Response(JSON.stringify({ access_token: 'fresh', expires_in: 3600 })))
    const result = await loadHandler('spotify-auth', () => client, fetch)(request({ authorization: 'Bearer a' }, { pair_id: pairId, action: 'refresh' }))
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ access_token: 'fresh', expires_in: 3600 })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
