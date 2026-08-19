import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({ user: null, token: null }),
}));

jest.mock('./services/BookingsService', () => ({
  __esModule: true,
  default: { getBookingsCount: jest.fn().mockResolvedValue(0) },
}));

jest.mock('./services/SavedPropertiesService', () => ({
  __esModule: true,
  default: { getSavedPropertiesCount: jest.fn().mockResolvedValue(0) },
}));

jest.mock('./components/MapView', () => ({ places, onDiscoverPlaces }) => (
  <div>
    <div data-testid="map-places">{places.map(place => place.name).join(',')}</div>
    <button onClick={() => onDiscoverPlaces([
      { id: 'a-1', name: 'Alpha Grand Hotel', latitude: 1, longitude: 1 },
      { id: 'a-2', name: 'Alpha Luxury Resort', latitude: 2, longitude: 2 },
    ], { address: { city: 'Alpha' } })}>Discover Alpha</button>
    <button onClick={() => onDiscoverPlaces([
      { id: 'b-1', name: 'Beta Grand Hotel', latitude: 3, longitude: 3 },
    ], { address: { city: 'Beta' } })}>Discover Beta</button>
    <button onClick={() => onDiscoverPlaces([], { address: { city: 'Empty' } })}>
      Discover Empty
    </button>
  </div>
));

jest.mock('./components/ListView', () => () => null);
jest.mock('./components/PlaceDetails', () => () => null);

test('each viewport discovery replaces the previous result set', async () => {
  render(<App />);

  fireEvent.click(await screen.findByText('Discover Alpha'));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('2 of 2'));
  expect(screen.getByTestId('map-places').textContent).toContain('Alpha Grand Hotel');

  fireEvent.click(screen.getByText('Discover Beta'));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('1 of 1'));
  expect(screen.getByTestId('map-places').textContent).toContain('Beta Grand Hotel');
  expect(screen.getByTestId('map-places').textContent).not.toContain('Alpha Grand Hotel');

  fireEvent.click(screen.getByText('Discover Empty'));
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('0 of 0'));
  expect(screen.getByTestId('map-places').textContent).toBe('');
});
