/**
 * Main application entry point
 */

import { initSearch, setDeckColors } from './search.js';
import { initRender, renderPreview, renderDeck, renderSplitView, renderManaCurve, renderColorPie, renderTypeBreakdown, renderZoneCounts } from './render.js';
import {
  addCard, removeCard, subscribe, getDeck, setDeck,
  isModified, getCurrentPrecon,
  addCardToZone, removeCardFromZone, moveCard, getZone, getZoneStats, clearAllZones, deleteCard
} from './deck.js';
import { calculateManaCurve, calculateColorDistribution, calculateTypeDistribution } from './stats.js';
import { getAllPrecons, getPreconById } from './precons.js';
import { fetchCardsBatch } from './scryfall.js';
import { getSavedDecks, saveDeck, deleteSavedDeck, getSavedDeckById, setLastDeckId, getLastDeckId } from './storage.js';
import { showToast } from './toast.js';

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
let deckSelectorContainer;
let deckSelectorButton;
let deckSelectorDropdown;
let commanderCache = {}; // Cache commander card data
let selectedDeckId = null; // Currently selected deck
let currentLoadId = 0; // Track current load operation to cancel previous

/**
 * Mobile tab navigation state
 */
let currentMobileTab = 'deck';

/**
 * Setup mobile tab navigation
 */
function setupMobileTabs() {
  const tabsContainer = document.getElementById('mobile-tabs');
  if (!tabsContainer) return;

  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.mobile-tab');
    if (!tab) return;

    const tabName = tab.dataset.tab;
    if (tabName === currentMobileTab) return;

    // Update active tab button
    tabsContainer.querySelectorAll('.mobile-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Show/hide content based on tab
    currentMobileTab = tabName;
    updateMobileTabContent();
  });
}

/**
 * Update visible content based on current mobile tab
 */
function updateMobileTabContent() {
  const mainPanel = document.querySelector('.main-panel');
  const leftPanel = document.querySelector('.left-panel');
  const filterBar = document.getElementById('filter-bar');
  const searchContainer = document.querySelector('.search-container');

  // Reset visibility
  if (mainPanel) mainPanel.style.display = '';
  if (leftPanel) {
    leftPanel.style.display = '';
    leftPanel.classList.remove('mobile-visible');
  }
  if (filterBar) filterBar.style.display = '';
  if (searchContainer) {
    searchContainer.style.display = '';
    searchContainer.classList.remove('mobile-visible');
  }

  // Only apply on mobile
  if (window.innerWidth > 768) return;

  switch (currentMobileTab) {
    case 'deck':
      if (leftPanel) leftPanel.style.display = 'none';
      if (searchContainer) searchContainer.style.display = 'none';
      break;
    case 'search':
      if (leftPanel) leftPanel.style.display = 'none';
      if (filterBar) filterBar.style.display = 'none';
      if (searchContainer) {
        searchContainer.style.display = 'block';
        searchContainer.classList.add('mobile-visible');
      }
      break;
    case 'stats':
      if (mainPanel) mainPanel.style.display = 'none';
      if (leftPanel) {
        leftPanel.style.display = 'flex';
        leftPanel.classList.add('mobile-visible');
      }
      if (searchContainer) searchContainer.style.display = 'none';
      break;
  }
}

/**
 * Card modal state
 */
let cardModalCard = null;

/**
 * Mobile filter bar collapse state
 */
let lastScrollY = 0;
let filterBarCollapsed = false;

/**
 * Setup mobile filter bar collapse on scroll
 */
function setupMobileFilterCollapse() {
  const deckList = document.getElementById('deck-list');
  const filterBar = document.getElementById('filter-bar');
  const filterToggle = document.getElementById('filter-toggle');

  if (!deckList || !filterBar) return;

  // Scroll handler - hide filter on scroll down, show on scroll up
  deckList.addEventListener('scroll', () => {
    if (window.innerWidth > 768) return;

    const currentScrollY = deckList.scrollTop;
    const scrollingDown = currentScrollY > lastScrollY && currentScrollY > 50;

    if (scrollingDown && !filterBarCollapsed) {
      filterBar.classList.add('collapsed');
      filterBarCollapsed = true;
    } else if (currentScrollY < lastScrollY && filterBarCollapsed) {
      filterBar.classList.remove('collapsed');
      filterBarCollapsed = false;
    }

    lastScrollY = currentScrollY;
  });

  // Toggle button handler
  if (filterToggle) {
    filterToggle.addEventListener('click', () => {
      filterBarCollapsed = !filterBarCollapsed;
      filterBar.classList.toggle('collapsed', filterBarCollapsed);
    });
  }
}

/**
 * Card action menu state (mobile)
 */
let cardActionMenuCard = null;
let cardActionMenuZone = null;

/**
 * Setup card action menu (mobile)
 */
function setupCardActionMenu() {
  const menu = document.getElementById('card-action-menu');
  if (!menu) return;

  // Handle menu actions
  menu.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-menu-action]');
    if (!btn || !cardActionMenuCard) return;

    const action = btn.dataset.menuAction;
    const cardId = cardActionMenuCard.id;

    switch (action) {
      case 'minus':
        removeCardFromZone(cardId, cardActionMenuZone);
        updateCardActionMenuQty();
        break;
      case 'plus':
        addCardToZone(cardActionMenuCard, cardActionMenuZone);
        updateCardActionMenuQty();
        break;
      case 'sideboard':
        moveCard(cardId, cardActionMenuZone, 'sideboard');
        closeCardActionMenu();
        break;
      case 'maybeboard':
        moveCard(cardId, cardActionMenuZone, 'maybeboard');
        closeCardActionMenu();
        break;
      case 'main':
        moveCard(cardId, cardActionMenuZone, 'deck');
        closeCardActionMenu();
        break;
      case 'delete':
        deleteCard(cardId, cardActionMenuZone);
        closeCardActionMenu();
        break;
    }
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('hidden') &&
        !e.target.closest('.card-action-menu') &&
        !e.target.closest('.deck-card-menu-btn')) {
      closeCardActionMenu();
    }
  });
}

function openCardActionMenu(card, zone, buttonEl) {
  if (window.innerWidth > 768) return;

  cardActionMenuCard = card;
  cardActionMenuZone = zone;

  const menu = document.getElementById('card-action-menu');
  if (!menu) return;

  // Position menu near the button
  const rect = buttonEl.getBoundingClientRect();
  menu.style.top = `${rect.bottom + 4}px`;
  menu.style.right = `${window.innerWidth - rect.right}px`;
  menu.style.left = 'auto';

  // Update quantity display
  updateCardActionMenuQty();

  // Show/hide move options based on current zone
  menu.querySelectorAll('[data-menu-action="sideboard"]')[0].style.display =
    zone === 'sideboard' ? 'none' : '';
  menu.querySelectorAll('[data-menu-action="maybeboard"]')[0].style.display =
    zone === 'maybeboard' ? 'none' : '';
  menu.querySelectorAll('[data-menu-action="main"]')[0].style.display =
    zone === 'deck' ? 'none' : '';

  menu.classList.remove('hidden');
}

function closeCardActionMenu() {
  const menu = document.getElementById('card-action-menu');
  if (menu) {
    menu.classList.add('hidden');
  }
  cardActionMenuCard = null;
  cardActionMenuZone = null;
}

function updateCardActionMenuQty() {
  const qtyEl = document.getElementById('card-action-menu-qty');
  if (!qtyEl || !cardActionMenuCard) return;

  const zoneData = cardActionMenuZone === 'deck' ? deckState.deck :
                   cardActionMenuZone === 'sideboard' ? deckState.sideboard :
                   deckState.maybeboard;
  const entry = zoneData.find(c => c.card.id === cardActionMenuCard.id);
  qtyEl.textContent = entry ? entry.quantity : 0;

  // Close if card was removed
  if (!entry) {
    closeCardActionMenu();
  }
}

/**
 * Open card preview modal
 */
function openCardModal(card, zone = 'deck') {
  if (!card || window.innerWidth > 768) return;

  cardModalCard = { card, zone };

  const backdrop = document.getElementById('card-modal-backdrop');
  const modal = document.getElementById('card-modal');
  const imageContainer = document.getElementById('card-modal-image');
  const nameEl = document.getElementById('card-modal-name');
  const typeEl = document.getElementById('card-modal-type');
  const priceEl = document.getElementById('card-modal-price');
  const actionsEl = document.getElementById('card-modal-actions');

  // Populate content
  const imageUrl = card.imageUris?.normal || card.imageUris?.small || '';
  imageContainer.innerHTML = imageUrl ? `<img src="${imageUrl}" alt="${card.name}">` : '';
  nameEl.textContent = card.name;
  typeEl.textContent = card.typeLine || '';
  priceEl.textContent = card.prices?.usd ? `$${card.prices.usd}` : '';

  // Build action buttons
  actionsEl.innerHTML = `
    <button class="btn btn-secondary btn-sm" data-action="remove">
      <span>−</span>
    </button>
    <span style="min-width: 30px; text-align: center;">1</span>
    <button class="btn btn-secondary btn-sm" data-action="add">
      <span>+</span>
    </button>
    <button class="btn btn-secondary btn-sm" data-action="sideboard">SB</button>
    <button class="btn btn-secondary btn-sm" data-action="maybeboard">MB</button>
    <button class="btn btn-danger btn-sm" data-action="delete">✕</button>
  `;

  // Show modal
  backdrop.classList.remove('hidden');
  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  });
}

/**
 * Close card preview modal
 */
function closeCardModal() {
  const backdrop = document.getElementById('card-modal-backdrop');
  const modal = document.getElementById('card-modal');

  backdrop.classList.remove('visible');
  modal.classList.remove('visible');

  setTimeout(() => {
    backdrop.classList.add('hidden');
    modal.classList.add('hidden');
    cardModalCard = null;
  }, 200);
}

/**
 * Setup card modal event listeners
 */
function setupCardModal() {
  const backdrop = document.getElementById('card-modal-backdrop');
  const actionsEl = document.getElementById('card-modal-actions');

  if (backdrop) {
    backdrop.addEventListener('click', closeCardModal);
  }

  if (actionsEl) {
    actionsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn || !cardModalCard) return;

      const action = btn.dataset.action;
      const { card, zone } = cardModalCard;

      switch (action) {
        case 'add':
          addCardToZone(card, zone);
          break;
        case 'remove':
          removeCardFromZone(card.id, zone);
          break;
        case 'delete':
          deleteCard(card.id, zone);
          closeCardModal();
          break;
        case 'sideboard':
          moveCard(card.id, zone, 'sideboard');
          closeCardModal();
          break;
        case 'maybeboard':
          moveCard(card.id, zone, 'maybeboard');
          closeCardModal();
          break;
      }
    });
  }
}

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
    onPreview: (card, zone) => {
      handlePreview(card);
      // On mobile, tapping opens modal
      if (window.innerWidth <= 768 && card) {
        openCardModal(card, zone || 'deck');
      }
    },
    onMenuOpen: (card, zone, buttonEl) => {
      openCardActionMenu(card, zone, buttonEl);
    },
    onAdd: (card, zone) => addCardToZone(card, zone || 'deck'),
    onRemove: (cardId, zone, deleteAll) => {
      const targetZone = zone || 'deck';
      if (deleteAll) {
        deleteCard(cardId, targetZone);
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
 * Render mana cost as symbols for deck selector
 */
function renderManaIcons(manaCost) {
  if (!manaCost) return '';
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];
  return symbols.map(symbol => {
    const code = symbol.slice(1, -1).replace('/', '');
    return `<img class="mana-symbol" src="https://svgs.scryfall.io/card-symbols/${encodeURIComponent(code)}.svg" alt="${symbol}">`;
  }).join('');
}

/**
 * Get completion class based on card count
 */
function getCompletionClass(count) {
  if (count >= 100) return 'deck-completion-complete';
  if (count >= 50) return 'deck-completion-partial';
  return 'deck-completion-incomplete';
}

/**
 * Populate deck selector dropdown with rich items
 * Uses Scryfall collection API for batch fetching
 */
async function populateDeckSelector() {
  const precons = getAllPrecons();
  const savedDecks = getSavedDecks();

  // Combine saved decks (first) and precons for rendering
  const allDecks = [
    ...savedDecks.map(d => ({
      id: d.id,
      name: d.name,
      commander: d.commander,
      cardCount: d.cards.length,
      isSaved: true
    })),
    ...precons.map(d => ({ ...d, isSaved: false }))
  ];

  // Render placeholder items first
  renderDeckSelectorItems(allDecks);

  // Get unique commander names that aren't cached
  const commanderNames = allDecks
    .map(d => d.commander)
    .filter(name => name && !commanderCache[name]);

  if (commanderNames.length === 0) return;

  // Batch fetch using Scryfall collection API
  try {
    const identifiers = commanderNames.map(name => ({ name }));
    const response = await fetch('https://api.scryfall.com/cards/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifiers })
    });

    if (response.ok) {
      const data = await response.json();
      // Cache all fetched commanders
      for (const card of data.data) {
        commanderCache[card.name] = {
          name: card.name,
          typeLine: card.type_line,
          manaCost: card.mana_cost,
          artCrop: card.image_uris?.art_crop || card.card_faces?.[0]?.image_uris?.art_crop
        };
      }
      // Re-render with fetched data
      renderDeckSelectorItems(allDecks);
      // Update selected deck button if one is selected
      if (selectedDeckId) {
        updateSelectedDeckButton(selectedDeckId);
      }
    }
  } catch (err) {
    console.warn('Failed to fetch commanders:', err);
  }
}

/**
 * Render deck selector dropdown items
 */
function renderDeckSelectorItems(decks) {
  // Import action as first item
  const importAction = `
    <div class="deck-selector-action" id="deck-import-action">
      <svg class="deck-selector-action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
      <span>Import Deck</span>
    </div>
  `;

  const deckItems = decks.map(deck => {
    const cached = commanderCache[deck.commander];
    const completionClass = getCompletionClass(deck.cardCount);

    return `
      <div class="deck-selector-item${deck.isSaved ? ' deck-selector-item--saved' : ''}" data-deck-id="${deck.id}" data-is-saved="${deck.isSaved}">
        <div class="deck-selector-item-art-container">
          ${cached?.artCrop
            ? `<img class="deck-selector-item-art" src="${cached.artCrop}" alt="" loading="lazy">`
            : `<div class="deck-selector-item-art-placeholder"></div>`
          }
        </div>
        <div class="deck-selector-item-info">
          <div class="deck-selector-item-name">${deck.name}</div>
          <div class="deck-selector-item-type">${cached?.typeLine || 'Loading...'}</div>
        </div>
        <div class="deck-selector-item-meta">
          <div class="deck-selector-item-mana">
            ${cached?.manaCost ? renderManaIcons(cached.manaCost) : ''}
          </div>
          <span class="deck-completion ${completionClass}">${deck.cardCount}/100</span>
        </div>
        ${deck.isSaved ? `
          <button class="deck-selector-item-delete" data-deck-id="${deck.id}" title="Delete deck">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  deckSelectorDropdown.innerHTML = importAction + deckItems;

  // Add import click handler
  document.getElementById('deck-import-action')?.addEventListener('click', () => {
    closeDeckSelector();
    showImportModal();
  });

  // Add deck click handlers
  deckSelectorDropdown.querySelectorAll('.deck-selector-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Don't select deck if clicking delete button
      if (e.target.closest('.deck-selector-item-delete')) return;

      const deckId = item.dataset.deckId;
      const isSaved = item.dataset.isSaved === 'true';
      if (isSaved) {
        loadSavedDeck(deckId);
      } else {
        selectDeck(deckId);
      }
    });
  });

  // Add delete handlers for saved decks
  deckSelectorDropdown.querySelectorAll('.deck-selector-item-delete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const deckId = btn.dataset.deckId;
      if (confirm('Delete this saved deck?')) {
        deleteSavedDeck(deckId);
        if (selectedDeckId === deckId) {
          selectedDeckId = null;
          deckSelectorButton.innerHTML = '<span class="deck-selector-placeholder">Select a deck...</span>';
        }
        await populateDeckSelector();
        showToast('Deck deleted');
      }
    });
  });
}

/**
 * Update the selected deck button display
 */
function updateSelectedDeckButton(deckId) {
  // Try precon first, then saved deck
  const precon = getPreconById(deckId);
  const savedDeck = !precon ? getSavedDeckById(deckId) : null;
  const deck = precon || savedDeck;

  if (!deck) return;

  const commanderName = precon?.commander || savedDeck?.commander;
  const cached = commanderCache[commanderName];
  const cardCount = precon?.cards?.length || savedDeck?.cards?.length || 0;
  const completionClass = getCompletionClass(cardCount);

  deckSelectorButton.innerHTML = `
    <div class="deck-selector-selected">
      ${cached?.artCrop
        ? `<img class="deck-selector-selected-art" src="${cached.artCrop}" alt="">`
        : `<div class="deck-selector-selected-art-placeholder"></div>`
      }
      <span class="deck-selector-selected-name">${deck.name}</span>
    </div>
    <span class="deck-completion ${completionClass}">${cardCount}/100</span>
  `;
}

/**
 * Select a deck and update the button
 */
function selectDeck(deckId) {
  const precon = getPreconById(deckId);
  if (!precon) return;

  // Store selected deck ID and persist to localStorage
  selectedDeckId = deckId;
  setLastDeckId(deckId);

  // Close dropdown
  closeDeckSelector();

  // Update button with selected deck
  updateSelectedDeckButton(deckId);

  // Mark selected item
  deckSelectorDropdown.querySelectorAll('.deck-selector-item').forEach(item => {
    item.classList.toggle('selected', item.dataset.deckId === deckId);
  });

  // Load the deck
  loadPreconDeck(deckId);
}

/**
 * Toggle deck selector dropdown
 */
function toggleDeckSelector() {
  const isOpen = deckSelectorContainer.classList.contains('open');
  if (isOpen) {
    closeDeckSelector();
  } else {
    openDeckSelector();
  }
}

/**
 * Open deck selector dropdown
 */
function openDeckSelector() {
  deckSelectorContainer.classList.add('open');
  deckSelectorDropdown.classList.remove('hidden');
}

/**
 * Close deck selector dropdown
 */
function closeDeckSelector() {
  deckSelectorContainer.classList.remove('open');
  deckSelectorDropdown.classList.add('hidden');
}

/**
 * Initialize deck selector
 */
function initDeckSelector() {
  deckSelectorContainer = document.getElementById('deck-selector');
  deckSelectorButton = document.getElementById('deck-selector-button');
  deckSelectorDropdown = document.getElementById('deck-selector-dropdown');

  if (!deckSelectorButton) return;

  // Toggle dropdown on button click
  deckSelectorButton.addEventListener('click', toggleDeckSelector);

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!deckSelectorContainer.contains(e.target)) {
      closeDeckSelector();
    }
  });

  // Populate dropdown
  populateDeckSelector();

  // Load last selected deck, or default to Najeela
  const lastDeckId = getLastDeckId() || 'najeela-warriors';
  setTimeout(() => {
    // Check if it's a saved deck or precon
    if (getSavedDeckById(lastDeckId)) {
      loadSavedDeck(lastDeckId);
    } else {
      selectDeck(lastDeckId);
    }
  }, 100);
}

/**
 * Load a precon deck progressively
 */
async function loadPreconDeck(deckId) {
  const precon = getPreconById(deckId);
  if (!precon) return;

  // Cancel any previous load by incrementing the load ID
  currentLoadId++;
  const thisLoadId = currentLoadId;

  // Clear deck and all zones immediately
  clearAllZones();
  setDeck([], null);
  commanderCard = null;
  renderPreview(null);
  setDeckColors([]); // Clear search filter colors

  // Get all card lists
  const mainboardNames = precon.cards || [];
  const sideboardNames = precon.sideboard || [];
  const maybeboardNames = precon.maybeboard || [];
  const totalCards = mainboardNames.length + sideboardNames.length + maybeboardNames.length;

  // Start loading
  isLoading = true;
  loadingIndicator.classList.remove('hidden');
  loadingProgress.textContent = `0/${totalCards}`;

  const batchSize = 10;
  const loadedCards = [];
  let loadedCount = 0;

  // Helper to load cards in batches
  async function loadCardBatches(cardNames, zone) {
    for (let i = 0; i < cardNames.length; i += batchSize) {
      if (thisLoadId !== currentLoadId) return null;

      const batch = cardNames.slice(i, i + batchSize);
      const cards = await fetchCardsBatch(batch);

      if (thisLoadId !== currentLoadId) return null;

      // Add cards to appropriate zone
      for (const card of cards) {
        if (zone === 'deck') {
          loadedCards.push(card);
        } else {
          addCardToZone(card, zone);
        }
      }

      loadedCount += cards.length;
      loadingProgress.textContent = `${loadedCount}/${totalCards}`;

      // Update main deck display
      if (zone === 'deck') {
        setDeck(loadedCards, deckId);
      }
    }
    return true;
  }

  // Load mainboard
  if (await loadCardBatches(mainboardNames, 'deck') === null) return;

  // Load sideboard
  if (sideboardNames.length > 0) {
    if (await loadCardBatches(sideboardNames, 'sideboard') === null) return;
  }

  // Load maybeboard
  if (maybeboardNames.length > 0) {
    if (await loadCardBatches(maybeboardNames, 'maybeboard') === null) return;
  }

  // Final check before completing
  if (thisLoadId !== currentLoadId) {
    return;
  }

  // Done loading
  isLoading = false;
  loadingIndicator.classList.add('hidden');

  const sbCount = sideboardNames.length;
  const mbCount = maybeboardNames.length;
  let toastMsg = `${precon.name} loaded (${loadedCards.length} cards`;
  if (sbCount > 0 || mbCount > 0) {
    toastMsg += `, SB: ${sbCount}, MB: ${mbCount}`;
  }
  toastMsg += ')';
  showToast(toastMsg);

  // Set commander (first card with "Legendary" in type, or first card)
  const commander = loadedCards.find(c =>
    c.typeLine && c.typeLine.includes('Legendary')
  ) || loadedCards[0];
  if (commander) {
    commanderCard = commander;
    renderPreview(commander);
    // Set deck colors for search filter
    setDeckColors(commander.colorIdentity || []);
  }
}

/**
 * Load a saved deck from localStorage
 */
async function loadSavedDeck(deckId) {
  const savedDeck = getSavedDeckById(deckId);
  if (!savedDeck) return;

  // Cancel any previous load
  currentLoadId++;
  const thisLoadId = currentLoadId;

  // Store selected deck ID, persist to localStorage, and close dropdown
  selectedDeckId = deckId;
  setLastDeckId(deckId);
  closeDeckSelector();

  // Update button with selected deck
  updateSelectedDeckButton(deckId);

  // Clear deck and all zones
  clearAllZones();
  setDeck([], null);
  commanderCard = null;
  renderPreview(null);
  setDeckColors([]);

  // Get all card lists
  const mainboardNames = savedDeck.cards || [];
  const sideboardNames = savedDeck.sideboard || [];
  const maybeboardNames = savedDeck.maybeboard || [];
  const totalCards = mainboardNames.length + sideboardNames.length + maybeboardNames.length;

  // Start loading
  isLoading = true;
  loadingIndicator.classList.remove('hidden');
  loadingProgress.textContent = `0/${totalCards}`;

  const batchSize = 10;
  const loadedCards = [];
  let loadedCount = 0;

  // Helper to load cards in batches
  async function loadCardBatches(cardNames, zone) {
    for (let i = 0; i < cardNames.length; i += batchSize) {
      if (thisLoadId !== currentLoadId) return null;

      const batch = cardNames.slice(i, i + batchSize);
      const cards = await fetchCardsBatch(batch);

      if (thisLoadId !== currentLoadId) return null;

      for (const card of cards) {
        if (zone === 'deck') {
          loadedCards.push(card);
        } else {
          addCardToZone(card, zone);
        }
      }

      loadedCount += cards.length;
      loadingProgress.textContent = `${loadedCount}/${totalCards}`;

      if (zone === 'deck') {
        setDeck(loadedCards, deckId);
      }
    }
    return true;
  }

  // Load all zones
  if (await loadCardBatches(mainboardNames, 'deck') === null) return;
  if (sideboardNames.length > 0) {
    if (await loadCardBatches(sideboardNames, 'sideboard') === null) return;
  }
  if (maybeboardNames.length > 0) {
    if (await loadCardBatches(maybeboardNames, 'maybeboard') === null) return;
  }

  if (thisLoadId !== currentLoadId) return;

  // Done loading
  isLoading = false;
  loadingIndicator.classList.add('hidden');

  const sbCount = sideboardNames.length;
  const mbCount = maybeboardNames.length;
  let toastMsg = `${savedDeck.name} loaded (${loadedCards.length} cards`;
  if (sbCount > 0 || mbCount > 0) {
    toastMsg += `, SB: ${sbCount}, MB: ${mbCount}`;
  }
  toastMsg += ')';
  showToast(toastMsg);

  // Set commander
  const commander = loadedCards.find(c =>
    c.typeLine && c.typeLine.includes('Legendary')
  ) || loadedCards[0];
  if (commander) {
    commanderCard = commander;
    renderPreview(commander);
    setDeckColors(commander.colorIdentity || []);
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
  const nameInput = document.getElementById('import-deck-name');
  textarea.value = '';
  if (nameInput) nameInput.value = '';
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
  const nameInput = document.getElementById('import-deck-name');
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

  // Get deck name (use first card name as default)
  const firstCardName = parsed.deck[0]?.name || parsed.sideboard[0]?.name || parsed.maybeboard[0]?.name || 'Imported Deck';
  const deckName = nameInput?.value.trim() || firstCardName;

  // Cancel any previous load operation
  currentLoadId++;
  const thisLoadId = currentLoadId;

  hideImportModal();
  clearAllZones();

  // Show loading in deck selector button
  const uniqueNames = [...new Set(allCards.map(c => c.name))];
  const totalUnique = uniqueNames.length;

  function updateSelectorProgress(current) {
    deckSelectorButton.innerHTML = `
      <div class="deck-selector-selected">
        <div class="deck-selector-loading-spinner"></div>
        <span class="deck-selector-selected-name">Importing ${deckName}...</span>
      </div>
      <span class="deck-completion deck-completion-partial">${current}/${totalUnique}</span>
    `;
  }
  updateSelectorProgress(0);

  // Show loading indicator too
  loadingIndicator.classList.remove('hidden');

  const notFound = [];
  const cardMap = new Map();

  // Fetch in batches
  const batchSize = 10;
  for (let i = 0; i < uniqueNames.length; i += batchSize) {
    // Check for cancellation
    if (thisLoadId !== currentLoadId) return;

    const batch = uniqueNames.slice(i, i + batchSize);
    const progress = Math.min(i + batchSize, uniqueNames.length);
    loadingProgress.textContent = `${progress}/${totalUnique}`;
    updateSelectorProgress(progress);

    const cards = await fetchCardsBatch(batch);

    // Check for cancellation after async operation
    if (thisLoadId !== currentLoadId) return;

    cards.forEach(card => cardMap.set(card.name.toLowerCase(), card));

    // Check for not found
    batch.forEach(name => {
      if (!cardMap.has(name.toLowerCase())) {
        notFound.push(name);
      }
    });
  }

  // Final cancellation check
  if (thisLoadId !== currentLoadId) return;

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

  // Determine commander (first legendary or first card)
  const deckCards = getZone('deck');
  const commander = deckCards.find(e =>
    e.card.typeLine && e.card.typeLine.includes('Legendary')
  )?.card || deckCards[0]?.card;

  // Save deck to localStorage
  const savedDeck = saveDeck({
    name: deckName,
    commander: commander?.name || firstCardName,
    cards: parsed.deck.map(c => c.name),
    sideboard: parsed.sideboard.map(c => c.name),
    maybeboard: parsed.maybeboard.map(c => c.name)
  });

  // Cache commander data for deck selector display
  if (commander) {
    commanderCache[commander.name] = {
      name: commander.name,
      typeLine: commander.typeLine,
      manaCost: commander.manaCost,
      artCrop: commander.artCrop
    };
  }

  // Update deck selector to show saved deck
  selectedDeckId = savedDeck.id;
  setLastDeckId(savedDeck.id);
  await populateDeckSelector();
  updateSelectedDeckButton(savedDeck.id);

  // Set commander for preview
  if (commander) {
    commanderCard = commander;
    renderPreview(commander);
    setDeckColors(commander.colorIdentity || []);
  }

  // Report results
  const imported = allCards.length - notFound.length;
  if (notFound.length > 0) {
    showToast(`Imported ${imported} cards. ${notFound.length} not found.`);
  } else {
    showToast(`${deckName} saved (${imported} cards)`);
  }
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

  // Initialize modules
  initRender();
  initSearch(handlePreview);
  initImportExport();
  initFilters();
  initDeckSelector();

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

  // Setup mobile tab navigation
  setupMobileTabs();
  setupCardModal();
  setupCardActionMenu();
  setupMobileFilterCollapse();
  window.addEventListener('resize', updateMobileTabContent);

  console.log('DeckBuilder initialized');
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
