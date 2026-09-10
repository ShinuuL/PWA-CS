# Plano de implementação — segurança e experiência CoupleSpace

Spec: `docs/auditoria-refatoracao-2026-09-08.md`. Usuário autorizou aplicar correções, criar suporte Docker e instalar Playwright em 2026-09-08.

Arquitetura: manter React/JSX e Supabase; restringir privilégios no servidor, preservar a assinatura das RPCs existentes com verificação explícita de identidade, resolver mídia privada no cliente e limpar estado por sessão. Preservar a semântica atual de desvinculação (exclusão do par); não transferir histórico a novo parceiro. Sem deploy ou dados reais.

## Execução e responsabilidades

- [x] Banco: nova migração aditiva em `FRONTEND/supabase/migrations`, testes SQL em `supabase/tests`. Corrigir RPCs, concorrência, escrita de pares, push, buckets e funções auxiliares. Testar anônimo/A/B e condições de corrida. Responsável: subagente banco.
- [x] Edge Functions: handlers e `_shared`, testes locais. Validar sessão + vínculo antes de service role; push interno autorizado e conteúdo derivado de registro. Coordenar contrato do trigger/cron com banco. Responsável: subagente funções.
- [x] Sessão e pareamento: `authStore`, `spotifyStore`, `usePairing`, shell/gate e respectivos testes. Invalidar trabalho atrasado, limpar credenciais locais sem desconectar integração remota, propagar erro e observar pareamento. Responsável: subagente sessão.
- [x] Mídia e interface: helper de acesso privado, consumidores chat/album/dashboard; recuperação OAuth, rota desconhecida, idioma e acessibilidade. Inspecionar DOM/CSS antes de mudanças visuais. Responsável: coordenador.
- [x] Ambiente e aceite: Playwright em desenvolvimento com mocks exclusivamente de teste, Docker local, testes SQL isolados, lint/build/testes e revisão independente. Responsável: coordenador.

## Contratos entre tarefas

| Produtor / consumidor | Contrato | Decisão |
| --- | --- | --- |
| Banco / usePairing | create_invite_code(p_user_id), consume_invite_code(p_code,p_user_id) | Preservar assinatura; rejeitar p_user_id diferente da sessão. |
| Banco / mídia | buckets privados e caminhos existentes | Cliente deriva path de storage_path ou URL pública antiga; não persistir URLs assinadas. |
| Banco / push handlers | trigger/cron com autenticação de serviço e ID do registro | Coordenar antes de editar; nunca aceitar apenas anon key como autorização interna. |
| Sessão / mídia | mudança de identidade limpa cache/estado privado | Evitar respostas antigas publicarem dados após troca. |
| Interface / sessão | usePairing mantém API compatível | Erros retornados devem ser visíveis; pares observados por todas as instâncias. |

## Ciclo de verificação

1. Escrever regressão comportamental e executar para observar falha antes de cada correção crítica.
2. Implementar mudanças restritas aos arquivos sob responsabilidade; não editar READMEs preexistentes.
3. Executar teste focado, revisar diff e integrar.
4. Rodar `npm.cmd run test:run`, `npm.cmd run lint`, `npm.cmd run build`; validar navegador com contas/serviços simulados, sem tráfego ao projeto real.
5. Revisar banco e funções independentemente; registrar limitações reais do Docker/serviços. Atualizar relatório com o que está corrigido localmente e o que exige implantação.

## Resultado da execução local

- `npm.cmd run test:run`: 11 arquivos, 88 testes aprovados.
- `npm.cmd run lint`: aprovado sem avisos.
- `npm.cmd run build`: aprovado; imagem Docker multistage construída e servida pelo Nginx.
- `npx.cmd playwright test` com servidor Vite externo: 4 cenários mobile aprovados.
- `supabase/tests/run-security.ps1`: migrações, RLS, concorrência e dispatch aprovados em PostgreSQL 17 isolado.
- Auditoria funcional mobile: rotas principais carregadas sem `pageerror` ou overflow horizontal; busca Spotify, recuperação OAuth e estados sem pareamento exercitados com mocks.
- A migração `20260908125710` foi aplicada e registrada no projeto remoto vinculado em 2026-09-09; Edge Functions e frontend continuam sem publicação remota.

Ruling: trabalhar na branch atual `fix/spotify-fix`, em arquivos delimitados, preservando alterações do usuário; nenhuma movimentação de arquivos para fora do projeto. Não criar commits ou publicar mudanças automaticamente.
