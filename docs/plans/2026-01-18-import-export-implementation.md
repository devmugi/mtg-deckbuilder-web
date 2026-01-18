# Import/Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add import and export functionality for deck lists via clipboard.

**Architecture:** Modal for import, clipboard API for export, toast notifications for feedback.

**Tech Stack:** Vanilla CSS, JavaScript ES6 modules

---

### Task 1: Add Modal and Toast Styles

**Files:**
- Modify: `css/components.css`

**Step 1: Add modal styles**

Add at end of file:

```css
/* Modal */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal.hidden {
  display: none;
}

.modal-content {
  background: var(--bg-raised);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.modal-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-textarea {
  width: 100%;
  height: 300px;
  padding: var(--space-sm);
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  font-family: monospace;
  font-size: var(--font-size-sm);
  resize: vertical;
}

.modal-textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.modal-textarea::placeholder {
  color: var(--text-muted);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-sm);
}

/* Toast */
.toast {
  position: fixed;
  bottom: var(--space-lg);
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: var(--bg-base);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 500;
  z-index: 1001;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.toast.visible {
  opacity: 1;
}
```

**Step 2: Commit**

```bash
git add css/components.css
git commit -m "feat: add modal and toast styles"
```

---

### Task 2: Add HTML Structure

**Files:**
- Modify: `index.html`

**Step 1: Add Import/Export buttons to main-panel-actions**

Find the main-panel-actions div and add buttons before the Clear button:

```html
<div class="main-panel-actions">
  <button class="btn btn-primary btn-sm" id="import-btn">Import</button>
  <button class="btn btn-primary btn-sm" id="export-btn">Export</button>
  <button class="btn btn-primary btn-sm" id="clear-deck-btn">Clear</button>
</div>
```

**Step 2: Add modal markup before closing </body>**

```html
<div class="modal hidden" id="import-modal">
  <div class="modal-content">
    <h2 class="modal-title">Import Deck</h2>
    <textarea class="modal-textarea" id="import-textarea"
              placeholder="1 Sol Ring
1 Command Tower
1 Arcane Signet

// Sideboard
1 Swords to Plowshares

// Maybeboard
1 Phyrexian Arena"></textarea>
    <div class="modal-actions">
      <button class="btn btn-secondary btn-sm" id="import-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="import-confirm">Import</button>
    </div>
  </div>
</div>

<div class="toast" id="toast"></div>
```

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add import/export buttons, modal, and toast HTML"
```

---

### Task 3: Add Parse and Format Functions

**Files:**
- Modify: `js/app.js`

**Step 1: Add parseDeckList function**

```javascript
/**
 * Parse deck list text into zones
 * @param {string} text - Deck list text
 * @returns {Object} { deck: [], sideboard: [], maybeboard: [] }
 */
function parseDeckList(text) {
  const lines = text.split('\n');
  let currentZone = 'deck';
  const result = { deck: [], sideboard: [], maybeboard: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for zone headers
    const lowerLine = trimmed.toLowerCase();
    if (lowerLine.includes('sideboard')) {
      currentZone = 'sideboard';
      continue;
    } else if (lowerLine.includes('maybeboard')) {
      currentZone = 'maybeboard';
      continue;
    } else if (trimmed.startsWith('//')) {
      continue; // Skip other comments
    }

    // Parse card line: "1 Card Name" or "1x Card Name" or just "Card Name"
    const match = trimmed.match(/^(\d+)x?\s+(.+)$/i);
    const quantity = match ? parseInt(match[1]) : 1;
    const name = match ? match[2].trim() : trimmed;

    result[currentZone].push({ name, quantity });
  }

  return result;
}
```

**Step 2: Add formatDeckList function**

```javascript
/**
 * Format deck zones into text
 * @returns {string} Formatted deck list
 */
function formatDeckList() {
  const deck = getZone('deck');
  const sideboard = getZone('sideboard');
  const maybeboard = getZone('maybeboard');

  let text = deck.map(e => `${e.quantity} ${e.card.name}`).join('\n');

  if (sideboard.length > 0) {
    text += '\n\n// Sideboard\n';
    text += sideboard.map(e => `${e.quantity} ${e.card.name}`).join('\n');
  }

  if (maybeboard.length > 0) {
    text += '\n\n// Maybeboard\n';
    text += maybeboard.map(e => `${e.quantity} ${e.card.name}`).join('\n');
  }

  return text;
}
```

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add deck list parse and format functions"
```

---

### Task 4: Add Import Functionality

**Files:**
- Modify: `js/app.js`

**Step 1: Add modal control functions**

```javascript
function showImportModal() {
  const modal = document.getElementById('import-modal');
  const textarea = document.getElementById('import-textarea');
  textarea.value = '';
  modal.classList.remove('hidden');
  textarea.focus();
}

function hideImportModal() {
  const modal = document.getElementById('import-modal');
  modal.classList.add('hidden');
}
```

**Step 2: Add import function**

```javascript
async function importDeck() {
  const textarea = document.getElementById('import-textarea');
  const text = textarea.value.trim();

  if (!text) {
    alert('No cards to import');
    return;
  }

  const parsed = parseDeckList(text);
  const allCards = [
    ...parsed.deck.map(c => ({ ...c, zone: 'deck' })),
    ...parsed.sideboard.map(c => ({ ...c, zone: 'sideboard' })),
    ...parsed.maybeboard.map(c => ({ ...c, zone: 'maybeboard' }))
  ];

  if (allCards.length === 0) {
    alert('No valid cards found');
    return;
  }

  hideImportModal();
  clearAllZones();

  // Show loading
  loadingIndicator.classList.remove('hidden');

  // Get unique card names
  const uniqueNames = [...new Set(allCards.map(c => c.name))];
  const notFound = [];
  const cardMap = new Map();

  // Fetch in batches
  const batchSize = 10;
  for (let i = 0; i < uniqueNames.length; i += batchSize) {
    const batch = uniqueNames.slice(i, i + batchSize);
    loadingProgress.textContent = `${Math.min(i + batchSize, uniqueNames.length)}/${uniqueNames.length}`;

    const cards = await fetchCardsBatch(batch);
    cards.forEach(card => cardMap.set(card.name.toLowerCase(), card));

    // Check for not found
    batch.forEach(name => {
      if (!cardMap.has(name.toLowerCase())) {
        notFound.push(name);
      }
    });
  }

  // Add cards to zones
  allCards.forEach(({ name, quantity, zone }) => {
    const card = cardMap.get(name.toLowerCase());
    if (card) {
      for (let i = 0; i < quantity; i++) {
        addCardToZone(card, zone);
      }
    }
  });

  loadingIndicator.classList.add('hidden');

  // Report results
  const imported = allCards.length - notFound.length;
  if (notFound.length > 0) {
    alert(`Imported ${imported} cards.\n\nNot found (${notFound.length}):\n${notFound.slice(0, 10).join('\n')}${notFound.length > 10 ? '\n...' : ''}`);
  }
}
```

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add import deck functionality"
```

---

### Task 5: Add Export and Toast Functions

**Files:**
- Modify: `js/app.js`

**Step 1: Add toast function**

```javascript
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2000);
}
```

**Step 2: Add export function**

```javascript
async function exportDeck() {
  const text = formatDeckList();

  if (!text.trim()) {
    showToast('Nothing to export');
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!');
  } catch (err) {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  }
}
```

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: add export deck and toast functions"
```

---

### Task 6: Wire Up Event Handlers

**Files:**
- Modify: `js/app.js`

**Step 1: Add initImportExport function**

```javascript
function initImportExport() {
  const importBtn = document.getElementById('import-btn');
  const exportBtn = document.getElementById('export-btn');
  const importModal = document.getElementById('import-modal');
  const importCancel = document.getElementById('import-cancel');
  const importConfirm = document.getElementById('import-confirm');

  importBtn?.addEventListener('click', showImportModal);
  exportBtn?.addEventListener('click', exportDeck);
  importCancel?.addEventListener('click', hideImportModal);
  importConfirm?.addEventListener('click', importDeck);

  // Close modal on backdrop click
  importModal?.addEventListener('click', (e) => {
    if (e.target === importModal) {
      hideImportModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !importModal.classList.contains('hidden')) {
      hideImportModal();
    }
  });
}
```

**Step 2: Call initImportExport in init()**

Add to the init function:

```javascript
initImportExport();
```

**Step 3: Commit**

```bash
git add js/app.js
git commit -m "feat: wire up import/export event handlers"
```

---

### Task 7: Test and Verify

**Step 1: Test in browser**

1. Click Export with empty deck - should show "Nothing to export"
2. Load a precon deck, click Export - should copy and show "Copied!"
3. Paste exported text elsewhere to verify format
4. Click Import, paste deck list, click Import - cards should load
5. Test with sideboard/maybeboard sections
6. Test cancel button and backdrop click
7. Test Escape key closes modal

**Step 2: Fix any issues found**
