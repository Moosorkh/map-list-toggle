import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import BookingModal from './BookingModal';
import SavedPropertiesService from '../services/SavedPropertiesService';
import { getPlacePrice } from '../utils/price';
import { getPlaceImage, PLACEHOLDER_IMAGE } from '../config/constants';

const PlaceDetails = ({ place, onClose }) => {
  const { token } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showSaveNotification, setShowSaveNotification] = useState(false);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);

  // Show a real dollar amount (estimating from price_range when needed)
  const numericPrice = getPlacePrice(place);
  const estimatedPrice = numericPrice || 0; // used for booking totals
  const priceDisplay = numericPrice != null
    ? `$${numericPrice.toLocaleString()}`
    : 'Contact for pricing';

  // Check if property is saved
  useEffect(() => {
    const checkSaved = async () => {
      const saved = await SavedPropertiesService.isPropertySaved(place.id, token);
      setIsSaved(saved);
    };
    checkSaved();
  }, [place.id, token]);

  // Handle save/unsave
  const handleSaveToggle = async () => {
    const nowSaved = await SavedPropertiesService.toggleSaveProperty(place, token);
    setIsSaved(nowSaved);
    if (nowSaved) {
      setShowSaveNotification(true);
      setTimeout(() => setShowSaveNotification(false), 3000);
    }
  };

  const handleBooking = () => {
    setShowBooking(true);
  };

  const handleBookingConfirm = (booking) => {
    setShowBooking(false);
    setShowBookingSuccess(true);
    setTimeout(() => setShowBookingSuccess(false), 5000);
  };

  // UI-only helper to decorate amenities with icons
  const getAmenityIcon = (amenity) => {
    const map = {
      'Pool': '🏊',
      'Parking': '🅿️',
      'WiFi': '📶',
      'Air Conditioning': '❄️',
      'Kitchen': '🍳',
      'Washer': '🧺',
      'Spa': '🧖',
      'Gym': '🏋️',
      'Ocean View': '🌊',
      'Fireplace': '🔥'
    };
    return map[amenity] || '•';
  };

  return (
    <>
      <div className="place-details-overlay" onClick={onClose}>
        <div className="place-details-container" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={onClose} aria-label="Close details">×</button>

          {/* Save button */}
          <button
            className={`save-heart-button ${isSaved ? 'saved' : ''}`}
            onClick={handleSaveToggle}
            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
          >
            {isSaved ? '❤️' : '🤍'}
          </button>

          <div className="place-details-content">
            <div className="details-image-section">
              <img
                src={getPlaceImage(place)}
                alt={place.name}
                loading="lazy"
                className="place-details-image"
                onError={(e) => {
                  e.currentTarget.onerror = null; // avoid infinite retry loop
                  e.currentTarget.src = PLACEHOLDER_IMAGE;
                }}
              />
              {place.isDiscovered && (
                <div className="discovery-badge-details">
                  ✨ Newly Discovered
                </div>
              )}
            </div>

            <div className="place-details-info">
              <div className="details-header">
                <h2>{place.name}</h2>
                <div className="price-badge">
                  <span className="price-amount">{priceDisplay}</span>
                  <span className="price-label">{numericPrice != null ? 'per night' : ''}</span>
                </div>
              </div>

              <p className="place-description">{place.description}</p>

              <div className="details-features">
                <div className="feature-item">
                  <span className="feature-icon">📍</span>
                  <div className="feature-content">
                    <span className="feature-label">Location</span>
                    <span className="feature-value">{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</span>
                  </div>
                </div>

                <div className="feature-item">
                  <span className="feature-icon">🏠</span>
                  <div className="feature-content">
                    <span className="feature-label">Property Type</span>
                    <span className="feature-value">{place.propertyType || 'Hotel'}</span>
                  </div>
                </div>

                {typeof place.rating === 'number' && (
                  <div className="feature-item">
                    <span className="feature-icon">⭐</span>
                    <div className="feature-content">
                      <span className="feature-label">Rating</span>
                      <span className="feature-value">{place.rating.toFixed(1)}{place.reviewCount ? ` (${place.reviewCount} reviews)` : ''}</span>
                    </div>
                  </div>
                )}
              </div>

              {Array.isArray(place.amenities) && place.amenities.length > 0 && (
                <div className="details-amenities">
                  <h3>Amenities</h3>
                  <div className="amenities-grid">
                    {place.amenities.map((amenity, idx) => (
                      <div key={idx} className="amenity">{getAmenityIcon(amenity)} {amenity}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="details-actions">
                <button className="details-book-button" onClick={handleBooking}>
                  <span className="button-icon">📅</span>
                  Book This Property
                </button>
                <button
                  className={`details-save-button ${isSaved ? 'saved' : ''}`}
                  onClick={handleSaveToggle}
                >
                  <span className="button-icon">{isSaved ? '❤️' : '🤍'}</span>
                  {isSaved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBooking && (
        <BookingModal
          place={{ ...place, price: estimatedPrice }}
          onClose={() => setShowBooking(false)}
          onConfirm={handleBookingConfirm}
        />
      )}

      {/* Save Notification */}
      {showSaveNotification && (
        <div className="save-notification">
          <span className="notification-icon">❤️</span>
          <span>Property saved to your favorites</span>
        </div>
      )}

      {/* Booking Success Notification */}
      {showBookingSuccess && (
        <div className="booking-success-notification-details">
          <div className="success-icon">✓</div>
          <div>
            <div className="success-title">Booking Confirmed!</div>
            <div className="success-message">Your stay has been reserved</div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlaceDetails;