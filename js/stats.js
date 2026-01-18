/**
 * Stats calculation module
 * Calculates mana curve and color distribution from deck cards
 */

/**
 * Calculate mana curve distribution (CMC 0-7+)
 * @param {Array} cards - Array of card objects with cmc and quantity
 * @returns {Array} Array of 8 counts for CMC 0-7+
 */
export function calculateManaCurve(cards) {
  const curve = [0, 0, 0, 0, 0, 0, 0, 0];

  cards.forEach(card => {
    const cmc = Math.min(Math.floor(card.cmc || 0), 7);
    curve[cmc] += card.quantity;
  });

  return curve;
}

/**
 * Calculate color distribution
 * Each color on a card is counted once per copy
 * @param {Array} cards - Array of card objects with colors and quantity
 * @returns {Object} Color counts { W, U, B, R, G, C }
 */
export function calculateColorDistribution(cards) {
  const colors = { W: 0, U: 0, B: 0, R: 0, G: 0, C: 0 };

  cards.forEach(card => {
    const cardColors = card.colors || [];

    if (cardColors.length === 0) {
      // Colorless card
      colors.C += card.quantity;
    } else {
      // Count each color once per copy
      cardColors.forEach(color => {
        if (colors.hasOwnProperty(color)) {
          colors[color] += card.quantity;
        }
      });
    }
  });

  return colors;
}

/**
 * Calculate type distribution
 * @param {Array} cards - Array of card objects with typeLine and quantity
 * @returns {Object} Type counts { Creature, Instant, Sorcery, Artifact, Enchantment, Planeswalker, Land }
 */
export function calculateTypeDistribution(cards) {
  const types = {
    Creature: 0,
    Instant: 0,
    Sorcery: 0,
    Artifact: 0,
    Enchantment: 0,
    Planeswalker: 0,
    Land: 0
  };

  cards.forEach(card => {
    const typeLine = card.typeLine || '';
    // Check each type (a card can be multiple types, e.g., "Artifact Creature")
    Object.keys(types).forEach(type => {
      if (typeLine.includes(type)) {
        types[type] += card.quantity;
      }
    });
  });

  return types;
}
