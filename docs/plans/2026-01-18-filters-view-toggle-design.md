# Filters and View Toggle - Design Document

Add color/type filters and list/grid view toggle for the deck display.

## Overview

**Goal:** Let users filter cards by color and type, and switch between list and grid views.

**Key Decisions:**
- Placement: Filter bar above deck list, below tabs
- Filters: Color toggle buttons (WUBRGC) + Type dropdown
- Grid view: Card images only with quantity badge
- View toggle: Icon buttons (list/grid)

## Filter Bar Layout

**Location:** Between zone tabs and deck list

**HTML:**
```html
<div class="filter-bar">
  <div class="color-filters">
    <button class="color-filter active" data-color="W" title="White">W</button>
    <button class="color-filter active" data-color="U" title="Blue">U</button>
    <button class="color-filter active" data-color="B" title="Black">B</button>
    <button class="color-filter active" data-color="R" title="Red">R</button>
    <button class="color-filter active" data-color="G" title="Green">G</button>
    <button class="color-filter active" data-color="C" title="Colorless">C</button>
  </div>
  <select class="type-filter" id="type-filter">
    <option value="">All Types</option>
    <option value="Creature">Creature</option>
    <option value="Instant">Instant</option>
    <option value="Sorcery">Sorcery</option>
    <option value="Artifact">Artifact</option>
    <option value="Enchantment">Enchantment</option>
    <option value="Planeswalker">Planeswalker</option>
    <option value="Land">Land</option>
  </select>
  <div class="view-toggle">
    <button class="view-btn active" data-view="list" title="List view">☰</button>
    <button class="view-btn" data-view="grid" title="Grid view">▦</button>
  </div>
</div>
```

**Behavior:**
- Color buttons toggle on/off (all start active)
- Type dropdown filters to selected type
- View buttons switch between list and grid

## Filter Logic

**State:**
```javascript
let filterState = {
  colors: ['W', 'U', 'B', 'R', 'G', 'C'],
  type: '',
  view: 'list'
};
```

**Filter Function:**
```javascript
function filterCards(cards) {
  return cards.filter(({ card }) => {
    const cardColors = card.colors || [];
    const matchesColor = cardColors.length === 0
      ? filterState.colors.includes('C')
      : cardColors.some(c => filterState.colors.includes(c));

    const matchesType = !filterState.type ||
      card.typeLine.includes(filterState.type);

    return matchesColor && matchesType;
  });
}
```

**Update Flow:**
1. Filter changes → update filterState
2. Call renderCurrentZone() which applies filters
3. Filtered cards passed to renderDeck() or renderGrid()

## Grid View

**CSS:**
```css
.deck-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-sm);
  padding: var(--space-sm);
}

.grid-card {
  position: relative;
  aspect-ratio: 488 / 680;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
}

.grid-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.grid-card-qty {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: var(--font-size-xs);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
```

**Render Function:**
```javascript
function renderGrid(cards, handlers) {
  const html = cards.map(({ card, quantity }) => `
    <div class="grid-card" data-card-id="${card.id}">
      <img src="${card.images.small}" alt="${card.name}">
      ${quantity > 1 ? `<span class="grid-card-qty">×${quantity}</span>` : ''}
    </div>
  `).join('');
}
```

## File Changes

**Modified:**
- `css/components.css` - Filter bar, color buttons, view toggle, grid styles
- `css/layout.css` - Filter bar positioning
- `index.html` - Filter bar HTML
- `js/render.js` - Add renderGrid(), handle view mode
- `js/app.js` - Filter state, logic, event handlers
