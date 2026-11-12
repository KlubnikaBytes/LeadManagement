const Activity = require('../models/Activity.model');
const Lead = require('../models/Lead.model');
const { canAccessSalesSection } = require('../services/lead.service');

const getActivitiesByLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.leadId, isDeleted: false });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    if (!canAccessSalesSection(lead, req.user)) {
      return res.json({
        success: true,
        data: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    const [activities, total] = await Promise.all([
      Activity.find({ lead: req.params.leadId })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Activity.countDocuments({ lead: req.params.leadId }),
    ]);

    res.json({
      success: true,
      data: activities,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getActivitiesByLead };
