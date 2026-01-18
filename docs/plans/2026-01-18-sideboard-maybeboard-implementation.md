# Sideboard/Maybeboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sideboard and maybeboard zones as tabs in the main panel with move buttons.

**Architecture:** Multi-zone state in deck.js, tab switching in app.js, zone-aware rendering.

**Tech Stack:** Vanilla CSS, JavaScript ES6 modules

---

### Task 1: Add Tab and Move Button Styles

**Files:**
- Modify: `css/components.css`

**Step 1: Add zone tab styles**

Add at end of file:

```css
/* Zone Tabs */
.zone-tabs {
  display: flex;
  gap: var(--space-xs);
}

.zone-tab {
  padding: var(--space-xs) var(--space-sm);
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.zone-tab:hover {
  background: var(--bg-pressed);
  color: var(--text-primary);
}

.zone-tab.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-base);
}

/* Move Buttons */
.move-controls {
  display: flex;
  gap: 2px;
}

.btn-move {
  width: 20px;
  height: 20px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-move:hover {
  background: var(--bg-raised);
  border-color: var(--accent);
  color: var(--accent);
}

/* Zone Counts */
.zone-counts {
  display: flex;
  gap: var(--space-md);
  margin-left: auto;
}

.zone-count {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.zone-count:hover {
  color: var(--text-secondary);
}
```

**Step 2: Commit**

```bash
git add css/components.css
git commit -m "feat: add zone tab and move button styles"
```

---

### Task 2: Update HTML Structure

**Files:**
- Modify: `index.html`

**Step 1: Replace main panel header with tabs**

Find the main-panel-header div and replace the h1 with tabs:

```html
<div class="main-panel-header">
  <div class="zone-tabs" id="zone-tabs">
    <button class="zone-tab active" data-zone="deck">Deck</button>
    <button class="zone-tab" data-zone="sideboard">Sideboard</button>
    <button class="zone-tab" data-zone="maybeboard">Maybeboard</button>
  </div>
  <span class="loading-indicator hidden" id="loading-indicator">
    Loading... <span id="loading-progress">0/100</span>
  </span>
  <div class="main-panel-actions">
    <button class="btn btn-primary btn-sm" id="clear-deck-btn">Clear</button>
  </div>
</div>
```

**Step 2: Add zone counts to bottom bar**

In the footer, add zone counts after the existing stats:

```html
<div class="zone-counts">
  <span class="zone-count" data-zone="sideboard" id="zone-count-sideboard">SB: 0</span>
  <span class="zone-count" data-zone="maybeboard" id="zone-count-maybeboard">MB: 0</span>
</div>
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add zone tabs and counts HTML"
```

---

### Task 3: Refactor Deck State for Multi-Zone

**Files:**
- Modify: `js/deck.js`

**Step 1: Update state structure**

Replace single cards Map with multi-zone state:

```javascript
const state = {
  zones: {
    deck: new Map(),
    sideboard: new Map(),
    maybeboard: new Map()
  },
  currentPrecon: null,
  modified: false
};
```

**Step 2: Add zone-aware functions**

```javascript
export function addCardToZone(card, zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (!zoneMap) return;

  const existing = zoneMap.get(card.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    zoneMap.set(card.id, { card, quantity: 1 });
  }
  state.modified = true;
  notifySubscribers();
}

export function removeCardFromZone(cardId, zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (!zoneMap) return;

  const existing = zoneMap.get(cardId);
  if (existing) {
    existing.quantity -= 1;
    if (existing.quantity <= 0) {
      zoneMap.delete(cardId);
    }
  }
  state.modified = true;
  notifySubscribers();
}

export function moveCard(cardId, fromZone, toZone) {
  const fromMap = state.zones[fromZone];
  const toMap = state.zones[toZone];
  if (!fromMap || !toMap) return;

  const entry = fromMap.get(cardId);
  if (!entry) return;

  // Remove one from source
  entry.quantity -= 1;
  if (entry.quantity <= 0) {
    fromMap.delete(cardId);
  }

  // Add one to target
  const existing = toMap.get(cardId);
  if (existing) {
    existing.quantity += 1;
  } else {
    toMap.set(cardId, { card: entry.card, quantity: 1 });
  }

  state.modified = true;
  notifySubscribers();
}

export function getZone(zone = 'deck') {
  const zoneMap = state.zones[zone];
  return zoneMap ? Array.from(zoneMap.values()) : [];
}

export function getZoneStats(zone = 'deck') {
  const cards = getZone(zone);
  const totalCards = cards.reduce((sum, e) => sum + e.quantity, 0);
  const uniqueCards = cards.length;
  const totalPrice = cards.reduce((sum, e) => {
    const price = e.card.prices?.usd ? parseFloat(e.card.prices.usd) : 0;
    return sum + (price * e.quantity);
  }, 0);
  return { totalCards, uniqueCards, totalPrice };
}

export function clearZone(zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (zoneMap) {
    zoneMap.clear();
    state.modified = true;
    notifySubscribers();
  }
}

export function clearAllZones() {
  state.zones.deck.clear();
  state.zones.sideboard.clear();
  state.zones.maybeboard.clear();
  state.modified = false;
  state.currentPrecon = null;
  notifySubscribers();
}
```

**Step 3: Update getDeck to return all zones**

```javascript
export function getDeck() {
  return {
    deck: getZone('deck'),
    sideboard: getZone('sideboard'),
    maybeboard: getZone('maybeboard'),
    stats: getZoneStats('deck')
  };
}
```

**Step 4: Update existing addCard/removeCard to use zone functions**

```javascript
export function addCard(card) {
  addCardToZone(card, 'deck');
}

export function removeCard(cardId) {
  removeCardFromZone(cardId, 'deck');
}
```

**Step 5: Update setDeck for precon loading**

```javascript
export function setDeck(cards, preconId = null) {
  clearAllZones();
  cards.forEach(card => {
    state.zones.deck.set(card.id, { card, quantity: 1 });
  });
  state.currentPrecon = preconId;
  state.modified = false;
  notifySubscribers();
}
```

**Step 6: Commit**

```bash
git add js/deck.js
git commit -m "feat: refactor deck state for multi-zone support"
```

---

### Task 4: Update Render Functions for Zones

**Files:**
- Modify: `js/render.js`

**Step 1: Update renderDeck to accept zone parameter and move handlers**

```javascript
export function renderDeck(cards, zone, handlers) {
  const { onPreview, onAdd, onRemove, onMove } = handlers;
  const container = document.getElementById('deck-list');
  const emptyState = document.getElementById('deck-empty');

  if (!container) return;

  if (cards.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Determine which move buttons to show based on current zone
  const moveTargets = {
    deck: ['sideboard', 'maybeboard'],
    sideboard: ['deck', 'maybeboard'],
    maybeboard: ['deck', 'sideboard']
  }[zone] || [];

  const moveLabels = { deck: 'D', sideboard: 'S', maybeboard: 'M' };

  const html = cards.map(({ card, quantity }) => `
    <div class="deck-card" data-card-id="${card.id}">
      <img class="deck-card-thumb"
           src="${card.image_uris?.small || card.card_faces?.[0]?.image_uris?.small || ''}"
           alt="${card.name}"
           loading="lazy">
      <div class="deck-card-info">
        <span class="deck-card-name">${card.name}</span>
        <span class="deck-card-type">${card.type_line || ''}</span>
      </div>
      <div class="deck-card-actions">
        <div class="quantity-controls">
          <button class="btn-qty" data-action="remove">−</button>
          <span class="quantity">${quantity}</span>
          <button class="btn-qty" data-action="add">+</button>
        </div>
        <div class="move-controls">
          ${moveTargets.map(target => `
            <button class="btn-move" data-target="${target}" title="Move to ${target}">
              ${moveLabels[target]}
            </button>
          `).join('')}
        </div>
      </div>
      <span class="deck-card-price">${card.prices?.usd ? '$' + card.prices.usd : ''}</span>
    </div>
  `).join('');

  container.innerHTML = html;

  // Add event listeners
  container.querySelectorAll('.deck-card').forEach(row => {
    const cardId = row.dataset.cardId;
    const cardEntry = cards.find(e => e.card.id === cardId);
    if (!cardEntry) return;

    row.addEventListener('mouseenter', () => onPreview(cardEntry.card));

    row.querySelector('[data-action="add"]')?.addEventListener('click', () => onAdd(cardEntry.card));
    row.querySelector('[data-action="remove"]')?.addEventListener('click', () => onRemove(cardId));

    row.querySelectorAll('.btn-move').forEach(btn => {
      btn.addEventListener('click', () => onMove(cardId, zone, btn.dataset.target));
    });
  });
}
```

**Step 2: Add renderZoneCounts function**

```javascript
export function renderZoneCounts(sideboard, maybeboard) {
  const sbCount = document.getElementById('zone-count-sideboard');
  const mbCount = document.getElementById('zone-count-maybeboard');

  if (sbCount) sbCount.textContent = `SB: ${sideboard}`;
  if (mbCount) mbCount.textContent = `MB: ${maybeboard}`;
}
```

**Step 3: Commit**

```bash
git add js/render.js
git commit -m "feat: update render for zones and move buttons"
```

---

### Task 5: Integrate Zone Tabs in App

**Files:**
- Modify: `js/app.js`

**Step 1: Import new deck functions**

Update imports:

```javascript
import {
  addCard, removeCard, subscribe, getDeck, setDeck,
  isModified, setCurrentPrecon, getCurrentPrecon,
  addCardToZone, removeCardFromZone, moveCard, getZone, getZoneStats, clearAllZones
} from './deck.js';
```

**Step 2: Add zone state and tab handling**

```javascript
let currentZone = 'deck';

function initZoneTabs() {
  const tabsContainer = document.getElementById('zone-tabs');
  if (!tabsContainer) return;

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.zone-tab');
    if (!tab) return;

    const zone = tab.dataset.zone;
    switchZone(zone);
  });
}

function switchZone(zone) {
  currentZone = zone;

  // Update active tab
  document.querySelectorAll('.zone-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.zone === zone);
  });

  // Re-render with current zone
  const deckData = getDeck();
  renderCurrentZone(deckData);
}

function renderCurrentZone(deckData) {
  const cards = deckData[currentZone] || [];
  renderDeck(cards, currentZone, {
    onPreview: handlePreview,
    onAdd: (card) => addCardToZone(card, currentZone),
    onRemove: (cardId) => removeCardFromZone(cardId, currentZone),
    onMove: handleMove
  });
}

function handleMove(cardId, fromZone, toZone) {
  moveCard(cardId, fromZone, toZone);
}
```

**Step 3: Update handleDeckChange**

```javascript
function handleDeckChange(deckData) {
  renderCurrentZone(deckData);
  updateStats(deckData.deck);
  updateBottomBar(deckData.stats);

  // Update zone counts
  const sbStats = getZoneStats('sideboard');
  const mbStats = getZoneStats('maybeboard');
  renderZoneCounts(sbStats.totalCards, mbStats.totalCards);
}
```

**Step 4: Update render imports**

```javascript
import { renderPreview, renderDeck, renderManaCurve, renderColorPie, renderZoneCounts } from './render.js';
```

**Step 5: Update clear button to use clearAllZones or clear current zone**

```javascript
clearBtn?.addEventListener('click', () => {
  if (confirm('Clear all zones?')) {
    clearAllZones();
  }
});
```

**Step 6: Add zone count click handlers**

```javascript
function initZoneCounts() {
  document.querySelectorAll('.zone-count').forEach(el => {
    el.addEventListener('click', () => {
      const zone = el.dataset.zone;
      if (zone) switchZone(zone);
    });
  });
}
```

**Step 7: Call init functions**

In the init function, add:

```javascript
initZoneTabs();
initZoneCounts();
```

**Step 8: Commit**

```bash
git add js/app.js
git commit -m "feat: integrate zone tabs and switching"
```

---

### Task 6: Test and Verify

**Step 1: Open in browser and test**

1. Verify tabs appear and switch correctly
2. Add cards to deck, switch to sideboard, add cards there
3. Test move buttons - move card from deck to sideboard
4. Verify zone counts in bottom bar update
5. Verify stats always show deck data
6. Load a precon - should clear all zones
7. Test clear button - should clear all zones

**Step 2: Fix any issues found**

**Step 3: Final commit if needed**
