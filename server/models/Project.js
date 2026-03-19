const mongoose = require('mongoose');

const furnitureItemSchema = new mongoose.Schema({
  furnitureId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Furniture' },
  name:         String,
  modelUrl:     String,
  position:     { x: Number, y: Number, z: Number },
  rotation:     { x: Number, y: Number, z: Number },
  scale:        { x: Number, y: Number, z: Number },
  color:        { type: String, default: '#ffffff' },
}, { _id: true });

const roomSchema = new mongoose.Schema({
  width:      { type: Number, required: true, default: 5 },   // meters
  length:     { type: Number, required: true, default: 5 },
  height:     { type: Number, default: 2.7 },
  wallColor:  { type: String, default: '#f5f0eb' },
  floorColor: { type: String, default: '#c8a96e' },
  floorType:  { type: String, enum: ['wood', 'tile', 'carpet', 'concrete'], default: 'wood' },
});

const projectSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name:           { type: String, required: true, trim: true, default: 'My Room' },
    description:    { type: String, default: '' },
    thumbnail:      { type: String, default: '' },
    room:           { type: roomSchema, default: () => ({}) },
    objects:        [furnitureItemSchema],
    isPublic:       { type: Boolean, default: false },
    shareToken:     { type: String, unique: true, sparse: true },
    tags:           [String],
  },
  { timestamps: true }
);

// Text index for search
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Project', projectSchema);
