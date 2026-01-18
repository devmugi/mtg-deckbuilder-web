# Import/Export - Design Document

Add import and export functionality for deck lists via clipboard.

## Overview

**Goal:** Let users copy deck lists to/from clipboard in standard text format.

**Key Decisions:**
- Format: Simple "1 Card Name" per line
- UI: Buttons in main panel header next to Clear
- Import: Modal with textarea
- Export: Copy to clipboard directly
- Zones: All zones with section headers

## UI Components

**Button Placement:** Main panel header, after existing buttons

**HTML:**
```html
<div class="main-panel-actions">
  <button class="btn btn-primary btn-sm" id="import-btn">Import</button>
  <button class="btn btn-primary btn-sm" id="export-btn">Export</button>
  <button class="btn btn-primary btn-sm" id="clear-deck-btn">Clear</button>
</div>
```

**Import Modal:**
```html
<div class="modal hidden" id="import-modal">
  <div class="modal-content">
    <h2 class="modal-title">Import Deck</h2>
    <textarea class="modal-textarea" id="import-textarea"
              placeholder="1 Sol Ring&#10;1 Command Tower&#10;..."></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary" id="import-cancel">Cancel</button>
      <button class="btn btn-primary" id="import-confirm">Import</button>
    </div>
  </div>
</div>
```

**Toast Notification:** Brief "Copied to clipboard!" message

## Text Format

**Export Format:**
```
1 Sol Ring
1 Command Tower
1 Elenda, the Dusk Rose

// Sideboard
1 Swords to Plowshares
1 Path to Exile

// Maybeboard
1 Phyrexian Arena
```

**Parsing Rules:**
- Lines starting with `//` are section headers
- Empty lines are ignored
- Format: `<quantity> <card name>` or just `<card name>` (assumes 1)
- Quantity can be followed by `x` (e.g., `4x Lightning Bolt`)

## Import Flow

1. User pastes deck list, clicks Import
2. Parse text into zone arrays with card names
3. Clear all zones
4. Show loading indicator
5. Fetch cards in batches (10 at a time)
6. Add each card to appropriate zone
7. Hide modal, show success

**Error Handling:**
- Cards not found: Skip and collect names
- After import: Show message "Imported X cards. Y cards not found: [names]"
- Empty input: Show "No cards to import"

## Export Flow

1. User clicks Export
2. Build text from all zones
3. Copy to clipboard via `navigator.clipboard.writeText()`
4. Show "Copied!" toast for 2 seconds

## File Changes

**Modified:**
- `css/components.css` - Modal styles, toast notification styles
- `index.html` - Import/Export buttons, modal markup, toast element
- `js/app.js` - Import/export handlers, modal logic, clipboard API

**CSS Additions:**
- `.modal` - Overlay and centered content box
- `.modal-content` - Box with padding
- `.modal-textarea` - Large text input area
- `.modal-actions` - Button row
- `.toast` - Fixed position notification
