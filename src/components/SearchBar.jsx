import React from 'react';

const SearchBar = ({ value, onChange }) => {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search for places..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="search-bar"
      />
      {value && (
        <button 
          className="clear-search"
          onClick={() => onChange('')}
          aria-label="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default SearchBar;