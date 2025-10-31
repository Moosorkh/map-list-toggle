/**
 * Shared constants and configuration for the app
 */

// Default map center (Los Angeles)
export const DEFAULT_MAP_CENTER = [34.0522, -118.2437];
export const DEFAULT_MAP_ZOOM = 10;

// Luxury property images from Unsplash
export const LUXURY_IMAGES = [
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1613977257363-707ba9348227?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1613545325278-f24b0cae1224?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600566753051-f0b89df2dd90?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1605146769289-440113cc3d00?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1628744448840-55bdb2497bd4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1567428485548-c499e49c5e71?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1576941089067-2de3c901e126?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1600047509782-20d39509f26d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1571055107559-3e67626fa8be?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
];

// Get a random image URL
export const getRandomImage = () => {
    return LUXURY_IMAGES[Math.floor(Math.random() * LUXURY_IMAGES.length)];
};

// Coastal cities in California
export const COASTAL_CITIES = [
    { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
    { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
    { name: "San Diego", lat: 32.7157, lng: -117.1611 },
    { name: "Santa Barbara", lat: 34.4208, lng: -119.6982 },
    { name: "Monterey", lat: 36.6002, lng: -121.8947 },
    { name: "Santa Cruz", lat: 36.9741, lng: -122.0308 },
    { name: "Malibu", lat: 34.0259, lng: -118.7798 },
    { name: "Newport Beach", lat: 33.6189, lng: -117.9298 },
    { name: "Laguna Beach", lat: 33.5427, lng: -117.7854 },
    { name: "Carlsbad", lat: 33.1581, lng: -117.3506 },
    { name: "La Jolla", lat: 32.8328, lng: -117.2713 },
    { name: "Carmel", lat: 36.5552, lng: -121.9233 },
    { name: "Half Moon Bay", lat: 37.4636, lng: -122.4286 },
    { name: "Huntington Beach", lat: 33.6595, lng: -117.9988 },
    { name: "Long Beach", lat: 33.7701, lng: -118.1937 },
    { name: "Santa Monica", lat: 34.0195, lng: -118.4912 },
    { name: "Oxnard", lat: 34.1975, lng: -119.1771 },
    { name: "Ventura", lat: 34.2746, lng: -119.2290 },
    { name: "Dana Point", lat: 33.4672, lng: -117.6981 },
    { name: "Redondo Beach", lat: 33.8492, lng: -118.3886 }
];

// Inland luxury destinations
export const INLAND_CITIES = [
    { name: "Palm Springs", lat: 33.8303, lng: -116.5453 },
    { name: "Napa", lat: 38.2975, lng: -122.2869 },
    { name: "Sonoma", lat: 38.2919, lng: -122.4580 },
    { name: "Lake Tahoe", lat: 39.0968, lng: -120.0324 },
    { name: "Big Bear Lake", lat: 34.2439, lng: -116.9114 },
    { name: "Ojai", lat: 34.4480, lng: -119.2429 },
    { name: "Temecula", lat: 33.4936, lng: -117.1484 },
    { name: "Yosemite", lat: 37.8651, lng: -119.5383 },
    { name: "Paso Robles", lat: 35.6368, lng: -120.6545 },
    { name: "Calistoga", lat: 38.5787, lng: -122.5797 }
];

// All cities combined for convenience
export const ALL_CITIES = [...COASTAL_CITIES, ...INLAND_CITIES];
