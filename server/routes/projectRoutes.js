const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getProjects, getProject, getSharedProject,
  createProject, updateProject, deleteProject,
  shareProject, suggestLayout,
} = require('../controllers/projectController');

router.get('/shared/:token', getSharedProject);

router.use(protect);
router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.post('/:id/share', shareProject);
router.get('/:id/suggest', suggestLayout);

module.exports = router;