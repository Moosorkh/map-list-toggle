import React, { useState, useEffect } from 'react';

const SearchBar = ({ places, onUpdatePlaces }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const filtered = places.filter(place =>
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    onUpdatePlaces(filtered);
  }, [searchTerm, places, onUpdatePlaces]);

  return (
    <input
      type="text"
      placeholder="Search for places..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="search-bar"
    />
  );
};

export default SearchBar;
