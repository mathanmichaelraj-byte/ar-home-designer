const express = require('express');
const router = express.Router();
const {
  getFurniture, getFurnitureItem, createFurniture, updateFurniture, deleteFurniture,
} = require('../controllers/furnitureController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getFurniture);
router.get('/:id', getFurnitureItem);
router.post('/', protect, adminOnly, createFurniture);
router.put('/:id', protect, adminOnly, updateFurniture);
router.delete('/:id', protect, adminOnly, deleteFurniture);

module.exports = router;
