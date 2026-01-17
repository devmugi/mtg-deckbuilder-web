# DeckBuilderDemo - Design Document

Portfolio demo: MTG Commander Deck Builder with pixel-perfect military/olive dark theme.

## Overview

Single-page application for managing Magic: The Gathering Commander decks with real Scryfall API integration. Designed for GitHub Pages deployment.

## Design System Tokens

Extracted from reference UI design system image.

### Colors

```css
/* Backgrounds */
--bg-base: #1a1a1a;
--bg-raised: #242424;
--bg-inset: #141414;
--bg-pressed: #0f0f0f;

/* Accent (olive/khaki) */
--accent: #8b9a46;
--accent-hover: #9cad52;
--accent-pressed: #7a8a3d;

/* Text */
--text-primary: #e8e8e8;
--text-secondary: #888888;
--text-muted: #555555;

/* Semantic */
--error: #c75a5a;
--success: #8b9a46;
```

### Elevation Shadows

```css
--shadow-low: 3px 0 4px 0 rgba(0,0,0,0.2);
--shadow-mid: 4px 0 8px 0 rgba(0,0,0,0.25);
--shadow-high: 8px 0 16px 0 rgba(0,0,0,0.3);
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
```

### Border Thickness

- Thin: 1px
- Medium: 2px
- Thick: 3px

## Architecture

### File Structure

```
DeckBuilderDemo/
├── index.html              # Entry point, layout skeleton
├── css/
│   ├── tokens.css          # Design system variables
│   ├── components.css      # Button, input, card styles
│   └── layout.css          # Grid, panels, responsive
└── js/
    ├── app.js              # Main initialization, state
    ├── scryfall.js         # API calls, rate limiting, caching
    ├── search.js           # Autocomplete logic, debouncing
    ├── deck.js             # Deck state management
    └── render.js           # DOM updates, component rendering
```

### Tech Stack

- HTML5 single entry point
- Vanilla CSS (no Tailwind - custom design system)
- Vanilla JavaScript ES6 modules
- Scryfall API for card data
- GitHub Pages deployment

## Layout

```
┌─────────────────────────────────────────────────────┐
│ TopBar: Logo | Search with autocomplete             │
├──────────────┬──────────────────────────────────────┤
│ Left Panel   │ Main Panel                           │
│              │                                      │
│ Card Preview │ Search results / Deck list           │
│ (on hover)   │ - Add card button                    │
│              │ - Quantity controls (+/-)            │
│              │                                      │
├──────────────┴──────────────────────────────────────┤
│ Bottom: Card count | Total price                    │
└─────────────────────────────────────────────────────┘
```

## Component Specifications

### Search Input

- Background: `--bg-inset`
- Border: 2px solid `--text-muted`, `--radius-md`
- Focus: olive highlight border (`--accent`)
- Autocomplete dropdown: `--bg-raised` with `--shadow-mid`

### Card Preview Panel

- Container: `--bg-raised` surface
- Card image: 256px width (Scryfall `normal`)
- Title: `--text-primary`
- Type line: `--text-secondary`
- Price: olive badge

### Deck List Rows

- Background: `--bg-base`
- Hover: `--bg-raised`
- Contents: thumbnail | name | mana cost | quantity | price
- Quantity buttons: outlined primary style

### Bottom Bar

- Background: `--bg-inset`
- Stats as badge chips

## Scryfall API Integration

### Endpoints

```javascript
// Autocomplete (fast search)
GET https://api.scryfall.com/cards/autocomplete?q={query}

// Exact card fetch
GET https://api.scryfall.com/cards/named?exact={name}
```

### Rate Limiting

- 100ms debounce on search input
- 50ms minimum delay between API calls
- In-memory cache for fetched cards

## Vertical Slice (Phase 1)

First implementation includes:

1. Design system CSS (tokens + components)
2. Layout shell (3-panel grid)
3. Scryfall integration with caching
4. Search with autocomplete
5. Deck management (add, remove, quantity)
6. Bottom bar stats

## Future Phases

- Deck selector dropdown (10 precons)
- Sideboard/Maybeboard panels
- Stats charts (mana curve, color distribution)
- Import/Export functionality
- Filters and List/Grid view toggle
- LocalStorage persistence
