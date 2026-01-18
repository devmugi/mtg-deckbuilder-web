/**
 * Scryfall API integration with rate limiting and caching
 */

const SCRYFALL_API = 'https://api.scryfall.com';
const RATE_LIMIT_MS = 75; // Scryfall asks for 50-100ms between requests

// In-memory cache for card data
const cardCache = new Map();
let lastRequestTime = 0;

/**
 * Rate-limited fetch wrapper
 */
async function rateLimitedFetch(url) {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    await new Promise(resolve =>
      setTimeout(resolve, RATE_LIMIT_MS - timeSinceLastRequest)
    );
  }

  lastRequestTime = Date.now();
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Scryfall API error: ${response.status}`);
  }

  return response.json();
}

/**
 * Search for card name suggestions (autocomplete)
 */
export async function autocomplete(query) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const data = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/autocomplete?q=${encodeURIComponent(query)}`
    );
    return data.data || [];
  } catch (error) {
    console.error('Autocomplete error:', error);
    return [];
  }
}

/**
 * Search for cards using the search endpoint
 * @param {string} query - Search query
 * @param {string[]} colorIdentity - Optional color identity filter (e.g., ['W', 'U', 'B', 'R', 'G'])
 * @returns {Promise<Object[]>} - Array of normalized cards
 */
export async function searchCards(query, colorIdentity = null) {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    let searchQuery = `${query}`;

    // Add color identity filter if provided
    if (colorIdentity && colorIdentity.length > 0) {
      const colors = colorIdentity.join('');
      searchQuery += ` id<=${colors}`;
    }

    const data = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/search?q=${encodeURIComponent(searchQuery)}&order=name`
    );

    // Normalize and cache each card
    const cards = (data.data || []).slice(0, 10).map(card => {
      const normalized = normalizeCard(card);
      cardCache.set(card.name.toLowerCase(), normalized);
      return normalized;
    });

    return cards;
  } catch (error) {
    // Search returns 404 when no results found
    if (error.message.includes('404')) {
      return [];
    }
    console.error('Search error:', error);
    return [];
  }
}

/**
 * Fetch a card by exact name
 */
export async function fetchCardByName(name) {
  const cacheKey = name.toLowerCase();
  if (cardCache.has(cacheKey)) {
    return cardCache.get(cacheKey);
  }

  try {
    const card = await rateLimitedFetch(
      `${SCRYFALL_API}/cards/named?exact=${encodeURIComponent(name)}`
    );

    const normalizedCard = normalizeCard(card);
    cardCache.set(cacheKey, normalizedCard);

    return normalizedCard;
  } catch (error) {
    console.error('Fetch card error:', error);
    return null;
  }
}

/**
 * Normalize Scryfall card data to our format
 */
function normalizeCard(scryfallCard) {
  // Handle double-faced cards
  const imageUris = scryfallCard.image_uris ||
    (scryfallCard.card_faces && scryfallCard.card_faces[0]?.image_uris) ||
    {};

  return {
    id: scryfallCard.id,
    name: scryfallCard.name,
    manaCost: scryfallCard.mana_cost || '',
    cmc: scryfallCard.cmc || 0,
    typeLine: scryfallCard.type_line || '',
    colors: scryfallCard.colors || [],
    colorIdentity: scryfallCard.color_identity || [],
    oracleText: scryfallCard.oracle_text || '',
    images: {
      small: imageUris.small || '',
      normal: imageUris.normal || '',
      artCrop: imageUris.art_crop || ''
    },
    prices: {
      usd: scryfallCard.prices?.usd || null,
      usdFoil: scryfallCard.prices?.usd_foil || null
    }
  };
}

/**
 * Fetch multiple cards by name using collection endpoint
 * @param {string[]} names - Array of card names
 * @returns {Promise<Object[]>} - Array of normalized cards
 */
export async function fetchCardsBatch(names) {
  if (!names || names.length === 0) {
    return [];
  }

  // Build identifiers for collection endpoint
  const identifiers = names.map(name => ({ name }));

  try {
    // Collection endpoint allows up to 75 cards per request
    const response = await fetch(`${SCRYFALL_API}/cards/collection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifiers }),
    });

    if (!response.ok) {
      throw new Error(`Scryfall API error: ${response.status}`);
    }

    const data = await response.json();

    // Normalize and cache each card
    const cards = (data.data || []).map(card => {
      const normalized = normalizeCard(card);
      cardCache.set(card.name.toLowerCase(), normalized);
      return normalized;
    });

    return cards;
  } catch (error) {
    console.error('Batch fetch error:', error);
    return [];
  }
}

/**
 * Get cached card if available
 */
export function getCachedCard(name) {
  return cardCache.get(name.toLowerCase()) || null;
}
