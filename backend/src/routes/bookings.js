const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get user's bookings
router.get('/', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT * FROM bookings
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.userId);

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create booking
router.post('/', (req, res) => {
  try {
    const { placeId, placeName, checkIn, checkOut, guests, totalPrice } = req.body;

    if (!placeId || !placeName || !checkIn || !checkOut || !guests) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    const result = db.prepare(`
      INSERT INTO bookings (user_id, place_id, place_name, check_in, check_out, guests, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.userId, placeId, placeName, checkIn, checkOut, guests, totalPrice || null);

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(booking);
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Delete booking
router.delete('/:id', (req, res) => {
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.userId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    db.prepare('DELETE FROM bookings WHERE id = ?').run(req.params.id);

    res.json({ message: 'Booking deleted' });
  } catch (error) {
    console.error('Delete booking error:', error);
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

module.exports = router;
