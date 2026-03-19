const Project = require('../models/Project');
const crypto = require('crypto');
const Furniture = require('../models/Furniture');
const { suggestLayout: generateSuggestions, estimateCost } = require('../services/aiService');

const getProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.json({ success: true, projects });
  } catch (err) { next(err); }
};

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    const isOwner = project.userId.toString() === req.user?._id?.toString();
    if (!project.isPublic && !isOwner)
      return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

const getSharedProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ shareToken: req.params.token });
    if (!project) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

const createProject = async (req, res, next) => {
  try {
    const project = await Project.create({ ...req.body, userId: req.user._id });
    res.status(201).json({ success: true, project });
  } catch (err) { next(err); }
};

const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    project = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, project });
  } catch (err) { next(err); }
};

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    await project.deleteOne();
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) { next(err); }
};

const shareProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });
    project.shareToken = crypto.randomBytes(16).toString('hex');
    project.isPublic = true;
    await project.save();
    res.json({ success: true, shareUrl: `${process.env.CLIENT_URL}/share/${project.shareToken}` });
  } catch (err) { next(err); }
};

const suggestLayout = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    if (project.userId.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized' });

    const furniture = await Furniture.find({ isActive: true });
    const { style = 'living' } = req.query;

    const result = generateSuggestions({
      width: project.roomDimensions?.width || 5,
      length: project.roomDimensions?.length || 5,
      style,
      availableFurniture: furniture,
    });

    const cost = estimateCost(
      result.suggestions
        .map(s => furniture.find(f => f._id.toString() === s.furnitureId?.toString()))
        .filter(Boolean)
    );

    res.json({ success: true, ...result, cost });
  } catch (err) { next(err); }
};

module.exports = { getProjects, getProject, getSharedProject, createProject, updateProject, deleteProject, shareProject, suggestLayout };