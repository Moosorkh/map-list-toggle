import React, { useState } from 'react';
import MapView from './components/MapView';
import ListView from './components/ListView';
import SearchBar from './components/SearchBar';
import { places } from './data/places';
import './App.css';

function App() {
  const [view, setView] = useState('list');
  const [displayedPlaces, setDisplayedPlaces] = useState(places);

  return (
    <div className="app">
      <SearchBar places={places} onUpdatePlaces={setDisplayedPlaces} />
      <div className="content">
        {view === 'map' ? <MapView places={displayedPlaces} /> : <ListView places={displayedPlaces} />}
      </div>
      <button className="toggle-button" onClick={() => setView(view === 'map' ? 'list' : 'map')}>
        {view === 'map' ? 'Show List' : 'Show Map'}
      </button>
    </div>
  );
}

export default App;
