const express = require('express');
const router = express.Router();
const { login, getProfile, getSession, logout, signupAdmin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', signupAdmin);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/session', getSession);
router.get('/me', protect, getProfile);

module.exports = router;
