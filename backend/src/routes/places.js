const express = require('express');
const db = require('../db');
const FoursquareService = require('../services/FoursquareService');

const router = express.Router();

// Search places within bounds with API integration and caching
router.post('/search', async (req, res) => {
  try {
    const { bounds, searchTerm } = req.body;

    if (!bounds || !bounds.north || !bounds.south || !bounds.east || !bounds.west) {
      return res.status(400).json({ error: 'Invalid bounds' });
    }

    // Step 1: Check cache (our database)
    let query = `
      SELECT * FROM places
      WHERE latitude BETWEEN ? AND ?
        AND longitude BETWEEN ? AND ?
    `;
    const params = [bounds.south, bounds.north, bounds.west, bounds.east];

    // Add search term filter
    if (searchTerm && searchTerm.trim()) {
      query += ` AND (name LIKE ? OR type LIKE ? OR city LIKE ?)`;
      const searchPattern = `%${searchTerm.trim()}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    query += ` LIMIT 100`;

    let places = db.prepare(query).all(...params);

    // Step 2: If cache has fewer than 5 results, fetch from API and store
    if (places.length < 5) {
      console.log(`PlacesRoute: Only ${places.length} cached results, fetching from Foursquare API...`);
      
      try {
        const apiPlaces = await FoursquareService.searchPlaces(bounds, searchTerm);
        
        if (apiPlaces.length > 0) {
          console.log(`PlacesRoute: Fetched ${apiPlaces.length} places from API, caching...`);
          
          // Upsert places into database
          const upsertStmt = db.prepare(`
            INSERT INTO places (
              id, name, type, address, city, country, 
              latitude, longitude, rating, price_range, 
              amenities, description, image_url
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
              name = excluded.name,
              type = excluded.type,
              address = excluded.address,
              city = excluded.city,
              country = excluded.country,
              latitude = excluded.latitude,
              longitude = excluded.longitude,
              rating = excluded.rating,
              price_range = excluded.price_range,
              amenities = excluded.amenities,
              description = excluded.description,
              image_url = excluded.image_url
          `);

          const insertMany = db.transaction((places) => {
            for (const place of places) {
              upsertStmt.run(
                place.id,
                place.name,
                place.type,
                place.address,
                place.city,
                place.country,
                place.latitude,
                place.longitude,
                place.rating,
                place.price_range,
                place.amenities,
                place.description,
                place.image_url
              );
            }
          });

          insertMany(apiPlaces);
          
          // Re-query database to get cached + new results
          places = db.prepare(query).all(...params);
        }
      } catch (apiError) {
        console.error('PlacesRoute: API fetch failed, using cached results only:', apiError.message);
        // Continue with cached results even if API fails
      }
    }

    // Step 3: Parse amenities and return
    const placesWithAmenities = places.map(place => ({
      ...place,
      amenities: place.amenities ? JSON.parse(place.amenities) : []
    }));

    console.log(`PlacesRoute: Returning ${placesWithAmenities.length} places`);
    res.json(placesWithAmenities);
  } catch (error) {
    console.error('Search places error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get place by ID
router.get('/:id', (req, res) => {
  try {
    const place = db.prepare('SELECT * FROM places WHERE id = ?').get(req.params.id);

    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }

    // Parse amenities JSON
    place.amenities = place.amenities ? JSON.parse(place.amenities) : [];

    res.json(place);
  } catch (error) {
    console.error('Get place error:', error);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
});

module.exports = router;
