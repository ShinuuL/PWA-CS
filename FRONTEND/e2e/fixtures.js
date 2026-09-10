export async function mockSignedIn(page) {
  const user = { id: '11111111-1111-4111-8111-111111111111', email: 'teste@example.test', aud: 'authenticated', role: 'authenticated', user_metadata: {} }
  const projectRef = (process.env.VITE_SUPABASE_URL || 'https://mjoczzhxaqhkkmujchzm.supabase.co').match(/^https?:\/\/([^.]+)/)?.[1]
  const exp = Math.floor(Date.now() / 1000) + 3600
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url')
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, role: 'authenticated', exp })}.test-signature`
  const session = { access_token: token, refresh_token: 'test-only', token_type: 'bearer', expires_at: exp, expires_in: 3600, user }
  await page.addInitScript(({ user, projectRef }) => {
    const exp = Math.floor(Date.now() / 1000) + 3600
    const token = `${btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${btoa(JSON.stringify({ sub: user.id, role: 'authenticated', exp }))}.test-signature`
    const session = JSON.stringify({ access_token: token, refresh_token: 'test-only', token_type: 'bearer', expires_at: exp, expires_in: 3600, user })
    for (const key of new Set(['sb-127-auth-token', `sb-${projectRef}-auth-token`])) {
      localStorage.setItem(key, session)
    }
  }, { user, projectRef })
  await page.route('**/auth/v1/**', async route => {
    const url = new URL(route.request().url())
    let body = {}
    if (url.pathname.endsWith('/session')) body = session
    if (url.pathname.endsWith('/user')) body = user
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
  await page.route('**/rest/v1/**', async route => {
    const url = new URL(route.request().url())
    let body = {}
    if (url.pathname.endsWith('/pairs')) body = null
    if (url.pathname.endsWith('/profiles')) body = { id: user.id, display_name: 'Pessoa de teste', email: user.email }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  })
}
