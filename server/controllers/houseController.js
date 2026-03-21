const House = require('../models/House');
const crypto = require('crypto');

const getHouses = async (req, res, next) => {
  try {
    const houses = await House.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, houses });
  } catch (err) { next(err); }
};

const getHouse = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    const isOwner = house.userId.toString() === req.user._id.toString();
    if (!house.isPublic && !isOwner)
      return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, house });
  } catch (err) { next(err); }
};

const createHouse = async (req, res, next) => {
  try {
    const house = await House.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, house });
  } catch (err) { next(err); }
};

const updateHouse = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    const updated = await House.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, house: updated });
  } catch (err) { next(err); }
};

const deleteHouse = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await house.deleteOne();
    res.json({ success: true, message: 'House deleted' });
  } catch (err) { next(err); }
};

// Add a room to a house
const addRoom = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    house.rooms.push(req.body);
    await house.save();
    res.json({ success: true, house });
  } catch (err) { next(err); }
};

// Update a specific room
const updateRoom = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    const room = house.rooms.id(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    Object.assign(room, req.body);
    await house.save();
    res.json({ success: true, house });
  } catch (err) { next(err); }
};

// Delete a specific room
const deleteRoom = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    house.rooms.pull(req.params.roomId);
    await house.save();
    res.json({ success: true, house });
  } catch (err) { next(err); }
};

const shareHouse = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    house.shareToken = crypto.randomBytes(16).toString('hex');
    house.isPublic = true;
    await house.save();
    res.json({ success: true, shareUrl: `${process.env.CLIENT_URL}/shared/house/${house.shareToken}` });
  } catch (err) { next(err); }
};

module.exports = { getHouses, getHouse, createHouse, updateHouse, deleteHouse, addRoom, updateRoom, deleteRoom, shareHouse };