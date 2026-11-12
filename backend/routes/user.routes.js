const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { getUsers, getSalesUsers, createUser, updateUser, toggleStatus } = require('../controllers/user.controller');

router.use(protect);

router.get('/sales', getSalesUsers);

router.route('/')
  .get(authorize('ADMIN', 'TEAM_LEADER'), getUsers)
  .post(authorize('ADMIN'), createUser);

router.route('/:id')
  .put(authorize('ADMIN'), updateUser);

router.patch('/:id/status', authorize('ADMIN'), toggleStatus);

module.exports = router;
