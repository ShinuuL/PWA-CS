# CoupleSpace — auditoria e tarefas de refatoração

Data: 2026-09-08. Escopo autorizado: verificar o projeto com subagentes para preparar a refatoração de segurança, bugs e design.

## Resultado e limites

Auditoria estática das 21 migrações, funções, autenticação e fluxos da interface, com três subagentes especializados e revisão do coordenador. Achados abaixo são confirmados no código local. Em 2026-09-09, a migração de segurança foi aplicada ao projeto Supabase vinculado e os buckets, políticas e cron principais foram conferidos por leitura; as Edge Functions e os segredos internos ainda não foram publicados/provisionados. Nenhuma requisição de ataque foi dirigida ao ambiente publicado.

A URL e a chave pública do Supabase são parte do cliente. O objetivo é impedir operações não autorizadas mesmo com requisições modificadas. Não foi identificada área administrativa nas rotas, menu e configurações examinados. O relatório de problemas é uma função normal de suporte.

Strix: comando não encontrado e não foi instalada. A análise ofensiva foi substituída por revisão estática e harnesses locais; nenhuma requisição de ataque foi dirigida ao ambiente publicado. Docker e Playwright ficaram disponíveis depois para validação isolada, incluindo inspeção de DOM/CSS e screenshots em quatro cenários mobile.

O grafo existente foi consultado como mapa da arquitetura; associa isolamento por RLS ao modelo Supabase e ao identificador do casal. As conclusões de segurança foram conferidas nos arquivos atuais, não inferidas do grafo.

## Verificações executadas

- `npm.cmd run lint`: exit 0, sem avisos.
- `npm.cmd run test:run`: exit 0, 11 arquivos e 88 testes passaram, incluindo recuperação de autenticação, mídia privada, isolamento de stores, busca Spotify e funções Edge.
- `npm.cmd run build`: exit 0, incluindo geração do service worker e divisão por rotas.
- `npx.cmd playwright test` (servidor Vite externo): exit 0, quatro cenários mobile passaram; foram anexados DOM/CSS e screenshots aos resultados do Playwright.
- `supabase/tests/run-security.ps1`: exit 0 em PostgreSQL 17 isolado; a regressão legada foi reproduzida antes da migração e os cenários protegidos passaram depois.
- Rodada adicional de UI: formulários receberam labels associados, modais receberam semântica de diálogo, controles flutuantes ganharam nomes acessíveis e o cabeçalho deixou de acessar perfil nulo durante a troca de estado.
- O comando `npm` pelo PowerShell foi bloqueado pela política de execução; `npm.cmd` funcionou sem modificar a política do sistema.
- Alterações preexistentes preservadas: `FRONTEND/README.md` modificado e `README.md` não rastreado.

## Tarefas — segurança primeiro

As correções abaixo foram aplicadas localmente. P1 indica prioridade; não representa exploração confirmada no ambiente publicado.

### SEC-01 — vincular RPCs de pareamento à identidade autenticada (P1)

Evidência: `FRONTEND/supabase/migrations/001_initial_schema.sql:83` e `:98`. `create_invite_code` e `consume_invite_code` recebem `p_user_id`, executam como `SECURITY DEFINER` e não conferem `auth.uid()`. Não há redefinição ou revogação posterior nas migrações examinadas. Um chamador com acesso à RPC e UUID de usuário elegível pode agir em nome dele; acesso anônimo depende dos grants efetivos.

- [x] Derivar identidade da sessão, rejeitar anônimo, restringir EXECUTE e definir search_path seguro.
- [x] Aceite: anônimo e A passando ID de B não criam nem alteram vínculo; fluxo legítimo funciona.

### SEC-02 — impedir substituição direta dos membros do casal (P1)

Evidência: `001_initial_schema.sql:40-43`. INSERT exige apenas que o autor ocupe `user_one`; UPDATE permite alteração enquanto ele continuar em um dos slots. Isso permite escolher outro membro sem convite, sujeito às constraints. Substituir um membro de um par existente concede ao novo membro acesso ao histórico desse pair_id.

- [x] Restringir escrita direta de membros/estado e centralizar transições autorizadas em RPCs.
- [x] Aceite: INSERT com parceiro escolhido e PATCH dos slots/code_used são negados; aceitar convite não permite adquirir histórico por substituição de membro.
- [x] Definir explicitamente a política de histórico após desvinculação antes de implementar mudanças nesse comportamento.

### SEC-03 — proteger mídia privada (P1)

Evidência: `20260725_extend_messages_for_media.sql:20` e `20260725_create_album_photos.sql:52` criam chat-media e album-photos como públicos. `src/stores/chatStore.js:309`, `:392` e `albumStore.js:135` geram URLs públicas. Quem possui uma URL consegue baixar o objeto sem a proteção de leitura do RLS.

- [x] Migrar esses buckets para privados e adaptar exibição/upload para acesso autenticado ou URLs temporárias.
- [x] Aceite: URLs públicas antigas deixam de funcionar sem sessão; outro casal não consegue obter mídia; membros válidos carregam imagens e áudio. URLs assinadas continuam compartilháveis até expirar, portanto definir prazo e revogação esperada.
- [x] Adaptar cache do service worker e testar mídia offline/troca de conta antes de ativar a mudança.

### SEC-04 — impedir inscrição push em nome de terceiros (P1)

Evidência: `20260729_add_status_and_push_subscriptions.sql:34-41` valida pair_id, mas não exige user_id igual ao usuário autenticado. `functions/send-chat-push/index.ts:95-98` seleciona destinatários só por user_id. Um atacante em casal válido pode cadastrar seu endpoint com UUID de outra pessoa e receber prévias dela. A constraint UNIQUE(user_id) de `20260804_dedup_push_subscriptions.sql:14` limita o cenário a vítima sem inscrição existente.

- [x] Vincular escrita ao proprietário e garantir coerência usuário/casal na entrega.
- [x] Aceite: usuário A não inscreve endpoint com user_id C; mensagens de C jamais são enviadas ao endpoint de A.

### SEC-05 — autorizar operações Spotify antes de usar service role (P1)

Evidência: `functions/spotify-auth/index.ts:16-20`, `:91-107`, `:169-171`; `spotify-playlist/index.ts:47-52`, `:88`, `:134-166`. As funções recebem pair_id e usam credenciais privilegiadas sem validar identidade/vínculo no handler. Refresh devolve access token do casal indicado; exchange sobrescreve sua configuração. A função de playlist também lê/modifica playlists. Reachability e exigência JWT no gateway não foram verificadas; validar JWT no gateway não basta para autorizar o casal.

- [x] Autenticar chamador e verificar participação no casal antes de decriptar, chamar Spotify ou gravar dados.
- [x] Aceite: token A + pair_id B retorna 403, com zero chamadas externas e zero mudanças; membro legítimo mantém integração funcional.

### SEC-06 — restringir funções de push e lembretes (P1)

Evidência: `functions/send-chat-push/index.ts:79-91` aceita destinatário, remetente e texto do cliente; `send-push-notification/index.ts:37-69` aceita IDs e pode atualizar lembrete sem conferir que pertence ao casal. Ambas usam service role sem autorização no handler.

- [x] Definir autenticação própria para chamadas internas de trigger/cron; derivar destinatário e conteúdo de registros autorizados. Para chamadas de usuário, validar sessão e vínculo.
- [x] Aceite: anônimo, usuário externo e IDs inconsistentes falham antes de enviar push ou alterar status; cron/trigger legítimos continuam funcionando.

### SEC-07 — limpar credenciais e inscrições na troca de conta (P1/P2)

Evidência: `src/stores/authStore.js:62-65` limpa apenas autenticação; `spotifyStore.js:55-61` reutiliza token global do sessionStorage; `HomePage.jsx:32-34` preserva estado Spotify. Logout também não cancela inscrição push (`shared/lib/pushSubscription.js:185`). O cache global de storage em `vite.config.js:37-39` merece teste de retenção.

- [x] Limpar estado e token Spotify local, invalidar operações antigas e cancelar somente a inscrição push do dispositivo antes do logout; reinicializar controle de inscrição.
- [x] Não usar disconnect remoto para limpeza local, pois isso exclui configuração compartilhada.
- [x] Aceite: A sai e B entra na mesma aba: nenhuma requisição de B usa token de A; push privado de A não aparece após sair. Testar cache offline separadamente.

### SEC-08 — tornar consumo de convite atômico (P2)

Evidência: `001_initial_schema.sql:105-111` lê convite disponível sem bloqueio e atualiza só por ID. Dois consumidores concorrentes podem receber sucesso e o segundo substituir o primeiro.

- [x] Usar bloqueio e revalidação ou UPDATE condicional, garantindo vínculo ativo único entre ambos os slots.
- [x] Aceite: duas tentativas simultâneas produzem exatamente um sucesso e preservam o primeiro membro aceito.

## Tarefas — bugs e experiência

- [x] **BUG-01 — atualizar vínculo sem reload.** Estado de pareamento compartilhado, polling/foco e limpeza de sessão.
- [x] **BUG-02 — recuperar falha OAuth.** Callback inválido/cancelado apresenta mensagem, timeout e nova tentativa; destino interno é preservado.
- [x] **BUG-03 — não simular sucesso ao desvincular.** Erros ficam visíveis e o estado só é limpo após sucesso.
- [x] **BUG-04 — tratar rota desconhecida.** Rota wildcard oferece recuperação para Início.
- [x] **UX-01 — teclado e leitores de tela.** Foco, Escape, retorno ao gatilho e nomes acessíveis foram validados com Playwright.
- [x] **UX-02 — notificações compreensíveis.** Erros, switches e alvos de toque foram ajustados.
- [x] **DES-01 — direção visual e idioma.** Login, navegação e configurações receberam a primeira rodada responsiva em português; a referência visual continua disponível para iterações futuras.
- [x] **PERF-01 — dividir carregamento por rotas.** Páginas autenticadas foram lazy-loaded e o cache global de Storage removido.
- [x] **QA-01 — cobertura real.** Cenários de autenticação, mídia, isolamento de stores, Edge Functions, RLS e concorrência foram adicionados.

## Ordem de execução proposta

1. Preparar ambiente de teste com dois casais fictícios e comparar migrations/grants/policies/buckets/funções implantados por acesso administrativo somente leitura.
2. SEC-01, SEC-02 e SEC-08 juntos, por compartilharem a transição de pareamento; SEC-04 e SEC-06 juntos para fluxo push; SEC-05 para Spotify.
3. SEC-03 e SEC-07 com testes de mídia, cache e dispositivo compartilhado.
4. BUG-01 a BUG-04; UX-01/02; protótipo e aprovação visual de DES-01; PERF-01 conforme medição.
5. Executar Strix em ambiente isolado quando CLI/Docker/provedor estiverem preparados, com alvos e contas de teste delimitados. Revisar manualmente achados antes de convertê-los em correções.

Não é necessário comprar domínio para corrigir segurança. O vercel.app pode continuar hospedando o frontend. Branding/verificação no Google e domínio próprio de autenticação são tarefas de apresentação/configuração externa separadas.

## Evitar falsos positivos

- Falta de WITH CHECK isoladamente não prova vulnerabilidade: PostgreSQL reutiliza USING. Em pairs o problema é o predicado permissivo.
- A autorização entre casais de mark_messages_read foi corrigida em `20260728_fix_security_and_profiles_rls.sql:9-15`; não reportar a versão antiga como atual.
- URL/chave pública visível não equivale a acesso administrativo. Decrypt RPC exigir chave não demonstra exposição dessa chave.
- Não concluir segurança de produção porque build ou testes unitários passaram.

Referências: [segurança da API](https://supabase.com/docs/guides/api/securing-your-api), [buckets públicos](https://supabase.com/docs/guides/storage/buckets/fundamentals), [funções e permissões](https://supabase.com/docs/guides/database/functions), [CREATE POLICY](https://www.postgresql.org/docs/current/sql-createpolicy.html), [Strix oficial](https://github.com/usestrix/strix).
