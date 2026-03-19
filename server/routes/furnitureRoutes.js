const express  = require('express');
const router   = express.Router();
const { getFurniture, getFurnitureById, createFurniture, updateFurniture, deleteFurniture, seedFurniture } = require('../controllers/furnitureController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',      getFurniture);
router.get('/:id',   getFurnitureById);

router.post('/seed', protect, adminOnly, seedFurniture);     // Dev seeding

router.post('/',     protect, adminOnly, createFurniture);
router.put('/:id',   protect, adminOnly, updateFurniture);
router.delete('/:id',protect, adminOnly, deleteFurniture);

module.exports = router;
