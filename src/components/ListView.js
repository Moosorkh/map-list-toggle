import React, { useState } from 'react';
import PlaceCard from './PlaceCard';

const ListView = ({ places, onSelectPlace }) => {
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  
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
    switch(sortOrder) {
      case 'price-asc':
        return [...places].sort((a, b) => a.price - b.price);
      case 'price-desc':
        return [...places].sort((a, b) => b.price - a.price);
      case 'name-asc':
        return [...places].sort((a, b) => a.name.localeCompare(b.name));
      default:
        return places;
    }
  };
  
  return (
    <div className="list-view-container">
      {/* Sorting controls */}
      <div className="list-controls">
        <div className="sort-controls">
          <label htmlFor="sort-select">Sort by:</label>
          <select 
            id="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>
        <div className="results-count">
          {places.length} place{places.length !== 1 ? 's' : ''} found
        </div>
      </div>
      
      {/* Places grid */}
      <div 
        className="place-card-container" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px', 
          padding: '20px' 
        }}
      >
        {getSortedPlaces().map(place => (
          <PlaceCard 
            key={place.id} 
            place={place} 
            onClick={handlePlaceClick}
            isSelected={selectedPlaceId === place.id}
          />
        ))}
      </div>
      
      {/* Empty state */}
      {places.length === 0 && (
        <div className="empty-state">
          <p>No places match your current search criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ListView;