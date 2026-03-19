const Furniture = require('../models/Furniture');

// @desc    Get all furniture (with filters)
// @route   GET /api/furniture
// @access  Public
const getFurniture = async (req, res, next) => {
  try {
    const { type, category, search, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };

    if (type)     query.type     = type;
    if (category) query.category = category;
    if (search)   query.$text    = { $search: search };

    const furniture = await Furniture.find(query)
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Furniture.countDocuments(query);
    res.json({ success: true, furniture, total });
  } catch (err) { next(err); }
};

// @desc    Get single furniture item
// @route   GET /api/furniture/:id
// @access  Public
const getFurnitureById = async (req, res, next) => {
  try {
    const item = await Furniture.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Furniture not found' });
    res.json({ success: true, furniture: item });
  } catch (err) { next(err); }
};

// @desc    Create furniture item (admin)
// @route   POST /api/furniture
// @access  Admin
const createFurniture = async (req, res, next) => {
  try {
    const item = await Furniture.create(req.body);
    res.status(201).json({ success: true, furniture: item });
  } catch (err) { next(err); }
};

// @desc    Update furniture item (admin)
// @route   PUT /api/furniture/:id
// @access  Admin
const updateFurniture = async (req, res, next) => {
  try {
    const item = await Furniture.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Furniture not found' });
    res.json({ success: true, furniture: item });
  } catch (err) { next(err); }
};

// @desc    Delete furniture item (admin)
// @route   DELETE /api/furniture/:id
// @access  Admin
const deleteFurniture = async (req, res, next) => {
  try {
    const item = await Furniture.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Furniture not found' });
    res.json({ success: true, message: 'Furniture deleted' });
  } catch (err) { next(err); }
};

// @desc    Seed default furniture (dev helper)
// @route   POST /api/furniture/seed
// @access  Admin
const seedFurniture = async (req, res, next) => {
  try {
    await Furniture.deleteMany({});
    const defaults = [
      { name: 'Modern Sofa',    type: 'sofa',     category: 'living',  modelUrl: '/models/sofa.glb',    dimensions: { width: 2.2, depth: 0.9, height: 0.8 }, price: 799  },
      { name: 'Dining Chair',   type: 'chair',    category: 'living',  modelUrl: '/models/chair.glb',   dimensions: { width: 0.5, depth: 0.5, height: 0.9 }, price: 199  },
      { name: 'Coffee Table',   type: 'table',    category: 'living',  modelUrl: '/models/table.glb',   dimensions: { width: 1.2, depth: 0.6, height: 0.4 }, price: 349  },
      { name: 'King Bed',       type: 'bed',      category: 'bedroom', modelUrl: '/models/bed.glb',     dimensions: { width: 1.8, depth: 2.1, height: 0.6 }, price: 1299 },
      { name: 'Wardrobe',       type: 'wardrobe', category: 'bedroom', modelUrl: '/models/wardrobe.glb',dimensions: { width: 1.5, depth: 0.6, height: 2.0 }, price: 899  },
      { name: 'Floor Lamp',     type: 'lamp',     category: 'living',  modelUrl: '/models/lamp.glb',    dimensions: { width: 0.3, depth: 0.3, height: 1.6 }, price: 129  },
      { name: 'Bookshelf',      type: 'shelf',    category: 'office',  modelUrl: '/models/shelf.glb',   dimensions: { width: 0.8, depth: 0.3, height: 1.8 }, price: 259  },
      { name: 'Office Desk',    type: 'desk',     category: 'office',  modelUrl: '/models/desk.glb',    dimensions: { width: 1.4, depth: 0.7, height: 0.75}, price: 449  },
      { name: 'Area Rug',       type: 'rug',      category: 'living',  modelUrl: '/models/rug.glb',     dimensions: { width: 2.0, depth: 3.0, height: 0.01}, price: 199  },
      { name: 'Potted Plant',   type: 'plant',    category: 'decor',   modelUrl: '/models/plant.glb',   dimensions: { width: 0.4, depth: 0.4, height: 0.9 }, price: 49   },
    ];
    const items = await Furniture.insertMany(defaults);
    res.json({ success: true, message: `${items.length} furniture items seeded`, data: items });
  } catch (err) { next(err); }
};

module.exports = { getFurniture, getFurnitureById, createFurniture, updateFurniture, deleteFurniture, seedFurniture };
