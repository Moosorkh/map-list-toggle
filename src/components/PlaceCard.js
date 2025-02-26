import React from 'react';

const PlaceCard = ({ place }) => {
    return (
        <div className="place-card-container">
      <div className="place-card">
        <img src={place.imageUrl} alt={place.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px 8px 0 0' }} />
        <div style={{ padding: '10px' }}>
          <h3>{place.name}</h3>
          <p>{place.description}</p>
          <strong>$${place.price} total before taxes</strong>
        </div>
      </div>
    </div>
    );
  };

export default PlaceCard;