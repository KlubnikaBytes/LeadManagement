const User = require('../models/User.model');
const Lead = require('../models/Lead.model');

const getUsers = async (query) => {
  const { role, isActive, search } = query;
  const filter = {};
  if (role) filter.role = role;
  if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .populate('teamLeader', 'name email')
    .sort({ createdAt: -1 });
  return users;
};

const createUser = async (data) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw Object.assign(new Error('User with this email already exists'), { statusCode: 400 });
  const user = await User.create(data);
  return user;
};

const updateUser = async (id, data) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  Object.assign(user, data);
  await user.save();
  return user;
};

const toggleUserStatus = async (id) => {
  const user = await User.findById(id);
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  user.isActive = !user.isActive;
  await user.save();
  return user;
};

const getSalesUsers = async () => {
  return User.find({ role: { $in: ['ADMIN', 'TEAM_LEADER', 'SALES_EXECUTIVE'] }, isActive: true })
    .select('name email role avatar')
    .sort({ name: 1 });
};

module.exports = { getUsers, createUser, updateUser, toggleUserStatus, getSalesUsers };
