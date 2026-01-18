# Search Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve search with rich results dropdown, deck color filtering, and color mismatch indicators.

**Architecture:** Replace simple text autocomplete with rich card results. Add deck color filter toggle that switches between autocomplete (all cards) and search endpoint (filtered by color identity). Show visual indicator for cards outside deck's color identity.

**Tech Stack:** Vanilla JS, Scryfall API (autocomplete + search endpoints), CSS

---

## Task 1: Add searchCards function to scryfall.js

**Files:**
- Modify: `js/scryfall.js`

**Step 1: Add searchCards function**

```javascript
/**
 * Search for cards using the search endpoint
 * @param {string} query - Search query
 * @param {string[]} colorIdentity - Optional color identity filter (e.g., ['W', 'U', 'B', 'R', 'G'])
 * @returns {Promise<Object[]>} - Array of normalized cards
 */
export async function searchCards(query, colorIdentity = null) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    let searchQuery = `${query}`;

    // Add color identity filter if provided
    if (colorIdentity && colorIdentity.length > 0) {
      const colors = colorIdentity.join('');
      searchQuery += ` id<=${colors}`;
    }

    const data = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(searchQuery)}&order=name`
    );

    // Normalize and cache each card
    const cards = (data.data || []).slice(0, 10).map(card => {
      const normalized = normalizeCard(card);
      cardCache.set(card.name.toLowerCase(), normalized);
      return normalized;
    });

    return cards;
  } catch (error) {
    // Search returns 404 when no results found
    if (error.message.includes('404')) {
      return [];
    }
    console.error('Search error:', error);
    return [];
  }
}
```

**Step 2: Verify the function works**

Test in browser console after adding.

**Step 3: Commit**

```bash
git add js/scryfall.js
git commit -m "feat: add searchCards function with color identity filter"
```

---

## Task 2: Update HTML with search filter elements

**Files:**
- Modify: `index.html`

**Step 1: Update search container structure**

Replace the existing search container:

```html
<div class="search-container">
  <div class="search-input-wrapper">
    <input type="text" class="input search-input" id="search-input" placeholder="Search for cards..." autocomplete="off">
    <div class="search-filters" id="search-filters">
      <button class="search-filter-toggle" id="search-filter-toggle" title="Filter by deck colors">
        <svg class="search-filter-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 4h18v2H3V4zm0 7h12v2H3v-2zm0 7h18v2H3v-2z"/>
        </svg>
      </button>
      <div class="search-filter-colors" id="search-filter-colors"></div>
    </div>
  </div>
  <div class="dropdown hidden" id="search-dropdown"></div>
</div>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add search filter elements to HTML"
```

---

## Task 3: Add CSS styles for search filter and rich dropdown

**Files:**
- Modify: `css/components.css`

**Step 1: Add search filter styles**

```css
/* Search Filter */
.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input-wrapper .search-input {
  flex: 1;
  padding-right: 120px;
}

.search-filters {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-filter-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-filter-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.search-filter-toggle.active {
  background: var(--accent-subtle);
  color: var(--accent);
}

.search-filter-icon {
  width: 16px;
  height: 16px;
}

.search-filter-colors {
  display: flex;
  align-items: center;
  gap: 2px;
}

.search-filter-colors .mana-symbol {
  width: 16px;
  height: 16px;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}

.search-filter-toggle.active + .search-filter-colors .mana-symbol {
  opacity: 1;
}

.search-filters.hidden {
  display: none;
}
```

**Step 2: Add rich dropdown styles**

```css
/* Rich Search Dropdown */
.search-result-item {
  display: grid;
  grid-template-columns: 40px 1fr auto auto;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: background-color var(--transition-fast);
}

.search-result-item:hover,
.search-result-item.active {
  background: var(--bg-hover);
}

.search-result-item.color-mismatch {
  border-left-color: var(--color-danger, #e53935);
  opacity: 0.7;
}

.search-result-item.color-mismatch:hover {
  opacity: 0.85;
}

.search-result-item-art {
  width: 40px;
  height: 30px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.search-result-item-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.search-result-item-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-item-type {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.search-result-item-mana {
  display: flex;
  gap: 1px;
}

.search-result-item-mana .mana-symbol {
  width: 14px;
  height: 14px;
}

.search-result-item-price {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  min-width: 45px;
  text-align: right;
}
```

**Step 3: Commit**

```bash
git add css/components.css
git commit -m "feat: add styles for search filter and rich dropdown"
```

---

## Task 4: Rewrite search.js with rich dropdown and deck filter

**Files:**
- Modify: `js/search.js`

**Step 1: Update imports and state**

```javascript
/**
 * Search component with rich dropdown and deck color filter
 */

import { autocomplete, fetchCardByName, fetchCardsBatch, searchCards } from './scryfall.js';
import { addCard } from './deck.js';

const DEBOUNCE_MS = 200;

let searchInput;
let dropdown;
let filterToggle;
let filterColors;
let searchFilters;
let debounceTimer = null;
let currentResults = [];
let activeIndex = -1;
let onPreviewCallback = null;

// Deck color state
let deckColorIdentity = [];
let deckFilterEnabled = false;
```

**Step 2: Update initSearch**

```javascript
/**
 * Initialize search component
 */
export function initSearch(onPreview) {
  searchInput = document.getElementById('search-input');
  dropdown = document.getElementById('search-dropdown');
  filterToggle = document.getElementById('search-filter-toggle');
  filterColors = document.getElementById('search-filter-colors');
  searchFilters = document.getElementById('search-filters');
  onPreviewCallback = onPreview;

  if (!searchInput || !dropdown) {
    console.error('Search elements not found');
    return;
  }

  searchInput.addEventListener('input', handleInput);
  searchInput.addEventListener('keydown', handleKeydown);

  filterToggle?.addEventListener('click', toggleDeckFilter);

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  // Initially hide filters until deck is loaded
  if (searchFilters) {
    searchFilters.classList.add('hidden');
  }
}
```

**Step 3: Add deck color functions**

```javascript
/**
 * Set deck color identity (called when deck loads)
 */
export function setDeckColors(colors) {
  deckColorIdentity = colors || [];
  renderFilterColors();

  if (searchFilters) {
    if (deckColorIdentity.length > 0) {
      searchFilters.classList.remove('hidden');
    } else {
      searchFilters.classList.add('hidden');
      deckFilterEnabled = false;
      filterToggle?.classList.remove('active');
    }
  }
}

/**
 * Render color identity icons
 */
function renderFilterColors() {
  if (!filterColors) return;

  if (deckColorIdentity.length === 0) {
    filterColors.innerHTML = '';
    return;
  }

  filterColors.innerHTML = deckColorIdentity.map(color =>
    `<img class="mana-symbol" src="https://svgs.scryfall.io/card-symbols/${color}.svg" alt="${color}">`
  ).join('');
}

/**
 * Toggle deck color filter
 */
function toggleDeckFilter() {
  deckFilterEnabled = !deckFilterEnabled;
  filterToggle?.classList.toggle('active', deckFilterEnabled);

  // Re-run current search if there's a query
  const query = searchInput?.value.trim();
  if (query && query.length >= 2) {
    runSearch(query);
  }
}
```

**Step 4: Update handleInput and add runSearch**

```javascript
/**
 * Handle input changes with debounce
 */
function handleInput(e) {
  const query = e.target.value.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (!query || query.length < 2) {
    hideDropdown();
    return;
  }

  debounceTimer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
}

/**
 * Run search based on current filter state
 */
async function runSearch(query) {
  let cards = [];

  if (deckFilterEnabled && deckColorIdentity.length > 0) {
    // Use search endpoint with color identity filter
    cards = await searchCards(query, deckColorIdentity);
  } else {
    // Use autocomplete then batch fetch
    const names = await autocomplete(query);
    if (names.length > 0) {
      cards = await fetchCardsBatch(names.slice(0, 10));
    }
  }

  currentResults = cards;
  activeIndex = -1;
  renderRichDropdown(cards);
}
```

**Step 5: Add renderRichDropdown**

```javascript
/**
 * Render rich dropdown with card details
 */
function renderRichDropdown(cards) {
  if (!cards.length) {
    hideDropdown();
    return;
  }

  dropdown.innerHTML = cards.map((card, index) => {
    const mismatch = !deckFilterEnabled && deckColorIdentity.length > 0 &&
      !cardFitsColorIdentity(card, deckColorIdentity);
    const price = card.prices.usd ? `$${card.prices.usd}` : '—';

    return `
      <div class="search-result-item ${mismatch ? 'color-mismatch' : ''}" data-index="${index}">
        <img class="search-result-item-art" src="${card.images.artCrop || card.images.small}" alt="" loading="lazy">
        <div class="search-result-item-info">
          <div class="search-result-item-name">${escapeHtml(card.name)}</div>
          <div class="search-result-item-type">${escapeHtml(card.typeLine)}</div>
        </div>
        <div class="search-result-item-mana">${renderManaCost(card.manaCost)}</div>
        <div class="search-result-item-price">${price}</div>
      </div>
    `;
  }).join('');

  dropdown.querySelectorAll('.search-result-item').forEach((item, index) => {
    item.addEventListener('click', () => selectCard(cards[index]));
    item.addEventListener('mouseenter', () => {
      activeIndex = index;
      updateActiveItem();
      if (onPreviewCallback) {
        onPreviewCallback(cards[index]);
      }
    });
  });

  dropdown.classList.remove('hidden');
}

/**
 * Check if card fits within deck's color identity
 */
function cardFitsColorIdentity(card, deckColors) {
  const cardIdentity = card.colorIdentity || [];
  return cardIdentity.every(c => deckColors.includes(c));
}

/**
 * Render mana cost as Scryfall symbol images
 */
function renderManaCost(manaCost) {
  if (!manaCost) return '';
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];
  return symbols.map(symbol => {
    const code = symbol.slice(1, -1).replace('/', '');
    return `<img class="mana-symbol" src="https://svgs.scryfall.io/card-symbols/${encodeURIComponent(code)}.svg" alt="${symbol}">`;
  }).join('');
}
```

**Step 6: Update selectCard to work with card objects**

```javascript
/**
 * Select a card from results
 */
function selectCard(card) {
  hideDropdown();
  searchInput.value = '';

  addCard(card);
  if (onPreviewCallback) {
    onPreviewCallback(card);
  }
}
```

**Step 7: Keep existing helper functions**

Keep `handleKeydown`, `updateActiveItem`, `hideDropdown`, `escapeHtml` as they are, but update `handleKeydown` to use card objects:

```javascript
/**
 * Handle keyboard navigation
 */
function handleKeydown(e) {
  if (!currentResults.length) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentResults.length - 1);
      updateActiveItem();
      // Show preview for keyboard navigation
      if (activeIndex >= 0 && onPreviewCallback) {
        onPreviewCallback(currentResults[activeIndex]);
      }
      break;

    case 'ArrowUp':
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveItem();
      if (activeIndex >= 0 && onPreviewCallback) {
        onPreviewCallback(currentResults[activeIndex]);
      }
      break;

    case 'Enter':
      e.preventDefault();
      if (activeIndex >= 0) {
        selectCard(currentResults[activeIndex]);
      }
      break;

    case 'Escape':
      hideDropdown();
      searchInput.blur();
      break;
  }
}
```

**Step 8: Commit**

```bash
git add js/search.js
git commit -m "feat: rewrite search with rich dropdown and deck color filter"
```

---

## Task 5: Update app.js to set deck colors

**Files:**
- Modify: `js/app.js`

**Step 1: Import setDeckColors**

Update the import:
```javascript
import { initSearch, setDeckColors } from './search.js';
```

**Step 2: Update loadPreconDeck to set deck colors**

After setting the commander, add:
```javascript
  // Set commander (first card with "Legendary" in type, or first card)
  const commander = loadedCards.find(c =>
    c.typeLine && c.typeLine.includes('Legendary')
  ) || loadedCards[0];
  if (commander) {
    commanderCard = commander;
    renderPreview(commander);
    // Set deck colors for search filter
    setDeckColors(commander.colorIdentity || []);
  }
```

**Step 3: Clear deck colors when clearing deck**

In `loadPreconDeck`, after clearing:
```javascript
  // Clear deck and all zones immediately
  clearAllZones();
  setDeck([], null);
  commanderCard = null;
  renderPreview(null);
  setDeckColors([]); // Clear search filter colors
```

**Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: connect deck color identity to search filter"
```

---

## Task 6: Test and verify

**Step 1: Test in browser**

1. Open http://localhost:8080 in incognito
2. Load Najeela deck (5-color)
3. Verify filter icons appear in search input (W U B R G)
4. Search "counterspell" with filter OFF - should show results, all should fit 5-color
5. Load mono-white Giada deck
6. Search "counterspell" with filter OFF - should show red border on blue cards
7. Click filter toggle (should turn active/highlighted)
8. Search "counterspell" with filter ON - should show no results (filtered server-side)
9. Search "swords" with filter ON - should show Swords to Plowshares

**Step 2: Verify keyboard navigation works**

**Step 3: Verify hover preview works**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete search improvements with rich dropdown and deck filter"
```

---

## Verification Checklist

- [ ] Search shows rich dropdown with image, name, type, mana, price
- [ ] Deck color icons appear when deck is loaded
- [ ] Filter toggle switches between autocomplete and search modes
- [ ] Color mismatch indicator (red border) appears when filter is OFF
- [ ] Server-side filtering works when filter is ON
- [ ] Keyboard navigation (↑↓ Enter Esc) works
- [ ] Hover shows card in preview panel
- [ ] Click adds card to deck
