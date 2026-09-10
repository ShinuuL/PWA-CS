# CoupleSpace Cosmic UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o mockup cósmico aprovado em todas as telas principais, tornar as estrelas visíveis e preservar todos os fluxos existentes.

**Architecture:** O tema global fica em `src/index.css`, enquanto cada feature mantém seu CSS co-localizado. As três frentes abaixo não compartilham arquivos de feature; a integração final será apenas visual e será validada pelo build, suíte existente e inspeção no Docker.

**Tech Stack:** React 19, Vite 8, JSX, CSS co-localizado, framer-motion já existente, Vitest, oxlint e Docker Compose.

**Spec:** `docs/superpowers/specs/2026-09-10-cosmic-ui-redesign.md`

## Global Constraints

- Não adicionar dependências.
- Não alterar stores, queries, migrations, autenticação ou Edge Functions.
- Não criar TypeScript.
- Preservar ações, estados, foco e áreas de toque existentes.
- Animar somente `transform`/`opacity`; respeitar `prefers-reduced-motion`.

---

### Task 1: Tema global e estrelas visíveis

**Files:**
- Modify: `FRONTEND/src/index.css`
- Modify: `FRONTEND/src/shared/components/appshell.css` only if stacking/overflow needs correction

**Interfaces:**
- Consumes: existing `#root`, `body`, `.appshell` and `--color-*` tokens.
- Produces: visible `#root::before` aurora and `#root::after` star field, with reduced-motion behavior.

- [ ] **Step 1: Confirm current visual baseline**

Open `http://127.0.0.1:18080/login` at 1440px and 390px. Confirm the current auroras are visible but the stars are too faint.

- [ ] **Step 2: Strengthen the star layer**

Keep the current aurora layers, but make the star layer explicit with two radial dot sizes, increase opacity only for that layer, reduce the mask fade, and keep `pointer-events: none`.

- [ ] **Step 3: Verify motion behavior**

Use browser evaluation to confirm the star layer transform changes after 1 second and that `page.emulateMedia({ reducedMotion: 'reduce' })` reports `animation-name: none`.

- [ ] **Step 4: Run CSS-independent checks**

Run `npm.cmd run lint`, `npm.cmd run test:run`, and `npm.cmd run build` from `FRONTEND/`.

- [ ] **Step 5: Commit**

Commit with `feat: make cosmic star field visible`.

### Task 2: Dashboard and Spotify surfaces

**Files:**
- Modify: `FRONTEND/src/features/dashboard/dashboard.css`
- Modify: `FRONTEND/src/features/dashboard/memory-hero.css`
- Modify: `FRONTEND/src/features/spotify/SpotifyPlayer.css`
- Modify: `FRONTEND/src/features/spotify/SpotifySearch.css`
- Modify: `FRONTEND/src/features/spotify/PlaylistManager.css`

**Interfaces:**
- Consumes: existing JSX class names and store states in `HomePage`, `MemoryHero`, `SpotifyPlayer`, `SpotifySearch`, and `PlaylistManager`.
- Produces: visual layout matching the dashboard and Spotify mockups without changing handlers or state.

- [ ] **Step 1: Inspect existing class structure**

Read the JSX before editing. Do not rename selectors used by behavior or tests.

- [ ] **Step 2: Align dashboard surfaces**

Use the mockup palette (`#151B2B`, `#1B2234`, lilac, mint), large radius for hero, translucent cards, and selected mood halo. Keep image `object-fit` behavior intact.

- [ ] **Step 3: Align Spotify surfaces**

Give the playing state a stronger hero hierarchy, retain every state branch, and style search/playlist modals with the same border, background and focus tokens. Keep Spotify green contextual.

- [ ] **Step 4: Run targeted checks**

Run `npm.cmd run lint` and the existing test suite. Build if CSS import ordering changes.

- [ ] **Step 5: Commit**

Commit with `feat: align dashboard and spotify surfaces`.

### Task 2A: Dedicated Spotify route and dashboard composition

**Files:**
- Create: `FRONTEND/src/features/spotify/SpotifyPage.jsx`
- Create: `FRONTEND/src/features/spotify/spotify-page.css`
- Modify: `FRONTEND/src/App.jsx`
- Modify: `FRONTEND/src/shared/components/Drawer.jsx`
- Modify: `FRONTEND/src/features/dashboard/HomePage.jsx`
- Modify: `FRONTEND/src/features/dashboard/dashboard.css`

**Interfaces:**
- Consumes: existing `SpotifyPlayer`, `useSpotifyStore`, `usePairing`, `ProtectedRoute`, `PairingGate` and Drawer navigation.
- Produces: authenticated `/spotify` route with full-width player; dashboard without embedded Spotify player.

- [ ] **Step 1: Add a dedicated page shell**

Create `SpotifyPage` with the same pairing-aware initialization currently used by `HomePage`, render `SpotifyPlayer` once, and clean auto-rotate/visibility handlers on unmount.

- [ ] **Step 2: Move the route and navigation**

Add lazy route `/spotify` inside `ProtectedRoute` + `AppShell` + `PairingGate`, and add a pairing-required `Spotify` Drawer item using the existing icon library.

- [ ] **Step 3: Remove Spotify from dashboard composition**

Stop initializing Spotify in `HomePage`, remove its player import/render, and keep memory, mood, partner mood and mini album in the approved grid.

- [ ] **Step 4: Style the page shell**

Use a centered responsive content column, page heading and full-width player surface; do not duplicate player controls or stores.

- [ ] **Step 5: Run tests and commit**

Run lint, tests and build. Commit with `feat: add dedicated spotify screen`.

### Task 3: Communication, organization and account surfaces

**Files:**
- Modify: `FRONTEND/src/features/chat/chat.css`
- Modify: `FRONTEND/src/features/chat/chatSettings.css`
- Modify: `FRONTEND/src/features/album/album.css`
- Modify: `FRONTEND/src/features/agenda/agenda.css`
- Modify: `FRONTEND/src/features/agenda/ItemRow.css`
- Modify: `FRONTEND/src/features/agenda/ListCard.css`
- Modify: `FRONTEND/src/features/profile/profile.css`
- Modify: `FRONTEND/src/features/settings/settings.css`
- Modify: `FRONTEND/src/features/pairing/pairing.css`

**Interfaces:**
- Consumes: existing JSX selectors and interaction states.
- Produces: consistent cards, inputs, buttons, bubbles, tabs, overlays and focus states across remaining screens.

- [ ] **Step 1: Preserve interaction selectors**

Read each component and retain selectors used by menus, modals, reactions, upload, lightbox, tabs, logout and pairing.

- [ ] **Step 2: Apply shared visual language**

Use translucent surfaces where the page wrapper previously hid the ambient background, lilac focus borders, readable secondary text and mobile-safe spacing.

- [ ] **Step 3: Check overlays and scroll behavior**

Ensure fixed overlays remain above the ambient layer and page content still scrolls in chat, album and agenda.

- [ ] **Step 4: Run checks**

Run `npm.cmd run lint`, `npm.cmd run test:run`, and `npm.cmd run build`.

- [ ] **Step 5: Commit**

Commit with `feat: align app surfaces with cosmic theme`.

### Task 4: Cross-screen visual validation and integration

**Files:**
- Modify: only files needed to correct findings from visual validation
- Test artifacts: temporary screenshots under `FRONTEND/.artifacts/` (do not commit)

**Interfaces:**
- Consumes: all CSS changes from Tasks 1–3.
- Produces: a clean Docker build and a verified set of screen states.

- [ ] **Step 1: Rebuild Docker**

Run `docker compose --env-file .env.local up -d --build` from `FRONTEND/`.

- [ ] **Step 2: Capture desktop and mobile states**

Capture login and authenticated routes available in the existing session at 1440px and 390px. Check stars, card contrast, focus, overflow and modals.

- [ ] **Step 3: Check console and reduced motion**

Record browser console errors. Confirm stars move normally and stop under reduced motion.

- [ ] **Step 4: Run final checks**

Run lint, full tests, build, and `git diff --check`.

- [ ] **Step 5: Commit integration fixes**

If fixes are required, commit with `fix: polish cosmic theme validation`; otherwise leave the preceding commits intact.
