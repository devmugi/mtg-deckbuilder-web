/**
 * Deck state management with event-driven updates
 * Supports multiple zones: deck, sideboard, maybeboard
 */

// Deck state with multi-zone support
const state = {
  zones: {
    deck: new Map(),      // cardId -> { card, quantity }
    sideboard: new Map(), // cardId -> { card, quantity }
    maybeboard: new Map() // cardId -> { card, quantity }
  },
  listeners: new Set(),
  modified: false,
  currentPrecon: null
};

/**
 * Subscribe to deck changes
 */
export function subscribe(callback) {
  state.listeners.add(callback);
  return () => state.listeners.delete(callback);
}

/**
 * Check if deck has been modified
 */
export function isModified() {
  return state.modified;
}

/**
 * Get current precon ID
 */
export function getCurrentPrecon() {
  return state.currentPrecon;
}

/**
 * Notify all listeners of state change
 */
function notifySubscribers() {
  const deckData = getDeck();
  state.listeners.forEach(callback => callback(deckData));
}

// Keep old name for backwards compatibility
function notifyListeners() {
  notifySubscribers();
}

/**
 * Add a card to a specific zone
 * @param {Object} card - Card object to add
 * @param {string} zone - Zone name: 'deck', 'sideboard', or 'maybeboard'
 */
export function addCardToZone(card, zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (!zoneMap) return;
  const existing = zoneMap.get(card.id);
  if (existing) {
    existing.quantity += 1;
  } else {
    zoneMap.set(card.id, { card, quantity: 1 });
  }
  state.modified = true;
  notifySubscribers();
}

/**
 * Remove one copy of a card from a specific zone
 * @param {string} cardId - Card ID to remove
 * @param {string} zone - Zone name: 'deck', 'sideboard', or 'maybeboard'
 */
export function removeCardFromZone(cardId, zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (!zoneMap) return;
  const existing = zoneMap.get(cardId);
  if (existing) {
    existing.quantity -= 1;
    if (existing.quantity <= 0) {
      zoneMap.delete(cardId);
    }
  }
  state.modified = true;
  notifySubscribers();
}

/**
 * Move one copy of a card from one zone to another
 * @param {string} cardId - Card ID to move
 * @param {string} fromZone - Source zone
 * @param {string} toZone - Destination zone
 */
export function moveCard(cardId, fromZone, toZone) {
  const fromMap = state.zones[fromZone];
  const toMap = state.zones[toZone];
  if (!fromMap || !toMap) return;
  const entry = fromMap.get(cardId);
  if (!entry) return;

  entry.quantity -= 1;
  if (entry.quantity <= 0) {
    fromMap.delete(cardId);
  }

  const existing = toMap.get(cardId);
  if (existing) {
    existing.quantity += 1;
  } else {
    toMap.set(cardId, { card: entry.card, quantity: 1 });
  }
  state.modified = true;
  notifySubscribers();
}

/**
 * Get all cards in a specific zone
 * @param {string} zone - Zone name: 'deck', 'sideboard', or 'maybeboard'
 * @returns {Array} Array of { card, quantity } objects
 */
export function getZone(zone = 'deck') {
  const zoneMap = state.zones[zone];
  return zoneMap ? Array.from(zoneMap.values()) : [];
}

/**
 * Get statistics for a specific zone
 * @param {string} zone - Zone name: 'deck', 'sideboard', or 'maybeboard'
 * @returns {Object} Stats object with totalCards, uniqueCards, totalPrice
 */
export function getZoneStats(zone = 'deck') {
  const cards = getZone(zone);
  const totalCards = cards.reduce((sum, e) => sum + e.quantity, 0);
  const uniqueCards = cards.length;
  const totalPrice = cards.reduce((sum, e) => {
    const price = e.card.prices?.usd ? parseFloat(e.card.prices.usd) : 0;
    return sum + (price * e.quantity);
  }, 0);
  return { totalCards, uniqueCards, totalPrice };
}

/**
 * Clear all cards from a specific zone
 * @param {string} zone - Zone name: 'deck', 'sideboard', or 'maybeboard'
 */
export function clearZone(zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (zoneMap) {
    zoneMap.clear();
    state.modified = true;
    notifySubscribers();
  }
}

/**
 * Clear all zones and reset state
 */
export function clearAllZones() {
  state.zones.deck.clear();
  state.zones.sideboard.clear();
  state.zones.maybeboard.clear();
  state.modified = false;
  state.currentPrecon = null;
  notifySubscribers();
}

/**
 * Add a card to the deck (backwards compatible)
 */
export function addCard(card) {
  addCardToZone(card, 'deck');
}

/**
 * Remove one copy of a card from the deck (backwards compatible)
 */
export function removeCard(cardId) {
  removeCardFromZone(cardId, 'deck');
}

/**
 * Get cards in the deck zone (backwards compatible)
 * @returns {Array} Array of { card, quantity } objects
 */
export function getCards() {
  return getZone('deck');
}

/**
 * Set card quantity directly in a zone
 * @param {string} cardId - Card ID
 * @param {number} quantity - New quantity
 * @param {string} zone - Zone name (default: 'deck')
 */
export function setQuantity(cardId, quantity, zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (!zoneMap) return;

  const existing = zoneMap.get(cardId);

  if (!existing) return;

  if (quantity <= 0) {
    zoneMap.delete(cardId);
  } else {
    existing.quantity = quantity;
  }

  state.modified = true;
  notifySubscribers();
}

/**
 * Delete a card entirely from a zone
 * @param {string} cardId - Card ID
 * @param {string} zone - Zone name (default: 'deck')
 */
export function deleteCard(cardId, zone = 'deck') {
  const zoneMap = state.zones[zone];
  if (!zoneMap) return;

  zoneMap.delete(cardId);
  state.modified = true;
  notifySubscribers();
}

/**
 * Set deck contents (for loading precons)
 * Clears all zones before loading
 * @param {Object[]} cards - Array of card objects
 * @param {string|null} preconId - Precon ID or null
 */
export function setDeck(cards, preconId = null) {
  state.zones.deck.clear();
  state.zones.sideboard.clear();
  state.zones.maybeboard.clear();

  cards.forEach(card => {
    const existing = state.zones.deck.get(card.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      state.zones.deck.set(card.id, { card, quantity: 1 });
    }
  });

  state.currentPrecon = preconId;
  state.modified = false;
  notifySubscribers();
}

/**
 * Clear all cards from all zones (backwards compatible)
 */
export function clearDeck() {
  clearAllZones();
}

/**
 * Get current deck data with all zones
 * @returns {Object} Deck data with deck, sideboard, maybeboard arrays and stats
 */
export function getDeck() {
  return {
    deck: getZone('deck'),
    sideboard: getZone('sideboard'),
    maybeboard: getZone('maybeboard'),
    stats: getZoneStats('deck'),
    // Backwards compatibility: also include cards property pointing to deck zone
    cards: getZone('deck')
  };
}
