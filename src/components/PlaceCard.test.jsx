import { render, screen, fireEvent } from '@testing-library/react';
import PlaceCard from './PlaceCard';
import { PLACEHOLDER_IMAGE } from '../config/constants';

describe('PlaceCard', () => {
  const basePlace = {
    id: 'p1',
    name: 'Beach House',
    description: 'A lovely house',
    imageUrl: 'https://example.com/x.jpg',
  };

  test('renders a numeric price correctly', () => {
    render(<PlaceCard place={{ ...basePlace, price: 250 }} />);
    expect(screen.getByText('$250')).toBeInTheDocument();
    // "per night" suffix shown for numeric prices
    expect(screen.getByText('/night')).toBeInTheDocument();
  });

  test('converts a price_range to a dollar amount (no numeric price)', () => {
    // Backend places commonly return price_range like "$$$" and no numeric `price`.
    render(<PlaceCard place={{ ...basePlace, price_range: '$$$' }} />);
    expect(screen.getByText('$300')).toBeInTheDocument();
    expect(screen.getByText('/night')).toBeInTheDocument();
  });

  test('falls back to "Contact for pricing" when no price info exists', () => {
    render(<PlaceCard place={basePlace} />);
    expect(screen.getByText('Contact for pricing')).toBeInTheDocument();
  });

  test('shows a placeholder image when the photo fails to load', () => {
    render(<PlaceCard place={{ ...basePlace, imageUrl: 'https://example.com/broken.jpg' }} />);
    const img = screen.getByRole('img', { name: basePlace.name });
    fireEvent.error(img);
    expect(img).toHaveAttribute('src', PLACEHOLDER_IMAGE);
  });
});