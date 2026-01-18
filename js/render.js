/**
 * DOM rendering functions
 */

let previewContainer;
let deckList;
let deckEmpty;
let statCards;
let statUnique;
let statPrice;

/**
 * Initialize render module
 */
export function initRender() {
  previewContainer = document.getElementById('card-preview');
  deckList = document.getElementById('deck-list');
  deckEmpty = document.getElementById('deck-empty');
  statCards = document.getElementById('stat-cards');
  statUnique = document.getElementById('stat-unique');
  statPrice = document.getElementById('stat-price');
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
    <div class="card-preview-image-container">
      <img
        class="card-preview-image"
        src="${card.images.normal}"
        alt="${escapeHtml(card.name)}"
      >
    </div>
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
 * @param {Array} cards - Array of card entries with card and quantity
 * @param {string} zone - Current zone ('deck', 'sideboard', 'maybeboard')
 * @param {Object} handlers - Event handlers { onPreview, onAdd, onRemove, onMove }
 */
export function renderDeck(cards, zone, handlers) {
  // Determine move targets based on current zone
  const moveTargets = {
    deck: ['sideboard', 'maybeboard'],
    sideboard: ['deck', 'maybeboard'],
    maybeboard: ['deck', 'sideboard']
  }[zone] || [];

  const moveLabels = { deck: 'D', sideboard: 'S', maybeboard: 'M' };

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
          src="${card.images.artCrop}"
          alt=""
          loading="lazy"
        >
        <div class="deck-card-info">
          <div class="deck-card-name">${escapeHtml(card.name)}</div>
          <div class="deck-card-type">${escapeHtml(card.typeLine || '')}</div>
        </div>
        <div class="deck-card-mana">${renderManaCost(card.manaCost)}</div>
        <div class="deck-card-price">${price}</div>
        <div class="deck-card-controls">
          <button class="btn btn-primary btn-sm qty-minus" data-card-id="${card.id}">−</button>
          <span class="deck-card-qty-value">${quantity}</span>
          <button class="btn btn-primary btn-sm qty-plus" data-card-id="${card.id}">+</button>
          ${moveTargets.map(target => `
            <button class="btn-move" data-target="${target}" title="Move to ${target}">
              ${moveLabels[target]}
            </button>
          `).join('')}
        </div>
        <div class="deck-card-actions">
          <button class="btn btn-primary btn-sm delete-card" data-card-id="${card.id}" title="Remove">✕</button>
        </div>
        <button class="deck-card-menu-btn" data-card-id="${card.id}" aria-label="Card actions">⋮</button>
      </div>
    `;
  }).join('');

  // Update DOM - use innerHTML to clear any previous layout (including split view headers)
  deckList.innerHTML = cardRows;

  // Add event listeners for each card row
  deckList.querySelectorAll('.deck-card').forEach(row => {
    const cardId = row.dataset.cardId;
    const cardEntry = cards.find(c => c.card.id === cardId);

    // Quantity minus
    row.querySelector('.qty-minus').addEventListener('click', (e) => {
      e.stopPropagation();
      // Animate if this is the last card
      if (cardEntry && cardEntry.quantity === 1) {
        row.classList.add('removing');
        row.addEventListener('animationend', () => {
          handlers.onRemove(cardId, zone);
        }, { once: true });
      } else {
        handlers.onRemove(cardId, zone);
      }
    });

    // Quantity plus
    row.querySelector('.qty-plus').addEventListener('click', (e) => {
      e.stopPropagation();
      if (cardEntry) {
        handlers.onAdd(cardEntry.card);
      }
    });

    // Delete card
    row.querySelector('.delete-card').addEventListener('click', (e) => {
      e.stopPropagation();
      row.classList.add('removing');
      row.addEventListener('animationend', () => {
        handlers.onRemove(cardId, zone, true); // true = delete all
      }, { once: true });
    });

    // Move buttons
    row.querySelectorAll('.btn-move').forEach(btn => {
      btn.addEventListener('click', () => handlers.onMove(cardId, zone, btn.dataset.target));
    });

    // Hover preview
    row.addEventListener('mouseenter', () => {
      if (cardEntry && handlers.onPreview) {
        handlers.onPreview(cardEntry.card);
      }
    });

    // Mobile tap to open card modal
    row.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && cardEntry && handlers.onCardClick) {
        handlers.onCardClick(cardEntry.card, zone);
      }
    });

    // Mobile menu button
    const menuBtn = row.querySelector('.deck-card-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (cardEntry && handlers.onMenuOpen) {
          handlers.onMenuOpen(cardEntry.card, zone, menuBtn);
        }
      });
    }
  });
}

/**
 * Render deck skeleton with card names in loading state
 * @param {Array} cardNames - Array of card names to display
 * @param {string} commanderGradient - CSS gradient for progress line
 * @param {Object} handlers - Event handlers { onPreview }
 */
export function renderDeckSkeleton(cardNames, commanderGradient, handlers) {
  // Show/hide empty state
  if (cardNames.length === 0) {
    deckEmpty.classList.remove('hidden');
    const existingCards = deckList.querySelectorAll('.deck-card');
    existingCards.forEach(el => el.remove());
    return;
  }

  deckEmpty.classList.add('hidden');

  // Set commander gradient CSS variable on the deck list
  if (commanderGradient) {
    deckList.style.setProperty('--commander-gradient', commanderGradient);
  }

  // Sort by name
  const sortedNames = [...cardNames].sort((a, b) => a.localeCompare(b));

  // Render skeleton card rows
  const cardRows = sortedNames.map(name => `
    <div class="deck-card loading" data-card-name="${escapeHtml(name)}">
      <div class="deck-card-thumb-placeholder"></div>
      <div class="deck-card-info">
        <div class="deck-card-name">${escapeHtml(name)}</div>
        <div class="deck-card-type deck-card-type-placeholder"></div>
      </div>
      <div class="deck-card-mana"></div>
      <div class="deck-card-price"></div>
      <div class="deck-card-controls" style="visibility: hidden;">
        <button class="btn btn-primary btn-sm qty-minus">−</button>
        <span class="deck-card-qty-value">1</span>
        <button class="btn btn-primary btn-sm qty-plus">+</button>
      </div>
      <div class="deck-card-actions" style="visibility: hidden;">
        <button class="btn btn-primary btn-sm delete-card" title="Remove">✕</button>
      </div>
      <button class="deck-card-menu-btn" aria-label="Card actions" style="visibility: hidden;">⋮</button>
    </div>
  `).join('');

  // Update DOM
  const existingCards = deckList.querySelectorAll('.deck-card');
  existingCards.forEach(el => el.remove());
  deckList.insertAdjacentHTML('beforeend', cardRows);
}

/**
 * Update a single skeleton card row with loaded data
 * @param {string} cardName - Name of the card to update
 * @param {Object} card - Full card data
 * @param {number} quantity - Card quantity
 * @param {string} zone - Current zone
 * @param {Object} handlers - Event handlers
 */
export function updateSkeletonCard(cardName, card, quantity, zone, handlers) {
  // Find the skeleton row by name
  const row = deckList.querySelector(`.deck-card[data-card-name="${CSS.escape(cardName)}"]`);
  if (!row) return;

  // Update data attributes
  row.dataset.cardId = card.id;
  row.classList.remove('loading');

  // Update thumbnail
  const thumbPlaceholder = row.querySelector('.deck-card-thumb-placeholder');
  if (thumbPlaceholder) {
    const img = document.createElement('img');
    img.className = 'deck-card-thumb';
    img.src = card.images.artCrop;
    img.alt = '';
    img.loading = 'lazy';
    thumbPlaceholder.replaceWith(img);
  }

  // Update type line
  const typeEl = row.querySelector('.deck-card-type');
  if (typeEl) {
    typeEl.textContent = card.typeLine || '';
    typeEl.classList.remove('deck-card-type-placeholder');
  }

  // Update mana cost
  const manaEl = row.querySelector('.deck-card-mana');
  if (manaEl) {
    manaEl.innerHTML = renderManaCost(card.manaCost);
  }

  // Update price
  const priceEl = row.querySelector('.deck-card-price');
  if (priceEl) {
    const price = card.prices.usd
      ? `$${(parseFloat(card.prices.usd) * quantity).toFixed(2)}`
      : '—';
    priceEl.textContent = price;
  }

  // Update quantity
  const qtyEl = row.querySelector('.deck-card-qty-value');
  if (qtyEl) {
    qtyEl.textContent = quantity;
  }

  // Show controls
  const controls = row.querySelector('.deck-card-controls');
  const actions = row.querySelector('.deck-card-actions');
  const menuBtn = row.querySelector('.deck-card-menu-btn');
  if (controls) controls.style.visibility = '';
  if (actions) actions.style.visibility = '';
  if (menuBtn) menuBtn.style.visibility = '';

  // Set up event handlers
  const minusBtn = row.querySelector('.qty-minus');
  const plusBtn = row.querySelector('.qty-plus');
  const deleteBtn = row.querySelector('.delete-card');

  if (minusBtn) {
    minusBtn.dataset.cardId = card.id;
    minusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (quantity === 1) {
        row.classList.add('removing');
        row.addEventListener('animationend', () => {
          handlers.onRemove?.(card.id, zone);
        }, { once: true });
      } else {
        handlers.onRemove?.(card.id, zone);
      }
    });
  }

  if (plusBtn) {
    plusBtn.dataset.cardId = card.id;
    plusBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onAdd?.(card);
    });
  }

  if (deleteBtn) {
    deleteBtn.dataset.cardId = card.id;
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      row.classList.add('removing');
      row.addEventListener('animationend', () => {
        handlers.onRemove?.(card.id, zone, true);
      }, { once: true });
    });
  }

  // Hover preview
  row.addEventListener('mouseenter', () => {
    handlers.onPreview?.(card);
  });

  // Mobile tap to open card modal
  row.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && handlers.onCardClick) {
      handlers.onCardClick(card, zone);
    }
  });

  // Mobile menu button
  if (menuBtn) {
    menuBtn.dataset.cardId = card.id;
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onMenuOpen?.(card, zone, menuBtn);
    });
  }
}

/**
 * Render cards in grid view
 * @param {Array} cards - Card entries to render
 * @param {Object} handlers - Event handlers { onPreview }
 */
export function renderGrid(cards, handlers) {
  const container = document.getElementById('deck-list');
  const emptyState = document.getElementById('deck-empty');

  if (!container) return;

  if (cards.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Sort by name
  const sortedCards = [...cards].sort((a, b) =>
    a.card.name.localeCompare(b.card.name)
  );

  const html = `
    <div class="deck-grid">
      ${sortedCards.map(({ card, quantity }) => `
        <div class="grid-card" data-card-id="${card.id}">
          <img src="${card.images.small}" alt="${card.name}" loading="lazy">
          ${quantity > 1 ? `<span class="grid-card-qty">×${quantity}</span>` : ''}
        </div>
      `).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Add hover handlers for preview
  container.querySelectorAll('.grid-card').forEach(gridCard => {
    const cardId = gridCard.dataset.cardId;
    const cardEntry = cards.find(c => c.card.id === cardId);
    if (cardEntry && handlers.onPreview) {
      gridCard.addEventListener('mouseenter', () => handlers.onPreview(cardEntry.card));
    }
  });
}

/**
 * Render mana cost as Scryfall symbol images
 */
function renderManaCost(manaCost) {
  if (!manaCost) return '';

  // Parse mana symbols like {4}{R}{R} or {2}{G}{G}
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];

  return symbols.map(symbol => {
    // Remove braces and format for Scryfall URL
    const code = symbol.slice(1, -1).replace('/', '');
    return `<img class="mana-symbol" src="https://svgs.scryfall.io/card-symbols/${encodeURIComponent(code)}.svg" alt="${symbol}">`;
  }).join('');
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Extract short type from full type line
 * e.g., "Legendary Creature — Warrior" → "Creature"
 */
function getShortType(typeLine) {
  if (!typeLine) return '';
  // Remove the subtype part (after em dash)
  const mainType = typeLine.split('—')[0].trim();
  // Extract primary card type
  const types = ['Creature', 'Instant', 'Sorcery', 'Artifact', 'Enchantment', 'Planeswalker', 'Land'];
  for (const type of types) {
    if (mainType.includes(type)) return type;
  }
  return mainType;
}

/**
 * Render mana curve bar chart with mana icons, count and percent
 * @param {Array} curve - Array of 8 counts for CMC 0-7+
 */
export function renderManaCurve(curve) {
  const container = document.getElementById('mana-curve');
  if (!container) return;

  const max = Math.max(...curve, 1);
  const total = curve.reduce((sum, c) => sum + c, 0);

  const bars = curve.map((count, i) => {
    const height = (count / max) * 100;
    const percent = total > 0 ? Math.round((count / total) * 100) : 0;
    const manaSymbol = i === 7 ? '7' : String(i);

    return `
      <div class="mana-bar-container">
        <div class="mana-bar">
          <div class="mana-bar-fill" style="height: ${height}%"></div>
        </div>
        <div class="mana-bar-stats">
          <span class="mana-bar-count">${count}</span>
          <span class="mana-bar-percent">${percent}%</span>
        </div>
        <img class="mana-bar-icon" src="https://svgs.scryfall.io/card-symbols/${manaSymbol}.svg" alt="${manaSymbol}">
      </div>
    `;
  }).join('');

  container.innerHTML = bars;
}

/**
 * Render color distribution as horizontal bar with mana icons
 * @param {Object} colors - Color counts { W, U, B, R, G, C }
 */
export function renderColorPie(colors) {
  const container = document.getElementById('color-pie');
  if (!container) return;

  const colorOrder = ['W', 'U', 'B', 'R', 'G', 'C'];
  const total = Object.values(colors).reduce((sum, count) => sum + count, 0);

  if (total === 0) {
    container.innerHTML = '<div class="color-bar-empty"></div>';
    return;
  }

  // Build horizontal segments
  const segments = colorOrder
    .filter(color => colors[color] > 0)
    .map(color => {
      const count = colors[color];
      const percent = (count / total) * 100;
      return `
        <div class="color-bar-segment color-bar-segment--${color}" style="width: ${percent}%" title="${color}: ${count} (${Math.round(percent)}%)">
          <img class="color-bar-icon" src="https://svgs.scryfall.io/card-symbols/${color}.svg" alt="${color}">
        </div>
      `;
    })
    .join('');

  container.innerHTML = segments;
}

/**
 * Update type counts in filter bar
 * @param {Object} types - Type counts { Creature, Instant, Sorcery, ... }
 */
export function renderTypeBreakdown(types) {
  const typeOrder = ['Planeswalker', 'Creature', 'Artifact', 'Instant', 'Enchantment', 'Sorcery', 'Land'];

  typeOrder.forEach(type => {
    const countEl = document.getElementById(`type-count-${type}`);
    if (countEl) {
      countEl.textContent = types[type] || 0;
    }
  });
}

/**
 * Render zone counts for sideboard and maybeboard
 * @param {number} sideboardCount - Number of cards in sideboard
 * @param {number} maybeboardCount - Number of cards in maybeboard
 */
export function renderZoneCounts(sideboardCount, maybeboardCount) {
  const sbEl = document.getElementById('zone-count-sideboard');
  const mbEl = document.getElementById('zone-count-maybeboard');
  if (sbEl) sbEl.textContent = sideboardCount;
  if (mbEl) mbEl.textContent = maybeboardCount;
}

/**
 * Render split view with mainboard on left, sideboard/maybeboard on right
 * @param {Object} data - { deck, sideboard, maybeboard } filtered card arrays (sideboard/maybeboard can be null)
 * @param {Object} handlers - Event handlers { onPreview, onAdd, onRemove, onMove }
 */
export function renderSplitView(data, handlers) {
  const container = document.getElementById('deck-list');
  const emptyState = document.getElementById('deck-empty');

  if (!container) return;

  const sbCards = data.sideboard || [];
  const mbCards = data.maybeboard || [];
  const totalCards = data.deck.length + sbCards.length + mbCards.length;

  if (totalCards === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    container.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Sort cards
  const sortedDeck = [...data.deck].sort((a, b) => a.card.name.localeCompare(b.card.name));
  const sortedSB = [...sbCards].sort((a, b) => a.card.name.localeCompare(b.card.name));
  const sortedMB = [...mbCards].sort((a, b) => a.card.name.localeCompare(b.card.name));

  // Build right column sections
  let rightColumnContent = '';

  if (data.sideboard !== null) {
    rightColumnContent += `
      <div class="split-section split-section-fit">
        <div class="split-header">Sideboard (${sbCards.length})</div>
        <div class="split-cards">
          ${sortedSB.length > 0
            ? sortedSB.map(({ card, quantity }) => renderSplitCard(card, quantity, 'sideboard')).join('')
            : '<div class="split-empty">No cards</div>'
          }
        </div>
      </div>
    `;
  }

  if (data.maybeboard !== null) {
    rightColumnContent += `
      <div class="split-section split-section-fit">
        <div class="split-header">Maybeboard (${mbCards.length})</div>
        <div class="split-cards">
          ${sortedMB.length > 0
            ? sortedMB.map(({ card, quantity }) => renderSplitCard(card, quantity, 'maybeboard')).join('')
            : '<div class="split-empty">No cards</div>'
          }
        </div>
      </div>
    `;
  }

  const html = `
    <div class="split-view">
      <div class="split-column split-column-main">
        <div class="split-header">Main Board (${data.deck.length})</div>
        <div class="split-cards">
          ${sortedDeck.map(({ card, quantity }) => renderSplitCard(card, quantity, 'deck')).join('')}
        </div>
      </div>
      <div class="split-column split-column-side">
        ${rightColumnContent}
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Add event listeners
  const allData = [
    ...data.deck.map(e => ({ ...e, zone: 'deck' })),
    ...(sbCards).map(e => ({ ...e, zone: 'sideboard' })),
    ...(mbCards).map(e => ({ ...e, zone: 'maybeboard' }))
  ];

  container.querySelectorAll('.deck-card').forEach(row => {
    const cardId = row.dataset.cardId;
    const zone = row.dataset.zone;
    const cardEntry = allData.find(c => c.card.id === cardId && c.zone === zone);

    if (!cardEntry) return;

    // Quantity minus
    row.querySelector('.qty-minus')?.addEventListener('click', (e) => {
      e.stopPropagation();
      // Animate if this is the last card
      if (cardEntry.quantity === 1) {
        row.classList.add('removing');
        row.addEventListener('animationend', () => {
          handlers.onRemove?.(cardId, zone);
        }, { once: true });
      } else {
        handlers.onRemove?.(cardId, zone);
      }
    });

    // Quantity plus
    row.querySelector('.qty-plus')?.addEventListener('click', (e) => {
      e.stopPropagation();
      handlers.onAdd?.(cardEntry.card, zone);
    });

    // Delete card
    row.querySelector('.delete-card')?.addEventListener('click', (e) => {
      e.stopPropagation();
      row.classList.add('removing');
      row.addEventListener('animationend', () => {
        handlers.onRemove?.(cardId, zone, true);
      }, { once: true });
    });

    // Move buttons
    row.querySelectorAll('.btn-move').forEach(btn => {
      btn.addEventListener('click', () => handlers.onMove?.(cardId, zone, btn.dataset.target));
    });

    // Hover preview
    row.addEventListener('mouseenter', () => {
      handlers.onPreview?.(cardEntry.card);
    });

    // Mobile tap to open card modal
    row.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && cardEntry && handlers.onCardClick) {
        handlers.onCardClick(cardEntry.card, zone);
      }
    });

    // Mobile menu button
    const menuBtn = row.querySelector('.deck-card-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handlers.onMenuOpen?.(cardEntry.card, zone, menuBtn);
      });
    }
  });
}

/**
 * Render a card row for split view (same style as deck list)
 */
function renderSplitCard(card, quantity, zone) {
  const price = card.prices.usd
    ? `$${(parseFloat(card.prices.usd) * quantity).toFixed(2)}`
    : '—';

  const moveTargets = {
    deck: ['sideboard', 'maybeboard'],
    sideboard: ['deck', 'maybeboard'],
    maybeboard: ['deck', 'sideboard']
  }[zone] || [];

  const moveLabels = { deck: 'D', sideboard: 'S', maybeboard: 'M' };

  return `
    <div class="deck-card" data-card-id="${card.id}" data-zone="${zone}">
      <img class="deck-card-thumb" src="${card.images.artCrop}" alt="" loading="lazy">
      <div class="deck-card-info">
        <div class="deck-card-name">${escapeHtml(card.name)}</div>
        <div class="deck-card-type">${escapeHtml(card.typeLine || '')}</div>
      </div>
      <div class="deck-card-mana">${renderManaCost(card.manaCost)}</div>
      <div class="deck-card-price">${price}</div>
      <div class="deck-card-controls">
        <button class="btn btn-primary btn-sm qty-minus" data-card-id="${card.id}">−</button>
        <span class="deck-card-qty-value">${quantity}</span>
        <button class="btn btn-primary btn-sm qty-plus" data-card-id="${card.id}">+</button>
        ${moveTargets.map(target => `
          <button class="btn-move" data-target="${target}" title="Move to ${target}">
            ${moveLabels[target]}
          </button>
        `).join('')}
      </div>
      <div class="deck-card-actions">
        <button class="btn btn-primary btn-sm delete-card" data-card-id="${card.id}" title="Remove">✕</button>
      </div>
      <button class="deck-card-menu-btn" data-card-id="${card.id}" data-zone="${zone}" aria-label="Card actions">⋮</button>
    </div>
  `;
}
