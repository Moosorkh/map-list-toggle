import React, { memo } from 'react';
import './PlaceCard.css';
import { getPlacePrice } from '../utils/price';
import { getPlaceImage, PLACEHOLDER_IMAGE } from '../config/constants';

const PlaceCard = ({ place, onClick, isSelected, onBook }) => {
  // Backend places may only have a `price_range` (e.g. "$$$"); convert to dollars
  const numericPrice = getPlacePrice(place);
  const hasPrice = numericPrice != null;
  const formattedPrice = hasPrice
    ? `$${numericPrice.toLocaleString()}`
    : 'Contact for pricing';

  // Prevent default button click from bubbling
  const handleDetailsClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(place);
    }
  };

  const handleBookClick = (e) => {
    e.stopPropagation();
    if (onBook) {
      onBook(place);
    }
  };

  return (
    <div className="place-card-container">
      <div
        className={`place-card ${isSelected ? 'selected' : ''}`}
        onClick={() => onClick && onClick(place)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onClick && onClick(place)}
      >
        <div className="image-container">
          <img
            src={getPlaceImage(place)}
            alt={place.name}
            loading="lazy"
            className="place-image"
            onError={(e) => {
              e.currentTarget.onerror = null; // avoid infinite retry loop
              e.currentTarget.src = PLACEHOLDER_IMAGE;
            }}
          />
          {place.isDiscovered && (
            <div className="new-badge">New</div>
          )}
        </div>

        <div className="place-content">
          <h3 className="place-title">{place.name}</h3>
          <p className="place-description">{place.description}</p>

          <div className="place-footer">
            <div className="place-price">
              <strong>{formattedPrice}</strong>
              {hasPrice && <span className="price-period">/night</span>}
            </div>

            <div className="place-actions">
              <button
                className="view-details-button"
                onClick={handleDetailsClick}
                aria-label={`View details for ${place.name}`}
              >
                Details
              </button>
              <button
                className="book-now-button"
                onClick={handleBookClick}
                aria-label={`Book ${place.name}`}
              >
                Book
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export default memo(PlaceCard, (prevProps, nextProps) => {
  return (
    prevProps.place.id === nextProps.place.id &&
    prevProps.isSelected === nextProps.isSelected
  );
});