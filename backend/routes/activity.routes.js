const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const Activity = require('../models/Activity.model');

router.use(protect);

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.user.role === 'SALES_EXECUTIVE') filter.user = req.user._id;
    const [activities, total] = await Promise.all([
      Activity.find(filter)
        .populate('user', 'name email avatar')
        .populate('lead', 'name companyName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Activity.countDocuments(filter),
    ]);
    res.json({ success: true, data: activities, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
