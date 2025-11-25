const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get saved properties with full place details
router.get('/', (req, res) => {
  try {
    const saved = db.prepare(`
      SELECT p.*, sp.created_at as saved_at
      FROM saved_properties sp
      JOIN places p ON sp.place_id = p.id
      WHERE sp.user_id = ?
      ORDER BY sp.created_at DESC
    `).all(req.user.userId);

    // Parse amenities JSON
    const savedWithAmenities = saved.map(place => ({
      ...place,
      amenities: place.amenities ? JSON.parse(place.amenities) : []
    }));

    res.json(savedWithAmenities);
  } catch (error) {
    console.error('Get saved properties error:', error);
    res.status(500).json({ error: 'Failed to fetch saved properties' });
  }
});

// Toggle saved property
router.post('/', (req, res) => {
  try {
    const { placeId } = req.body;

    if (!placeId) {
      return res.status(400).json({ error: 'Place ID required' });
    }

    // Check if already saved
    const existing = db.prepare(`
      SELECT id FROM saved_properties
      WHERE user_id = ? AND place_id = ?
    `).get(req.user.userId, placeId);

    if (existing) {
      // Remove from saved
      db.prepare('DELETE FROM saved_properties WHERE id = ?').run(existing.id);
      res.json({ message: 'Property removed from saved', saved: false });
    } else {
      // Add to saved
      db.prepare(`
        INSERT INTO saved_properties (user_id, place_id)
        VALUES (?, ?)
      `).run(req.user.userId, placeId);
      res.json({ message: 'Property saved', saved: true });
    }
  } catch (error) {
    console.error('Toggle saved property error:', error);
    res.status(500).json({ error: 'Failed to update saved properties' });
  }
});

module.exports = router;
