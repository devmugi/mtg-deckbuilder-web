/**
 * Search component with debounced autocomplete
 */

import { autocomplete, fetchCardByName } from './scryfall.js';
import { addCard } from './deck.js';

const DEBOUNCE_MS = 150;

let searchInput;
let dropdown;
let debounceTimer = null;
let currentResults = [];
let activeIndex = -1;
let onPreviewCallback = null;

/**
 * Initialize search component
 */
export function initSearch(onPreview) {
  searchInput = document.getElementById('search-input');
  dropdown = document.getElementById('search-dropdown');
  onPreviewCallback = onPreview;

  if (!searchInput || !dropdown) {
    console.error('Search elements not found');
    return;
  }

  searchInput.addEventListener('input', handleInput);
  searchInput.addEventListener('keydown', handleKeydown);

  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });
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

  debounceTimer = setTimeout(async () => {
    const results = await autocomplete(query);
    currentResults = results;
    activeIndex = -1;
    renderDropdown(results);
  }, DEBOUNCE_MS);
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
      break;

    case 'ArrowUp':
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, -1);
      updateActiveItem();
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
 * Render dropdown with results
 */
function renderDropdown(results) {
  if (!results.length) {
    hideDropdown();
    return;
  }

  dropdown.innerHTML = results.map((name, index) => `
    <div class="dropdown-item" data-index="${index}">${escapeHtml(name)}</div>
  `).join('');

  dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
    item.addEventListener('click', () => selectCard(results[index]));
    item.addEventListener('mouseenter', async () => {
      activeIndex = index;
      updateActiveItem();
      const card = await fetchCardByName(results[index]);
      if (card && onPreviewCallback) {
        onPreviewCallback(card);
      }
    });
  });

  dropdown.classList.remove('hidden');
}

/**
 * Update active item styling
 */
function updateActiveItem() {
  dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
    item.classList.toggle('active', index === activeIndex);
  });
}

/**
 * Select a card from results
 */
async function selectCard(name) {
  hideDropdown();
  searchInput.value = '';

  const card = await fetchCardByName(name);
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
