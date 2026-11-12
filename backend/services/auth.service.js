const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
  }
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });
  return { user, token: generateToken(user._id) };
};

const getMe = async (userId) => {
  const user = await User.findById(userId).populate('teamLeader', 'name email');
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
};

const registerAdmin = async (data) => {
  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) {
    throw Object.assign(new Error('An admin already exists in the system.'), { statusCode: 400 });
  }
  const user = await User.create({
    ...data,
    role: 'ADMIN'
  });
  return { user, token: generateToken(user._id) };
};

module.exports = { loginUser, getMe, generateToken, registerAdmin };
