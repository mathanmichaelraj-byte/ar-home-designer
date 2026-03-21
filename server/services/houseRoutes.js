const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHouses, getHouse, createHouse, updateHouse,
  deleteHouse, addRoom, updateRoom, deleteRoom, shareHouse,
} = require('../controllers/houseController');

router.use(protect);
router.route('/').get(getHouses).post(createHouse);
router.route('/:id').get(getHouse).put(updateHouse).delete(deleteHouse);
router.post('/:id/rooms', addRoom);
router.route('/:id/rooms/:roomId').put(updateRoom).delete(deleteRoom);
router.post('/:id/share', shareHouse);

module.exports = router;