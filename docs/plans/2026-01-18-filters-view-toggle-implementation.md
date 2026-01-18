# Filters and View Toggle Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add color/type filters and list/grid view toggle for deck display.

**Architecture:** Filter state in app.js, filter bar UI, grid view rendering.

**Tech Stack:** Vanilla CSS, JavaScript ES6 modules

---

### Task 1: Add Filter Bar and Grid Styles

**Files:**
- Modify: `css/components.css`

**Step 1: Add filter bar styles**

Add at end of file:

```css
/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: var(--space-sm);
}

.color-filters {
  display: flex;
  gap: 2px;
}

.color-filter {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition-fast);
  opacity: 0.4;
}

.color-filter.active {
  opacity: 1;
  border-color: currentColor;
}

.color-filter[data-color="W"] { background: var(--mtg-white); color: #333; }
.color-filter[data-color="U"] { background: var(--mtg-blue); color: #fff; }
.color-filter[data-color="B"] { background: var(--mtg-black); color: #fff; }
.color-filter[data-color="R"] { background: var(--mtg-red); color: #fff; }
.color-filter[data-color="G"] { background: var(--mtg-green); color: #fff; }
.color-filter[data-color="C"] { background: var(--mtg-colorless); color: #fff; }

.type-filter {
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.type-filter:focus {
  outline: none;
  border-color: var(--accent);
}

.view-toggle {
  display: flex;
  gap: 2px;
  margin-left: auto;
}

.view-btn {
  width: 28px;
  height: 28px;
  padding: 0;
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--font-size-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.view-btn:hover {
  color: var(--text-primary);
}

.view-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-base);
}

/* Grid View */
.deck-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--space-sm);
}

.grid-card {
  position: relative;
  aspect-ratio: 488 / 680;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.grid-card:hover {
  transform: scale(1.05);
  z-index: 1;
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
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}
```

**Step 2: Commit**

```bash
git add css/components.css
git commit -m "feat: add filter bar and grid view styles"
```

---

### Task 2: Add Filter Bar HTML

**Files:**
- Modify: `index.html`

**Step 1: Add filter bar after main-panel-header, before deck-list**

Find the `<div class="deck-list" id="deck-list">` and add above it:

```html
<div class="filter-bar" id="filter-bar">
  <div class="color-filters" id="color-filters">
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
  <div class="view-toggle" id="view-toggle">
    <button class="view-btn active" data-view="list" title="List view">☰</button>
    <button class="view-btn" data-view="grid" title="Grid view">▦</button>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add filter bar HTML"
```

---

### Task 3: Add Grid Render Function

**Files:**
- Modify: `js/render.js`

**Step 1: Add renderGrid function after renderDeck**

```javascript
/**
 * Render cards in grid view
 * @param {Array} cards - Card entries to render
 * @param {Object} handlers - Event handlers { onPreview }
 */
export function renderGrid(cards, handlers) {
  const container = document.getElementById('deck-list');
  const emptyState = document.getElementById('deck-empty');

  if (!container) return;

  if (cards.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Sort by name
  const sortedCards = [...cards].sort((a, b) =>
    a.card.name.localeCompare(b.card.name)
  );

  const html = `
    <div class="deck-grid">
      ${sortedCards.map(({ card, quantity }) => `
        <div class="grid-card" data-card-id="${card.id}">
          <img src="${card.images.small}" alt="${card.name}" loading="lazy">
          ${quantity > 1 ? `<span class="grid-card-qty">×${quantity}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Add hover handlers for preview
  container.querySelectorAll('.grid-card').forEach(gridCard => {
    const cardId = gridCard.dataset.cardId;
    const cardEntry = cards.find(c => c.card.id === cardId);
    if (cardEntry && handlers.onPreview) {
      gridCard.addEventListener('mouseenter', () => handlers.onPreview(cardEntry.card));
    }
  });
}
```

**Step 2: Commit**

```bash
git add js/render.js
git commit -m "feat: add grid view render function"
```

---

### Task 4: Add Filter State and Logic

**Files:**
- Modify: `js/app.js`

**Step 1: Add filter state at top with other state variables**

```javascript
let filterState = {
  colors: ['W', 'U', 'B', 'R', 'G', 'C'],
  type: '',
  view: 'list'
};
```

**Step 2: Add filter function**

```javascript
/**
 * Filter cards based on current filter state
 * @param {Array} cards - Card entries to filter
 * @returns {Array} Filtered cards
 */
function filterCards(cards) {
  return cards.filter(({ card }) => {
    // Color filter
    const cardColors = card.colors || [];
    const matchesColor = cardColors.length === 0
      ? filterState.colors.includes('C')
      : cardColors.some(c => filterState.colors.includes(c));

    // Type filter
    const matchesType = !filterState.type ||
      (card.typeLine && card.typeLine.includes(filterState.type));

    return matchesColor && matchesType;
  });
}
```

**Step 3: Update renderCurrentZone to use filters and view mode**

Update the function to filter cards and choose render mode:

```javascript
function renderCurrentZone(deckData) {
  const cards = deckData[currentZone] || [];
  const filteredCards = filterCards(cards);

  if (filterState.view === 'grid') {
    renderGrid(filteredCards, { onPreview: handlePreview });
  } else {
    renderDeck(filteredCards, currentZone, {
      onPreview: handlePreview,
      onAdd: (card) => addCardToZone(card, currentZone),
      onRemove: (cardId, deleteAll) => {
        if (deleteAll) {
          const cards = getZone(currentZone);
          const entry = cards.find(e => e.card.id === cardId);
          if (entry) {
            for (let i = 0; i < entry.quantity; i++) {
              removeCardFromZone(cardId, currentZone);
            }
          }
        } else {
          removeCardFromZone(cardId, currentZone);
        }
      },
      onMove: handleMove
    });
  }
}
```

**Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: add filter state and logic"
```

---

### Task 5: Add Filter Event Handlers

**Files:**
- Modify: `js/app.js`

**Step 1: Import renderGrid**

Update render imports:

```javascript
import { initRender, renderPreview, renderDeck, renderGrid, renderManaCurve, renderColorPie, renderZoneCounts } from './render.js';
```

**Step 2: Add filter initialization function**

```javascript
/**
 * Initialize filter controls
 */
function initFilters() {
  const colorFilters = document.getElementById('color-filters');
  const typeFilter = document.getElementById('type-filter');
  const viewToggle = document.getElementById('view-toggle');

  // Color filter clicks
  colorFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-filter');
    if (!btn) return;

    const color = btn.dataset.color;
    btn.classList.toggle('active');

    if (btn.classList.contains('active')) {
      filterState.colors.push(color);
    } else {
      filterState.colors = filterState.colors.filter(c => c !== color);
    }

    const deckData = getDeck();
    renderCurrentZone(deckData);
  });

  // Type filter change
  typeFilter?.addEventListener('change', (e) => {
    filterState.type = e.target.value;
    const deckData = getDeck();
    renderCurrentZone(deckData);
  });

  // View toggle clicks
  viewToggle?.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-btn');
    if (!btn) return;

    const view = btn.dataset.view;
    filterState.view = view;

    viewToggle.querySelectorAll('.view-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });

    const deckData = getDeck();
    renderCurrentZone(deckData);
  });
}
```

**Step 3: Call initFilters in init()**

Add to the init function:

```javascript
initFilters();
```

**Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: add filter event handlers"
```

---

### Task 6: Test and Verify

**Step 1: Test in browser**

1. Load a precon deck
2. Click color buttons - should toggle filters
3. Select type from dropdown - should filter by type
4. Click grid view icon - should switch to grid
5. Click list view icon - should switch back
6. Verify filters persist across zone switches
7. Verify hover preview works in grid view

**Step 2: Fix any issues found**
