const jwt = require('jsonwebtoken');
const User = require('../models/User.model');
const { loginUser, getMe, registerAdmin } = require('../services/auth.service');

const getCookieOptions = () => {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  };
};

const setTokenCookie = (res, token) => {
  res.cookie('jwt', token, {
    ...getCookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const signupAdmin = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    const { user, token } = await registerAdmin({ name, email, password });
    setTokenCookie(res, token);
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    console.log(`[LOGIN ATTEMPT] Email: '${email}', Password Length: ${password.length}`);
    const { user, token } = await loginUser(email, password);
    setTokenCookie(res, token);
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const user = await getMe(req.user._id);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const getSession = async (req, res) => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.json({ success: true, data: null });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').populate('teamLeader', 'name email');
    if (!user || !user.isActive) {
      return res.json({ success: true, data: null });
    }
    return res.json({ success: true, data: user });
  } catch {
    return res.json({ success: true, data: null });
  }
};

const logout = (req, res) => {
  res.cookie('jwt', 'none', {
    ...getCookieOptions(),
    expires: new Date(Date.now() + 10 * 1000),
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { login, getProfile, getSession, logout, signupAdmin };
