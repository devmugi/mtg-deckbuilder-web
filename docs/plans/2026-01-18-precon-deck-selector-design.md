# Precon Deck Selector - Design Document

Add a dropdown to select from 10 prebuilt Commander decks with progressive loading.

## Overview

**Goal:** Let users instantly load full 100-card Commander precon decks to explore the UI.

**Key Decisions:**
- Confirm before replacing modified deck
- Full 100-card authentic decks
- Progressive loading in batches of 10 cards

## UI Design

**Deck Selector:**
- Location: TopBar, between logo and search
- Component: `<select>` dropdown styled to match design system
- Default option: "Select a deck..."

**Loading Indicator:**
- Location: Main panel header, next to "Deck" title
- Shows: "Loading... 30/100 cards"
- Hidden when not loading

**Precon Decks (10):**
1. Elenda, the Dusk Rose (WB Vampires)
2. Wilhelt, the Rotcleaver (UB Zombies)
3. Atraxa, Praetors' Voice (WUBG Superfriends)
4. Prosper, Tome-Bound (BR Treasure)
5. Lathril, Blade of the Elves (BG Elves)
6. The Ur-Dragon (WUBRG Dragons)
7. Aesi, Tyrant of Gyre Strait (UG Sea Monsters)
8. Isshin, Two Heavens as One (RWB Attack Triggers)
9. Miirym, Sentinel Wyrm (URG Dragon Tokens)
10. Dihada, Binder of Wills (RWB Legends)

## Data Layer

**Deck Data (js/precons.js):**
```javascript
export const PRECON_DECKS = [
  {
    id: 'elenda-vampires',
    name: 'Elenda, the Dusk Rose',
    commander: 'Elenda, the Dusk Rose',
    colors: ['W', 'B'],
    cards: ['Elenda, the Dusk Rose', 'Blood Artist', ...] // 100 names
  },
  // ... 9 more decks
];
```

**Modified Detection (js/deck.js):**
- `deckModified` flag - true when user changes deck
- `isModified()` - getter for flag
- `setDeck(cards)` - bulk set cards, resets modified flag

**Batch Fetching (js/scryfall.js):**
```javascript
export async function fetchCardsBatch(names) {
  // POST /cards/collection with { identifiers: [{ name }, ...] }
  // Returns normalized cards array
}
```

## Loading Flow

1. User selects precon from dropdown
2. If `isModified()` → confirm("Load [deck]? Current changes will be lost")
3. If cancelled → reset dropdown to previous, return
4. Clear deck, show loading indicator
5. Chunk card names into batches of 10
6. For each batch:
   - Fetch via `fetchCardsBatch()`
   - Add cards to deck
   - Update progress "Loading... N/100"
7. Hide loading indicator
8. Set `deckModified = false`

## File Changes

**New:**
- `js/precons.js` - Deck definitions with 100 card names each

**Modified:**
- `css/components.css` - `.deck-selector` styles
- `css/layout.css` - `.loading-indicator` styles
- `index.html` - Add selector and loading indicator HTML
- `js/scryfall.js` - Add `fetchCardsBatch()`
- `js/deck.js` - Add modified tracking and `setDeck()`
- `js/app.js` - Add selector handler and loading logic
