const userService = require('../services/user.service');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers(req.query);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const getSalesUsers = async (req, res, next) => {
  try {
    const users = await userService.getSalesUsers();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    req.app.get('io')?.emit('user_updated');
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    req.app.get('io')?.emit('user_updated');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const user = await userService.toggleUserStatus(req.params.id);
    req.app.get('io')?.emit('user_updated');
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getSalesUsers, createUser, updateUser, toggleStatus };
