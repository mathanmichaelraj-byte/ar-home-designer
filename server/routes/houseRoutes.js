const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getHouses, getHouse, createHouse, updateHouse,
  deleteHouse, addRoom, updateRoom, deleteRoom,
  getRoom, shareHouse,
} = require('../controllers/houseController');

router.use(protect);

router.route('/').get(getHouses).post(createHouse);
router.route('/:id').get(getHouse).put(updateHouse).delete(deleteHouse);
router.post('/:id/share', shareHouse);

/* Room sub-routes */
router.post('/:id/rooms', addRoom);
router.route('/:id/rooms/:roomId').put(updateRoom).delete(deleteRoom);

/* Look up a single room across all houses — used by AR viewer */
router.get('/room/:roomId', getRoom);

module.exports = router;
