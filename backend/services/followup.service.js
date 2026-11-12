const FollowUp = require('../models/FollowUp.model');
const Lead = require('../models/Lead.model');
const { createActivity } = require('../utils/helpers');
const { canAccessSalesSection } = require('./lead.service');

const createFollowUp = async (leadId, data, user) => {
  const userId = user?._id || user;
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
  if (user?.role && !canAccessSalesSection(lead, user)) {
    throw Object.assign(new Error('Not authorized to schedule follow-up for this lead'), { statusCode: 403 });
  }

  // Cancel previous pending follow-ups
  await FollowUp.updateMany(
    { lead: leadId, status: 'PENDING' },
    { status: 'CANCELLED' }
  );

  const followUp = await FollowUp.create({
    lead: leadId,
    assignedTo: data.assignedTo || lead.assignedTo || userId,
    createdBy: userId,
    followUpDate: data.followUpDate,
    type: data.type || 'Call',
    note: data.note,
    status: 'PENDING',
  });

  lead.nextFollowUpAt = data.followUpDate;
  if (lead.status === 'INTERESTED') lead.status = 'FOLLOW_UP';
  await lead.save();

  await createActivity({
    lead: leadId,
    user: userId,
    type: 'FOLLOWUP_CREATED',
    description: `Follow-up scheduled: ${new Date(data.followUpDate).toLocaleDateString()} (${data.type || 'Call'})`,
    metadata: { followUpId: followUp._id, date: data.followUpDate, type: data.type },
  });

  return followUp;
};

const getFollowUps = async (query, user) => {
  const { page = 1, limit = 20, status, type, range, assignedTo } = query;
  const filter = {};

  if (user.role === 'SALES_EXECUTIVE') {
    filter.assignedTo = user._id;
  } else if (assignedTo) {
    filter.assignedTo = assignedTo;
  }

  if (status) filter.status = status;
  if (type) filter.type = type;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (range === 'today') {
    filter.followUpDate = { $gte: today, $lt: tomorrow };
  } else if (range === 'overdue') {
    filter.followUpDate = { $lt: today };
    filter.status = 'PENDING';
  } else if (range === 'upcoming') {
    filter.followUpDate = { $gte: today };
  }

  const skip = (page - 1) * limit;
  const [followUps, total] = await Promise.all([
    FollowUp.find(filter)
      .populate('lead', 'name companyName phone status priority')
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name')
      .sort({ followUpDate: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    FollowUp.countDocuments(filter),
  ]);

  return { data: followUps, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } };
};

const updateFollowUp = async (id, data, userId) => {
  const followUp = await FollowUp.findById(id).populate('lead');
  if (!followUp) throw Object.assign(new Error('Follow-up not found'), { statusCode: 404 });

  const oldStatus = followUp.status;

  if (data.status === 'COMPLETED') {
    followUp.completedAt = new Date();
    followUp.status = 'COMPLETED';

    await createActivity({
      lead: followUp.lead._id,
      user: userId,
      type: 'FOLLOWUP_COMPLETED',
      description: `Follow-up completed (${followUp.type})`,
      metadata: { followUpId: followUp._id },
    });
  } else if (data.status === 'MISSED') {
    followUp.status = 'MISSED';
  } else if (data.status === 'CANCELLED') {
    followUp.status = 'CANCELLED';
  }

  if (data.followUpDate && data.followUpDate !== followUp.followUpDate?.toISOString()) {
    const oldDate = followUp.followUpDate;
    followUp.followUpDate = data.followUpDate;
    followUp.status = 'PENDING';
    if (data.rescheduleNote) followUp.rescheduleNote = data.rescheduleNote;

    // Update lead next follow-up
    const lead = await Lead.findById(followUp.lead._id || followUp.lead);
    if (lead) {
      lead.nextFollowUpAt = data.followUpDate;
      await lead.save();
    }

    await createActivity({
      lead: followUp.lead._id || followUp.lead,
      user: userId,
      type: 'FOLLOWUP_RESCHEDULED',
      description: `Follow-up rescheduled to ${new Date(data.followUpDate).toLocaleDateString()}`,
      metadata: { from: oldDate, to: data.followUpDate, note: data.rescheduleNote },
    });
  }

  if (data.note) followUp.note = data.note;

  await followUp.save();
  return followUp;
};

module.exports = { createFollowUp, getFollowUps, updateFollowUp };
