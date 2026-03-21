const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, default: 'Room' },
  type: { type: String, enum: ['living','bedroom','office','dining','kitchen','bathroom','other'], default: 'living' },
  dimensions: {
    width: { type: Number, default: 5 },
    length: { type: Number, default: 5 },
    height: { type: Number, default: 2.8 },
  },
  position2D: {
    x: { type: Number, default: 40 },
    y: { type: Number, default: 40 },
  },
  wallColor: { type: String, default: '#f5f5f0' },
  floorTexture: { type: String, default: 'wood' },
  objects: [
    {
      furnitureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Furniture' },
      name: String,
      modelUrl: String,
      position: { x: Number, y: Number, z: Number },
      rotation: { x: Number, y: Number, z: Number },
      scale: { x: Number, y: Number, z: Number },
      color: { type: String, default: '#cccccc' },
    }
  ],
}, { _id: true });

const houseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My House' },
  rooms: [roomSchema],
  shareToken: { type: String, unique: true, sparse: true },
  isPublic: { type: Boolean, default: false },
  thumbnail: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('House', houseSchema);