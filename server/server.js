const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const errorHandler = require('./middleware/errorHandler');

dotenv.config();

const app = express();

/* ── Disable ETag so API routes never return 304 ──────────────────── */
app.set('etag', false);

/* ── CORS ─────────────────────────────────────────────────────────── */
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

/* ── Body parsers ─────────────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Logging (dev only) ───────────────────────────────────────────── */
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

/* ── No-cache header for all /api routes ──────────────────────────── */
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

/* ── Static assets ────────────────────────────────────────────────── */
app.use('/models',     express.static(path.join(__dirname, '../client/public/models')));
app.use('/thumbnails', express.static(path.join(__dirname, '../client/public/thumbnails')));

/* ── Routes ───────────────────────────────────────────────────────── */
app.use('/api/auth',      require('./routes/authRoutes'));
app.use('/api/projects',  require('./routes/projectRoutes'));
app.use('/api/furniture', require('./routes/furnitureRoutes'));
app.use('/api/houses',    require('./routes/houseRoutes'));

/* ── Health check ─────────────────────────────────────────────────── */
app.get('/api/health', (_req, res) => res.json({ status: 'OK', timestamp: new Date() }));

/* ── Error handler ────────────────────────────────────────────────── */
app.use(errorHandler);

/* ── DB + Listen ──────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
