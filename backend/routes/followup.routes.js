const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getFollowUps, updateFollowUp } = require('../controllers/followup.controller');

router.use(protect);
router.get('/', getFollowUps);
router.patch('/:id', updateFollowUp);

module.exports = router;
