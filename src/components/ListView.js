import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PlaceCard from './PlaceCard';
import BookingModal from './BookingModal';
import { deduplicatePlaces, sortPlaces } from '../utils/placeUtils';
import { throttle } from '../utils/performanceUtils';

const ListView = ({ places, onSelectPlace }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [visiblePlaces, setVisiblePlaces] = useState([]);
  const [bookingPlace, setBookingPlace] = useState(null);
  const [showBookingSuccess, setShowBookingSuccess] = useState(false);
  const listContainerRef = useRef(null);
  const [loadedAll, setLoadedAll] = useState(false);

  // Handle card click
  const handlePlaceClick = (place) => {
    setSelectedPlaceId(place.id === selectedPlaceId ? null : place.id);

    // Call the parent's onSelectPlace function if provided
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };

  // Handle booking
  const handleBookClick = (place) => {
    setBookingPlace(place);
  };

  // Sort places by price (low to high by default)
  const [sortOrder, setSortOrder] = useState('price-asc');

  // Memoize deduplicated and sorted places to prevent redundant calculations
  const memoizedPlaces = useMemo(() => {
    const deduplicated = deduplicatePlaces(places);
    return sortPlaces(deduplicated, sortOrder);
  }, [places, sortOrder]);

  // Throttled scroll handler for better performance
  const handleScroll = useCallback(
    throttle(() => {
      if (!listContainerRef.current) return;

      const container = listContainerRef.current;
      const scrollBottom = container.scrollTop + container.clientHeight;
      const scrollPercent = scrollBottom / container.scrollHeight;

      // If user has scrolled past 80% of current content, load more
      if (scrollPercent > 0.8 && visiblePlaces.length < memoizedPlaces.length && !loadedAll) {
        const newVisibleCount = Math.min(visiblePlaces.length + 4, memoizedPlaces.length);
        setVisiblePlaces(memoizedPlaces.slice(0, newVisibleCount));
        setLoadedAll(newVisibleCount >= memoizedPlaces.length);
      }
    }, 200), // Throttle to once every 200ms
    [visiblePlaces, memoizedPlaces, loadedAll]
  );

  // Setup scroll handler for infinite loading
  useEffect(() => {
    const containerElement = listContainerRef.current;

    if (containerElement) {
      containerElement.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (containerElement) {
        containerElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll]);

  // Initial load and when places or sort order changes
  useEffect(() => {
    // Initial load shows fewer places
    const initialCount = Math.min(9, memoizedPlaces.length);
    setVisiblePlaces(memoizedPlaces.slice(0, initialCount));
    setLoadedAll(initialCount >= memoizedPlaces.length);
  }, [memoizedPlaces]);

  // Get deduplicated visible places for rendering - no need for another dedup since memoizedPlaces is already deduplicated
  const visiblePlacesToRender = visiblePlaces;

  return (
    <div
      className="list-view-container"
      ref={listContainerRef}
    >
      {/* Sorting controls */}
      <div className="list-controls">
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="sort-select"
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
        <div className="results-count">
          {visiblePlacesToRender.length} {visiblePlacesToRender.length !== 1 ? 'properties' : 'property'} found
        </div>
      </div>

      {/* Places grid with virtualization */}
      <div className="place-cards-grid">
        {visiblePlacesToRender.map((place, index) => (
          <div
            key={`${place.id}_${index}`}
            className="card-animation-container"
            style={{
              opacity: 0,
              animation: `fadeIn 0.5s ease forwards ${index * 0.1}s`
            }}
          >
            <PlaceCard
              place={place}
              onClick={handlePlaceClick}
              onBook={handleBookClick}
              isSelected={selectedPlaceId === place.id}
            />
          </div>
        ))}
      </div>

      {/* Load more indicator */}
      {!loadedAll && visiblePlacesToRender.length < memoizedPlaces.length && (
        <div className="load-more-indicator">
          <div className="loading-dot-container">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
          <div>Scroll to load more luxury properties...</div>
        </div>
      )}

      {/* Empty state */}
      {visiblePlacesToRender.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🏠</div>
          <p>No luxury properties match your current search criteria.</p>
          <p style={{ fontSize: '14px', color: '#999' }}>Try adjusting your search or explore a different area.</p>
        </div>
      )}

      <style>{`
        .list-view-container {
          width: 100%;
          height: 100vh;
          padding-top: 130px;
          padding-bottom: 70px;
          overflow-y: auto;
          background-color: #f7f7f7;
          position: relative;
        }
        
        .list-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
          margin: 8px 0 16px;
        }
        
        .sort-controls {
          display: flex;
          align-items: center;
        }
        
        .sort-select {
          padding: 8px 16px;
          border-radius: 20px;
          border: 1px solid #ddd;
          background-color: white;
          margin-left: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .results-count {
          color: #555;
          font-size: 14px;
          font-weight: 500;
        }
        
        .place-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
          padding: 20px;
        }
        
        .load-more-indicator {
          text-align: center;
          padding: 20px;
          color: #777;
          font-weight: 500;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100px;
        }
        
        .loading-dot-container {
          display: flex;
          margin-bottom: 12px;
        }
        
        .loading-dot {
          width: 8px;
          height: 8px;
          background-color: #FF385C;
          border-radius: 50%;
          margin: 0 4px;
          animation: loadingDots 1.4s infinite;
          opacity: 0.6;
        }
        
        .loading-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        
        .loading-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        
        @keyframes loadingDots {
          0% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.5); opacity: 1; }
          100% { transform: scale(1); opacity: 0.6; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #777;
          text-align: center;
        }
        
        .empty-state-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
      `}</style>

      {/* Booking Modal */}
      {bookingPlace && (
        <BookingModal
          place={bookingPlace}
          onClose={() => setBookingPlace(null)}
          onConfirm={(booking) => {
            setBookingPlace(null);
            setShowBookingSuccess(true);
            setTimeout(() => setShowBookingSuccess(false), 5000);
          }}
        />
      )}

      {/* Booking Success Notification */}
      {showBookingSuccess && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(16, 185, 129, 0.4)',
          zIndex: 10001,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            fontWeight: 'bold'
          }}>✓</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '2px' }}>Booking Confirmed!</div>
            <div style={{ fontSize: '13px', opacity: 0.95 }}>Your luxury stay has been reserved</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListView;