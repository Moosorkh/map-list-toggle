// Estimated nightly prices used to convert a price_range tier into dollars
const estimatedPricesByRange = {
  '$': 50,
  '$$': 150,
  '$$$': 300,
  '$$$$': 600,
};

/**
 * Get the numeric nightly price for a place.
 * Prefers the numeric `price` field, otherwise converts `price_range` into an
 * estimated dollar value.
 * @param {object} place - Place object (may have `price` and/or `price_range`)
 * @returns {number|null} The price, or null when no pricing info exists.
 */
export const getPlacePrice = (place) => {
  if (!place) return null;
  if (typeof place.price === 'number' && Number.isFinite(place.price)) {
    return place.price;
  }
  if (place.price_range) {
    return estimatedPricesByRange[place.price_range] ?? 150;
  }
  return null;
};

/**
 * Human-readable price label for a place.
 * @param {object} place - Place object
 * @returns {string} e.g. "$150/night" or "Contact for pricing"
 */
export const getPlacePriceLabel = (place) => {
  const price = getPlacePrice(place);
  return price == null ? 'Contact for pricing' : `$${price.toLocaleString()}/night`;
};