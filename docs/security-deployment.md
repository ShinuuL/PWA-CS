# Implantação das correções de segurança

As mudanças foram verificadas localmente. Em 2026-09-09, a migração `20260908125710_security_identity_and_private_media.sql` foi aplicada ao projeto Supabase vinculado `mjoczzhxaqhkkmujchzm` e sua versão foi registrada no histórico remoto. As Edge Functions estão ativas, mas precisam ser republicadas com a configuração abaixo: o projeto remoto ainda reporta `verify_jwt=true` para os handlers de push e não possui o segredo interno necessário.

O projeto remoto ainda não possui as entradas Vault `project_url`/`push_internal_secret` nem o segredo Edge `PUSH_INTERNAL_SECRET`; por isso os dispatchers de push permanecem em modo fail-closed até o provisionamento desses valores. Execute comandos a partir de `FRONTEND/` com Supabase CLI 2.109.1 ou compatível.

## Contrato e segredos

| Local | Nome | Conteúdo |
| --- | --- | --- |
| Vault | `project_url` | URL HTTPS do projeto Supabase, sem `/functions/v1` |
| Vault | `push_internal_secret` | Segredo aleatório de pelo menos 32 bytes, exclusivo do push interno |
| Edge secrets | `PUSH_INTERNAL_SECRET` | Exatamente o mesmo valor de `push_internal_secret` |
| Edge secrets | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Par P-256 existente, em base64url ou par JWK exportado em JSON |
| Edge secrets | `VAPID_SUBJECT` | Contato VAPID (`mailto:` ou HTTPS) |

Preserve as chaves VAPID existentes: trocá-las invalida inscrições dos dispositivos. O frontend recebe somente a chave VAPID pública. Nunca coloque `PUSH_INTERNAL_SECRET`, chave VAPID privada ou service role em variáveis `VITE_*`.

Provisione `project_url` e `push_internal_secret` no painel Vault. Se já existirem, atualize as entradas existentes, mantendo nomes únicos. Provisione `PUSH_INTERNAL_SECRET` no painel Edge Function Secrets. Como alternativa para os segredos Edge, use um arquivo seguro já preparado, ignorado pelo Git:

```powershell
supabase.cmd secrets set --project-ref $env:SUPABASE_PROJECT_REF --env-file $env:COUPLESPACE_EDGE_SECRETS_FILE
```

As variáveis acima são caminhos/identificadores configurados pelo operador. Não imprima o conteúdo dos segredos nem os inclua no histórico de comandos. Segredos Spotify existentes continuam necessários: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_TOKEN_ENCRYPTION_KEY`.

## Ordem de implantação

1. Publique o frontend atualizado pelo procedimento em `docs/deploy.md`: ele lê mídia via Storage autenticado, inclusive URLs públicas antigas. Os buckets ainda públicos continuam compatíveis com esse leitor.
2. Provisione os segredos acima e confira o projeto de destino.
3. Republique os quatro handlers. Os dois handlers push exigem o segredo interno e recusam chamadas antigas com somente anon key; haverá uma breve pausa nas notificações até aplicar a configuração.

```powershell
supabase.cmd functions deploy spotify-auth spotify-playlist --project-ref $env:SUPABASE_PROJECT_REF
supabase.cmd functions deploy send-chat-push send-push-notification --project-ref $env:SUPABASE_PROJECT_REF --no-verify-jwt
```

`supabase/config.toml` registra `verify_jwt=false` somente para push. Isso permite que o gateway encaminhe chamadas `x-internal-secret` para a validação obrigatória no handler; não torna o envio anônimo. Spotify mantém JWT no gateway e valida usuário/vínculo no handler.

4. Para outros ambientes, faça backup e confira o histórico remoto antes de aplicar SQL. Há migrações legadas com versões de oito dígitos repetidas; não execute `db push` indiscriminadamente. A migração nova pressupõe que o schema legado usado pelo app já existe, incluindo `pg_net`, `pg_cron` e Vault.

```powershell
supabase.cmd link --project-ref $env:SUPABASE_PROJECT_REF
supabase.cmd migration list --linked
supabase.cmd db query --linked --file supabase/migrations/20260908125710_security_identity_and_private_media.sql
```

O arquivo contém `BEGIN`/`COMMIT` para aplicação atômica. Depois de sucesso, registre a versão `20260908125710` no histórico de migrações pelo procedimento de reconciliação adotado no projeto; `db query` não registra histórico automaticamente. Não reaplique o arquivo: políticas novas não são idempotentes.

5. Confirme que o cron `send-due-reminders` chama `public.dispatch_due_reminders()` a cada minuto. O trigger envia somente `{message_id}` e o dispatcher somente `{reminder_id}`; ambos usam `x-internal-secret`. Sem configuração de Vault eles deixam de despachar, sem expor conteúdo.

## Aceite no ambiente implantado

- Anônimo e JWT comum não enviam push nem alteram lembretes; membro A não acessa Spotify do casal B.
- Um chat e um lembrete vencido de contas de teste chegam ao dispositivo inscrito. O lembrete recebe status `sent`; ausência de inscrições produz `pending_send`.
- URLs públicas antigas de `chat-media` e `album-photos` deixam de entregar arquivos. Os dois parceiros carregam as mesmas mídias autenticados; conta externa não consegue baixá-las.
- Sair, entrar com outra conta e desfazer o vínculo eliminam o acesso local ao histórico anterior. Clientes antigos podem precisar atualizar o PWA.

Não restaure políticas permissivas ou buckets públicos como rollback. Em caso de falha de push, mantenha os controles de acesso e corrija segredos/configuração antes de reativar entrega.

## Verificação local reproduzível

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File supabase/tests/run-security.ps1
npm.cmd run test:run -- src/test/edgeSecurity.test.js src/test/vapid.test.js
```

O harness PostgreSQL usa tmpfs, sem portas publicadas ou volumes do banco real. Auth/Storage/Vault/cron/HTTP são simulados; as regras RLS, RPCs e duas corridas de transações são executadas no PostgreSQL 17. Os testes Edge executam handlers com adaptadores locais e importação WebCrypto real das chaves; não enviam notificações externas.

## Executar o frontend com Docker

Na pasta `FRONTEND/`, preencha `.env.local` e execute:

```powershell
docker compose --env-file .env.local up --build
```

O PWA ficará disponível em `http://127.0.0.1:18080` por padrão. Se essa porta estiver ocupada, defina `FRONTEND_HOST_PORT` antes de subir (por exemplo, `FRONTEND_HOST_PORT=8080 docker compose --env-file .env.local up --build`). O container serve apenas o frontend estático; Supabase e as Edge Functions continuam sendo serviços separados. Para encerrar, use `docker compose down`.

Fontes: [configuração individual de funções](https://supabase.com/docs/guides/functions/function-configuration), [segredos de funções](https://supabase.com/docs/guides/functions/secrets), [controle de acesso Storage](https://supabase.com/docs/guides/storage/security/access-control), [formato JWK de importVapidKeys](https://github.com/negrel/webpush/blob/master/vapid.ts).
