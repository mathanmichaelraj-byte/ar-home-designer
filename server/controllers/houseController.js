const House = require('../models/House');
const crypto = require('crypto');

/* ── helper: mark rooms + nested objects as modified ─────────────── */
const markRoomsModified = (house) => {
  house.markModified('rooms');
};

/* ─────────────────────────────────────────────────────────────────── */

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

    Object.assign(house, req.body);
    markRoomsModified(house);
    await house.save();

    res.json({ success: true, house });
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

/* ── Room CRUD ────────────────────────────────────────────────────── */

const addRoom = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    house.rooms.push(req.body);
    markRoomsModified(house);
    await house.save();

    res.json({ success: true, house });
  } catch (err) { next(err); }
};

const updateRoom = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const room = house.rooms.id(req.params.roomId);
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    /* Deep-merge objects array if present in the update payload */
    const { objects, ...rest } = req.body;
    Object.assign(room, rest);

    if (Array.isArray(objects)) {
      room.objects = objects;          // replace the objects array wholesale
    }

    markRoomsModified(house);
    await house.save();

    res.json({ success: true, house });
  } catch (err) { next(err); }
};

const deleteRoom = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    house.rooms.pull(req.params.roomId);
    markRoomsModified(house);
    await house.save();

    res.json({ success: true, house });
  } catch (err) { next(err); }
};

/* ── Get a single room by ID (used by AR viewer) ─────────────────── */
const getRoom = async (req, res, next) => {
  try {
    const house = await House.findOne({ 'rooms._id': req.params.roomId });
    if (!house) return res.status(404).json({ success: false, message: 'Room not found' });

    const isOwner = house.userId.toString() === req.user._id.toString();
    if (!house.isPublic && !isOwner)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const room = house.rooms.id(req.params.roomId);
    res.json({ success: true, room, houseId: house._id });
  } catch (err) { next(err); }
};

/* ── Share ────────────────────────────────────────────────────────── */
const shareHouse = async (req, res, next) => {
  try {
    const house = await House.findById(req.params.id);
    if (!house) return res.status(404).json({ success: false, message: 'House not found' });
    if (house.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    house.shareToken = crypto.randomBytes(16).toString('hex');
    house.isPublic = true;
    await house.save();

    res.json({
      success: true,
      shareUrl: `${process.env.CLIENT_URL}/shared/house/${house.shareToken}`,
    });
  } catch (err) { next(err); }
};

module.exports = {
  getHouses, getHouse, createHouse, updateHouse, deleteHouse,
  addRoom, updateRoom, deleteRoom, getRoom,
  shareHouse,
};
