require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Initialize database and routes
const db = require('./db');
const authRoutes = require('./routes/auth');
const placesRoutes = require('./routes/places');
const bookingsRoutes = require('./routes/bookings');
const savedRoutes = require('./routes/saved');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/places', placesRoutes);
app.use('/me/bookings', bookingsRoutes);
app.use('/me/saved', savedRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
