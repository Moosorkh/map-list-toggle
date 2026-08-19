import { getPlacePrice, getPlacePriceLabel } from './price';

test('converts provider price ranges into safe nightly prices', () => {
  expect(getPlacePrice({ price_range: '$$$$' })).toBe(600);
  expect(getPlacePriceLabel({ price_range: '$$$$' })).toBe('Est. $600/night');
});

test('handles places without price information', () => {
  expect(getPlacePrice({})).toBeNull();
  expect(getPlacePriceLabel({})).toBe('Contact for pricing');
});
