/**
 * Main application entry point
 */

import { initSearch } from './search.js';
import { initRender, renderPreview, renderDeck, renderSplitView, renderManaCurve, renderColorPie, renderTypeBreakdown, renderZoneCounts } from './render.js';
import {
  addCard, removeCard, subscribe, getDeck, setDeck,
  isModified, getCurrentPrecon,
  addCardToZone, removeCardFromZone, moveCard, getZone, getZoneStats, clearAllZones
} from './deck.js';
import { calculateManaCurve, calculateColorDistribution, calculateTypeDistribution } from './stats.js';
import { getAllPrecons, getPreconById } from './precons.js';
import { fetchCardsBatch } from './scryfall.js';

/**
 * Current preview card state
 */
let currentPreviewCard = null;
let commanderCard = null;
let filterState = {
  colors: [],  // Selected colors - empty = show all, otherwise AND logic
  type: '',  // Single type filter, empty = show all
  boards: []  // Visible boards: 'sideboard', 'maybeboard'
};
let isLoading = false;
let loadingIndicator;
let loadingProgress;
let deckSelector;

/**
 * Handle card preview updates
 * Shows hovered card, or commander if no card hovered
 */
function handlePreview(card) {
  currentPreviewCard = card;
  renderPreview(card || commanderCard);
}

/**
 * Filter cards based on current filter state
 * @param {Array} cards - Card entries to filter
 * @returns {Array} Filtered cards
 */
function filterCards(cards) {
  return cards.filter(({ card }) => {
    // Color filter - empty = show all, otherwise AND logic
    let matchesColor = true;

    if (filterState.colors.length > 0) {
      const cardColors = card.colors || [];
      const selectedColors = filterState.colors.filter(c => c !== 'C');
      const colorlessSelected = filterState.colors.includes('C');

      if (cardColors.length === 0) {
        // Colorless card - only show if C is selected
        matchesColor = colorlessSelected;
      } else if (selectedColors.length === 0) {
        // Only C selected, hide colored cards
        matchesColor = false;
      } else {
        // Card must have ALL selected colors (AND logic)
        matchesColor = selectedColors.every(c => cardColors.includes(c));
      }
    }

    // Type filter - single type, empty = show all
    const matchesType = !filterState.type ||
      (card.typeLine && card.typeLine.includes(filterState.type));

    return matchesColor && matchesType;
  });
}

/**
 * Render zones based on board filter selection
 */
function renderCurrentZone(deckData) {
  const filteredDeck = filterCards(deckData.deck || []);
  const filteredSideboard = filterCards(deckData.sideboard || []);
  const filteredMaybeboard = filterCards(deckData.maybeboard || []);

  const showSideboard = filterState.boards.includes('sideboard');
  const showMaybeboard = filterState.boards.includes('maybeboard');

  const handlers = {
    onPreview: handlePreview,
    onAdd: (card, zone) => addCardToZone(card, zone || 'deck'),
    onRemove: (cardId, zone, deleteAll) => {
      const targetZone = zone || 'deck';
      if (deleteAll) {
        const zoneCards = getZone(targetZone);
        const entry = zoneCards.find(e => e.card.id === cardId);
        if (entry) {
          for (let i = 0; i < entry.quantity; i++) {
            removeCardFromZone(cardId, targetZone);
          }
        }
      } else {
        removeCardFromZone(cardId, targetZone);
      }
    },
    onMove: handleMove
  };

  // No boards selected - show mainboard only in 2 columns
  if (!showSideboard && !showMaybeboard) {
    renderDeck(filteredDeck, 'deck', handlers);
    return;
  }

  // Show split view with selected boards
  renderSplitView(
    {
      deck: filteredDeck,
      sideboard: showSideboard ? filteredSideboard : null,
      maybeboard: showMaybeboard ? filteredMaybeboard : null
    },
    handlers
  );
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
  updateBoardCounts(deckData);

  const sbStats = getZoneStats('sideboard');
  const mbStats = getZoneStats('maybeboard');
  renderZoneCounts(sbStats.totalCards, mbStats.totalCards);
}

/**
 * Update board filter counts
 */
function updateBoardCounts(deckData) {
  const sbCount = document.getElementById('board-count-sideboard');
  const mbCount = document.getElementById('board-count-maybeboard');

  const sbTotal = (deckData.sideboard || []).reduce((sum, e) => sum + e.quantity, 0);
  const mbTotal = (deckData.maybeboard || []).reduce((sum, e) => sum + e.quantity, 0);

  if (sbCount) sbCount.textContent = sbTotal;
  if (mbCount) mbCount.textContent = mbTotal;
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
 * Update deck statistics charts
 */
function updateStats(cards) {
  // Map deck entries to flat structure for stats functions
  const statsCards = cards.map(entry => ({
    cmc: entry.card.cmc,
    colors: entry.card.colors,
    typeLine: entry.card.typeLine,
    quantity: entry.quantity
  }));

  const curve = calculateManaCurve(statsCards);
  const colors = calculateColorDistribution(statsCards);
  const types = calculateTypeDistribution(statsCards);
  renderManaCurve(curve);
  renderColorPie(colors);
  renderTypeBreakdown(types);
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
  showToast(`${precon.name} loaded (${loadedCards.length} cards)`);

  // Set commander (first card with "Legendary" in type, or first card)
  const commander = loadedCards.find(c =>
    c.typeLine && c.typeLine.includes('Legendary')
  ) || loadedCards[0];
  if (commander) {
    commanderCard = commander;
    renderPreview(commander);
  }
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
  const typeFilters = document.getElementById('type-filters');
  const boardFilters = document.getElementById('board-filters');

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

  // Board filter clicks (multi-select toggle)
  boardFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.board-filter-btn');
    if (!btn) return;

    const board = btn.dataset.board;
    btn.classList.toggle('active');

    if (btn.classList.contains('active')) {
      filterState.boards.push(board);
    } else {
      filterState.boards = filterState.boards.filter(b => b !== board);
    }

    const deckData = getDeck();
    renderCurrentZone(deckData);
  });

  // Type filter clicks (single-select)
  typeFilters?.addEventListener('click', (e) => {
    const btn = e.target.closest('.type-filter-btn');
    if (!btn) return;

    const type = btn.dataset.type;

    // If clicking the already selected type, deselect it (show all)
    if (filterState.type === type) {
      filterState.type = '';
      btn.classList.remove('active');
    } else {
      // Deselect all, then select clicked one
      filterState.type = type;
      typeFilters.querySelectorAll('.type-filter-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.type === type);
      });
    }

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
  initImportExport();
  initFilters();

  // Reset preview to commander when mouse leaves deck list
  const deckList = document.getElementById('deck-list');
  deckList?.addEventListener('mouseleave', () => handlePreview(null));

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

  console.log('DeckBuilder initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
