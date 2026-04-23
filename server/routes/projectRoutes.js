const express = require('express');
const router = express.Router();
const {
  getProjects, createProject, getProject,
  updateProject, deleteProject, shareProject,
  getSharedProject, suggestLayout,
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

/* Public */
router.get('/shared/:token', getSharedProject);

/* Protected */
router.use(protect);
router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.post('/:id/share', shareProject);
router.get('/:id/suggest', suggestLayout);

module.exports = router;
