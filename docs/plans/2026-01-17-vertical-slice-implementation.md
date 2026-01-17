# DeckBuilderDemo Vertical Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a functional MTG deck builder with card search, preview, and deck management using pixel-perfect military/olive dark theme.

**Architecture:** Single HTML entry point with modular CSS (tokens, components, layout) and ES6 JavaScript modules. Scryfall API for card data with in-memory caching.

**Tech Stack:** HTML5, Vanilla CSS, Vanilla JavaScript ES6 modules, Scryfall API

---

## Task 1: Design System Tokens

**Files:**
- Create: `css/tokens.css`

**Step 1: Create CSS directory**

```bash
mkdir -p css
```

**Step 2: Write design tokens**

Create `css/tokens.css`:

```css
:root {
  /* Backgrounds */
  --bg-base: #1a1a1a;
  --bg-raised: #242424;
  --bg-inset: #141414;
  --bg-pressed: #0f0f0f;

  /* Accent (olive/khaki) */
  --accent: #8b9a46;
  --accent-hover: #9cad52;
  --accent-pressed: #7a8a3d;
  --accent-subtle: rgba(139, 154, 70, 0.15);

  /* Text */
  --text-primary: #e8e8e8;
  --text-secondary: #888888;
  --text-muted: #555555;

  /* Semantic */
  --error: #c75a5a;
  --error-bg: rgba(199, 90, 90, 0.15);
  --success: #8b9a46;

  /* Borders */
  --border-subtle: #2a2a2a;
  --border-default: #333333;
  --border-strong: #444444;

  /* Elevation Shadows */
  --shadow-low: 3px 0 4px 0 rgba(0,0,0,0.2);
  --shadow-mid: 4px 0 8px 0 rgba(0,0,0,0.25);
  --shadow-high: 8px 0 16px 0 rgba(0,0,0,0.3);

  /* Border Radius */
  --radius-none: 0;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-md: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-bold: 600;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}
```

**Step 3: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add design system tokens"
```

---

## Task 2: Component Styles

**Files:**
- Create: `css/components.css`

**Step 1: Write button styles**

Create `css/components.css`:

```css
/* ============================================
   BUTTONS
   ============================================ */

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 2px solid transparent;
  outline: none;
}

.btn:focus-visible {
  box-shadow: 0 0 0 2px var(--bg-base), 0 0 0 4px var(--accent);
}

/* Primary - Outlined */
.btn-primary {
  background: transparent;
  border-color: var(--border-strong);
  color: var(--text-primary);
}

.btn-primary:hover {
  border-color: var(--text-secondary);
  background: var(--bg-raised);
}

.btn-primary:active {
  background: var(--bg-pressed);
}

/* Secondary - Filled olive */
.btn-secondary {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg-base);
}

.btn-secondary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.btn-secondary:active {
  background: var(--accent-pressed);
  border-color: var(--accent-pressed);
}

/* Small variant */
.btn-sm {
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
}

/* Disabled */
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ============================================
   TEXT INPUTS
   ============================================ */

.input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  color: var(--text-primary);
  background: var(--bg-inset);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-md);
  outline: none;
  transition: all var(--transition-fast);
}

.input::placeholder {
  color: var(--text-muted);
}

.input:hover {
  border-color: var(--border-strong);
}

.input:focus {
  border-color: var(--accent);
  background: var(--bg-base);
}

.input-error {
  border-color: var(--error);
}

/* ============================================
   CARDS / SURFACES
   ============================================ */

.surface-base {
  background: var(--bg-base);
}

.surface-raised {
  background: var(--bg-raised);
  box-shadow: var(--shadow-low);
}

.surface-inset {
  background: var(--bg-inset);
}

.card {
  background: var(--bg-raised);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

/* ============================================
   BADGES
   ============================================ */

.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-sm);
  background: var(--bg-raised);
  color: var(--text-secondary);
  border: 1px solid var(--border-subtle);
}

.badge-accent {
  background: var(--accent-subtle);
  color: var(--accent);
  border-color: var(--accent);
}

/* ============================================
   DROPDOWN / AUTOCOMPLETE
   ============================================ */

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--space-xs);
  background: var(--bg-raised);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-mid);
  max-height: 300px;
  overflow-y: auto;
  z-index: 100;
}

.dropdown-item {
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  transition: background var(--transition-fast);
  color: var(--text-primary);
}

.dropdown-item:hover,
.dropdown-item.active {
  background: var(--accent-subtle);
}

.dropdown-item:first-child {
  border-radius: var(--radius-md) var(--radius-md) 0 0;
}

.dropdown-item:last-child {
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}

/* ============================================
   LIST ITEMS
   ============================================ */

.list-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
  transition: background var(--transition-fast);
}

.list-item:hover {
  background: var(--bg-raised);
}

.list-item:last-child {
  border-bottom: none;
}

/* ============================================
   SCROLLBAR
   ============================================ */

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--bg-inset);
}

::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: var(--radius-sm);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

**Step 2: Commit**

```bash
git add css/components.css
git commit -m "feat: add component styles (buttons, inputs, cards, badges)"
```

---

## Task 3: Layout Styles

**Files:**
- Create: `css/layout.css`

**Step 1: Write layout styles**

Create `css/layout.css`:

```css
/* ============================================
   RESET & BASE
   ============================================ */

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-md);
  color: var(--text-primary);
  background: var(--bg-base);
  line-height: 1.5;
}

/* ============================================
   APP LAYOUT
   ============================================ */

.app {
  display: grid;
  grid-template-rows: auto 1fr auto;
  height: 100vh;
  overflow: hidden;
}

/* ============================================
   TOP BAR
   ============================================ */

.topbar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-raised);
  border-bottom: 1px solid var(--border-subtle);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.logo-icon {
  width: 32px;
  height: 32px;
  fill: var(--accent);
}

.search-container {
  position: relative;
  flex: 1;
  max-width: 500px;
}

/* ============================================
   MAIN CONTENT AREA
   ============================================ */

.main-content {
  display: grid;
  grid-template-columns: 280px 1fr;
  overflow: hidden;
}

/* ============================================
   LEFT PANEL - CARD PREVIEW
   ============================================ */

.left-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-inset);
  border-right: 1px solid var(--border-subtle);
  overflow-y: auto;
}

.card-preview {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.card-preview-image {
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-mid);
}

.card-preview-placeholder {
  width: 100%;
  aspect-ratio: 488 / 680;
  background: var(--bg-raised);
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

.card-preview-info {
  padding: var(--space-sm);
}

.card-preview-name {
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-bottom: var(--space-xs);
}

.card-preview-type {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.card-preview-price {
  margin-top: var(--space-sm);
}

/* ============================================
   MAIN PANEL - DECK LIST
   ============================================ */

.main-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.main-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--border-subtle);
}

.main-panel-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.deck-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-md);
}

.deck-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text-muted);
  text-align: center;
  padding: var(--space-xl);
}

.deck-empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: var(--space-md);
  opacity: 0.5;
}

/* ============================================
   DECK CARD ROW
   ============================================ */

.deck-card {
  display: grid;
  grid-template-columns: 48px 1fr auto auto auto;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.deck-card:hover {
  background: var(--bg-raised);
}

.deck-card-thumb {
  width: 48px;
  height: 36px;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.deck-card-info {
  min-width: 0;
}

.deck-card-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.deck-card-type {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.deck-card-mana {
  display: flex;
  gap: 2px;
}

.deck-card-quantity {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.deck-card-qty-value {
  min-width: 24px;
  text-align: center;
  font-weight: var(--font-weight-medium);
}

.deck-card-price {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  min-width: 60px;
  text-align: right;
}

.deck-card-actions {
  display: flex;
  gap: var(--space-xs);
}

/* ============================================
   BOTTOM BAR
   ============================================ */

.bottombar {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
  padding: var(--space-sm) var(--space-lg);
  background: var(--bg-inset);
  border-top: 1px solid var(--border-subtle);
}

.stat {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--font-size-sm);
}

.stat-label {
  color: var(--text-secondary);
}

.stat-value {
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.stat-value-accent {
  color: var(--accent);
}

/* ============================================
   UTILITIES
   ============================================ */

.hidden {
  display: none !important;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

**Step 2: Commit**

```bash
git add css/layout.css
git commit -m "feat: add layout styles (app grid, panels, deck list)"
```

---

## Task 4: HTML Structure

**Files:**
- Create: `index.html`

**Step 1: Write HTML skeleton**

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeckBuilder Demo - MTG Commander</title>

  <!-- Styles -->
  <link rel="stylesheet" href="css/tokens.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/layout.css">
</head>
<body>
  <div class="app">
    <!-- Top Bar -->
    <header class="topbar">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 32 32" fill="currentColor">
          <path d="M16 2L4 8v8c0 7.5 5.1 14.5 12 16 6.9-1.5 12-8.5 12-16V8L16 2zm0 4l8 4v6c0 5.5-3.4 10.5-8 12-4.6-1.5-8-6.5-8-12v-6l8-4z"/>
          <path d="M16 10l-4 2v4c0 2.8 1.7 5.3 4 6 2.3-.7 4-3.2 4-6v-4l-4-2z"/>
        </svg>
        <span>DeckBuilder</span>
      </div>

      <div class="search-container">
        <input
          type="text"
          class="input"
          id="search-input"
          placeholder="Search for cards..."
          autocomplete="off"
        >
        <div class="dropdown hidden" id="search-dropdown"></div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <!-- Left Panel - Card Preview -->
      <aside class="left-panel">
        <div class="card-preview" id="card-preview">
          <div class="card-preview-placeholder">
            Hover over a card to preview
          </div>
        </div>
      </aside>

      <!-- Main Panel - Deck List -->
      <section class="main-panel">
        <div class="main-panel-header">
          <h1 class="main-panel-title">Deck</h1>
          <div class="main-panel-actions">
            <button class="btn btn-primary btn-sm" id="clear-deck-btn">Clear</button>
          </div>
        </div>

        <div class="deck-list" id="deck-list">
          <div class="deck-empty" id="deck-empty">
            <svg class="deck-empty-icon" viewBox="0 0 64 64" fill="currentColor">
              <rect x="8" y="8" width="48" height="48" rx="4" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 4"/>
              <path d="M32 24v16M24 32h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p>No cards in deck</p>
            <p style="font-size: var(--font-size-sm);">Search and add cards to get started</p>
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Bar -->
    <footer class="bottombar">
      <div class="stat">
        <span class="stat-label">Cards:</span>
        <span class="stat-value" id="stat-cards">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">Unique:</span>
        <span class="stat-value" id="stat-unique">0</span>
      </div>
      <div class="stat">
        <span class="stat-label">Total:</span>
        <span class="stat-value stat-value-accent" id="stat-price">$0.00</span>
      </div>
    </footer>
  </div>

  <!-- Scripts -->
  <script type="module" src="js/app.js"></script>
</body>
</html>
```

**Step 2: Verify in browser**

Open `index.html` in browser. Expected:
- Dark background with 3-panel layout
- Top bar with logo and search input
- Left panel with preview placeholder
- Main panel with empty deck state
- Bottom bar with stats showing 0

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add HTML structure with layout shell"
```

---

## Task 5: Scryfall API Module

**Files:**
- Create: `js/scryfall.js`

**Step 1: Create JS directory**

```bash
mkdir -p js
```

**Step 2: Write Scryfall API module**

Create `js/scryfall.js`:

```javascript
/**
 * Scryfall API integration with rate limiting and caching
 */

const SCRYFALL_API = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 75; // Scryfall asks for 50-100ms between requests

// In-memory cache for card data
const cardCache = new Map();
let lastRequestTime = 0;

/**
 * Rate-limited fetch wrapper
 */
async function rateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search for card name suggestions (autocomplete)
 * @param {string} query - Search query
 * @returns {Promise<string[]>} - Array of card names
 */
export async function autocomplete(query) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const data = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/autocomplete?q=${encodeURIComponent(query)}`
    );
    return data.data || [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

/**
 * Fetch a card by exact name
 * @param {string} name - Exact card name
 * @returns {Promise<Object|null>} - Card object or null
 */
export async function fetchCardByName(name) {
  // Check cache first
  const cacheKey = name.toLowerCase();
  if (cardCache.has(cacheKey)) {
    return cardCache.get(cacheKey);
  }

  try {
    const card = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(name)}`
    );

    // Normalize and cache
    const normalizedCard = normalizeCard(card);
    cardCache.set(cacheKey, normalizedCard);

    return normalizedCard;
  } catch (error) {
    console.error('Fetch card error:', error);
    return null;
  }
}

/**
 * Normalize Scryfall card data to our format
 */
function normalizeCard(scryfallCard) {
  // Handle double-faced cards
  const imageUris = scryfallCard.image_uris ||
    (scryfallCard.card_faces && scryfallCard.card_faces[0]?.image_uris) ||
    {};

  return {
    id: scryfallCard.id,
    name: scryfallCard.name,
    manaCost: scryfallCard.mana_cost || '',
    cmc: scryfallCard.cmc || 0,
    typeLine: scryfallCard.type_line || '',
    colors: scryfallCard.colors || [],
    colorIdentity: scryfallCard.color_identity || [],
    oracleText: scryfallCard.oracle_text || '',
    images: {
      small: imageUris.small || '',
      normal: imageUris.normal || '',
      artCrop: imageUris.art_crop || ''
    },
    prices: {
      usd: scryfallCard.prices?.usd || null,
      usdFoil: scryfallCard.prices?.usd_foil || null
    }
  };
}

/**
 * Get cached card if available
 */
export function getCachedCard(name) {
  return cardCache.get(name.toLowerCase()) || null;
}
```

**Step 3: Commit**

```bash
git add js/scryfall.js
git commit -m "feat: add Scryfall API module with rate limiting and caching"
```

---

## Task 6: Deck State Management

**Files:**
- Create: `js/deck.js`

**Step 1: Write deck state module**

Create `js/deck.js`:

```javascript
/**
 * Deck state management with event-driven updates
 */

// Deck state
const state = {
  cards: new Map(), // cardId -> { card, quantity }
  listeners: new Set()
};

/**
 * Subscribe to deck changes
 * @param {Function} callback - Called when deck changes
 * @returns {Function} - Unsubscribe function
 */
export function subscribe(callback) {
  state.listeners.add(callback);
  return () => state.listeners.delete(callback);
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
  const deckData = getDeck();
  state.listeners.forEach(callback => callback(deckData));
}

/**
 * Add a card to the deck
 * @param {Object} card - Card object from Scryfall
 */
export function addCard(card) {
  const existing = state.cards.get(card.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cards.set(card.id, { card, quantity: 1 });
  }

  notifyListeners();
}

/**
 * Remove one copy of a card from the deck
 * @param {string} cardId - Card ID
 */
export function removeCard(cardId) {
  const existing = state.cards.get(cardId);

  if (!existing) return;

  if (existing.quantity > 1) {
    existing.quantity -= 1;
  } else {
    state.cards.delete(cardId);
  }

  notifyListeners();
}

/**
 * Set card quantity directly
 * @param {string} cardId - Card ID
 * @param {number} quantity - New quantity
 */
export function setQuantity(cardId, quantity) {
  const existing = state.cards.get(cardId);

  if (!existing) return;

  if (quantity <= 0) {
    state.cards.delete(cardId);
  } else {
    existing.quantity = quantity;
  }

  notifyListeners();
}

/**
 * Delete a card entirely from the deck
 * @param {string} cardId - Card ID
 */
export function deleteCard(cardId) {
  state.cards.delete(cardId);
  notifyListeners();
}

/**
 * Clear all cards from the deck
 */
export function clearDeck() {
  state.cards.clear();
  notifyListeners();
}

/**
 * Get current deck data
 * @returns {Object} - Deck statistics and card list
 */
export function getDeck() {
  const cards = Array.from(state.cards.values());

  let totalCards = 0;
  let totalPrice = 0;

  cards.forEach(({ card, quantity }) => {
    totalCards += quantity;
    const price = parseFloat(card.prices.usd) || 0;
    totalPrice += price * quantity;
  });

  return {
    cards,
    stats: {
      totalCards,
      uniqueCards: cards.length,
      totalPrice
    }
  };
}
```

**Step 2: Commit**

```bash
git add js/deck.js
git commit -m "feat: add deck state management module"
```

---

## Task 7: Search Component

**Files:**
- Create: `js/search.js`

**Step 1: Write search module**

Create `js/search.js`:

```javascript
/**
 * Search component with debounced autocomplete
 */

import { autocomplete, fetchCardByName } from './scryfall.js';
import { addCard } from './deck.js';

const DEBOUNCE_MS = 150;

let searchInput;
let dropdown;
let debounceTimer = null;
let currentResults = [];
let activeIndex = -1;
let onPreviewCallback = null;

/**
 * Initialize search component
 * @param {Function} onPreview - Callback when card is hovered
 */
export function initSearch(onPreview) {
  searchInput = document.getElementById('search-input');
  dropdown = document.getElementById('search-dropdown');
  onPreviewCallback = onPreview;

  if (!searchInput || !dropdown) {
    console.error('Search elements not found');
    return;
  }

  // Input handler with debounce
  searchInput.addEventListener('input', handleInput);

  // Keyboard navigation
  searchInput.addEventListener('keydown', handleKeydown);

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });
}

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

  debounceTimer = setTimeout(async () => {
    const results = await autocomplete(query);
    currentResults = results;
    activeIndex = -1;
    renderDropdown(results);
  }, DEBOUNCE_MS);
}

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
      break;

    case 'ArrowUp':
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveItem();
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

/**
 * Render dropdown with results
 */
function renderDropdown(results) {
  if (!results.length) {
    hideDropdown();
    return;
  }

  dropdown.innerHTML = results.map((name, index) => `
    <div class="dropdown-item" data-index="${index}">${escapeHtml(name)}</div>
  `).join('');

  // Add click handlers
  dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
    item.addEventListener('click', () => selectCard(results[index]));
    item.addEventListener('mouseenter', async () => {
      activeIndex = index;
      updateActiveItem();
      // Preview on hover
      const card = await fetchCardByName(results[index]);
      if (card && onPreviewCallback) {
        onPreviewCallback(card);
      }
    });
  });

  dropdown.classList.remove('hidden');
}

/**
 * Update active item styling
 */
function updateActiveItem() {
  dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
    item.classList.toggle('active', index === activeIndex);
  });
}

/**
 * Select a card from results
 */
async function selectCard(name) {
  hideDropdown();
  searchInput.value = '';

  const card = await fetchCardByName(name);
  if (card) {
    addCard(card);
    if (onPreviewCallback) {
      onPreviewCallback(card);
    }
  }
}

/**
 * Hide dropdown
 */
function hideDropdown() {
  dropdown.classList.add('hidden');
  currentResults = [];
  activeIndex = -1;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Step 2: Commit**

```bash
git add js/search.js
git commit -m "feat: add search component with autocomplete"
```

---

## Task 8: Render Module

**Files:**
- Create: `js/render.js`

**Step 1: Write render module**

Create `js/render.js`:

```javascript
/**
 * DOM rendering functions
 */

import { removeCard, addCard, deleteCard } from './deck.js';

let previewContainer;
let deckList;
let deckEmpty;
let statCards;
let statUnique;
let statPrice;
let onPreviewCallback = null;

/**
 * Initialize render module
 * @param {Function} onPreview - Callback for card preview
 */
export function initRender(onPreview) {
  previewContainer = document.getElementById('card-preview');
  deckList = document.getElementById('deck-list');
  deckEmpty = document.getElementById('deck-empty');
  statCards = document.getElementById('stat-cards');
  statUnique = document.getElementById('stat-unique');
  statPrice = document.getElementById('stat-price');
  onPreviewCallback = onPreview;
}

/**
 * Render card preview
 * @param {Object|null} card - Card to preview or null to clear
 */
export function renderPreview(card) {
  if (!card) {
    previewContainer.innerHTML = `
      <div class="card-preview-placeholder">
        Hover over a card to preview
      </div>
    `;
    return;
  }

  const price = card.prices.usd ? `$${card.prices.usd}` : 'N/A';

  previewContainer.innerHTML = `
    <img
      class="card-preview-image"
      src="${card.images.normal}"
      alt="${escapeHtml(card.name)}"
      loading="lazy"
    >
    <div class="card-preview-info">
      <div class="card-preview-name">${escapeHtml(card.name)}</div>
      <div class="card-preview-type">${escapeHtml(card.typeLine)}</div>
      <div class="card-preview-price">
        <span class="badge badge-accent">${price}</span>
      </div>
    </div>
  `;
}

/**
 * Render deck list
 * @param {Object} deckData - Deck data from getDeck()
 */
export function renderDeck(deckData) {
  const { cards, stats } = deckData;

  // Update stats
  statCards.textContent = stats.totalCards;
  statUnique.textContent = stats.uniqueCards;
  statPrice.textContent = `$${stats.totalPrice.toFixed(2)}`;

  // Show/hide empty state
  if (cards.length === 0) {
    deckEmpty.classList.remove('hidden');
    // Clear any existing cards
    const existingCards = deckList.querySelectorAll('.deck-card');
    existingCards.forEach(el => el.remove());
    return;
  }

  deckEmpty.classList.add('hidden');

  // Sort by name
  const sortedCards = [...cards].sort((a, b) =>
    a.card.name.localeCompare(b.card.name)
  );

  // Render card rows
  const cardRows = sortedCards.map(({ card, quantity }) => {
    const price = card.prices.usd
      ? `$${(parseFloat(card.prices.usd) * quantity).toFixed(2)}`
      : '—';

    return `
      <div class="deck-card" data-card-id="${card.id}">
        <img
          class="deck-card-thumb"
          src="${card.images.small}"
          alt=""
          loading="lazy"
        >
        <div class="deck-card-info">
          <div class="deck-card-name">${escapeHtml(card.name)}</div>
          <div class="deck-card-type">${escapeHtml(card.typeLine)}</div>
        </div>
        <div class="deck-card-mana">${renderManaCost(card.manaCost)}</div>
        <div class="deck-card-quantity">
          <button class="btn btn-primary btn-sm qty-minus" data-card-id="${card.id}">−</button>
          <span class="deck-card-qty-value">${quantity}</span>
          <button class="btn btn-primary btn-sm qty-plus" data-card-id="${card.id}">+</button>
        </div>
        <div class="deck-card-price">${price}</div>
        <div class="deck-card-actions">
          <button class="btn btn-primary btn-sm delete-card" data-card-id="${card.id}" title="Remove">✕</button>
        </div>
      </div>
    `;
  }).join('');

  // Update DOM (preserve deck-empty element)
  const existingCards = deckList.querySelectorAll('.deck-card');
  existingCards.forEach(el => el.remove());
  deckList.insertAdjacentHTML('beforeend', cardRows);

  // Add event listeners
  deckList.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCard(btn.dataset.cardId);
    });
  });

  deckList.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cardEntry = cards.find(c => c.card.id === btn.dataset.cardId);
      if (cardEntry) {
        addCard(cardEntry.card);
      }
    });
  });

  deckList.querySelectorAll('.delete-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCard(btn.dataset.cardId);
    });
  });

  // Hover preview
  deckList.querySelectorAll('.deck-card').forEach(row => {
    row.addEventListener('mouseenter', () => {
      const cardEntry = cards.find(c => c.card.id === row.dataset.cardId);
      if (cardEntry && onPreviewCallback) {
        onPreviewCallback(cardEntry.card);
      }
    });
  });
}

/**
 * Render mana cost symbols (simplified)
 */
function renderManaCost(manaCost) {
  if (!manaCost) return '';

  // Simple text representation
  return `<span class="badge">${escapeHtml(manaCost)}</span>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Step 2: Commit**

```bash
git add js/render.js
git commit -m "feat: add render module for preview and deck list"
```

---

## Task 9: Main Application Entry

**Files:**
- Create: `js/app.js`

**Step 1: Write main app module**

Create `js/app.js`:

```javascript
/**
 * Main application entry point
 */

import { initSearch } from './search.js';
import { initRender, renderPreview, renderDeck } from './render.js';
import { subscribe, getDeck, clearDeck } from './deck.js';

/**
 * Current preview card state
 */
let currentPreviewCard = null;

/**
 * Handle card preview updates
 */
function handlePreview(card) {
  currentPreviewCard = card;
  renderPreview(card);
}

/**
 * Handle deck state changes
 */
function handleDeckChange(deckData) {
  renderDeck(deckData);
}

/**
 * Initialize application
 */
function init() {
  // Initialize modules with preview callback
  initRender(handlePreview);
  initSearch(handlePreview);

  // Subscribe to deck changes
  subscribe(handleDeckChange);

  // Initial render
  renderDeck(getDeck());

  // Clear deck button
  const clearBtn = document.getElementById('clear-deck-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all cards from deck?')) {
        clearDeck();
        renderPreview(null);
      }
    });
  }

  console.log('DeckBuilder initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

**Step 2: Verify in browser**

Open `index.html` in browser and test:
1. Type "Lightning Bolt" in search - should show autocomplete
2. Click a result - card adds to deck
3. Hover card in deck - preview shows on left
4. Use +/- buttons - quantity changes
5. Check bottom bar - stats update

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add main application entry point"
```

---

## Task 10: Final Polish and Verification

**Step 1: Full test checklist**

Open `index.html` in browser and verify:

- [ ] Layout displays correctly (3 panels)
- [ ] Search input has olive focus highlight
- [ ] Autocomplete dropdown appears while typing
- [ ] Keyboard navigation works (up/down/enter/escape)
- [ ] Cards add to deck on selection
- [ ] Deck list shows card thumbnail, name, type, mana, quantity, price
- [ ] +/- buttons work
- [ ] Delete (✕) button removes card entirely
- [ ] Hovering cards shows preview
- [ ] Bottom bar stats update correctly
- [ ] Clear button clears deck with confirmation
- [ ] No console errors

**Step 2: Create final commit**

```bash
git add -A
git status
git commit -m "feat: complete vertical slice - search, preview, deck management"
```

---

## Summary

The vertical slice is complete with:

1. **Design System**: Pixel-perfect tokens and component styles matching reference
2. **Layout**: 3-panel responsive grid
3. **Scryfall Integration**: Rate-limited API with caching
4. **Search**: Debounced autocomplete with keyboard nav
5. **Deck Management**: Add, remove, quantity controls
6. **Preview**: Card image and info on hover
7. **Stats**: Live card count and price totals

**Next phases** (future implementation):
- Deck selector with 10 precon decks
- Sideboard/Maybeboard panels
- Stats charts (mana curve, color pie)
- Import/Export
- Filters and view toggle
- LocalStorage persistence
