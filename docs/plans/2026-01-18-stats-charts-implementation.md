# Stats Charts Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add mana curve bar chart and color distribution pie chart to left panel.

**Architecture:** Pure CSS charts (flex bars, conic-gradient pie), new stats.js module for calculations, integrate with existing deck pub/sub.

**Tech Stack:** Vanilla CSS, JavaScript ES6 modules

---

### Task 1: Add MTG Color Tokens

**Files:**
- Modify: `css/tokens.css`

**Step 1: Add MTG color variables**

Add after the semantic colors section:

```css
/* MTG Colors */
--mtg-white: #f9faf4;
--mtg-blue: #0e68ab;
--mtg-black: #150b00;
--mtg-red: #d3202a;
--mtg-green: #00733e;
--mtg-colorless: #888888;
```

**Step 2: Commit**

```bash
git add css/tokens.css
git commit -m "feat: add MTG color tokens"
```

---

### Task 2: Add Stats Panel Styles

**Files:**
- Modify: `css/components.css`

**Step 1: Add stats panel component styles**

Add at end of file:

```css
/* Stats Panel */
.stats-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-raised);
  border-radius: var(--radius-md);
}

.stats-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.stats-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Mana Curve */
.mana-curve {
  display: flex;
  gap: 4px;
  height: 60px;
  align-items: flex-end;
}

.mana-bar-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mana-bar {
  flex: 1;
  background: var(--bg-inset);
  border-radius: var(--radius-sm);
  position: relative;
  min-height: 40px;
}

.mana-bar-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--accent);
  border-radius: var(--radius-sm);
  transition: height 0.2s ease;
}

.mana-bar-label {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
  line-height: 1;
}

/* Color Pie */
.color-pie {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--bg-inset);
  margin: 0 auto;
  transition: background 0.2s ease;
}

.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: var(--space-sm);
}

.color-legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.color-swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.color-swatch--W { background: var(--mtg-white); }
.color-swatch--U { background: var(--mtg-blue); }
.color-swatch--B { background: var(--mtg-black); }
.color-swatch--R { background: var(--mtg-red); }
.color-swatch--G { background: var(--mtg-green); }
.color-swatch--C { background: var(--mtg-colorless); }
```

**Step 2: Commit**

```bash
git add css/components.css
git commit -m "feat: add stats panel component styles"
```

---

### Task 3: Update Layout for Stats Panel

**Files:**
- Modify: `css/layout.css`

**Step 1: Update left panel layout**

Find `.left-panel` and update to include gap for stats panel:

```css
.left-panel {
  background: var(--bg-base);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  overflow-y: auto;
}
```

**Step 2: Commit**

```bash
git add css/layout.css
git commit -m "feat: update left panel layout for stats"
```

---

### Task 4: Add Stats Panel HTML

**Files:**
- Modify: `index.html`

**Step 1: Add stats panel after card-preview div**

Inside the `<aside class="left-panel">`, after the `card-preview` div, add:

```html
<div class="stats-panel" id="stats-panel">
  <div class="stats-section">
    <h3 class="stats-title">Mana Curve</h3>
    <div class="mana-curve" id="mana-curve">
      <div class="mana-curve-empty">No cards</div>
    </div>
  </div>
  <div class="stats-section">
    <h3 class="stats-title">Colors</h3>
    <div class="color-pie" id="color-pie"></div>
    <div class="color-legend" id="color-legend"></div>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add stats panel HTML structure"
```

---

### Task 5: Create Stats Calculation Module

**Files:**
- Create: `js/stats.js`

**Step 1: Create stats.js with calculation functions**

```javascript
/**
 * Stats calculation module
 * Calculates mana curve and color distribution from deck cards
 */

/**
 * Calculate mana curve distribution (CMC 0-7+)
 * @param {Array} cards - Array of card objects with cmc and quantity
 * @returns {Array} Array of 8 counts for CMC 0-7+
 */
export function calculateManaCurve(cards) {
  const curve = [0, 0, 0, 0, 0, 0, 0, 0];

  cards.forEach(card => {
    const cmc = Math.min(Math.floor(card.cmc || 0), 7);
    curve[cmc] += card.quantity;
  });

  return curve;
}

/**
 * Calculate color distribution
 * Each color on a card is counted once per copy
 * @param {Array} cards - Array of card objects with colors and quantity
 * @returns {Object} Color counts { W, U, B, R, G, C }
 */
export function calculateColorDistribution(cards) {
  const colors = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

  cards.forEach(card => {
    const cardColors = card.colors || [];

    if (cardColors.length === 0) {
      // Colorless card
      colors.C += card.quantity;
    } else {
      // Count each color once per copy
      cardColors.forEach(color => {
        if (colors.hasOwnProperty(color)) {
          colors[color] += card.quantity;
        }
      });
    }
  });

  return colors;
}
```

**Step 2: Commit**

```bash
git add js/stats.js
git commit -m "feat: add stats calculation module"
```

---

### Task 6: Add Stats Render Functions

**Files:**
- Modify: `js/render.js`

**Step 1: Add mana curve render function**

Add after existing render functions:

```javascript
/**
 * Render mana curve bar chart
 * @param {Array} curve - Array of 8 counts for CMC 0-7+
 */
export function renderManaCurve(curve) {
  const container = document.getElementById('mana-curve');
  if (!container) return;

  const max = Math.max(...curve, 1); // Avoid division by zero

  const bars = curve.map((count, i) => {
    const height = (count / max) * 100;
    const label = i === 7 ? '7+' : String(i);

    return `
      <div class="mana-bar-container">
        <div class="mana-bar">
          <div class="mana-bar-fill" style="height: ${height}%" title="${count} cards at CMC ${label}"></div>
        </div>
        <div class="mana-bar-label">${label}</div>
      </div>
    `;
  }).join('');

  container.innerHTML = bars;
}

/**
 * Render color distribution pie chart
 * @param {Object} colors - Color counts { W, U, B, R, G, C }
 */
export function renderColorPie(colors) {
  const pie = document.getElementById('color-pie');
  const legend = document.getElementById('color-legend');
  if (!pie || !legend) return;

  const colorOrder = ['W', 'U', 'B', 'R', 'G', 'C'];
  const colorVars = {
    W: 'var(--mtg-white)',
    U: 'var(--mtg-blue)',
    B: 'var(--mtg-black)',
    R: 'var(--mtg-red)',
    G: 'var(--mtg-green)',
    C: 'var(--mtg-colorless)'
  };

  const total = Object.values(colors).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    // Empty state
    pie.style.background = 'var(--bg-inset)';
    legend.innerHTML = '';
    return;
  }

  // Build conic gradient
  const segments = [];
  let currentAngle = 0;

  colorOrder.forEach(color => {
    const count = colors[color];
    if (count > 0) {
      const angle = (count / total) * 360;
      segments.push(`${colorVars[color]} ${currentAngle}deg ${currentAngle + angle}deg`);
      currentAngle += angle;
    }
  });

  pie.style.background = `conic-gradient(${segments.join(', ')})`;

  // Build legend
  const legendItems = colorOrder
    .filter(color => colors[color] > 0)
    .map(color => `
      <div class="color-legend-item">
        <div class="color-swatch color-swatch--${color}"></div>
        <span>${color}: ${colors[color]}</span>
      </div>
    `)
    .join('');

  legend.innerHTML = legendItems;
}
```

**Step 2: Commit**

```bash
git add js/render.js
git commit -m "feat: add stats render functions"
```

---

### Task 7: Integrate Stats with App

**Files:**
- Modify: `js/app.js`

**Step 1: Import stats module and render functions**

Add to imports at top:

```javascript
import { calculateManaCurve, calculateColorDistribution } from './stats.js';
```

Update render imports to include new functions:

```javascript
import { renderPreview, renderDeck, renderManaCurve, renderColorPie } from './render.js';
```

**Step 2: Create updateStats function**

Add after other helper functions:

```javascript
function updateStats(cards) {
  const curve = calculateManaCurve(cards);
  const colors = calculateColorDistribution(cards);
  renderManaCurve(curve);
  renderColorPie(colors);
}
```

**Step 3: Subscribe stats to deck changes**

Find where deck.subscribe is called and update to include stats:

```javascript
deck.subscribe(cards => {
  renderDeck(cards, handlePreview, handleAdd, handleRemove);
  updateStats(cards);
});
```

**Step 4: Initialize stats on load**

After initializing deck subscriber, add initial stats render:

```javascript
// Initial render
updateStats(deck.getCards());
```

**Step 5: Commit**

```bash
git add js/app.js
git commit -m "feat: integrate stats with deck updates"
```

---

### Task 8: Test and Verify

**Step 1: Open in browser and test**

1. Open index.html in browser
2. Verify stats panel appears below card preview
3. Search and add a card - verify mana curve updates
4. Add cards of different colors - verify pie chart updates
5. Load a precon deck - verify full stats display
6. Clear deck - verify stats reset to empty state

**Step 2: Final commit if any fixes needed**

```bash
git status
# If changes needed, commit them
```
