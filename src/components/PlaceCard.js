import React, { memo } from 'react';
import './PlaceCard.css';

const PlaceCard = ({ place, onClick, isSelected, onBook }) => {
  // Format price with commas
  const formattedPrice = place.price.toLocaleString();

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
            src={place.imageUrl}
            alt={place.name}
            loading="lazy"
            className="place-image"
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
              <strong>${formattedPrice}</strong>
              <span className="price-period">/night</span>
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