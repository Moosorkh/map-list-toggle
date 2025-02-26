import React from 'react';
import PlaceCard from './PlaceCard';

const ListView = ({ places }) => {
  return (
    <div className="place-card-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 2fr))', gap: '20px', padding: '20px' }}>
      {places.map(place => <PlaceCard key={place.id} place={place} />)}
    </div>
  );
};

export default ListView;