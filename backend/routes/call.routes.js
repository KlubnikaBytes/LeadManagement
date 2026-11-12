const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getAllCalls } = require('../controllers/call.controller');

router.use(protect);
router.get('/', getAllCalls);

module.exports = router;
