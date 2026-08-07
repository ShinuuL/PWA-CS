# Spotify Integration - Bugs Corrigidos (07/08/2026)

## Bug 1: 406 Not Acceptable no spotify_config (antes de autenticar)

**Sintoma:**
```
GET https://...supabase.co/rest/v1/spotify_config?select=*&pair_id=eq.xxx 406 (Not Acceptable)
```

**Causa:** `initializeSpotify` chamava `.single()` na tabela `spotify_config` antes do user conectar Spotify. Quando não existe row, o Supabase client v2 retorna 406 (content negotiation error).

**Correção:** Trocado `.single()` por `.maybeSingle()` + tratamento específico para `PGRST116` e 406:
```javascript
// Antes
const { data, error } = await supabase
  .from('spotify_config').select('*').eq('pair_id', pairId).single()
if (error && error.code !== 'PGRST116') throw error

// Depois
const { data, error } = await supabase
  .from('spotify_config').select('*').eq('pair_id', pairId).maybeSingle()
if (error) {
  if (error.code === 'PGRST116' || error.message?.includes('406')) {
    set({ isConnected: false, isLoading: false })
    return
  }
  throw error
}
```

**Arquivo:** `FRONTEND/src/stores/spotifyStore.js`

---

## Bug 2: `onSpotifyWebPlaybackSDKReady is not defined`

**Sintoma:**
```
spotify-player.js:3 Uncaught AnthemError: onSpotifyWebPlaybackSDKReady is not defined
```

**Causa:** O SDK do Spotify carrega e tenta chamar `window.onSpotifyWebPlaybackSDKReady` antes dele estar definido.

**Correção:** Definido callback vazio antes de carregar o script:
```javascript
const loadSpotifySDK = () => {
  return new Promise((resolve) => {
    if (window.Spotify) { resolve(window.Spotify); return }
    window.onSpotifyWebPlaybackSDKReady = () => {}
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    // ...
  })
}
```

**Arquivo:** `FRONTEND/src/features/spotify/useSpotifyPlayer.js`

---

## Bug 3: `fetchUserPlaylists` crashava - `Cannot read properties of undefined (reading 'total')`

**Sintoma:**
```
spotifyStore.js: fetchUserPlaylists error TypeError: Cannot read properties of undefined (reading 'total')
```

**Causa:** O filtro `.filter((pl) => pl && pl.tracks)` removia todas as playlists porque o campo `tracks` foi renomeado para `items` na API do Spotify (migração fevereiro/2026).

**Breaking Change da Spotify API:**
```javascript
// Antes ( Spotify)
playlist.tracks.total → 15

// Depois ( Spotify)
playlist.items?.total → 15
playlist.tracks → undefined
```

**Correção:**
```javascript
// Antes
const playlists = data.items?.filter((pl) => pl && pl.tracks).map((pl) => ({
  trackCount: pl.tracks.total,
}))

// Depois
const playlists = (data.items || [])
  .filter((pl) => pl && pl.id)
  .map((pl) => ({
    trackCount: pl.items?.total ?? pl.tracks?.total ?? 0,
  }))
```

**Arquivo:** `FRONTEND/src/stores/spotifyStore.js`

---

## Bug 4: Play 404 - No Active Device

**Sintoma:**
```
PUT https://api.spotify.com/v1/me/player/play 404 (Not Found)
```

**Causa:** `togglePlay` não enviava `device_id` no body da requisição. A API do Spotify requer um device ativo — quando nenhum device está conectado, retorna 404.

**Correção:** Enviar `device_ids` (array) no body:
```javascript
// Antes
await fetch(url, {
  method: 'PUT',
  headers: { Authorization: `Bearer ${freshToken}` },
})

// Depois
const body = deviceId ? JSON.stringify({ device_ids: [deviceId] } : undefined
await fetch(url, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${freshToken}`,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  },
  body,
})
```

**Nota:** A API do Spotify usa `device_ids` (plural, array), não `device_id` (singular, string). Isso foi corrigido em `togglePlay`, `playUri` e `playRandom`.

**Arquivo:** `FRONTEND/src/stores/spotifyStore.js`

---

## Bug 5: Scopes OAuth incompletos

**Sintoma:** SDK check_scope retorna 403, possíveis erros de permissão.

**Correção:** Adicionados scopes `user-read-email` e `user-read-private` ao OAuth flow:
```javascript
scope: [
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'streaming',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-email',      // novo
  'user-read-private',    // novo
].join(' '),
```

**Nota:** Após essa mudança, o user precisa **desconectar e reconectar** o Spotify para obter token com os novos scopes.

**Arquivo:** `FRONTEND/src/features/spotify/useSpotifyAuth.js`

---

## Nota sobre o 403 no `check_scope`

```
api.spotify.com/v1/melody/v1/check_scope?scope=web-playback:1  403
```

Esse 403 é **normal para apps de terceiros**. O endpoint `web-playback` scope é reservado para apps oficiais do Spotify. O SDK continua funcionando para playback — é apenas um check interno que falha. Não é um bug.

---

## Logs Adicionados

Logs de debug foram adicionados para facilitar diagnóstico futuro:

- **Edge Function `spotify-playlist`:** Loga request, config query, decrypt result, Spotify API status, tracks por página, erros com stack trace
- **`spotifyStore.js`:** Loga initializeSpotify, sessionStorage check, refreshTokenIfNeeded, fetchUserPlaylists, fetchPlaylist, setAccessToken

Para ver os logs da Edge Function: Supabase Dashboard → Edge Functions → Logs
Para ver os logs do frontend: Console do navegador (DevTools)
