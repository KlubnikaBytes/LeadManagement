const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getNotifications, markRead, markOneRead } = require('../controllers/notification.controller');

router.use(protect);
router.get('/', getNotifications);
router.patch('/read-all', markRead);
router.patch('/:id/read', markOneRead);

module.exports = router;
