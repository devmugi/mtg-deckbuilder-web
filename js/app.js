/**
 * Main application entry point
 */

import { initSearch } from './search.js';
import { initRender, renderPreview, renderDeck } from './render.js';
import { subscribe, getDeck, clearDeck } from './deck.js';

/**
 * Current preview card state
 */
let currentPreviewCard = null;

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
}

/**
 * Initialize application
 */
function init() {
  // Initialize modules with preview callback
  initRender(handlePreview);
  initSearch(handlePreview);

  // Subscribe to deck changes
  subscribe(handleDeckChange);

  // Initial render
  renderDeck(getDeck());

  // Clear deck button
  const clearBtn = document.getElementById('clear-deck-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Clear all cards from deck?')) {
        clearDeck();
        renderPreview(null);
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
