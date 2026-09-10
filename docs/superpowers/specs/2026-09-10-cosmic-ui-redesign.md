# CoupleSpace Cosmic UI Redesign

## Objetivo

Alinhar as telas autenticadas do CoupleSpace ao mockup cósmico aprovado, mantendo todas as funções existentes e tornando a camada de fundo animada perceptível em desktop e mobile.

## Referências aprovadas

- `docs/mockups/couplespace-dashboard-v3.html` — direção do dashboard.
- `docs/mockups/couplespace-spotify-v3.html` — direção do Spotify.
- `docs/cosmic-v2.html` e `docs/UIUX.md` — identidade visual existente.
- A atmosfera da referência externa do Astra será traduzida em auroras lentas, profundidade e pontos de luz, sem copiar conteúdo ou marca.

## Resultado esperado

Todas as rotas principais usam o mesmo vocabulário visual:

- fundo `#080B14`/`#0A0C14` com auroras lilás, menta e azul;
- pontos de luz visíveis, pequenos e variados, com movimento independente das auroras;
- superfícies translúcidas azul-marinho, borda lilás de baixa opacidade e sombras amplas;
- hierarquia tipográfica com títulos compactos, labels em caixa alta e texto auxiliar de baixo contraste;
- estados de foco e seleção preservando o lilás como ação primária e o menta como estado positivo;
- espaçamento e raios grandes em cards principais, reduzidos no mobile.

## Escopo por tela

### Tema global

`FRONTEND/src/index.css` continua sendo a fonte dos tokens globais e da camada ambiente. A camada deve:

- ocupar a viewport inteira sem criar scroll horizontal;
- não interceptar cliques ou foco;
- animar somente `transform`/`opacity`;
- reduzir intensidade no mobile;
- desligar movimento com `prefers-reduced-motion: reduce`;
- exibir estrelas como uma camada explícita, com pontos de pelo menos dois tamanhos e espaçamento suficiente para serem percebidos sobre o fundo escuro.

### Dashboard

`FRONTEND/src/features/dashboard/dashboard.css` e `memory-hero.css` devem convergir para o dashboard v3:

- memory hero como card dominante, com imagem centralizada sem perda de qualidade;
- mood selector como grade de seis opções, seleção lilás com halo sutil;
- partner mood com presença, emoji e estado online;
- cards menores com atalhos claros e leitura rápida;
- preservar upload, seleção de mood, modal customizado e carregamento.

### Spotify

`SpotifyPlayer.css`, `SpotifySearch.css` e `PlaylistManager.css` devem convergir para o Spotify v3:

- player atual com capa em destaque, metadados, progresso e controles;
- fila da playlist visível sem esconder o estado atual;
- ação para adicionar música com hierarquia secundária;
- estados não conectado, sem playlist, playlist vazia, Premium necessário, carregando e erro continuam acessíveis e coerentes;
- verde Spotify somente como acento contextual, sem substituir a identidade lilás do produto.

### Chat

`FRONTEND/src/features/chat/chat.css` e `chatSettings.css` devem receber superfícies, bolhas, composer e estados de interação alinhados ao sistema. Reações, reply, exclusão, anexos, scroll-to-bottom e indicadores de digitação não podem perder contraste nem área de toque.

### Álbum e agenda

`FRONTEND/src/features/album/album.css` e os estilos de agenda devem usar o fundo ambiente e cards translúcidos. Upload, lightbox, exclusão, tabs, listas, lembretes e modais continuam com os mesmos fluxos e foco visível.

### Perfil, configurações e pairing

Os estilos de `profile`, `settings` e `pairing` devem adotar os mesmos tokens, cards e botões, mantendo logout, desvinculação, relatório de problema, edição de perfil e vínculo do casal.

## Restrições

- Não adicionar dependências.
- Não alterar queries, stores, migrations, autenticação ou contratos do Supabase.
- Não expor URLs, tokens ou links internos na UI.
- Não criar TypeScript; o projeto usa JSX e CSS co-localizado.
- Não remover textos ou ações existentes sem substituto equivalente.
- Alterações de CSS devem ser pequenas e reversíveis; markup só muda quando necessário para a hierarquia visual.

## Acessibilidade e desempenho

- contraste mínimo equivalente ao padrão atual e foco `:focus-visible` preservado;
- controles de toque com pelo menos 40px de área útil no mobile;
- `prefers-reduced-motion` elimina animações de aurora, estrelas e halos;
- nenhuma animação usa `filter: blur()` em elementos gigantes ou loops rápidos;
- conteúdo permanece acima do fundo com ordem de empilhamento explícita.

## Validação

- `npm.cmd run lint` em `FRONTEND/`;
- `npm.cmd run test:run` em `FRONTEND/`;
- `npm.cmd run build` em `FRONTEND/`;
- rebuild com `docker compose --env-file .env.local up -d --build`;
- inspeção visual em `/login`, `/home`, `/spotify`, `/chat`, `/album`, `/agenda`, `/settings` e `/profile` em 1440px e 390px;
- confirmar no navegador que as estrelas se movem, o modo reduzido desliga movimento e não surgem erros no console.

## Fora do escopo

- redesenho de ícones ou criação de novas ilustrações;
- mudanças de dados, schema, RLS, Edge Functions ou notificações;
- nova lógica de playlist, chat, upload, pairing ou autenticação;
- suporte a tema claro.
