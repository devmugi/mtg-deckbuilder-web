# Stats Charts - Design Document

Add mana curve and color distribution charts to visualize deck composition.

## Overview

**Goal:** Display real-time deck statistics in the left panel below card preview.

**Key Decisions:**
- Location: Left panel, below card preview
- Rendering: Pure CSS (no libraries)
- Mana curve: 0-7+ range (8 bars)
- Color counting: Each color counted once per card

## Layout & Structure

**HTML:**
```html
<div class="stats-panel">
  <div class="stats-section">
    <h3 class="stats-title">Mana Curve</h3>
    <div class="mana-curve" id="mana-curve"></div>
  </div>
  <div class="stats-section">
    <h3 class="stats-title">Colors</h3>
    <div class="color-pie" id="color-pie"></div>
    <div class="color-legend" id="color-legend"></div>
  </div>
</div>
```

**Sizing:**
- Panel width: matches left panel (256px)
- Mana curve height: ~80px (bars + labels)
- Color pie: 120px diameter
- Legend: below pie, compact text

## Mana Curve

**Bar Chart Design:**
- Background: `--bg-inset` for bar track
- Filled portion: `--accent` (olive green)
- Labels: 0, 1, 2, 3, 4, 5, 6, 7+
- Height scales to max count (tallest bar = 100%)
- Hover: tooltip showing count

**CSS:**
```css
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
}

.mana-bar {
  flex: 1;
  background: var(--bg-inset);
  border-radius: var(--radius-sm);
  position: relative;
}

.mana-bar-fill {
  position: absolute;
  bottom: 0;
  width: 100%;
  background: var(--accent);
  border-radius: var(--radius-sm);
}

.mana-bar-label {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: 4px;
}
```

## Color Pie

**MTG Colors:**
```css
--mtg-white: #f9faf4;
--mtg-blue: #0e68ab;
--mtg-black: #150b00;
--mtg-red: #d3202a;
--mtg-green: #00733e;
--mtg-colorless: #888888;
```

**Pie Chart (conic-gradient):**
```css
.color-pie {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: conic-gradient(/* segments calculated dynamically */);
  margin: 0 auto;
}
```

**Legend:**
```css
.color-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
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
}
```

## Data Layer

**New file: js/stats.js**

```javascript
export function calculateManaCurve(cards) {
  const curve = [0, 0, 0, 0, 0, 0, 0, 0];
  cards.forEach(card => {
    const cmc = Math.min(card.cmc || 0, 7);
    curve[cmc] += card.quantity;
  });
  return curve;
}

export function calculateColorDistribution(cards) {
  const colors = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };
  cards.forEach(card => {
    const cardColors = card.colors || [];
    if (cardColors.length === 0) {
      colors.C += card.quantity;
    } else {
      cardColors.forEach(c => colors[c] += card.quantity);
    }
  });
  return colors;
}
```

## Updates

- Subscribe to deck changes via existing pub/sub
- Recalculate stats on every add/remove/clear
- Update DOM with new values

**Empty State:**
- Mana curve: all bars at 0 height
- Color pie: solid `--bg-inset` circle
- Legend: hidden when no cards

## File Changes

**New:**
- `js/stats.js` - Calculation functions

**Modified:**
- `css/tokens.css` - Add MTG color variables
- `css/components.css` - Stats panel styles
- `css/layout.css` - Left panel layout adjustments
- `index.html` - Add stats panel HTML
- `js/render.js` - Add renderManaCurve, renderColorPie
- `js/app.js` - Subscribe stats to deck changes
