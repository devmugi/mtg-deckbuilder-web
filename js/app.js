/**
 * Main application entry point
 */

import { initSearch } from './search.js';
import { initRender, renderPreview, renderDeck, renderGrid, renderManaCurve, renderColorPie, renderZoneCounts } from './render.js';
import {
  addCard, removeCard, subscribe, getDeck, setDeck,
  isModified, getCurrentPrecon,
  addCardToZone, removeCardFromZone, moveCard, getZone, getZoneStats, clearAllZones
} from './deck.js';
import { calculateManaCurve, calculateColorDistribution } from './stats.js';
import { getAllPrecons, getPreconById } from './precons.js';
import { fetchCardsBatch } from './scryfall.js';

/**
 * Current preview card state
 */
let currentPreviewCard = null;
let currentZone = 'deck';
let filterState = {
  colors: ['W', 'U', 'B', 'R', 'G', 'C'],
  type: '',
  view: 'list'
};
let isLoading = false;
let loadingIndicator;
let loadingProgress;
let deckSelector;

/**
 * Handle card preview updates
 */
function handlePreview(card) {
  currentPreviewCard = card;
  renderPreview(card);
}

/**
 * Initialize zone tab click handlers
 */
function initZoneTabs() {
  const tabsContainer = document.getElementById('zone-tabs');
  if (!tabsContainer) return;

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.zone-tab');
    if (!tab) return;
    switchZone(tab.dataset.zone);
  });
}

/**
 * Switch to a different zone
 */
function switchZone(zone) {
  currentZone = zone;
  document.querySelectorAll('.zone-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.zone === zone);
  });
  const deckData = getDeck();
  renderCurrentZone(deckData);
}

/**
 * Filter cards based on current filter state
 * @param {Array} cards - Card entries to filter
 * @returns {Array} Filtered cards
 */
function filterCards(cards) {
  return cards.filter(({ card }) => {
    // Color filter
    const cardColors = card.colors || [];
    const matchesColor = cardColors.length === 0
      ? filterState.colors.includes('C')
      : cardColors.some(c => filterState.colors.includes(c));

    // Type filter
    const matchesType = !filterState.type ||
      (card.typeLine && card.typeLine.includes(filterState.type));

    return matchesColor && matchesType;
  });
}

/**
 * Render the current zone's cards
 */
function renderCurrentZone(deckData) {
  const cards = deckData[currentZone] || [];
  const filteredCards = filterCards(cards);

  if (filterState.view === 'grid') {
    renderGrid(filteredCards, { onPreview: handlePreview });
  } else {
    renderDeck(filteredCards, currentZone, {
      onPreview: handlePreview,
      onAdd: (card) => addCardToZone(card, currentZone),
      onRemove: (cardId, deleteAll) => {
        if (deleteAll) {
          const zoneCards = getZone(currentZone);
          const entry = zoneCards.find(e => e.card.id === cardId);
          if (entry) {
            for (let i = 0; i < entry.quantity; i++) {
              removeCardFromZone(cardId, currentZone);
            }
          }
        } else {
          removeCardFromZone(cardId, currentZone);
        }
      },
      onMove: handleMove
    });
  }
}

/**
 * Handle moving a card between zones
 */
function handleMove(cardId, fromZone, toZone) {
  moveCard(cardId, fromZone, toZone);
}

/**
 * Handle deck state changes
 */
function handleDeckChange(deckData) {
  renderCurrentZone(deckData);
  updateStats(deckData.deck);
  updateBottomBar(deckData.stats);

  const sbStats = getZoneStats('sideboard');
  const mbStats = getZoneStats('maybeboard');
  renderZoneCounts(sbStats.totalCards, mbStats.totalCards);
}

/**
 * Update bottom bar statistics
 */
function updateBottomBar(stats) {
  const statCards = document.getElementById('stat-cards');
  const statUnique = document.getElementById('stat-unique');
  const statPrice = document.getElementById('stat-price');

  if (statCards) statCards.textContent = stats.totalCards;
  if (statUnique) statUnique.textContent = stats.uniqueCards;
  if (statPrice) statPrice.textContent = `$${stats.totalPrice.toFixed(2)}`;
}

/**
 * Initialize zone count click handlers
 */
function initZoneCounts() {
  document.querySelectorAll('.zone-count').forEach(el => {
    el.addEventListener('click', () => {
      const zone = el.dataset.zone;
      if (zone) switchZone(zone);
    });
  });
}

/**
 * Update deck statistics charts
 */
function updateStats(cards) {
  // Map deck entries to flat structure for stats functions
  const statsCards = cards.map(entry => ({
    cmc: entry.card.cmc,
    colors: entry.card.colors,
    quantity: entry.quantity
  }));

  const curve = calculateManaCurve(statsCards);
  const colors = calculateColorDistribution(statsCards);
  renderManaCurve(curve);
  renderColorPie(colors);
}

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

/**
 * Show the import modal
 */
function showImportModal() {
  const modal = document.getElementById('import-modal');
  const textarea = document.getElementById('import-textarea');
  textarea.value = '';
  modal.classList.remove('hidden');
  textarea.focus();
}

/**
 * Hide the import modal
 */
function hideImportModal() {
  const modal = document.getElementById('import-modal');
  modal.classList.add('hidden');
}

/**
 * Import deck from textarea content
 */
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

/**
 * Show a toast notification
 * @param {string} message - Message to display
 */
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');

  setTimeout(() => {
    toast.classList.remove('visible');
  }, 2000);
}

/**
 * Export deck to clipboard
 */
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

/**
 * Initialize import/export functionality
 */
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

/**
 * Initialize filter controls
 */
function initFilters() {
  const colorFilters = document.getElementById('color-filters');
  const typeFilter = document.getElementById('type-filter');
  const viewToggle = document.getElementById('view-toggle');

  // Color filter clicks
  colorFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.color-filter');
    if (!btn) return;

    const color = btn.dataset.color;
    btn.classList.toggle('active');

    if (btn.classList.contains('active')) {
      filterState.colors.push(color);
    } else {
      filterState.colors = filterState.colors.filter(c => c !== color);
    }

    const deckData = getDeck();
    renderCurrentZone(deckData);
  });

  // Type filter change
  typeFilter?.addEventListener('change', (e) => {
    filterState.type = e.target.value;
    const deckData = getDeck();
    renderCurrentZone(deckData);
  });

  // View toggle clicks
  viewToggle?.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-btn');
    if (!btn) return;

    const view = btn.dataset.view;
    filterState.view = view;

    viewToggle.querySelectorAll('.view-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === view);
    });

    const deckData = getDeck();
    renderCurrentZone(deckData);
  });
}

/**
 * Initialize application
 */
function init() {
  // Get loading elements
  loadingIndicator = document.getElementById('loading-indicator');
  loadingProgress = document.getElementById('loading-progress');
  deckSelector = document.getElementById('deck-selector');

  // Initialize modules
  initRender();
  initSearch(handlePreview);
  initZoneTabs();
  initZoneCounts();
  initImportExport();
  initFilters();

  // Subscribe to deck changes
  subscribe(handleDeckChange);

  // Initial render
  const initialDeck = getDeck();
  renderCurrentZone(initialDeck);
  updateStats(initialDeck.deck);
  updateBottomBar(initialDeck.stats);

  // Populate deck selector
  if (deckSelector) {
    populateDeckSelector();
    deckSelector.addEventListener('change', (e) => {
      if (e.target.value) {
        loadPreconDeck(e.target.value);
      }
    });

    // Auto-load Najeela deck by default
    deckSelector.value = 'najeela-warriors';
    loadPreconDeck('najeela-warriors');
  }

  // Clear deck button
  const clearBtn = document.getElementById('clear-deck-btn');
  clearBtn?.addEventListener('click', () => {
    if (confirm('Clear all zones?')) {
      clearAllZones();
      renderPreview(null);
      if (deckSelector) {
        deckSelector.value = '';
      }
    }
  });

  console.log('DeckBuilder initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
