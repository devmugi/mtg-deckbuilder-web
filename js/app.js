/**
 * Main application entry point
 */

import { initSearch } from './search.js';
import { initRender, renderPreview, renderDeck, renderManaCurve, renderColorPie } from './render.js';
import { subscribe, getDeck, clearDeck } from './deck.js';
import { calculateManaCurve, calculateColorDistribution } from './stats.js';
import { getAllPrecons, getPreconById } from './precons.js';
import { fetchCardsBatch } from './scryfall.js';
import { isModified, setDeck, getCurrentPrecon } from './deck.js';

/**
 * Current preview card state
 */
let currentPreviewCard = null;
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
 * Handle deck state changes
 */
function handleDeckChange(deckData) {
  renderDeck(deckData);
  updateStats(deckData.cards);
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
 * Initialize application
 */
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
  const initialDeck = getDeck();
  renderDeck(initialDeck);
  updateStats(initialDeck.cards);

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

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
