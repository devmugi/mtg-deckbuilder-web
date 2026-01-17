# Precon Deck Selector Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add dropdown to select from 10 Commander precon decks with progressive loading.

**Architecture:** New precons.js stores deck lists (card names only). Modified deck.js tracks changes and supports bulk loading. Scryfall batch endpoint fetches cards in groups of 10. App.js orchestrates loading with progress indicator.

**Tech Stack:** Vanilla JavaScript ES6 modules, Scryfall Collection API

---

## Task 1: Deck Selector Styles

**Files:**
- Modify: `css/components.css`

**Step 1: Add deck selector styles**

Add to end of `css/components.css`:

```css
/* ============================================
   DECK SELECTOR
   ============================================ */

.deck-selector {
  padding: var(--space-sm) var(--space-md);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  background: var(--bg-inset);
  border: 2px solid var(--border-default);
  border-radius: var(--radius-md);
  cursor: pointer;
  outline: none;
  transition: all var(--transition-fast);
  min-width: 200px;
}

.deck-selector:hover {
  border-color: var(--border-strong);
}

.deck-selector:focus {
  border-color: var(--accent);
}

.deck-selector option {
  background: var(--bg-raised);
  color: var(--text-primary);
}
```

**Step 2: Commit**

```bash
git add css/components.css
git commit -m "feat: add deck selector styles"
```

---

## Task 2: Loading Indicator Styles

**Files:**
- Modify: `css/layout.css`

**Step 1: Add loading indicator styles**

Add after `.main-panel-title` section in `css/layout.css`:

```css
.loading-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--accent);
}

.loading-indicator::before {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-default);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Step 2: Commit**

```bash
git add css/layout.css
git commit -m "feat: add loading indicator styles with spinner"
```

---

## Task 3: HTML Updates

**Files:**
- Modify: `index.html`

**Step 1: Add deck selector to topbar**

In `index.html`, after the logo div (around line 22), add:

```html
      <select class="deck-selector" id="deck-selector">
        <option value="">Select a deck...</option>
      </select>
```

**Step 2: Add loading indicator to main panel header**

In the `.main-panel-header` div, after the title h1, add:

```html
          <span class="loading-indicator hidden" id="loading-indicator">
            Loading... <span id="loading-progress">0/100</span>
          </span>
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add deck selector and loading indicator HTML"
```

---

## Task 4: Scryfall Batch Fetch

**Files:**
- Modify: `js/scryfall.js`

**Step 1: Add fetchCardsBatch function**

Add to `js/scryfall.js` before the `getCachedCard` export:

```javascript
/**
 * Fetch multiple cards by name using collection endpoint
 * @param {string[]} names - Array of card names
 * @returns {Promise<Object[]>} - Array of normalized cards
 */
export async function fetchCardsBatch(names) {
  if (!names || names.length === 0) {
    return [];
  }

  // Build identifiers for collection endpoint
  const identifiers = names.map(name => ({ name }));

  try {
    // Collection endpoint allows up to 75 cards per request
    const response = await fetch(`${SCRYFALL_API}/cards/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiers }),
    });

    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize and cache each card
    const cards = (data.data || []).map(card => {
      const normalized = normalizeCard(card);
      cardCache.set(card.name.toLowerCase(), normalized);
      return normalized;
    });

    return cards;
  } catch (error) {
    console.error('Batch fetch error:', error);
    return [];
  }
}
```

**Step 2: Commit**

```bash
git add js/scryfall.js
git commit -m "feat: add batch card fetch using collection endpoint"
```

---

## Task 5: Deck State Modifications

**Files:**
- Modify: `js/deck.js`

**Step 1: Add modified tracking**

At the top of `js/deck.js`, modify the state object to add `modified` flag:

```javascript
// Deck state
const state = {
  cards: new Map(), // cardId -> { card, quantity }
  listeners: new Set(),
  modified: false,
  currentPrecon: null
};
```

**Step 2: Add isModified getter**

Add after the `subscribe` function:

```javascript
/**
 * Check if deck has been modified
 */
export function isModified() {
  return state.modified;
}

/**
 * Get current precon ID
 */
export function getCurrentPrecon() {
  return state.currentPrecon;
}
```

**Step 3: Update addCard to set modified**

Modify `addCard` to set modified flag - add before `notifyListeners()`:

```javascript
  state.modified = true;
```

**Step 4: Update removeCard to set modified**

Modify `removeCard` to set modified flag - add before `notifyListeners()`:

```javascript
  state.modified = true;
```

**Step 5: Update deleteCard to set modified**

Modify `deleteCard` to set modified flag - add before `notifyListeners()`:

```javascript
  state.modified = true;
```

**Step 6: Add setDeck function for bulk loading**

Add before `getDeck`:

```javascript
/**
 * Set deck contents (for loading precons)
 * @param {Object[]} cards - Array of card objects
 * @param {string|null} preconId - Precon ID or null
 */
export function setDeck(cards, preconId = null) {
  state.cards.clear();

  cards.forEach(card => {
    const existing = state.cards.get(card.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.cards.set(card.id, { card, quantity: 1 });
    }
  });

  state.modified = false;
  state.currentPrecon = preconId;
  notifyListeners();
}
```

**Step 7: Update clearDeck to reset state**

Modify `clearDeck` to also reset modified and precon:

```javascript
export function clearDeck() {
  state.cards.clear();
  state.modified = false;
  state.currentPrecon = null;
  notifyListeners();
}
```

**Step 8: Commit**

```bash
git add js/deck.js
git commit -m "feat: add deck modified tracking and setDeck for bulk loading"
```

---

## Task 6: Precon Deck Data

**Files:**
- Create: `js/precons.js`

**Step 1: Create precons.js with deck definitions**

Create `js/precons.js`:

```javascript
/**
 * Preconstructed Commander deck definitions
 * Card names only - fetched from Scryfall on demand
 */

export const PRECON_DECKS = [
  {
    id: 'elenda-vampires',
    name: 'Elenda, the Dusk Rose',
    commander: 'Elenda, the Dusk Rose',
    colors: ['W', 'B'],
    cards: [
      'Elenda, the Dusk Rose',
      'Blood Artist',
      'Bloodline Keeper',
      'Butcher of Malakir',
      'Champion of Dusk',
      'Cordial Vampire',
      'Dusk Legion Zealot',
      'Falkenrath Noble',
      'Indulgent Aristocrat',
      'Knight of the Ebon Legion',
      'Legion Lieutenant',
      'Malakir Bloodwitch',
      'Mavren Fein, Dusk Apostle',
      'Sanctum Seeker',
      'Twilight Prophet',
      'Vampire Nighthawk',
      'Viscera Seer',
      'Vito, Thorn of the Dusk Rose',
      'Yahenni, Undying Partisan',
      'Zagras, Thief of Heartbeats',
      'Anguished Unmaking',
      'Utter End',
      'Swords to Plowshares',
      'Path to Exile',
      'Mortify',
      'Vindicate',
      'Damn',
      'Wrath of God',
      'Toxic Deluge',
      'Living Death',
      'Phyrexian Arena',
      'Black Market',
      'Anointed Procession',
      'Dictate of Erebos',
      'Grave Pact',
      'Cathars Crusade',
      'Sol Ring',
      'Arcane Signet',
      'Orzhov Signet',
      'Talisman of Hierarchy',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Skullclamp',
      'Coat of Arms',
      'Door of Destinies',
      'Herald\'s Horn',
      'Vanquisher\'s Banner',
      'Command Tower',
      'Godless Shrine',
      'Isolated Chapel',
      'Caves of Koilos',
      'Concealed Courtyard',
      'Shambling Vent',
      'Vault of Champions',
      'Brightclimb Pathway',
      'Temple of Silence',
      'Orzhov Basilica',
      'Tainted Field',
      'Bojuka Bog',
      'Castle Locthwain',
      'Nykthos, Shrine to Nyx',
      'Urborg, Tomb of Yawgmoth',
      'Cabal Coffers',
      'Plains',
      'Plains',
      'Plains',
      'Plains',
      'Plains',
      'Plains',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Cruel Celebrant',
      'Bloodghast',
      'Kalitas, Traitor of Ghet',
      'Patron of the Vein',
      'Bloodlord of Vaasgoth',
      'Captivating Vampire',
      'Stromkirk Captain',
      'Forerunner of the Legion',
      'New Blood',
      'Kindred Charge',
      'Kindred Dominance',
      'Edgar Markov',
      'Sorin, Imperious Bloodlord',
      'Read the Bones',
      'Sign in Blood',
      'Night\'s Whisper',
      'Painful Truths',
      'Austere Command',
      'Return to Dust',
      'Generous Gift'
    ]
  },
  {
    id: 'wilhelt-zombies',
    name: 'Wilhelt, the Rotcleaver',
    commander: 'Wilhelt, the Rotcleaver',
    colors: ['U', 'B'],
    cards: [
      'Wilhelt, the Rotcleaver',
      'Gravecrawler',
      'Cryptbreaker',
      'Carrion Feeder',
      'Diregraf Ghoul',
      'Undead Augur',
      'Plague Belcher',
      'Death Baron',
      'Lord of the Undead',
      'Cemetery Reaper',
      'Diregraf Colossus',
      'Undead Warchief',
      'Diregraf Captain',
      'Gleaming Overseer',
      'Noxious Ghoul',
      'Gray Merchant of Asphodel',
      'Sidisi, Undead Vizier',
      'Mikaeus, the Unhallowed',
      'Grave Titan',
      'Gisa and Geralf',
      'Grimgrin, Corpse-Born',
      'The Scarab God',
      'Rooftop Storm',
      'Endless Ranks of the Dead',
      'Liliana\'s Mastery',
      'Open the Graves',
      'Graf Harvest',
      'Necromancer\'s Stockpile',
      'Phyrexian Arena',
      'Rhystic Study',
      'Ponder',
      'Preordain',
      'Brainstorm',
      'Counterspell',
      'Negate',
      'Cyclonic Rift',
      'Damnation',
      'Toxic Deluge',
      'Feed the Swarm',
      'Go for the Throat',
      'Sol Ring',
      'Arcane Signet',
      'Dimir Signet',
      'Talisman of Dominance',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Coat of Arms',
      'Door of Destinies',
      'Herald\'s Horn',
      'Command Tower',
      'Watery Grave',
      'Drowned Catacomb',
      'Underground River',
      'Darkslick Shores',
      'Clearwater Pathway',
      'Temple of Deceit',
      'Dimir Aqueduct',
      'Tainted Isle',
      'Bojuka Bog',
      'Castle Locthwain',
      'Unholy Grotto',
      'Cavern of Souls',
      'Urborg, Tomb of Yawgmoth',
      'Cabal Coffers',
      'Island',
      'Island',
      'Island',
      'Island',
      'Island',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Army of the Damned',
      'Dark Salvation',
      'From Under the Floorboards',
      'Dread Summons',
      'Living Death',
      'Patriarch\'s Bidding',
      'Zombie Apocalypse',
      'Empty the Pits',
      'Liliana, Untouched by Death',
      'Liliana, Dreadhorde General',
      'Ghoulcaller Gisa',
      'Acererak the Archlich',
      'Champion of the Perished',
      'Headless Rider',
      'Poppet Stitcher',
      'Death Tyrant',
      'Rot Hulk',
      'Ebondeath, Dracolich',
      'Bladewing the Risen'
    ]
  },
  {
    id: 'atraxa-superfriends',
    name: 'Atraxa, Praetors\' Voice',
    commander: 'Atraxa, Praetors\' Voice',
    colors: ['W', 'U', 'B', 'G'],
    cards: [
      'Atraxa, Praetors\' Voice',
      'Deepglow Skate',
      'Pir, Imaginative Rascal',
      'Toothy, Imaginary Friend',
      'Evolution Sage',
      'Flux Channeler',
      'Fathom Mage',
      'Vorel of the Hull Clade',
      'Inexorable Tide',
      'Doubling Season',
      'Parallel Lives',
      'Primal Vigor',
      'Oath of Nissa',
      'Oath of Teferi',
      'The Chain Veil',
      'Jace, the Mind Sculptor',
      'Teferi, Hero of Dominaria',
      'Narset, Parter of Veils',
      'Liliana, Dreadhorde General',
      'Elspeth, Sun\'s Champion',
      'Tamiyo, Field Researcher',
      'Vraska, Relic Seeker',
      'Ugin, the Spirit Dragon',
      'Nissa, Who Shakes the World',
      'Garruk, Cursed Huntsman',
      'Ashiok, Dream Render',
      'Karn Liberated',
      'Nicol Bolas, Dragon-God',
      'Teferi, Time Raveler',
      'Oko, Thief of Crowns',
      'Jace, Wielder of Mysteries',
      'Sorin, Grim Nemesis',
      'Ajani, Mentor of Heroes',
      'Swords to Plowshares',
      'Path to Exile',
      'Anguished Unmaking',
      'Assassin\'s Trophy',
      'Cyclonic Rift',
      'Wrath of God',
      'Damnation',
      'Supreme Verdict',
      'Sol Ring',
      'Arcane Signet',
      'Chromatic Lantern',
      'Coalition Relic',
      'Astral Cornucopia',
      'Everflowing Chalice',
      'Command Tower',
      'Breeding Pool',
      'Hallowed Fountain',
      'Watery Grave',
      'Godless Shrine',
      'Temple Garden',
      'Overgrown Tomb',
      'Flooded Strand',
      'Polluted Delta',
      'Windswept Heath',
      'Verdant Catacombs',
      'Misty Rainforest',
      'Yavimaya Coast',
      'Caves of Koilos',
      'Llanowar Wastes',
      'Adarkar Wastes',
      'Underground River',
      'Brushland',
      'Exotic Orchard',
      'Mana Confluence',
      'City of Brass',
      'Reflecting Pool',
      'Urborg, Tomb of Yawgmoth',
      'Forest',
      'Forest',
      'Forest',
      'Plains',
      'Plains',
      'Island',
      'Island',
      'Swamp',
      'Swamp',
      'Interplanar Beacon',
      'Karn\'s Bastion',
      'Tamiyo, the Moon Sage',
      'Nissa, Vital Force',
      'Vraska, Golgari Queen',
      'Kiora, Behemoth Beckoner',
      'Ajani Steadfast',
      'Sorin, Solemn Visitor',
      'Gideon Blackblade',
      'Vivien, Champion of the Wilds',
      'Tezzeret, Artifice Master',
      'Kasmina, Enigmatic Mentor',
      'Jiang Yanggu, Wildcrafter',
      'Spark Double',
      'Clever Impersonator',
      'Thrummingbird',
      'Grateful Apparition',
      'Contagion Engine',
      'Steady Progress',
      'Tezzeret\'s Gambit'
    ]
  },
  {
    id: 'prosper-treasure',
    name: 'Prosper, Tome-Bound',
    commander: 'Prosper, Tome-Bound',
    colors: ['B', 'R'],
    cards: [
      'Prosper, Tome-Bound',
      'Reckless Fireweaver',
      'Mayhem Devil',
      'Marionette Master',
      'Disciple of the Vault',
      'Nadier\'s Nightblade',
      'Academy Manufactor',
      'Xorn',
      'Professional Face-Breaker',
      'Goldspan Dragon',
      'Dockside Extortionist',
      'Magda, Brazen Outlaw',
      'Captain Lannery Storm',
      'Kalain, Reclusive Painter',
      'Rain of Riches',
      'Revel in Riches',
      'Mechanized Production',
      'Inspiring Statuary',
      'Pitiless Plunderer',
      'Black Market',
      'Phyrexian Arena',
      'Outpost Siege',
      'Theater of Horrors',
      'Chaos Wand',
      'Cunning Rhetoric',
      'Wild-Magic Sorcerer',
      'Commune with Lava',
      'Light Up the Stage',
      'Jeska\'s Will',
      'Ignite the Future',
      'Faithless Looting',
      'Feed the Swarm',
      'Deadly Dispute',
      'Village Rites',
      'Chaos Warp',
      'Rakdos Charm',
      'Bedevil',
      'Terminate',
      'Sol Ring',
      'Arcane Signet',
      'Rakdos Signet',
      'Talisman of Indulgence',
      'Mind Stone',
      'Thought Vessel',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Sensei\'s Divining Top',
      'Command Tower',
      'Blood Crypt',
      'Dragonskull Summit',
      'Sulfurous Springs',
      'Blackcleave Cliffs',
      'Blightstep Pathway',
      'Temple of Malice',
      'Rakdos Carnarium',
      'Tainted Peak',
      'Bojuka Bog',
      'Castle Locthwain',
      'Urborg, Tomb of Yawgmoth',
      'Cabal Coffers',
      'Treasure Vault',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Ragavan, Nimble Pilferer',
      'Laelia, the Blade Reforged',
      'Fevered Suspicion',
      'Share the Spoils',
      'Dream Devourer',
      'Etali, Primal Storm',
      'Stolen Strategy',
      'Possibility Storm',
      'Apex of Power',
      'Bituminous Blast',
      'Curse of Opulence',
      'Big Score',
      'Unexpected Windfall',
      'Strike It Rich',
      'Seize the Spoils',
      'Grim Hireling',
      'Ardent Elementalist',
      'You Find Some Prisoners',
      'Valakut Exploration',
      'Delayed Blast Fireball'
    ]
  },
  {
    id: 'lathril-elves',
    name: 'Lathril, Blade of the Elves',
    commander: 'Lathril, Blade of the Elves',
    colors: ['B', 'G'],
    cards: [
      'Lathril, Blade of the Elves',
      'Llanowar Elves',
      'Elvish Mystic',
      'Fyndhorn Elves',
      'Elves of Deep Shadow',
      'Deathrite Shaman',
      'Elvish Archdruid',
      'Priest of Titania',
      'Wirewood Channeler',
      'Marwyn, the Nurturer',
      'Circle of Dreams Druid',
      'Imperious Perfect',
      'Elvish Champion',
      'Dwynen, Gilt-Leaf Daen',
      'Elvish Clancaller',
      'Eladamri, Lord of Leaves',
      'Ezuri, Renegade Leader',
      'Joraga Warcaller',
      'Immaculate Magistrate',
      'Copperhorn Scout',
      'Quirion Ranger',
      'Scryb Ranger',
      'Timberwatch Elf',
      'Wellwisher',
      'Beast Whisperer',
      'Elvish Visionary',
      'Sylvan Messenger',
      'Realmwalker',
      'Vanquisher\'s Banner',
      'Herald\'s Horn',
      'Coat of Arms',
      'Door of Destinies',
      'Growing Rites of Itlimoc',
      'Kindred Summons',
      'Triumph of the Hordes',
      'Craterhoof Behemoth',
      'Finale of Devastation',
      'Natural Order',
      'Green Sun\'s Zenith',
      'Chord of Calling',
      'Assassin\'s Trophy',
      'Abrupt Decay',
      'Beast Within',
      'Heroic Intervention',
      'Sol Ring',
      'Arcane Signet',
      'Golgari Signet',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Skullclamp',
      'Command Tower',
      'Overgrown Tomb',
      'Woodland Cemetery',
      'Llanowar Wastes',
      'Blooming Marsh',
      'Darkbore Pathway',
      'Temple of Malady',
      'Golgari Rot Farm',
      'Tainted Wood',
      'Bojuka Bog',
      'Castle Garenbrig',
      'Nykthos, Shrine to Nyx',
      'Wirewood Lodge',
      'Gaea\'s Cradle',
      'Cavern of Souls',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Rhys the Redeemed',
      'Abomination of Llanowar',
      'Shaman of the Pack',
      'Poison-Tip Archer',
      'Prowess of the Fair',
      'Elderfang Venom',
      'Wolverine Riders',
      'Elvish Warmaster',
      'Tyvar Kell',
      'Gilt-Leaf Ambush',
      'Elvish Promenade',
      'Elven Ambush',
      'Eyeblight Massacre',
      'Miara, Thorn of the Glade',
      'Numa, Joraga Chieftain',
      'Nath of the Gilt-Leaf',
      'Nadier, Agent of the Duskenel',
      'Canopy Tactician',
      'Masked Admirers'
    ]
  },
  {
    id: 'ur-dragon-dragons',
    name: 'The Ur-Dragon',
    commander: 'The Ur-Dragon',
    colors: ['W', 'U', 'B', 'R', 'G'],
    cards: [
      'The Ur-Dragon',
      'Dragonlord Ojutai',
      'Dragonlord Silumgar',
      'Dragonlord Kolaghan',
      'Dragonlord Atarka',
      'Dragonlord Dromoka',
      'Scion of the Ur-Dragon',
      'Niv-Mizzet, Parun',
      'Niv-Mizzet, the Firemind',
      'Utvara Hellkite',
      'Scourge of Valkas',
      'Lathliss, Dragon Queen',
      'Bladewing the Risen',
      'Terror of the Peaks',
      'Ancient Copper Dragon',
      'Ancient Gold Dragon',
      'Ancient Silver Dragon',
      'Ancient Brass Dragon',
      'Ancient Bronze Dragon',
      'Old Gnawbone',
      'Savage Ventmaw',
      'Goldspan Dragon',
      'Glorybringer',
      'Thunderbreak Regent',
      'Scalelord Reckoner',
      'Dragon Tempest',
      'Temur Ascendancy',
      'Kindred Discovery',
      'Sarkhan Unbroken',
      'Sarkhan, Fireblood',
      'Sarkhan the Mad',
      'Patriarch\'s Bidding',
      'Living Death',
      'Crux of Fate',
      'Vanquisher\'s Banner',
      'Herald\'s Horn',
      'Urza\'s Incubator',
      'Dragon\'s Hoard',
      'Sol Ring',
      'Arcane Signet',
      'Chromatic Lantern',
      'Commander\'s Sphere',
      'Fist of Suns',
      'Morophon, the Boundless',
      'Command Tower',
      'Reflecting Pool',
      'Mana Confluence',
      'City of Brass',
      'Exotic Orchard',
      'Path of Ancestry',
      'Haven of the Spirit Dragon',
      'Crucible of the Spirit Dragon',
      'Unclaimed Territory',
      'Cavern of Souls',
      'Blood Crypt',
      'Breeding Pool',
      'Godless Shrine',
      'Hallowed Fountain',
      'Overgrown Tomb',
      'Sacred Foundry',
      'Steam Vents',
      'Stomping Ground',
      'Temple Garden',
      'Watery Grave',
      'Mountain',
      'Mountain',
      'Mountain',
      'Forest',
      'Forest',
      'Island',
      'Swamp',
      'Plains',
      'Scalelord Reckoner',
      'Drakuseth, Maw of Flames',
      'Balefire Dragon',
      'Hellkite Tyrant',
      'Hellkite Courser',
      'Backdraft Hellkite',
      'Steel Hellkite',
      'Wrathful Red Dragon',
      'Klauth, Unrivaled Ancient',
      'Tiamat',
      'Dragon Broodmother',
      'Karrthus, Tyrant of Jund',
      'Kolaghan, the Storm\'s Fury',
      'Ojutai, Soul of Winter',
      'Silumgar, the Drifting Death',
      'Atarka, World Render',
      'Dromoka, the Eternal',
      'Fearsome Awakening',
      'Spit Flame',
      'Earthquake',
      'Decimate',
      'Rishkar\'s Expertise',
      'Kindred Charge',
      'Kindred Summons',
      'Sarkhan\'s Triumph',
      'Tempt with Discovery',
      'Farseek',
      'Cultivate'
    ]
  },
  {
    id: 'aesi-sea-monsters',
    name: 'Aesi, Tyrant of Gyre Strait',
    commander: 'Aesi, Tyrant of Gyre Strait',
    colors: ['U', 'G'],
    cards: [
      'Aesi, Tyrant of Gyre Strait',
      'Tatyova, Benthic Druid',
      'Uro, Titan of Nature\'s Wrath',
      'Lotus Cobra',
      'Tireless Provisioner',
      'Risen Reef',
      'Coiling Oracle',
      'Sakura-Tribe Elder',
      'Wood Elves',
      'Farhaven Elf',
      'Solemn Simulacrum',
      'Scute Swarm',
      'Avenger of Zendikar',
      'Rampaging Baloths',
      'Roil Elemental',
      'Tatyova, Steward of Tides',
      'Koma, Cosmos Serpent',
      'Serpent of Yawning Depths',
      'Stormtide Leviathan',
      'Inkwell Leviathan',
      'Deep-Sea Kraken',
      'Slinn Voda, the Rising Deep',
      'Crush of Tentacles',
      'Whelming Wave',
      'Cyclonic Rift',
      'Simic Sky Swallower',
      'Nezahal, Primal Tide',
      'Spawning Kraken',
      'Pursuit of Knowledge',
      'Teferi\'s Ageless Insight',
      'Guardian Project',
      'Elemental Bond',
      'Burgeoning',
      'Exploration',
      'Kodama\'s Reach',
      'Cultivate',
      'Growth Spiral',
      'Three Visits',
      'Nature\'s Lore',
      'Skyshroud Claim',
      'Boundless Realms',
      'Sol Ring',
      'Arcane Signet',
      'Simic Signet',
      'Thought Vessel',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Command Tower',
      'Breeding Pool',
      'Hinterland Harbor',
      'Yavimaya Coast',
      'Botanical Sanctum',
      'Barkchannel Pathway',
      'Temple of Mystery',
      'Simic Growth Chamber',
      'Flooded Grove',
      'Alchemist\'s Refuge',
      'Reliquary Tower',
      'Mystic Sanctuary',
      'Castle Vantress',
      'Castle Garenbrig',
      'Boseiju, Who Shelters All',
      'Island',
      'Island',
      'Island',
      'Island',
      'Island',
      'Island',
      'Island',
      'Island',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Kiora, Behemoth Beckoner',
      'Kiora, the Crashing Wave',
      'Kiora Bests the Sea God',
      'Quest for Ula\'s Temple',
      'Serpent of the Endless Sea',
      'Vodalian Wave-Knight',
      'Gyruda, Doom of Depths',
      'Stormsurge Kraken',
      'Scourge of Fleets',
      'Tromokratis',
      'Lorthos, the Tidemaker',
      'Wrexial, the Risen Deep',
      'Ominous Seas',
      'Nadir Kraken',
      'Brinelin, the Moon Kraken',
      'Hullbreaker Horror',
      'Ruin Crab',
      'Rampant Growth',
      'Nissa, Steward of Elements',
      'Return of the Wildspeaker'
    ]
  },
  {
    id: 'isshin-attack-triggers',
    name: 'Isshin, Two Heavens as One',
    commander: 'Isshin, Two Heavens as One',
    colors: ['R', 'W', 'B'],
    cards: [
      'Isshin, Two Heavens as One',
      'Adeline, Resplendent Cathar',
      'Hero of Bladehold',
      'Hanweir Garrison',
      'Aurelia, the Warleader',
      'Combat Celebrant',
      'Karlach, Fury of Avernus',
      'Raiyuu, Storm\'s Edge',
      'Delina, Wild Mage',
      'Krenko, Tin Street Kingpin',
      'Commissar Severina Raine',
      'Professional Face-Breaker',
      'Captain Lannery Storm',
      'Brutal Hordechief',
      'Mardu Strike Leader',
      'Alesha, Who Smiles at Death',
      'Fervent Charge',
      'Reconnaissance',
      'Duelist\'s Heritage',
      'Gratuitous Violence',
      'True Conviction',
      'Berserkers\' Onslaught',
      'Shared Animosity',
      'Goblin War Drums',
      'Dictate of Erebos',
      'Grave Pact',
      'Phyrexian Arena',
      'Swords to Plowshares',
      'Path to Exile',
      'Anguished Unmaking',
      'Crackling Doom',
      'Mortify',
      'Chaos Warp',
      'Terminate',
      'Wrath of God',
      'Damn',
      'Blasphemous Act',
      'Sol Ring',
      'Arcane Signet',
      'Boros Signet',
      'Orzhov Signet',
      'Rakdos Signet',
      'Talisman of Conviction',
      'Talisman of Hierarchy',
      'Talisman of Indulgence',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Command Tower',
      'Blood Crypt',
      'Godless Shrine',
      'Sacred Foundry',
      'Dragonskull Summit',
      'Isolated Chapel',
      'Clifftop Retreat',
      'Caves of Koilos',
      'Battlefield Forge',
      'Sulfurous Springs',
      'Savai Triome',
      'Nomad Outpost',
      'Path of Ancestry',
      'Vault of Champions',
      'Spectator Seating',
      'Luxury Suite',
      'Plains',
      'Plains',
      'Plains',
      'Plains',
      'Swamp',
      'Swamp',
      'Swamp',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Aurelia\'s Fury',
      'Agitator Ant',
      'Karazikar, the Eye Tyrant',
      'Adriana, Captain of the Guard',
      'Hellrider',
      'Breena, the Demagogue',
      'Akroma, Vision of Ixidor',
      'Emberwilde Captain',
      'Goldnight Commander',
      'Frontline Medic',
      'Reconnaissance Mission',
      'Tectonic Giant',
      'Wulfgar of Icewind Dale',
      'Port Razer',
      'Moraug, Fury of Akoum',
      'Anger',
      'Legion Loyalist',
      'Archon of Cruelty',
      'Curse of Opulence',
      'Curse of Disturbance',
      'Mirror Entity',
      'Dolmen Gate',
      'Iroas, God of Victory',
      'Cathars\' Crusade',
      'Fiery Emancipation',
      'Mardu Ascendancy'
    ]
  },
  {
    id: 'miirym-dragon-tokens',
    name: 'Miirym, Sentinel Wyrm',
    commander: 'Miirym, Sentinel Wyrm',
    colors: ['U', 'R', 'G'],
    cards: [
      'Miirym, Sentinel Wyrm',
      'Thrakkus the Butcher',
      'Ganax, Astral Hunter',
      'Astral Dragon',
      'Ancient Copper Dragon',
      'Ancient Silver Dragon',
      'Ancient Bronze Dragon',
      'Old Gnawbone',
      'Savage Ventmaw',
      'Goldspan Dragon',
      'Utvara Hellkite',
      'Scourge of Valkas',
      'Terror of the Peaks',
      'Dragon Broodmother',
      'Lathliss, Dragon Queen',
      'Dragonmaster Outcast',
      'Thunderbreak Regent',
      'Glorybringer',
      'Skyline Despot',
      'Demanding Dragon',
      'Balefire Dragon',
      'Drakuseth, Maw of Flames',
      'Inferno of the Star Mounts',
      'Klauth, Unrivaled Ancient',
      'Rishkar\'s Expertise',
      'Kindred Summons',
      'Doubling Season',
      'Parallel Lives',
      'Primal Vigor',
      'Dragon Tempest',
      'Temur Ascendancy',
      'Garruk\'s Uprising',
      'Elemental Bond',
      'Guardian Project',
      'Temur Charm',
      'Beast Within',
      'Chaos Warp',
      'Cyclonic Rift',
      'Nature\'s Claim',
      'Krosan Grip',
      'Sol Ring',
      'Arcane Signet',
      'Gruul Signet',
      'Simic Signet',
      'Izzet Signet',
      'Chromatic Lantern',
      'Dragon\'s Hoard',
      'Urza\'s Incubator',
      'Herald\'s Horn',
      'Command Tower',
      'Breeding Pool',
      'Stomping Ground',
      'Steam Vents',
      'Ketria Triome',
      'Frontier Bivouac',
      'Hinterland Harbor',
      'Rootbound Crag',
      'Sulfur Falls',
      'Yavimaya Coast',
      'Shivan Reef',
      'Karplusan Forest',
      'Exotic Orchard',
      'Path of Ancestry',
      'Haven of the Spirit Dragon',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Forest',
      'Island',
      'Island',
      'Island',
      'Island',
      'Sarkhan, Fireblood',
      'Sarkhan Unbroken',
      'Spark Double',
      'Sakashima of a Thousand Faces',
      'Bramble Sovereign',
      'Flameshadow Conjuring',
      'Molten Echoes',
      'Kindred Charge',
      'Cursed Mirror',
      'Reflections of Littjara',
      'Irenicus\'s Vile Duplication',
      'Fable of the Mirror-Breaker',
      'Clone',
      'Phantasmal Image',
      'Sakashima the Impostor',
      'Temur Sabertooth',
      'Monster Manual',
      'Greater Good',
      'Return of the Wildspeaker',
      'Rhythm of the Wild',
      'Hull Breach',
      'Decimate'
    ]
  },
  {
    id: 'dihada-legends',
    name: 'Dihada, Binder of Wills',
    commander: 'Dihada, Binder of Wills',
    colors: ['R', 'W', 'B'],
    cards: [
      'Dihada, Binder of Wills',
      'Shanid, Sleepers\' Scourge',
      'Arvad the Cursed',
      'Kethis, the Hidden Hand',
      'Captain Sisay',
      'Jhoira, Weatherlight Captain',
      'Ratadrabik of Urborg',
      'Elenda, the Dusk Rose',
      'Teysa Karlov',
      'Aurelia, the Warleader',
      'Adriana, Captain of the Guard',
      'Alesha, Who Smiles at Death',
      'Anafenza, the Foremost',
      'Gisela, Blade of Goldnight',
      'Liesa, Forgotten Archangel',
      'Kambal, Consul of Allocation',
      'Odric, Lunarch Marshal',
      'Thalia, Guardian of Thraben',
      'Thalia, Heretic Cathar',
      'Tajic, Legion\'s Edge',
      'Krenko, Tin Street Kingpin',
      'Kaya, Geist Hunter',
      'Sorin, Grim Nemesis',
      'Elspeth, Sun\'s Champion',
      'Blackblade Reforged',
      'Helm of the Host',
      'Heroes\' Podium',
      'Relic of Legends',
      'Honor-Worn Shaku',
      'Day of Destiny',
      'Urza\'s Ruinous Blast',
      'Primevals\' Glorious Rebirth',
      'Kamahl\'s Druidic Vow',
      'Swords to Plowshares',
      'Path to Exile',
      'Anguished Unmaking',
      'Crackling Doom',
      'Damn',
      'Wrath of God',
      'Sol Ring',
      'Arcane Signet',
      'Boros Signet',
      'Orzhov Signet',
      'Rakdos Signet',
      'Commander\'s Sphere',
      'Lightning Greaves',
      'Swiftfoot Boots',
      'Command Tower',
      'Blood Crypt',
      'Godless Shrine',
      'Sacred Foundry',
      'Dragonskull Summit',
      'Isolated Chapel',
      'Clifftop Retreat',
      'Plaza of Heroes',
      'Eiganjo, Seat of the Empire',
      'Shizo, Death\'s Storehouse',
      'Savai Triome',
      'Nomad Outpost',
      'Vault of Champions',
      'Spectator Seating',
      'Luxury Suite',
      'Path of Ancestry',
      'Phyrexian Tower',
      'Plains',
      'Plains',
      'Plains',
      'Plains',
      'Plains',
      'Swamp',
      'Swamp',
      'Swamp',
      'Swamp',
      'Mountain',
      'Mountain',
      'Mountain',
      'Mountain',
      'Verrak, Warped Sengir',
      'Loran of the Third Path',
      'Feldon of the Third Path',
      'Teshar, Ancestor\'s Apostle',
      'Vona, Butcher of Magan',
      'Kaervek the Merciless',
      'Queen Marchesa',
      'Zurgo Helmsmasher',
      'Gerrard, Weatherlight Hero',
      'Hero\'s Blade',
      'Bloodforged Battle-Axe',
      'Search for Glory',
      'Time of Need',
      'Yomiji, Who Bars the Way',
      'Board the Weatherlight',
      'Weatherlight',
      'Kaya\'s Ghostform',
      'Gift of Immortality',
      'Nettlecyst',
      'Bontu\'s Monument',
      'Hazoret\'s Monument',
      'Oketra\'s Monument',
      'Boros Charm',
      'Utter End'
    ]
  }
];

/**
 * Get a precon deck by ID
 */
export function getPreconById(id) {
  return PRECON_DECKS.find(deck => deck.id === id) || null;
}

/**
 * Get all precon decks (for populating dropdown)
 */
export function getAllPrecons() {
  return PRECON_DECKS.map(({ id, name, colors }) => ({ id, name, colors }));
}
```

**Step 2: Commit**

```bash
git add js/precons.js
git commit -m "feat: add 10 Commander precon deck definitions"
```

---

## Task 7: App Integration

**Files:**
- Modify: `js/app.js`

**Step 1: Add imports**

At the top of `js/app.js`, add these imports:

```javascript
import { getAllPrecons, getPreconById } from './precons.js';
import { fetchCardsBatch } from './scryfall.js';
import { isModified, setDeck, getCurrentPrecon } from './deck.js';
```

**Step 2: Add loading state variables**

After `let currentPreviewCard = null;`, add:

```javascript
let isLoading = false;
let loadingIndicator;
let loadingProgress;
let deckSelector;
```

**Step 3: Add populateDeckSelector function**

Add after `handleDeckChange`:

```javascript
/**
 * Populate deck selector dropdown
 */
function populateDeckSelector() {
  const precons = getAllPrecons();

  precons.forEach(deck => {
    const option = document.createElement('option');
    option.value = deck.id;
    option.textContent = deck.name;
    deckSelector.appendChild(option);
  });
}
```

**Step 4: Add loadPreconDeck function**

Add after `populateDeckSelector`:

```javascript
/**
 * Load a precon deck progressively
 */
async function loadPreconDeck(deckId) {
  const precon = getPreconById(deckId);
  if (!precon) return;

  // Check if deck modified
  if (isModified()) {
    const confirmed = confirm(`Load "${precon.name}"? Current changes will be lost.`);
    if (!confirmed) {
      // Reset selector to current precon
      deckSelector.value = getCurrentPrecon() || '';
      return;
    }
  }

  // Start loading
  isLoading = true;
  loadingIndicator.classList.remove('hidden');

  const cardNames = precon.cards;
  const totalCards = cardNames.length;
  const batchSize = 10;
  const loadedCards = [];

  // Clear deck first
  setDeck([], null);

  // Load in batches
  for (let i = 0; i < totalCards; i += batchSize) {
    const batch = cardNames.slice(i, i + batchSize);
    const cards = await fetchCardsBatch(batch);
    loadedCards.push(...cards);

    // Update progress
    const loaded = Math.min(i + batchSize, totalCards);
    loadingProgress.textContent = `${loaded}/${totalCards}`;

    // Update deck with all loaded cards so far
    setDeck(loadedCards, deckId);
  }

  // Done loading
  isLoading = false;
  loadingIndicator.classList.add('hidden');
}
```

**Step 5: Update init function**

Modify the `init` function to initialize deck selector:

```javascript
function init() {
  // Get loading elements
  loadingIndicator = document.getElementById('loading-indicator');
  loadingProgress = document.getElementById('loading-progress');
  deckSelector = document.getElementById('deck-selector');

  // Initialize modules with preview callback
  initRender(handlePreview);
  initSearch(handlePreview);

  // Subscribe to deck changes
  subscribe(handleDeckChange);

  // Initial render
  renderDeck(getDeck());

  // Populate deck selector
  if (deckSelector) {
    populateDeckSelector();
    deckSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        loadPreconDeck(e.target.value);
      }
    });
  }

  // Clear deck button
  const clearBtn = document.getElementById('clear-deck-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all cards from deck?')) {
        clearDeck();
        renderPreview(null);
        if (deckSelector) {
          deckSelector.value = '';
        }
      }
    });
  }

  console.log('DeckBuilder initialized');
}
```

**Step 6: Commit**

```bash
git add js/app.js
git commit -m "feat: integrate deck selector with progressive loading"
```

---

## Task 8: Final Testing

**Step 1: Open in browser and verify**

Open `index.html` and test:

- [ ] Deck selector dropdown appears in topbar
- [ ] Dropdown shows 10 precon names
- [ ] Selecting a deck shows loading spinner
- [ ] Progress updates (10/100, 20/100, etc.)
- [ ] Cards progressively appear in deck list
- [ ] Stats update as cards load
- [ ] Hovering loaded cards shows preview
- [ ] Modifying deck (add/remove) works
- [ ] Switching deck with modifications shows confirm
- [ ] Canceling keeps current deck
- [ ] Clear button resets selector

**Step 2: Final commit**

```bash
git add -A
git commit -m "feat: complete precon deck selector with progressive loading"
```

---

## Summary

7 implementation tasks:
1. Deck selector CSS styles
2. Loading indicator CSS styles
3. HTML updates (selector + indicator)
4. Scryfall batch fetch function
5. Deck state modifications (modified flag, setDeck)
6. Precon deck data (10 decks, 100 cards each)
7. App integration (loading logic)
8. Final testing
