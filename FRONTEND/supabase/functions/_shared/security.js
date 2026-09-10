export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export function requireUuid(value) {
  if (typeof value !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
    throw new HttpError(400, 'invalid_id')
  }
}

export async function readBody(req) {
  if (req.method !== 'POST') throw new HttpError(405, 'method_not_allowed')
  try {
    const body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error()
    return body
  } catch { throw new HttpError(400, 'invalid_json') }
}

export async function authorizePair(req, pairId, createClient, env) {
  const token = req.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1]
  if (!token) throw new HttpError(401, 'unauthorized')
  requireUuid(pairId)
  const client = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await client.auth.getUser(token)
  if (error || !data?.user) throw new HttpError(401, 'unauthorized')
  const { data: pair, error: pairError } = await client.from('pairs')
    .select('user_one,user_two').eq('id', pairId).maybeSingle()
  if (pairError) throw new HttpError(500, 'authorization_failed')
  if (!pair || !pair.user_two || ![pair.user_one, pair.user_two].includes(data.user.id)) {
    throw new HttpError(403, 'forbidden')
  }
  return data.user
}

export function requireInternal(req, secret) {
  const supplied = req.headers.get('x-internal-secret')
  if (!secret || !supplied) throw new HttpError(401, 'unauthorized')
  let difference = supplied.length ^ secret.length
  for (let i = 0; i < secret.length; i++) difference |= secret.charCodeAt(i) ^ (supplied.charCodeAt(i) || 0)
  if (difference) throw new HttpError(403, 'forbidden')
}

export function errorResponse(error, headers) {
  return new Response(JSON.stringify({ error: error instanceof HttpError ? error.message : 'internal_error' }), {
    status: error instanceof HttpError ? error.status : 500,
    headers: { ...headers, 'Content-Type': 'application/json' },
  })
}
