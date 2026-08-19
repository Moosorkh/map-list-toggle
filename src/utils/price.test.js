import { getPlacePrice, getPlacePriceLabel } from './price';

describe('price helpers', () => {
  test('uses the numeric price when present', () => {
    const place = { id: 'x', price: 250, price_range: '$$$' };
    expect(getPlacePrice(place)).toBe(250);
    expect(getPlacePriceLabel(place)).toBe('$250/night');
  });

  test('estimates a dollar amount from price_range', () => {
    expect(getPlacePrice({ price_range: '$' })).toBe(50);
    expect(getPlacePrice({ price_range: '$$' })).toBe(150);
    expect(getPlacePrice({ price_range: '$$$' })).toBe(300);
    expect(getPlacePrice({ price_range: '$$$$' })).toBe(600);
    expect(getPlacePriceLabel({ price_range: '$$$' })).toBe('$300/night');
  });

  test('handles places with no pricing info', () => {
    expect(getPlacePrice({ id: 'x' })).toBeNull();
    expect(getPlacePrice(null)).toBeNull();
    expect(getPlacePriceLabel({ id: 'x' })).toBe('Contact for pricing');
  });
});
