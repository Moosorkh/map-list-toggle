import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

// Lazy-loaded, map-heavy views are replaced with lightweight stubs so the
// smoke test can run in jsdom without a real Leaflet map.
jest.mock('./components/MapView', () => () => (
  <div data-testid="mock-map-view">Mock Map</div>
));
jest.mock('./components/ListView', () => () => (
  <div data-testid="mock-list-view">Mock List</div>
));
jest.mock('./components/PlaceDetails', () => () => null);

beforeEach(() => {
  localStorage.clear();
});

test('renders the map home page with search bar', async () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );

  // Once initialized, the map view (stub) is rendered
  expect(await screen.findByTestId('mock-map-view')).toBeInTheDocument();

  // The header search bar is present
  expect(screen.getByPlaceholderText('Search properties...')).toBeInTheDocument();
});
