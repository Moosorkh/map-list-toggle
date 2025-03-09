import React, { useState, useEffect, useRef } from 'react';
import PlaceCard from './PlaceCard';

// Helper function to deduplicate places
const deduplicatePlaces = (placesArray) => {
  const uniquePlaces = new Map();
  
  // Keep only one instance of each place ID
  placesArray.forEach(place => {
    if (!uniquePlaces.has(place.id)) {
      uniquePlaces.set(place.id, place);
    } else {
      console.warn(`Skipping duplicate place ID in ListView: ${place.id}`);
    }
  });
  
  return Array.from(uniquePlaces.values());
};

const ListView = ({ places, onSelectPlace }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [visiblePlaces, setVisiblePlaces] = useState([]);
  const listContainerRef = useRef(null);
  const [loadedAll, setLoadedAll] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Handle card click
  const handlePlaceClick = (place) => {
    setSelectedPlaceId(place.id === selectedPlaceId ? null : place.id);
    
    // Call the parent's onSelectPlace function if provided
    if (onSelectPlace) {
      onSelectPlace(place);
    }
  };
  
  // Sort places by price (low to high by default)
  const [sortOrder, setSortOrder] = useState('price-asc');
  
  const getSortedPlaces = () => {
    // First deduplicate the places array
    const uniquePlaces = deduplicatePlaces(places);
    
    switch(sortOrder) {
      case 'price-asc':
        return [...uniquePlaces].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...uniquePlaces].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...uniquePlaces].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return uniquePlaces;
    }
  };
  
  // Setup scroll handler for infinite loading
  useEffect(() => {
    const handleScroll = () => {
      if (!listContainerRef.current) return;
      
      const container = listContainerRef.current;
      const scrollBottom = container.scrollTop + container.clientHeight;
      const scrollPercent = scrollBottom / container.scrollHeight;
      
      // If user has scrolled past 80% of current content, load more
      if (scrollPercent > 0.8 && visiblePlaces.length < getSortedPlaces().length && !loadedAll) {
        console.log("Loading more places...");
        const sortedPlaces = getSortedPlaces();
        const newVisibleCount = Math.min(visiblePlaces.length + 4, sortedPlaces.length);
        setVisiblePlaces(sortedPlaces.slice(0, newVisibleCount));
        setLoadedAll(newVisibleCount >= sortedPlaces.length);
      }
    };

    const containerElement = listContainerRef.current;
    if (containerElement) {
      containerElement.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      if (containerElement) {
        containerElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [places, visiblePlaces, loadedAll]);
  
  // Initial load and when places or sort order changes
  useEffect(() => {
    const sortedPlaces = getSortedPlaces();
    
    // Reset for new data
    setInitialLoad(true);
    
    // Initial load shows fewer places
    const initialCount = Math.min(9, sortedPlaces.length);
    setVisiblePlaces(sortedPlaces.slice(0, initialCount));
    setLoadedAll(initialCount >= sortedPlaces.length);
    
    // Small delay to allow DOM to update before setting initialLoad to false
    setTimeout(() => {
      setInitialLoad(false);
    }, 100);
  }, [places, sortOrder]);
  
  // Get deduplicated visible places for rendering
  const uniqueVisiblePlaces = deduplicatePlaces(visiblePlaces);
  
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
          {uniqueVisiblePlaces.length} {uniqueVisiblePlaces.length !== 1 ? 'properties' : 'property'} found
        </div>
      </div>
      
      {/* Places grid with virtualization */}
      <div className="place-cards-grid">
        {uniqueVisiblePlaces.map((place, index) => (
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
              isSelected={selectedPlaceId === place.id}
            />
          </div>
        ))}
      </div>
      
      {/* Load more indicator */}
      {!loadedAll && uniqueVisiblePlaces.length < getSortedPlaces().length && (
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
      {uniqueVisiblePlaces.length === 0 && (
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
    </div>
  );
};

export default ListView;