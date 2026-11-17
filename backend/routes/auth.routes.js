const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { login, getProfile, getSession, logout, signupAdmin, updateProfile } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Strict rate limiter only for login/signup brute-force protection (not session checks)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 60, // 60 attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
});

router.post('/signup', loginLimiter, signupAdmin);
router.post('/login', loginLimiter, login);
router.post('/logout', protect, logout);
router.get('/session', getSession);
router.get('/me', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
