# Dashboard Layout Design Spec

**Date:** 2026-07-28
**Status:** Approved

## Overview

Redesign the CoupleSpace dashboard from a single-column vertical stack to a 2-column grid layout on desktop, with responsive fallback to single-column on mobile.

## Layout

### Desktop (≥768px)

```
+-------------------+-------------------+
|                   |  PartnerMood      |
|   MemoryHero      +-------------------+
|   (50% width,     |  MoodSelector     |
|    spans 2 rows)  +-------------------+
|                   |  MiniAlbum        |
+-------------------+-------------------+
```

- **Grid:** 2 columns, 50/50 split
- **MemoryHero:** Left column, spans both rows (aspect-ratio 4:5)
- **Right top:** PartnerMood + MoodSelector side by side
- **Right bottom:** MiniAlbum (full width of right column)

### Mobile (<768px)

- Single column, everything stacked vertically
- Order: MemoryHero → PartnerMood → MoodSelector → MiniAlbum

## Components

### MemoryHero
- Card with backdrop-blur glassmorphism
- Header: Clock icon + "Última Lembrança" + "Recente" badge
- Photo: aspect-ratio 4:5, rounded corners
- Caption: quote itálico + date below photo
- Ken Burns animation (10s subtle zoom)

### PartnerMood
- Shows partner's current mood emoji and text
- Compact card fitting in half-width

### MoodSelector
- 3x2 grid of mood options
- Selected state with purple border glow

### MiniAlbum
- 3-column thumbnail grid
- "+N" overlay for remaining photos

## Technical

### CSS Grid
```css
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 1rem;
}

.memory-hero { grid-row: 1 / 3; }
.right-top { grid-column: 2; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.right-bottom { grid-column: 2; }

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; }
  .memory-hero { grid-row: auto; }
  .right-top { grid-template-columns: 1fr; }
  .right-bottom { grid-column: 1; }
}
```

### Background
- Cosmic shader (WebGL) full screen
- Cards use `backdrop-filter: blur(20px)` for glassmorphism effect
- Dashboard container has transparent background

## Files to Modify
- `src/features/dashboard/dashboard.css` — Grid layout + responsive
- `src/features/dashboard/HomePage.jsx` — Reorder components for grid
- `src/features/dashboard/memory-hero.css` — Adjust for grid context
