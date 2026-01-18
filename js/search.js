/**
 * Search component with rich dropdown and deck color filter
 */

import { autocomplete, fetchCardsBatch, searchCards } from './scryfall.js';
import { addCard } from './deck.js';

const DEBOUNCE_MS = 200;

let searchInput;
let dropdown;
let filterToggle;
let filterColors;
let searchFilters;
let debounceTimer = null;
let currentResults = [];
let activeIndex = -1;
let onPreviewCallback = null;

// Deck color state
let deckColorIdentity = [];
let deckFilterEnabled = false;

/**
 * Initialize search component
 */
export function initSearch(onPreview) {
  searchInput = document.getElementById('search-input');
  dropdown = document.getElementById('search-dropdown');
  filterToggle = document.getElementById('search-filter-toggle');
  filterColors = document.getElementById('search-filter-colors');
  searchFilters = document.getElementById('search-filters');
  onPreviewCallback = onPreview;

  if (!searchInput || !dropdown) {
    console.error('Search elements not found');
    return;
  }

  searchInput.addEventListener('input', handleInput);
  searchInput.addEventListener('keydown', handleKeydown);

  if (filterToggle) {
    filterToggle.addEventListener('click', toggleDeckFilter);
  }

  // Initially hide search filters until deck is loaded
  if (searchFilters) {
    searchFilters.classList.add('hidden');
  }

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });

  // Event delegation for dropdown items
  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) {
      const index = parseInt(item.dataset.index, 10);
      selectCard(currentResults[index]);
    }
  });

  dropdown.addEventListener('mouseover', (e) => {
    const item = e.target.closest('.search-result-item');
    if (item) {
      const index = parseInt(item.dataset.index, 10);
      activeIndex = index;
      updateActiveItem();
      if (onPreviewCallback && currentResults[index]) {
        onPreviewCallback(currentResults[index]);
      }
    }
  });
}

/**
 * Set deck colors for filtering
 */
export function setDeckColors(colors) {
  deckColorIdentity = colors || [];
  renderFilterColors();

  if (searchFilters) {
    if (deckColorIdentity.length > 0) {
      searchFilters.classList.remove('hidden');
    } else {
      searchFilters.classList.add('hidden');
      deckFilterEnabled = false;
      filterToggle?.classList.remove('active');
    }
  }
}

/**
 * Render color icons in the filter area
 */
function renderFilterColors() {
  if (!filterColors) return;

  filterColors.innerHTML = deckColorIdentity.map(color =>
    `<img class="mana-symbol" src="https://svgs.scryfall.io/card-symbols/${color}.svg" alt="${color}">`
  ).join('');
}

/**
 * Toggle deck color filter
 */
function toggleDeckFilter() {
  deckFilterEnabled = !deckFilterEnabled;

  if (filterToggle) {
    filterToggle.classList.toggle('active', deckFilterEnabled);
  }

  // Re-run search if there's a query
  const query = searchInput?.value.trim();
  if (query && query.length >= 2) {
    runSearch(query);
  }
}

/**
 * Handle input changes with debounce
 */
function handleInput(e) {
  const query = e.target.value.trim();

  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  if (!query || query.length < 2) {
    hideDropdown();
    return;
  }

  debounceTimer = setTimeout(() => {
    runSearch(query);
  }, DEBOUNCE_MS);
}

/**
 * Run search with appropriate method based on filter state
 */
async function runSearch(query) {
  try {
    let cards;

    if (deckFilterEnabled && deckColorIdentity.length > 0) {
      // Use search endpoint with color identity filter
      cards = await searchCards(query, deckColorIdentity);
    } else {
      // Use autocomplete + batch fetch for full card data
      const names = await autocomplete(query);
      if (names.length > 0) {
        cards = await fetchCardsBatch(names.slice(0, 10));
      } else {
        cards = [];
      }
    }

    currentResults = cards;
    activeIndex = -1;
    renderRichDropdown(cards);
  } catch (error) {
    console.error('Search failed:', error);
    hideDropdown();
  }
}

/**
 * Render rich dropdown with card details
 */
function renderRichDropdown(cards) {
  if (!cards.length) {
    hideDropdown();
    return;
  }

  dropdown.innerHTML = cards.map((card, index) => {
    const image = card.images.artCrop || card.images.small || '';
    const price = card.prices.usd ? `$${card.prices.usd}` : '';
    const manaHtml = renderManaCost(card.manaCost);
    const mismatchClass = !deckFilterEnabled && deckColorIdentity.length > 0 && !cardFitsColorIdentity(card, deckColorIdentity)
      ? 'color-mismatch'
      : '';

    return `
      <div class="search-result-item ${mismatchClass}" data-index="${index}">
        <img class="search-result-item-art" src="${image}" alt="" loading="lazy">
        <div class="search-result-item-info">
          <div class="search-result-item-name">${escapeHtml(card.name)}</div>
          <div class="search-result-item-type">${escapeHtml(card.typeLine)}</div>
        </div>
        <div class="search-result-item-mana">${manaHtml}</div>
        <div class="search-result-item-price">${price}</div>
      </div>
    `;
  }).join('');

  dropdown.classList.remove('hidden');
}

/**
 * Check if card fits within deck's color identity
 */
function cardFitsColorIdentity(card, deckColors) {
  if (!card.colorIdentity || card.colorIdentity.length === 0) {
    return true; // Colorless cards fit in any deck
  }
  return card.colorIdentity.every(color => deckColors.includes(color));
}

/**
 * Render mana cost as symbol images
 */
function renderManaCost(manaCost) {
  if (!manaCost) return '';

  // Parse mana symbols like {2}{U}{U} or {W/U}
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];

  return symbols.map(symbol => {
    // Extract symbol content without braces and convert to URL format
    const content = symbol.slice(1, -1).replace('/', '');
    return `<img class="mana-symbol" src="https://svgs.scryfall.io/card-symbols/${content}.svg" alt="${symbol}">`;
  }).join('');
}

/**
 * Handle keyboard navigation
 */
function handleKeydown(e) {
  if (!currentResults.length) return;

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentResults.length - 1);
      updateActiveItem();
      // Show preview when navigating with arrow keys
      if (activeIndex >= 0 && onPreviewCallback) {
        onPreviewCallback(currentResults[activeIndex]);
      }
      break;

    case 'ArrowUp':
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveItem();
      // Show preview when navigating with arrow keys
      if (activeIndex >= 0 && onPreviewCallback) {
        onPreviewCallback(currentResults[activeIndex]);
      }
      break;

    case 'Enter':
      e.preventDefault();
      if (activeIndex >= 0) {
        selectCard(currentResults[activeIndex]);
      }
      break;

    case 'Escape':
      hideDropdown();
      searchInput.blur();
      break;
  }
}

/**
 * Update active item styling
 */
function updateActiveItem() {
  dropdown.querySelectorAll('.search-result-item').forEach((item, index) => {
    item.classList.toggle('active', index === activeIndex);
  });
}

/**
 * Select a card from results
 */
function selectCard(card) {
  hideDropdown();
  searchInput.value = '';

  if (card) {
    addCard(card);
    if (onPreviewCallback) {
      onPreviewCallback(card);
    }
  }
}

/**
 * Hide dropdown
 */
function hideDropdown() {
  dropdown.classList.add('hidden');
  currentResults = [];
  activeIndex = -1;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
