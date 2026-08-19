const PRICE_RANGE_ESTIMATES = {
  '$': 50,
  '$$': 150,
  '$$$': 300,
  '$$$$': 600,
};

export const getPlacePrice = (place) => {
  if (Number.isFinite(place?.price)) return place.price;
  return PRICE_RANGE_ESTIMATES[place?.price_range] ?? null;
};

export const getPlacePriceLabel = (place) => {
  const price = getPlacePrice(place);
  if (price == null) return 'Contact for pricing';
  const prefix = Number.isFinite(place?.price) ? '' : 'Est. ';
  return `${prefix}$${price.toLocaleString()}/night`;
};
