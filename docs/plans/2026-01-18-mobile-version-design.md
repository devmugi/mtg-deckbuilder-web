# Mobile Version Design

## Overview

Add responsive mobile support to the MTG Commander Deck Builder using CSS media queries. Target minimum width: 375px (iPhone SE and up).

## Requirements

- Full editing capability (same as desktop)
- Bottom tab navigation: Deck / Search / Stats
- Card preview via tap-to-open modal
- Sideboard/maybeboard via sub-tabs within Deck tab

## Breakpoints

- `≥769px` — Desktop (current layout, unchanged)
- `≤768px` — Mobile (responsive layout)

## Layout Structure

```
Desktop:                          Mobile:
┌─────────────────────────┐      ┌─────────────────┐
│ topbar                  │      │ topbar (slim)   │
├───────┬─────────────────┤      ├─────────────────┤
│ left  │                 │      │                 │
│ panel │   main panel    │      │  active tab     │
│       │                 │      │  content        │
├───────┴─────────────────┤      │                 │
│ bottombar               │      ├─────────────────┤
└─────────────────────────┘      │ bottom tabs     │
                                 └─────────────────┘
```

### Key Changes

- Hide `.left-panel` on mobile (card preview moves to modal)
- `.main-content` becomes single column
- `.bottombar` stats move into Stats tab
- New `.mobile-tabs` fixed at bottom
- Topbar slims down: icon only + deck selector + hamburger menu

## Deck Tab

### Sub-tabs

```
┌─────────────────────────────────┐
│ Main (99) │ SB (10) │ MB (10)  │
├─────────────────────────────────┤
│ [Card rows...]                  │
└─────────────────────────────────┘
```

- Pill-style tabs, horizontally scrollable
- Active tab: accent background
- Count in parentheses

### Card Row (Mobile)

Desktop 6-column layout compressed to 2-row mobile layout:

```
┌──────┬────────────────────────┬───────┐
│      │ Card Name        ⚪⚪⚫ │ $1.50 │
│ img  ├────────────────────────┼───────┤
│      │ Creature — Human   [−1+]│   ✕   │
└──────┴────────────────────────┴───────┘
```

- Thumbnail: 50px × 36px
- Row height: ~70px
- Touch targets: minimum 44px
- Tap row → preview modal
- Tap buttons → direct action (stopPropagation)

## Search Tab

```
┌─────────────────────────────────┐
│ [Search input]        [🎨 filter]│
├─────────────────────────────────┤
│ │ 🖼 Sol Ring                 │ │
│ │    Artifact         $1.50  │ │
│ │                    [+ Add] │ │
│ ├─────────────────────────────┤ │
│ │ 🖼 Sol Talisman             │ │
│ │    Artifact         $0.25  │ │
│ │                    [+ Add] │ │
└─────────────────────────────────┘
```

- Full-screen vertical list (not dropdown overlay)
- Inline "Add" button per result
- Tap card → preview modal
- Color filter → bottom sheet

## Stats Tab

```
┌─────────────────────────────────┐
│ DECK SUMMARY                    │
│ Cards: 99/100    Total: $636.04 │
├─────────────────────────────────┤
│ MANA CURVE                      │
│ [bar chart]                     │
├─────────────────────────────────┤
│ COLORS                          │
│ ⚪ ⚫ 🔵 🔴 🟢 ◇               │
├─────────────────────────────────┤
│ TYPES                           │
│ Creatures: 34    Lands: 33      │
│ ...                             │
├─────────────────────────────────┤
│ [Export]  [Import]              │
└─────────────────────────────────┘
```

- Scrollable single column
- Export/Import buttons moved here
- Mana curve bars: max 80px height, ~32px width each

## Card Preview Modal

Bottom sheet style:

```
┌─────────────────────────────────┐
│ ─────  (drag handle)            │
├─────────────────────────────────┤
│         [Card Image]            │
│  Card Name                      │
│  Type Line                      │
│  $Price                         │
├─────────────────────────────────┤
│ [− 1 +]     [SB] [MB]     [✕]  │
└─────────────────────────────────┘
```

- Slides up from bottom
- Dark backdrop, tap to dismiss
- Card image: max-width 250px
- Action buttons: 44px height

## Bottom Tabs

```
┌───────────┬───────────┬───────────┐
│   📋      │    🔍     │    📊     │
│   Deck    │  Search   │   Stats   │
└───────────┴───────────┴───────────┘
```

- Fixed position, height: 56px
- Safe area padding: `env(safe-area-inset-bottom)`
- Active tab: accent color

## Topbar (Mobile)

```
┌─────────────────────────────────┐
│ 🔶  Najeela, the Bl... ▼   ☰   │
└─────────────────────────────────┘
```

| Element | Mobile Location |
|---------|-----------------|
| Logo text | Hidden (icon only) |
| Deck selector | Topbar, truncated |
| Search | Search tab |
| Color filter | Search tab |
| Export/Import | Stats tab |
| Social links | Hamburger menu |

## Implementation

### Files to Modify

| File | Changes |
|------|---------|
| `css/layout.css` | `@media (max-width: 768px)` block (~150-200 lines) |
| `css/components.css` | Mobile overrides (~50 lines) |
| `index.html` | Bottom tabs, modal container, hamburger |
| `js/app.js` | Tab switching, modal logic (~30 lines) |

### New CSS Classes

- `.mobile-tabs` — bottom tab bar
- `.mobile-tab` — tab button
- `.tab-content` / `.tab-content.active` — tab content visibility
- `.card-preview-modal` — bottom sheet
- `.modal-backdrop` — overlay

### New HTML

```html
<nav class="mobile-tabs">
  <button class="mobile-tab active" data-tab="deck">Deck</button>
  <button class="mobile-tab" data-tab="search">Search</button>
  <button class="mobile-tab" data-tab="stats">Stats</button>
</nav>

<div class="card-preview-modal hidden">...</div>
<div class="modal-backdrop hidden"></div>
```

### JS Additions

- `setupMobileTabs()` — tab click handlers
- `openCardModal(card)` / `closeCardModal()`

## Approach

CSS-only responsive with minimal JS. Add media queries to existing CSS, no separate mobile codebase.
