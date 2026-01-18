# Sideboard/Maybeboard Panels - Design Document

Add sideboard and maybeboard zones as tabs in the main panel.

## Overview

**Goal:** Provide additional card zones for deck planning and card evaluation.

**Key Decisions:**
- Tabs in main panel: Deck, Sideboard, Maybeboard
- All zones have identical functionality
- Stats always show deck data
- Move buttons on each card row for quick transfers

## Tab Navigation

**Location:** Main panel header, replacing static "Deck" title

**HTML:**
```html
<div class="zone-tabs">
  <button class="zone-tab active" data-zone="deck">Deck</button>
  <button class="zone-tab" data-zone="sideboard">Sideboard</button>
  <button class="zone-tab" data-zone="maybeboard">Maybeboard</button>
</div>
```

**Behavior:**
- Clicking a tab switches the visible zone
- Active tab has accent styling
- Each zone maintains its own card list
- Only one zone visible at a time

**Styling:**
- Tabs use `--bg-raised` background, `--accent` for active
- Compact buttons with `--radius-sm`

## Data Layer

**State Structure (js/deck.js):**
```javascript
const state = {
  deck: new Map(),
  sideboard: new Map(),
  maybeboard: new Map()
};
```

**New Functions:**
- `addCardToZone(card, zone)` - Add to specific zone
- `removeCardFromZone(cardId, zone)` - Remove from zone
- `moveCard(cardId, fromZone, toZone)` - Transfer card between zones
- `getZone(zone)` - Get cards for a zone
- `getZoneStats(zone)` - Get stats for a zone

**Subscription:**
- Single `subscribe()` callback receives all zones
- Stats always calculated from `deck` zone only

**Modified flag:**
- Any zone change sets `deckModified = true`
- Precon load clears all zones and resets flag

## Card Row with Move Buttons

**Updated Card Row:**
```html
<div class="deck-card" data-card-id="...">
  <img class="deck-card-thumb" src="..." alt="...">
  <div class="deck-card-info">
    <span class="deck-card-name">Card Name</span>
    <span class="deck-card-type">Creature — Vampire</span>
  </div>
  <div class="deck-card-actions">
    <div class="quantity-controls">...</div>
    <div class="move-controls">
      <button class="btn-move" data-target="sideboard" title="Move to Sideboard">S</button>
      <button class="btn-move" data-target="maybeboard" title="Move to Maybeboard">M</button>
    </div>
  </div>
</div>
```

**Move Button Behavior:**
- Shows buttons for zones other than current
- In Deck: shows "S" and "M" buttons
- In Sideboard: shows "D" and "M" buttons
- In Maybeboard: shows "D" and "S" buttons
- Tooltips clarify the action

## Bottom Bar Updates

**Existing stats unchanged:**
- Cards, Unique, Total price - always show deck data

**New zone indicators:**
```html
<div class="zone-counts">
  <span class="zone-count" data-zone="sideboard">SB: 0</span>
  <span class="zone-count" data-zone="maybeboard">MB: 0</span>
</div>
```

**Behavior:**
- Always visible regardless of active tab
- Shows card count for sideboard and maybeboard
- Clicking a zone count switches to that tab

## File Changes

**Modified:**
- `css/components.css` - Tab styles, move button styles, zone count styles
- `css/layout.css` - Main panel header adjustments for tabs
- `index.html` - Tab markup, zone counts in bottom bar
- `js/deck.js` - Multi-zone state, move functions, zone-aware API
- `js/render.js` - Zone-aware rendering, move button handlers
- `js/app.js` - Tab switching logic, zone integration
