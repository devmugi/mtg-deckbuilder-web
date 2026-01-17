/**
 * Deck state management with event-driven updates
 */

// Deck state
const state = {
  cards: new Map(), // cardId -> { card, quantity }
  listeners: new Set()
};

/**
 * Subscribe to deck changes
 */
export function subscribe(callback) {
  state.listeners.add(callback);
  return () => state.listeners.delete(callback);
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
  const deckData = getDeck();
  state.listeners.forEach(callback => callback(deckData));
}

/**
 * Add a card to the deck
 */
export function addCard(card) {
  const existing = state.cards.get(card.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    state.cards.set(card.id, { card, quantity: 1 });
  }

  notifyListeners();
}

/**
 * Remove one copy of a card from the deck
 */
export function removeCard(cardId) {
  const existing = state.cards.get(cardId);

  if (!existing) return;

  if (existing.quantity > 1) {
    existing.quantity -= 1;
  } else {
    state.cards.delete(cardId);
  }

  notifyListeners();
}

/**
 * Set card quantity directly
 */
export function setQuantity(cardId, quantity) {
  const existing = state.cards.get(cardId);

  if (!existing) return;

  if (quantity <= 0) {
    state.cards.delete(cardId);
  } else {
    existing.quantity = quantity;
  }

  notifyListeners();
}

/**
 * Delete a card entirely from the deck
 */
export function deleteCard(cardId) {
  state.cards.delete(cardId);
  notifyListeners();
}

/**
 * Clear all cards from the deck
 */
export function clearDeck() {
  state.cards.clear();
  notifyListeners();
}

/**
 * Get current deck data
 */
export function getDeck() {
  const cards = Array.from(state.cards.values());

  let totalCards = 0;
  let totalPrice = 0;

  cards.forEach(({ card, quantity }) => {
    totalCards += quantity;
    const price = parseFloat(card.prices.usd) || 0;
    totalPrice += price * quantity;
  });

  return {
    cards,
    stats: {
      totalCards,
      uniqueCards: cards.length,
      totalPrice
    }
  };
}
