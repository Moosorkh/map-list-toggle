const db = require('./db');

// Sample hospitality places data
const samplePlaces = [
  {
    id: 'hotel-paris-1',
    name: 'Le Grand Hotel Paris',
    type: 'hotel',
    address: '12 Boulevard des Capucines',
    city: 'Paris',
    country: 'France',
    latitude: 48.8698,
    longitude: 2.3320,
    rating: 4.7,
    price_range: '$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Gym']),
    description: 'Luxury hotel in the heart of Paris with elegant rooms and world-class amenities.',
    image_url: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
  },
  {
    id: 'bnb-london-1',
    name: 'Cozy Camden Loft',
    type: 'apartment',
    address: '45 Camden High Street',
    city: 'London',
    country: 'UK',
    latitude: 51.5390,
    longitude: -0.1426,
    rating: 4.5,
    price_range: '$$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Workspace']),
    description: 'Modern apartment in vibrant Camden with great transport links.',
    image_url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
  },
  {
    id: 'resort-bali-1',
    name: 'Ubud Jungle Resort',
    type: 'resort',
    address: 'Jalan Raya Ubud',
    city: 'Ubud',
    country: 'Indonesia',
    latitude: -8.5069,
    longitude: 115.2625,
    rating: 4.9,
    price_range: '$$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Yoga', 'Nature Tours']),
    description: 'Stunning resort surrounded by lush jungle and rice terraces.',
    image_url: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800'
  },
  {
    id: 'hostel-barcelona-1',
    name: 'Barcelona Beach Hostel',
    type: 'hostel',
    address: 'Carrer de la Marina',
    city: 'Barcelona',
    country: 'Spain',
    latitude: 41.3874,
    longitude: 2.1898,
    rating: 4.2,
    price_range: '$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Common Area', 'Bar']),
    description: 'Social hostel steps from the beach with friendly atmosphere.',
    image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'
  },
  {
    id: 'villa-tuscany-1',
    name: 'Tuscan Villa Retreat',
    type: 'villa',
    address: 'Via delle Colline',
    city: 'Florence',
    country: 'Italy',
    latitude: 43.7696,
    longitude: 11.2558,
    rating: 4.8,
    price_range: '$$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Garden', 'Kitchen', 'Parking']),
    description: 'Charming villa in Tuscan countryside with vineyard views.',
    image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
  },
  {
    id: 'hotel-tokyo-1',
    name: 'Tokyo Central Hotel',
    type: 'hotel',
    address: '1-1-1 Shibuya',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.6594,
    longitude: 139.7005,
    rating: 4.6,
    price_range: '$$$',
    amenities: JSON.stringify(['WiFi', 'Restaurant', 'Bar', 'Gym', 'Business Center']),
    description: 'Modern hotel in bustling Shibuya with excellent transit access.',
    image_url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
  },
  {
    id: 'bnb-nyc-1',
    name: 'Brooklyn Brownstone',
    type: 'apartment',
    address: '123 Prospect Place',
    city: 'New York',
    country: 'USA',
    latitude: 40.6782,
    longitude: -73.9442,
    rating: 4.4,
    price_range: '$$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Workspace', 'Laundry']),
    description: 'Classic Brooklyn brownstone with authentic NYC charm.',
    image_url: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1eef?w=800'
  },
  {
    id: 'hotel-la-1',
    name: 'Beverly Hills Luxury Hotel',
    type: 'hotel',
    address: '9876 Wilshire Boulevard',
    city: 'Los Angeles',
    country: 'USA',
    latitude: 34.0730,
    longitude: -118.4000,
    rating: 4.8,
    price_range: '$$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Valet']),
    description: 'Iconic Beverly Hills hotel with Hollywood glamour and luxury.',
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'
  },
  {
    id: 'hostel-la-1',
    name: 'Venice Beach Hostel',
    type: 'hostel',
    address: '25 Windward Avenue',
    city: 'Los Angeles',
    country: 'USA',
    latitude: 33.9850,
    longitude: -118.4695,
    rating: 4.3,
    price_range: '$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Common Area', 'Beach Access']),
    description: 'Laid-back hostel steps from Venice Beach boardwalk.',
    image_url: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'
  },
  {
    id: 'bnb-la-1',
    name: 'Santa Monica Beach House',
    type: 'apartment',
    address: '789 Ocean Avenue',
    city: 'Los Angeles',
    country: 'USA',
    latitude: 34.0195,
    longitude: -118.4912,
    rating: 4.6,
    price_range: '$$$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Beach View', 'Parking']),
    description: 'Beautiful beachfront apartment with stunning Pacific views.',
    image_url: 'https://images.unsplash.com/photo-1502672260066-6bc35f0a1eef?w=800'
  },
  {
    id: 'resort-maldives-1',
    name: 'Maldives Ocean Resort',
    type: 'resort',
    address: 'North Malé Atoll',
    city: 'Malé',
    country: 'Maldives',
    latitude: 4.1755,
    longitude: 73.5093,
    rating: 5.0,
    price_range: '$$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Water Sports', 'Diving']),
    description: 'Exclusive overwater villas with pristine beaches and crystal waters.',
    image_url: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?w=800'
  },
  {
    id: 'hostel-amsterdam-1',
    name: 'Amsterdam Canal Hostel',
    type: 'hostel',
    address: 'Prinsengracht 123',
    city: 'Amsterdam',
    country: 'Netherlands',
    latitude: 52.3676,
    longitude: 4.9041,
    rating: 4.3,
    price_range: '$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Common Area', 'Bike Rental']),
    description: 'Cozy hostel on a picturesque canal in the heart of Amsterdam.',
    image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800'
  },
  {
    id: 'hotel-dubai-1',
    name: 'Dubai Marina Tower Hotel',
    type: 'hotel',
    address: 'Dubai Marina Walk',
    city: 'Dubai',
    country: 'UAE',
    latitude: 25.0801,
    longitude: 55.1397,
    rating: 4.7,
    price_range: '$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Beach Access']),
    description: 'Luxurious hotel with stunning marina views and world-class facilities.',
    image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800'
  },
  {
    id: 'bnb-sydney-1',
    name: 'Bondi Beach Apartment',
    type: 'apartment',
    address: '56 Campbell Parade',
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.8915,
    longitude: 151.2767,
    rating: 4.6,
    price_range: '$$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Beach View', 'Parking']),
    description: 'Beachfront apartment with spectacular ocean views at Bondi.',
    image_url: 'https://images.unsplash.com/photo-1536407570555-b85ea0b7c6a8?w=800'
  },
  {
    id: 'villa-santorini-1',
    name: 'Santorini Sunset Villa',
    type: 'villa',
    address: 'Oia Village',
    city: 'Santorini',
    country: 'Greece',
    latitude: 36.4618,
    longitude: 25.3753,
    rating: 4.9,
    price_range: '$$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Jacuzzi', 'Kitchen', 'Sunset View']),
    description: 'Iconic white villa with infinity pool and caldera views.',
    image_url: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'
  },
  {
    id: 'resort-cancun-1',
    name: 'Cancun Beach Resort',
    type: 'resort',
    address: 'Boulevard Kukulcan Km 12',
    city: 'Cancun',
    country: 'Mexico',
    latitude: 21.1619,
    longitude: -86.8515,
    rating: 4.5,
    price_range: '$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Water Sports']),
    description: 'All-inclusive resort on pristine Caribbean beach.',
    image_url: 'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800'
  },
  {
    id: 'hotel-singapore-1',
    name: 'Marina Bay Grand Hotel',
    type: 'hotel',
    address: '10 Bayfront Avenue',
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.2838,
    longitude: 103.8607,
    rating: 4.8,
    price_range: '$$$$',
    amenities: JSON.stringify(['WiFi', 'Pool', 'Spa', 'Restaurant', 'Bar', 'Casino', 'Rooftop']),
    description: 'Iconic hotel with rooftop infinity pool and stunning skyline views.',
    image_url: 'https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?w=800'
  },
  {
    id: 'bnb-prague-1',
    name: 'Old Town Prague Apartment',
    type: 'apartment',
    address: 'Staroměstské náměstí',
    city: 'Prague',
    country: 'Czech Republic',
    latitude: 50.0875,
    longitude: 14.4213,
    rating: 4.4,
    price_range: '$$',
    amenities: JSON.stringify(['WiFi', 'Kitchen', 'Workspace', 'Historic Building']),
    description: 'Charming apartment in historic Old Town near major attractions.',
    image_url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
  }
];

function seedDatabase() {
  console.log('Starting database seed...');

  try {
    // Check if places already exist
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM places').get().count;
    
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} places. Skipping seed.`);
      console.log('To re-seed, delete database.db and run again.');
      return;
    }

    // Insert sample places
    const insertPlace = db.prepare(`
      INSERT INTO places (id, name, type, address, city, country, latitude, longitude, rating, price_range, amenities, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((places) => {
      for (const place of places) {
        insertPlace.run(
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

    insertMany(samplePlaces);

    console.log(`✓ Successfully seeded ${samplePlaces.length} places`);
    console.log('Sample locations: Paris, London, Bali, Barcelona, Tokyo, NYC, Los Angeles (Beverly Hills, Venice Beach, Santa Monica), Maldives, Amsterdam, Dubai, Sydney, Santorini, Cancun, Singapore, Prague');
    
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedDatabase();
