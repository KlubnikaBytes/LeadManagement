const createActivity = async (data) => {
  const Activity = require('../models/Activity.model');
  try {
    await Activity.create(data);
  } catch (err) {
    console.error('Activity creation failed:', err.message);
  }
};

const createNotification = async (data) => {
  const Notification = require('../models/Notification.model');
  try {
    await Notification.create(data);
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

const paginate = (page = 1, limit = 20, maxLimit = 100) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(maxLimit, Math.max(1, parseInt(limit) || 20));
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

const buildSortQuery = (sortBy = 'createdAt', sortOrder = 'desc') => {
  const allowedFields = ['createdAt','updatedAt','name','status','priority','lastContactedAt','nextFollowUpAt','totalCalls'];
  const field = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  return { [field]: sortOrder === 'asc' ? 1 : -1 };
};

module.exports = { createActivity, createNotification, paginate, buildSortQuery };
