/**
 * Local storage operations for saved decks
 */

const STORAGE_KEY = 'deckbuilder_saved_decks';
const LAST_DECK_KEY = 'deckbuilder_last_deck';

/**
 * Get all saved decks from localStorage
 * @returns {Array} Array of saved deck objects
 */
export function getSavedDecks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load saved decks:', e);
    return [];
  }
}

/**
 * Save a new deck to localStorage
 * @param {Object} deck - Deck data to save
 * @returns {Object} The saved deck with generated id
 */
export function saveDeck(deck) {
  const decks = getSavedDecks();
  const newDeck = {
    id: `saved-${Date.now()}`,
    name: deck.name || 'Imported Deck',
    commander: deck.commander,
    cards: deck.cards,
    sideboard: deck.sideboard || [],
    maybeboard: deck.maybeboard || [],
    createdAt: Date.now()
  };
  decks.push(newDeck);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  return newDeck;
}

/**
 * Delete a saved deck by ID
 * @param {string} deckId - ID of deck to delete
 */
export function deleteSavedDeck(deckId) {
  const decks = getSavedDecks().filter(d => d.id !== deckId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
}

/**
 * Get a saved deck by ID
 * @param {string} deckId - ID of deck to retrieve
 * @returns {Object|undefined} The deck object or undefined
 */
export function getSavedDeckById(deckId) {
  return getSavedDecks().find(d => d.id === deckId);
}

/**
 * Save last selected deck ID
 * @param {string} deckId - ID of the selected deck
 */
export function setLastDeckId(deckId) {
  localStorage.setItem(LAST_DECK_KEY, deckId);
}

/**
 * Get last selected deck ID
 * @returns {string|null} The last selected deck ID or null
 */
export function getLastDeckId() {
  return localStorage.getItem(LAST_DECK_KEY);
}
