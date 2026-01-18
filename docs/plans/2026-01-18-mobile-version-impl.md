# Mobile Version Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add responsive mobile layout with bottom tab navigation for 375px+ screens.

**Architecture:** CSS-only responsive using `@media (max-width: 768px)` queries. Minimal JS for tab switching and card preview modal. Single codebase, no separate mobile HTML.

**Tech Stack:** CSS3 media queries, vanilla JavaScript, existing DOM structure

---

## Task 1: Add Mobile HTML Structure

**Files:**
- Modify: `index.html`

**Step 1: Add bottom tabs before closing `</div>` of `.app`**

Find line ~193 (before `</div>` closing `.app`) and add:

```html
    <!-- Mobile Bottom Tabs -->
    <nav class="mobile-tabs" id="mobile-tabs">
      <button class="mobile-tab active" data-tab="deck">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/>
        </svg>
        <span>Deck</span>
      </button>
      <button class="mobile-tab" data-tab="search">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>Search</span>
      </button>
      <button class="mobile-tab" data-tab="stats">
        <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
        <span>Stats</span>
      </button>
    </nav>

    <!-- Card Preview Modal -->
    <div class="card-modal-backdrop hidden" id="card-modal-backdrop"></div>
    <div class="card-modal hidden" id="card-modal">
      <div class="card-modal-handle"></div>
      <div class="card-modal-image" id="card-modal-image"></div>
      <div class="card-modal-info">
        <div class="card-modal-name" id="card-modal-name"></div>
        <div class="card-modal-type" id="card-modal-type"></div>
        <div class="card-modal-price" id="card-modal-price"></div>
      </div>
      <div class="card-modal-actions" id="card-modal-actions"></div>
    </div>
```

**Step 2: Add `tab-content` wrapper classes to existing sections**

Add class `tab-content tab-deck active` to the `<section class="main-panel">`:
```html
<section class="main-panel tab-content tab-deck active">
```

**Step 3: Verify HTML is valid**

Open in browser, check for console errors.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat(mobile): add bottom tabs and card modal HTML structure"
```

---

## Task 2: Add Mobile Base Layout CSS

**Files:**
- Modify: `css/layout.css`

**Step 1: Add mobile media query block at end of file**

```css
/* ==========================================================================
   MOBILE RESPONSIVE (≤768px)
   ========================================================================== */

@media (max-width: 768px) {
  /* Hide desktop-only elements */
  .left-panel {
    display: none;
  }

  .bottombar {
    display: none;
  }

  /* Single column layout */
  .main-content {
    grid-template-columns: 1fr;
  }

  /* Full height main panel */
  .main-panel {
    height: 100%;
    overflow-y: auto;
  }

  /* Make room for bottom tabs */
  .app {
    padding-bottom: 56px;
  }

  /* Deck list mobile grid */
  .deck-list {
    grid-template-columns: 1fr;
    padding: var(--space-sm);
  }
}
```

**Step 2: Test in browser**

Open DevTools, toggle device toolbar to 375px width. Verify:
- Left panel is hidden
- Bottom bar is hidden
- Deck list shows single column

**Step 3: Commit**

```bash
git add css/layout.css
git commit -m "feat(mobile): add base responsive layout hiding desktop elements"
```

---

## Task 3: Style Mobile Bottom Tabs

**Files:**
- Modify: `css/layout.css`

**Step 1: Add bottom tabs styles inside the media query**

```css
  /* Mobile Bottom Tabs */
  .mobile-tabs {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 56px;
    display: flex;
    background: var(--bg-raised);
    border-top: 1px solid var(--border-subtle);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 100;
  }

  .mobile-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 10px;
    cursor: pointer;
    transition: color var(--transition-fast);
  }

  .mobile-tab svg {
    width: 24px;
    height: 24px;
  }

  .mobile-tab.active {
    color: var(--accent);
  }

  .mobile-tab:hover {
    color: var(--text-primary);
  }
```

**Step 2: Hide tabs on desktop - add outside media query**

At end of file, outside the media query:

```css
/* Hide mobile elements on desktop */
.mobile-tabs,
.card-modal,
.card-modal-backdrop {
  display: none;
}

@media (max-width: 768px) {
  .mobile-tabs {
    display: flex;
  }
}
```

**Step 3: Test in browser**

- Desktop: tabs should be hidden
- Mobile (375px): tabs visible at bottom with icons

**Step 4: Commit**

```bash
git add css/layout.css
git commit -m "feat(mobile): style bottom navigation tabs"
```

---

## Task 4: Style Mobile Topbar

**Files:**
- Modify: `css/layout.css`

**Step 1: Add topbar mobile styles inside media query**

```css
  /* Mobile Topbar */
  .topbar {
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-sm);
  }

  .logo span {
    display: none;
  }

  .logo-icon {
    width: 28px;
    height: 28px;
  }

  .search-container {
    display: none;
  }

  .topbar-actions {
    gap: var(--space-sm);
  }

  .topbar-actions .btn {
    display: none;
  }

  .deck-selector {
    flex: 1;
    min-width: 0;
  }

  .deck-selector-button {
    max-width: 100%;
  }

  .deck-selector-button .deck-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
```

**Step 2: Test in browser at 375px**

- Logo text hidden, icon only
- Search bar hidden
- Export button hidden
- Deck selector fills space, truncates long names
- Social links still visible

**Step 3: Commit**

```bash
git add css/layout.css
git commit -m "feat(mobile): slim down topbar for mobile"
```

---

## Task 5: Style Mobile Card Rows

**Files:**
- Modify: `css/layout.css`

**Step 1: Add mobile card row styles inside media query**

```css
  /* Mobile Card Row - 2-row compact layout */
  .deck-card {
    grid-template-columns: 50px 1fr auto;
    grid-template-rows: auto auto;
    gap: var(--space-xs);
    padding: var(--space-sm);
    min-height: 70px;
  }

  .deck-card-thumb {
    grid-row: span 2;
    width: 50px;
    height: 36px;
  }

  .deck-card-info {
    grid-column: 2;
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .deck-card-name {
    flex: 1;
    min-width: 0;
  }

  .deck-card-mana {
    flex-shrink: 0;
  }

  .deck-card-price {
    grid-column: 3;
    grid-row: 1;
    width: auto;
    font-size: var(--font-size-xs);
  }

  .deck-card-type {
    grid-column: 2;
    grid-row: 2;
  }

  .deck-card-quantity {
    grid-column: 3;
    grid-row: 2;
    justify-self: end;
  }

  .deck-card-controls .btn {
    min-width: 36px;
    min-height: 36px;
  }

  .deck-card-actions {
    display: none;
  }
```

**Step 2: Test in browser at 375px**

- Card rows show 2-line compact layout
- Thumbnail on left spanning both rows
- Name + mana on first row, type + controls on second
- Touch targets are 36px+

**Step 3: Commit**

```bash
git add css/layout.css
git commit -m "feat(mobile): compact 2-row card layout for touch"
```

---

## Task 6: Style Card Preview Modal

**Files:**
- Modify: `css/components.css`

**Step 1: Add card modal styles at end of file**

```css
/* ==========================================================================
   CARD PREVIEW MODAL (Mobile)
   ========================================================================== */

.card-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  opacity: 0;
  transition: opacity var(--transition-normal);
}

.card-modal-backdrop.visible {
  opacity: 1;
}

.card-modal {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-raised);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  padding: var(--space-md);
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
  z-index: 201;
  transform: translateY(100%);
  transition: transform var(--transition-normal);
  max-height: 85vh;
  overflow-y: auto;
}

.card-modal.visible {
  transform: translateY(0);
}

.card-modal-handle {
  width: 40px;
  height: 4px;
  background: var(--border-default);
  border-radius: 2px;
  margin: 0 auto var(--space-md);
}

.card-modal-image {
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-md);
}

.card-modal-image img {
  max-width: 250px;
  width: 100%;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-mid);
}

.card-modal-info {
  text-align: center;
  margin-bottom: var(--space-md);
}

.card-modal-name {
  font-size: var(--font-size-lg);
  font-weight: bold;
  margin-bottom: var(--space-xs);
}

.card-modal-type {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}

.card-modal-price {
  font-size: var(--font-size-md);
  color: var(--accent);
  font-weight: 500;
}

.card-modal-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
  flex-wrap: wrap;
}

.card-modal-actions .btn {
  min-height: 44px;
  min-width: 44px;
}
```

**Step 2: Test modal styles exist**

The modal won't be functional yet (needs JS), but verify CSS loads without errors.

**Step 3: Commit**

```bash
git add css/components.css
git commit -m "feat(mobile): add card preview modal styles"
```

---

## Task 7: Add Tab Switching JavaScript

**Files:**
- Modify: `js/app.js`

**Step 1: Add mobile tab setup function after imports**

Find a good location after the initial state variables (~line 36) and add:

```javascript
/**
 * Mobile tab navigation state
 */
let currentMobileTab = 'deck';

/**
 * Setup mobile tab navigation
 */
function setupMobileTabs() {
  const tabsContainer = document.getElementById('mobile-tabs');
  if (!tabsContainer) return;

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.mobile-tab');
    if (!tab) return;

    const tabName = tab.dataset.tab;
    if (tabName === currentMobileTab) return;

    // Update active tab button
    tabsContainer.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Show/hide content based on tab
    currentMobileTab = tabName;
    updateMobileTabContent();
  });
}

/**
 * Update visible content based on current mobile tab
 */
function updateMobileTabContent() {
  const mainPanel = document.querySelector('.main-panel');
  const leftPanel = document.querySelector('.left-panel');
  const filterBar = document.getElementById('filter-bar');
  const searchContainer = document.querySelector('.search-container');

  // Reset visibility
  if (mainPanel) mainPanel.style.display = '';
  if (leftPanel) leftPanel.style.display = '';
  if (filterBar) filterBar.style.display = '';
  if (searchContainer) searchContainer.style.display = '';

  // Only apply on mobile
  if (window.innerWidth > 768) return;

  switch (currentMobileTab) {
    case 'deck':
      if (leftPanel) leftPanel.style.display = 'none';
      if (searchContainer) searchContainer.style.display = 'none';
      break;
    case 'search':
      if (leftPanel) leftPanel.style.display = 'none';
      if (filterBar) filterBar.style.display = 'none';
      if (searchContainer) searchContainer.style.display = 'block';
      break;
    case 'stats':
      if (mainPanel) mainPanel.style.display = 'none';
      if (leftPanel) leftPanel.style.display = 'flex';
      if (searchContainer) searchContainer.style.display = 'none';
      break;
  }
}
```

**Step 2: Call setup in init function**

Find the `init()` function (around line 400+) and add `setupMobileTabs();` call:

```javascript
// Add near the end of init() before the initial deck load
setupMobileTabs();
window.addEventListener('resize', updateMobileTabContent);
```

**Step 3: Test tab switching**

- Open at 375px viewport
- Click each tab
- Deck: shows deck list + filter bar
- Search: shows search input
- Stats: shows left panel (mana curve, colors)

**Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat(mobile): add tab switching navigation"
```

---

## Task 8: Add Card Preview Modal JavaScript

**Files:**
- Modify: `js/app.js`

**Step 1: Add modal state and functions**

Add after the mobile tab functions:

```javascript
/**
 * Card modal state
 */
let cardModalCard = null;

/**
 * Open card preview modal
 */
function openCardModal(card, zone = 'deck') {
  if (!card || window.innerWidth > 768) return;

  cardModalCard = { card, zone };

  const backdrop = document.getElementById('card-modal-backdrop');
  const modal = document.getElementById('card-modal');
  const imageContainer = document.getElementById('card-modal-image');
  const nameEl = document.getElementById('card-modal-name');
  const typeEl = document.getElementById('card-modal-type');
  const priceEl = document.getElementById('card-modal-price');
  const actionsEl = document.getElementById('card-modal-actions');

  // Populate content
  const imageUrl = card.imageUris?.normal || card.imageUris?.small || '';
  imageContainer.innerHTML = imageUrl ? `<img src="${imageUrl}" alt="${card.name}">` : '';
  nameEl.textContent = card.name;
  typeEl.textContent = card.typeLine || '';
  priceEl.textContent = card.prices?.usd ? `$${card.prices.usd}` : '';

  // Build action buttons
  actionsEl.innerHTML = `
    <button class="btn btn-secondary btn-sm" data-action="remove">
      <span>−</span>
    </button>
    <span style="min-width: 30px; text-align: center;">1</span>
    <button class="btn btn-secondary btn-sm" data-action="add">
      <span>+</span>
    </button>
    <button class="btn btn-secondary btn-sm" data-action="sideboard">SB</button>
    <button class="btn btn-secondary btn-sm" data-action="maybeboard">MB</button>
    <button class="btn btn-danger btn-sm" data-action="delete">✕</button>
  `;

  // Show modal
  backdrop.classList.remove('hidden');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  });
}

/**
 * Close card preview modal
 */
function closeCardModal() {
  const backdrop = document.getElementById('card-modal-backdrop');
  const modal = document.getElementById('card-modal');

  backdrop.classList.remove('visible');
  modal.classList.remove('visible');

  setTimeout(() => {
    backdrop.classList.add('hidden');
    modal.classList.add('hidden');
    cardModalCard = null;
  }, 200);
}

/**
 * Setup card modal event listeners
 */
function setupCardModal() {
  const backdrop = document.getElementById('card-modal-backdrop');
  const actionsEl = document.getElementById('card-modal-actions');

  if (backdrop) {
    backdrop.addEventListener('click', closeCardModal);
  }

  if (actionsEl) {
    actionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || !cardModalCard) return;

      const action = btn.dataset.action;
      const { card, zone } = cardModalCard;

      switch (action) {
        case 'add':
          addCardToZone(card, zone);
          break;
        case 'remove':
          removeCardFromZone(card.id, zone);
          break;
        case 'delete':
          deleteCard(card.id, zone);
          closeCardModal();
          break;
        case 'sideboard':
          moveCard(card.id, zone, 'sideboard');
          closeCardModal();
          break;
        case 'maybeboard':
          moveCard(card.id, zone, 'maybeboard');
          closeCardModal();
          break;
      }
    });
  }
}
```

**Step 2: Call setup in init()**

Add `setupCardModal();` in the init function after `setupMobileTabs();`

**Step 3: Wire up card row taps to open modal**

Find the `renderCurrentZone` function and modify the `onPreview` handler to also open modal on mobile:

In the handlers object, modify `onPreview`:

```javascript
onPreview: (card, zone) => {
  handlePreview(card);
  // On mobile, tapping opens modal
  if (window.innerWidth <= 768 && card) {
    openCardModal(card, zone || 'deck');
  }
},
```

**Step 4: Test card modal**

- Open at 375px
- Tap a card row
- Modal should slide up with card image and actions
- Tap backdrop to close

**Step 5: Commit**

```bash
git add js/app.js
git commit -m "feat(mobile): add card preview modal with actions"
```

---

## Task 9: Mobile Search Tab Styles

**Files:**
- Modify: `css/layout.css`

**Step 1: Add search styles for mobile inside media query**

```css
  /* Mobile Search Tab */
  .search-container.mobile-visible {
    display: block;
    position: fixed;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 56px;
    padding: var(--space-md);
    background: var(--bg-base);
    z-index: 50;
    overflow-y: auto;
  }

  .search-container.mobile-visible .search-input-wrapper {
    margin-bottom: var(--space-md);
  }

  .search-container.mobile-visible .dropdown {
    position: static;
    max-height: none;
    box-shadow: none;
    border: 1px solid var(--border-subtle);
  }
```

**Step 2: Update JS to add mobile-visible class**

In `updateMobileTabContent()`, update the search case:

```javascript
case 'search':
  if (leftPanel) leftPanel.style.display = 'none';
  if (filterBar) filterBar.style.display = 'none';
  if (searchContainer) {
    searchContainer.style.display = 'block';
    searchContainer.classList.add('mobile-visible');
  }
  break;
```

And in the reset section at the top:

```javascript
if (searchContainer) {
  searchContainer.style.display = '';
  searchContainer.classList.remove('mobile-visible');
}
```

**Step 3: Test search tab**

- Switch to Search tab on mobile
- Search input should be full width at top
- Results should show below as scrollable list

**Step 4: Commit**

```bash
git add css/layout.css js/app.js
git commit -m "feat(mobile): style search tab as full-screen overlay"
```

---

## Task 10: Mobile Stats Tab Styles

**Files:**
- Modify: `css/layout.css`

**Step 1: Add stats panel mobile styles inside media query**

```css
  /* Mobile Stats Tab */
  .left-panel.mobile-visible {
    display: flex;
    position: fixed;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 56px;
    border-right: none;
    z-index: 50;
  }

  .left-panel.mobile-visible .stats-panel {
    flex: 1;
    overflow-y: auto;
  }

  .left-panel.mobile-visible .card-preview {
    display: none;
  }
```

**Step 2: Update JS to add mobile-visible class for stats**

In `updateMobileTabContent()`, update the stats case:

```javascript
case 'stats':
  if (mainPanel) mainPanel.style.display = 'none';
  if (leftPanel) {
    leftPanel.style.display = 'flex';
    leftPanel.classList.add('mobile-visible');
  }
  if (searchContainer) searchContainer.style.display = 'none';
  break;
```

And in the reset section:

```javascript
if (leftPanel) {
  leftPanel.style.display = '';
  leftPanel.classList.remove('mobile-visible');
}
```

**Step 3: Test stats tab**

- Switch to Stats tab on mobile
- Mana curve and color pie should show full screen
- Card preview should be hidden

**Step 4: Commit**

```bash
git add css/layout.css js/app.js
git commit -m "feat(mobile): style stats tab as full-screen view"
```

---

## Task 11: Final Testing & Polish

**Files:**
- All modified files

**Step 1: Test complete flow on 375px viewport**

Checklist:
- [ ] Deck tab shows card list with compact rows
- [ ] Tapping card opens preview modal
- [ ] Modal actions work (add, remove, move to SB/MB)
- [ ] Search tab shows input and results
- [ ] Adding card from search works
- [ ] Stats tab shows mana curve and colors
- [ ] Deck selector works and truncates long names
- [ ] Tab switching is smooth
- [ ] No horizontal scroll

**Step 2: Test on desktop (>768px)**

Checklist:
- [ ] Layout unchanged from before
- [ ] Mobile tabs hidden
- [ ] Card modal hidden
- [ ] All features work as before

**Step 3: Fix any issues found**

Address any bugs discovered during testing.

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(mobile): complete responsive mobile support

- Bottom tab navigation (Deck/Search/Stats)
- Compact 2-row card layout for touch
- Card preview modal with actions
- Full-screen search and stats tabs
- Slim topbar with truncated deck name
- Safe area support for notched phones"
```

**Step 5: Push to GitHub**

```bash
git push origin master
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | HTML structure | index.html |
| 2 | Base layout CSS | layout.css |
| 3 | Bottom tabs CSS | layout.css |
| 4 | Mobile topbar CSS | layout.css |
| 5 | Mobile card rows CSS | layout.css |
| 6 | Card modal CSS | components.css |
| 7 | Tab switching JS | app.js |
| 8 | Card modal JS | app.js |
| 9 | Search tab styles | layout.css, app.js |
| 10 | Stats tab styles | layout.css, app.js |
| 11 | Testing & polish | all |

**Estimated commits:** 11
