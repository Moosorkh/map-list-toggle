import React from 'react';

const PlaceCard = ({ place, onClick, isSelected }) => {
  // Format price with commas
  const formattedPrice = place.price.toLocaleString();
  
  return (
    <div className="place-card-container" onClick={() => onClick && onClick(place)}>
      <div className={`place-card ${isSelected ? 'selected' : ''}`}>
        <img 
          src={place.imageUrl} 
          alt={place.name} 
          style={{ 
            width: '100%', 
            height: '180px', 
            objectFit: 'cover', 
            borderRadius: '8px 8px 0 0' 
          }} 
        />
        <div style={{ padding: '16px' }}>
          <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px' }}>{place.name}</h3>
          <p style={{ marginBottom: '8px', color: '#555', fontSize: '14px' }}>{place.description}</p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <strong>${formattedPrice}</strong>
            {place.isDiscovered && (
              <span className="new-badge">New</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;