# Roadmap

## Objetivo

Este documento reúne funcionalidades planejadas para versões futuras do projeto. Os itens abaixo **não devem ser implementados na versão atual**, servindo apenas como referência para a evolução do produto.

**Importante:** Nenhuma funcionalidade descrita neste documento deve ser desenvolvida até que seja oficialmente movida para o `features.md`.

---

# Funcionalidades Futuras

## 📍 Localização em Tempo Real

Permitir que o casal compartilhe sua localização de forma segura.

### Planejamento

* Compartilhamento de localização em tempo real.
* Exibição da posição do parceiro em um mapa.
* Controle de privacidade para ativar ou desativar o compartilhamento.
* Atualização automática da localização.

---

## 🐾 Pet Virtual

Um companheiro virtual compartilhado pelo casal.

### Planejamento

* Pet único para ambos os usuários.
* Sistema de evolução conforme a interação do casal.
* Alimentação e cuidados diários.
* Animações e estados de humor.
* Personalização futura.

---

## 🎮 Minigames

Jogos rápidos para interação entre o casal.

### Planejamento

* Jogos cooperativos e competitivos.
* Registro de pontuação compartilhada.
* Convites para partidas em tempo real.
* Recompensas e conquistas futuras.

---

## 🎵 Spotify Random Picker (Phase 9)

Integração com Spotify para playlist compartilhada e sorteio aleatório de músicas na homepage.

### Planejamento

* Vincular conta Spotify via OAuth (requer Premium para playback in-app).
* Playlist compartilhada entre o casal (criada ou vinculada).
* Player dedicado na homepage com controles play/pause/skip.
* Auto-rotate com intervalo configurável (1–30 min).
* Busca integrada de músicas via Spotify Search API.
* Gerenciamento da playlist (visualizar, remover músicas) via modal inline.
* Deduplicação de músicas recentemente reproduzidas.
* Refresh automático de tokens via Supabase Edge Function.

### Status

* **Spec completo:** `docs/specs/2026-07-29-spotify-random-picker-design.md`
* **Fase proposta:** Phase 9 (v3.0)
* **Dependências:** Aguarda conclusão das fases 7 e 8

---

# Regras

## 1. Implementação

* Não implementar nenhuma funcionalidade descrita neste documento na versão atual.
* Este arquivo deve servir apenas como planejamento de futuras versões.

## 2. Consistência Visual

* Seguir integralmente o design e a identidade visual já validados.
* Manter os mesmos padrões de UI/UX utilizados nas funcionalidades existentes.

## 3. Qualidade

* Não adicionar componentes incompletos, experimentais ou quebrados.
* Toda funcionalidade só poderá ser implementada quando estiver totalmente planejada.

## 4. Padrões de Desenvolvimento

* Manter a mesma arquitetura e organização definidas no `features.md`.
* Priorizar componentes reutilizáveis e escaláveis.
* Garantir responsividade e abordagem **Mobile First**.
* Preservar a consistência entre todas as telas e futuras funcionalidades.

---

# Observação

Sempre que uma funcionalidade deste roadmap for aprovada para desenvolvimento, ela deverá ser removida deste documento e adicionada ao `features.md`, seguindo o mesmo padrão de documentação e especificação.
