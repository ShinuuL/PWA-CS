# CoupleSpace (PWA CS)

PWA mobile-first para casais: um espaço compartilhado com chat, memórias, agenda e música.

## Stack

- **React 19** + **Vite 8** (JavaScript, sem TypeScript)
- **Zustand 5** — gerenciamento de estado
- **React Router v7** — rotas
- **vite-plugin-pwa 1.3** — service worker via Workbox (`autoUpdate`)
- **@supabase/supabase-js 2.x** — Postgres, Auth, Storage e Edge Functions (Deno)
- **Spotify Web Playback SDK** (carregado em runtime) + **Web API OAuth** via Edge Functions `spotify-auth` / `spotify-playlist`
- **date-fns** — utilitários de data
- **react-hot-toast** — notificações na UI

## Funcionalidades

- **Dashboard** — visão geral do casal
- **Chat** — mensagens entre o casal com notificações push (Web Push/VAPID)
- **Álbum** — memórias em fotos (upload via Supabase Storage)
- **Agenda** — eventos e datas importantes
- **Spotify** — player integrado (Web Playback SDK), busca de faixas e gerenciamento de playlist compartilhada
- **Pairing** — vinculação entre os dois membros do casal
- **Perfil** e **Configurações**

## Instalação

```bash
cd FRONTEND
npm install
```

Crie um arquivo `.env.local` na raiz de `FRONTEND/` com as variáveis:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_SPOTIFY_REDIRECT_URI=http://127.0.0.1:5173/spotify/callback
```

Os segredos das Edge Functions (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_TOKEN_ENCRYPTION_KEY`) são configurados no Supabase via `npx supabase secrets set`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento Vite |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm test` | Testes com vitest (watch) |
| `npm run test:run` | Testes com vitest (execução única) |
| `npm run test:coverage` | Cobertura de testes |
| `npm run lint` | Lint com oxlint |

## Estrutura

```
src/
├── features/        # Módulos por domínio (agenda, album, auth, chat,
│                    # dashboard, pairing, profile, settings, spotify)
├── shared/          # Libs compartilhadas (supabase, push)
├── stores/          # Stores Zustand
├── hooks/           # Hooks reutilizáveis
└── assets/

supabase/
├── migrations/      # 21 migrações SQL
└── functions/       # Edge Functions Deno (send-chat-push,
                     # send-push-notification, spotify-auth, spotify-playlist)
```

## Deploy

O service worker é configurado com `registerType: 'autoUpdate'`: quando uma nova versão é publicada, o PWA atualiza sozinho na próxima visita/carregamento — não é necessário o usuário limpar cache ou reinstalar.
