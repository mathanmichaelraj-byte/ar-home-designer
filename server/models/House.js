const mongoose = require('mongoose');

/* ── Object sub-document ──────────────────────────────────────────── */
const objectSchema = new mongoose.Schema({
  furnitureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Furniture' },
  name:     { type: String, default: 'Object' },
  modelUrl: { type: String, default: '' },
  position: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  rotation: {
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    z: { type: Number, default: 0 },
  },
  scale: {
    x: { type: Number, default: 1 },
    y: { type: Number, default: 1 },
    z: { type: Number, default: 1 },
  },
  color: { type: String, default: '#cccccc' },
}, { _id: true });

/* ── Room sub-document ────────────────────────────────────────────── */
const roomSchema = new mongoose.Schema({
  name: { type: String, default: 'Room' },
  type: {
    type: String,
    enum: ['living', 'bedroom', 'office', 'dining', 'kitchen', 'bathroom', 'other'],
    default: 'living',
  },
  /* Which floor this room sits on (1 = ground, 2 = 1st floor, etc.) */
  floor: { type: Number, default: 1, min: 1, max: 10 },
  dimensions: {
    width:  { type: Number, default: 5 },
    length: { type: Number, default: 5 },
    height: { type: Number, default: 2.8 },
  },
  position2D: {
    x: { type: Number, default: 40 },
    y: { type: Number, default: 40 },
  },
  wallColor:    { type: String, default: '#f0ebe3' },
  floorTexture: { type: String, default: 'wood' },
  objects:      [objectSchema],
}, { _id: true });

/* ── House document ───────────────────────────────────────────────── */
const houseSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:       { type: String, default: 'My House', trim: true },
  rooms:      [roomSchema],
  shareToken: { type: String, unique: true, sparse: true },
  isPublic:   { type: Boolean, default: false },
  thumbnail:  { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('House', houseSchema);
