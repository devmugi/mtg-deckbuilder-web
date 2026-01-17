/**
 * DOM rendering functions
 */

import { removeCard, addCard, deleteCard } from './deck.js';

let previewContainer;
let deckList;
let deckEmpty;
let statCards;
let statUnique;
let statPrice;
let onPreviewCallback = null;

/**
 * Initialize render module
 */
export function initRender(onPreview) {
  previewContainer = document.getElementById('card-preview');
  deckList = document.getElementById('deck-list');
  deckEmpty = document.getElementById('deck-empty');
  statCards = document.getElementById('stat-cards');
  statUnique = document.getElementById('stat-unique');
  statPrice = document.getElementById('stat-price');
  onPreviewCallback = onPreview;
}

/**
 * Render card preview
 */
export function renderPreview(card) {
  if (!card) {
    previewContainer.innerHTML = `
      <div class="card-preview-placeholder">
        Hover over a card to preview
      </div>
    `;
    return;
  }

  const price = card.prices.usd ? `$${card.prices.usd}` : 'N/A';

  previewContainer.innerHTML = `
    <img
      class="card-preview-image"
      src="${card.images.normal}"
      alt="${escapeHtml(card.name)}"
      loading="lazy"
    >
    <div class="card-preview-info">
      <div class="card-preview-name">${escapeHtml(card.name)}</div>
      <div class="card-preview-type">${escapeHtml(card.typeLine)}</div>
      <div class="card-preview-price">
        <span class="badge badge-accent">${price}</span>
      </div>
    </div>
  `;
}

/**
 * Render deck list
 */
export function renderDeck(deckData) {
  const { cards, stats } = deckData;

  // Update stats
  statCards.textContent = stats.totalCards;
  statUnique.textContent = stats.uniqueCards;
  statPrice.textContent = `$${stats.totalPrice.toFixed(2)}`;

  // Show/hide empty state
  if (cards.length === 0) {
    deckEmpty.classList.remove('hidden');
    const existingCards = deckList.querySelectorAll('.deck-card');
    existingCards.forEach(el => el.remove());
    return;
  }

  deckEmpty.classList.add('hidden');

  // Sort by name
  const sortedCards = [...cards].sort((a, b) =>
    a.card.name.localeCompare(b.card.name)
  );

  // Render card rows
  const cardRows = sortedCards.map(({ card, quantity }) => {
    const price = card.prices.usd
      ? `$${(parseFloat(card.prices.usd) * quantity).toFixed(2)}`
      : '—';

    return `
      <div class="deck-card" data-card-id="${card.id}">
        <img
          class="deck-card-thumb"
          src="${card.images.small}"
          alt=""
          loading="lazy"
        >
        <div class="deck-card-info">
          <div class="deck-card-name">${escapeHtml(card.name)}</div>
          <div class="deck-card-type">${escapeHtml(card.typeLine)}</div>
        </div>
        <div class="deck-card-mana">${renderManaCost(card.manaCost)}</div>
        <div class="deck-card-quantity">
          <button class="btn btn-primary btn-sm qty-minus" data-card-id="${card.id}">−</button>
          <span class="deck-card-qty-value">${quantity}</span>
          <button class="btn btn-primary btn-sm qty-plus" data-card-id="${card.id}">+</button>
        </div>
        <div class="deck-card-price">${price}</div>
        <div class="deck-card-actions">
          <button class="btn btn-primary btn-sm delete-card" data-card-id="${card.id}" title="Remove">✕</button>
        </div>
      </div>
    `;
  }).join('');

  // Update DOM
  const existingCards = deckList.querySelectorAll('.deck-card');
  existingCards.forEach(el => el.remove());
  deckList.insertAdjacentHTML('beforeend', cardRows);

  // Add event listeners
  deckList.querySelectorAll('.qty-minus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeCard(btn.dataset.cardId);
    });
  });

  deckList.querySelectorAll('.qty-plus').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cardEntry = cards.find(c => c.card.id === btn.dataset.cardId);
      if (cardEntry) {
        addCard(cardEntry.card);
      }
    });
  });

  deckList.querySelectorAll('.delete-card').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCard(btn.dataset.cardId);
    });
  });

  // Hover preview
  deckList.querySelectorAll('.deck-card').forEach(row => {
    row.addEventListener('mouseenter', () => {
      const cardEntry = cards.find(c => c.card.id === row.dataset.cardId);
      if (cardEntry && onPreviewCallback) {
        onPreviewCallback(cardEntry.card);
      }
    });
  });
}

/**
 * Render mana cost symbols (simplified)
 */
function renderManaCost(manaCost) {
  if (!manaCost) return '';
  return `<span class="badge">${escapeHtml(manaCost)}</span>`;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
