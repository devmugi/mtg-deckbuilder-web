/**
 * Search component with rich dropdown and deck color filter
 */

import { autocomplete, fetchCardsBatch, searchCards } from './scryfall.js';
import { addCard, deleteCard } from './deck.js';
import { showToast } from './toast.js';

const DEBOUNCE_MS = 200;

let searchInput;
let dropdown;
let filterToggle;
let filterColors;
let searchFilters;
let searchSpinner;
let debounceTimer = null;
let currentResults = [];
let activeIndex = -1;
let onPreviewCallback = null;

// Deck color state
let deckColorIdentity = [];
let deckFilterEnabled = false;

// Pending selection while card data is loading
let pendingSelectionIndex = -1;

/**
 * Initialize search component
 */
export function initSearch(onPreview) {
  searchInput = document.getElementById('search-input');
  dropdown = document.getElementById('search-dropdown');
  filterToggle = document.getElementById('search-filter-toggle');
  filterColors = document.getElementById('search-filter-colors');
  searchFilters = document.getElementById('search-filters');
  searchSpinner = document.getElementById('search-spinner');
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
      e.preventDefault();
      e.stopPropagation();
      const index = parseInt(item.dataset.index, 10);
      selectCardByIndex(index);
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
 * Show/hide search spinner
 */
function showSpinner() {
  if (searchSpinner) {
    searchSpinner.classList.remove('hidden');
    searchInput?.classList.add('loading');
  }
}

function hideSpinner() {
  if (searchSpinner) {
    searchSpinner.classList.add('hidden');
    searchInput?.classList.remove('loading');
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

  showSpinner();
  debounceTimer = setTimeout(() => {
    runSearch(query);
  }, DEBOUNCE_MS);
}

/**
 * Run search with appropriate method based on filter state
 */
async function runSearch(query) {
  try {
    if (deckFilterEnabled && deckColorIdentity.length > 0) {
      // Use search endpoint with color identity filter - full data in one call
      const cards = await searchCards(query, deckColorIdentity);
      currentResults = cards;
      activeIndex = -1;
      renderRichDropdown(cards);
    } else {
      // Progressive loading: show names first, then fetch details
      const names = await autocomplete(query);
      if (names.length === 0) {
        hideDropdown();
        return;
      }

      // Show skeleton items with names immediately
      const limitedNames = names.slice(0, 10);
      currentResults = limitedNames.map(name => ({ name, loading: true }));
      activeIndex = -1;
      renderSkeletonDropdown(limitedNames);
      hideSpinner();

      // Fetch full card data and update progressively
      const cards = await fetchCardsBatch(limitedNames);
      currentResults = cards;
      updateDropdownWithCards(cards);
    }
  } catch (error) {
    console.error('Search failed:', error);
    hideDropdown();
  }
}

/**
 * Render skeleton dropdown with just card names
 */
function renderSkeletonDropdown(names) {
  dropdown.innerHTML = names.map((name, index) => `
    <div class="search-result-item" data-index="${index}" data-name="${escapeHtml(name)}">
      <div class="search-result-item-art shimmer"></div>
      <div class="search-result-item-info">
        <div class="search-result-item-name">${escapeHtml(name)}</div>
        <div class="search-result-item-type shimmer-text"></div>
      </div>
      <div class="search-result-item-mana">
        <div class="shimmer-mana"></div>
      </div>
      <div class="search-result-item-price shimmer-text"></div>
    </div>
  `).join('');

  dropdown.classList.remove('hidden');
}

/**
 * Update dropdown items with full card data
 */
function updateDropdownWithCards(cards) {
  const items = dropdown.querySelectorAll('.search-result-item');

  cards.forEach((card, index) => {
    const item = items[index];
    if (!item) return;

    const mismatchClass = !deckFilterEnabled && deckColorIdentity.length > 0 && !cardFitsColorIdentity(card, deckColorIdentity)
      ? 'color-mismatch'
      : '';

    if (mismatchClass) {
      item.classList.add('color-mismatch');
    }

    // Update art
    const artEl = item.querySelector('.search-result-item-art');
    if (artEl) {
      const image = card.images.artCrop || card.images.small || '';
      if (image) {
        const img = document.createElement('img');
        img.className = 'search-result-item-art';
        img.src = image;
        img.alt = '';
        img.loading = 'lazy';
        artEl.replaceWith(img);
      } else {
        artEl.classList.remove('shimmer');
      }
    }

    // Update type
    const typeEl = item.querySelector('.search-result-item-type');
    if (typeEl) {
      typeEl.textContent = card.typeLine || '';
      typeEl.classList.remove('shimmer-text');
    }

    // Update mana
    const manaEl = item.querySelector('.search-result-item-mana');
    if (manaEl) {
      manaEl.innerHTML = renderManaCost(card.manaCost);
    }

    // Update price
    const priceEl = item.querySelector('.search-result-item-price');
    if (priceEl) {
      priceEl.textContent = card.prices.usd ? `$${card.prices.usd}` : '';
      priceEl.classList.remove('shimmer-text');
    }
  });

  // Process pending selection if user clicked while loading
  if (pendingSelectionIndex >= 0 && cards[pendingSelectionIndex]) {
    selectCard(cards[pendingSelectionIndex]);
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

  hideSpinner();
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
        selectCardByIndex(activeIndex);
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
 * Select a card by index - queues selection if card is still loading
 */
function selectCardByIndex(index) {
  const card = currentResults[index];
  if (!card) return;

  // If card is fully loaded, select it immediately
  if (card.id) {
    selectCard(card);
  } else {
    // Card still loading - queue selection for when data arrives
    pendingSelectionIndex = index;
  }
}

/**
 * Select a card from results (card must be fully loaded)
 */
function selectCard(card) {
  if (!card || !card.id) return;

  pendingSelectionIndex = -1;
  hideDropdown();
  searchInput.value = '';
  addCard(card);
  if (onPreviewCallback) {
    onPreviewCallback(card);
  }

  // Show toast with undo action
  showToast(`Added ${card.name}`, {
    label: 'Undo',
    callback: () => deleteCard(card.id)
  });
}

/**
 * Hide dropdown
 */
function hideDropdown() {
  dropdown.classList.add('hidden');
  hideSpinner();
  currentResults = [];
  activeIndex = -1;
  pendingSelectionIndex = -1;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
