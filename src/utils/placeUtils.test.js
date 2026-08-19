import { filterPlacesBySearch, sortPlaces } from './placeUtils';

describe('filterPlacesBySearch', () => {
  const places = [
    { id: 'a', name: 'Beach Villa', description: 'Ocean view' },
    { id: 'b', name: 'City Hotel', description: null }, // description missing
  ];

  test('filters by name and description', () => {
    expect(filterPlacesBySearch(places, 'beach')).toEqual([places[0]]);
    expect(filterPlacesBySearch(places, 'view')).toEqual([places[0]]);
  });

  test('does not crash when a place lacks a description', () => {
    expect(filterPlacesBySearch(places, 'city')).toEqual([places[1]]);
  });

  test('returns all places when no search term', () => {
    expect(filterPlacesBySearch(places, '')).toEqual(places);
  });
});

describe('sortPlaces', () => {
  test('sorts by numeric price asc/desc', () => {
    const places = [
      { id: 'a', price: 300 },
      { id: 'b', price: 100 },
      { id: 'c', price: 200 },
    ];
    expect(sortPlaces(places, 'price-asc').map(p => p.id)).toEqual(['b', 'c', 'a']);
    expect(sortPlaces(places, 'price-desc').map(p => p.id)).toEqual(['a', 'c', 'b']);
  });

  test('does not crash when places only have price_range', () => {
    const places = [
      { id: 'cheap', price_range: '$' },
      { id: 'mid', price_range: '$$' },
      { id: 'lux', price_range: '$$$$' },
    ];
    expect(sortPlaces(places, 'price-asc').map(p => p.id)).toEqual(['cheap', 'mid', 'lux']);
    expect(sortPlaces(places, 'price-desc').map(p => p.id)).toEqual(['lux', 'mid', 'cheap']);
  });

  test('sorts by name ascending', () => {
    const places = [
      { id: 'b', name: 'Bravo' },
      { id: 'a', name: 'Alpha' },
    ];
    expect(sortPlaces(places, 'name-asc').map(p => p.id)).toEqual(['a', 'b']);
  });
});