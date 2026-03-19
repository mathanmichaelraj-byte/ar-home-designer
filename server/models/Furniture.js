const mongoose = require('mongoose');

const furnitureSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    type:       { type: String, required: true,
                  enum: ['sofa', 'chair', 'table', 'bed', 'shelf', 'desk', 'lamp', 'cabinet', 'wardrobe', 'plant', 'rug', 'other'],},
    category:   { type: String, enum: ['living', 'bedroom', 'kitchen', 'office', 'outdoor', 'decor'], default: 'living' },
    modelUrl:   { type: String, required: true },  // Path to .glb file
    thumbnailUrl: { type: String, default: '' },
    dimensions: {
      width:  { type: Number, required: true },    // meters
      depth:  { type: Number, required: true },
      height: { type: Number, required: true },
    },
    price:      { type: Number, default: 0 },
    brand:      { type: String, default: '' },
    colors:     [String],
    tags:       [String],
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

furnitureSchema.index({ name: 'text', type: 1, category: 1 });

module.exports = mongoose.model('Furniture', furnitureSchema);
