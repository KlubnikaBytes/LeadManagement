const Call = require('../models/Call.model');
const Lead = require('../models/Lead.model');
const FollowUp = require('../models/FollowUp.model');
const { createActivity } = require('../utils/helpers');

const logCall = async (leadId, data, userId) => {
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const call = await Call.create({
    lead: leadId,
    calledBy: userId,
    callDate: data.callDate || new Date(),
    duration: data.duration || '0:00',
    outcome: data.outcome,
    notes: data.notes,
    nextFollowUpAt: data.nextFollowUpAt,
    nextFollowUpType: data.nextFollowUpType,
  });

  // Update lead
  lead.totalCalls += 1;
  lead.lastContactedAt = new Date();
  if (data.outcome === 'Interested') lead.status = 'INTERESTED';
  else if (data.outcome === 'Not Interested') lead.status = 'NOT_INTERESTED';
  else if (data.outcome === 'Converted') lead.status = 'CONVERTED';
  else if (data.outcome === 'Connected' && lead.status === 'NEW') lead.status = 'CONTACTED';
  else if (data.outcome === 'Call Back Requested') lead.status = 'CALL_LATER';

  if (data.nextFollowUpAt) {
    lead.nextFollowUpAt = data.nextFollowUpAt;
    lead.status = lead.status === 'INTERESTED' ? 'FOLLOW_UP' : lead.status;
  }

  await lead.save();

  await createActivity({
    lead: leadId,
    user: userId,
    type: 'CALL_LOGGED',
    description: `Call logged - Outcome: ${data.outcome}`,
    metadata: {
      outcome: data.outcome,
      duration: data.duration,
      notes: data.notes,
    },
  });

  // Create follow-up if requested
  if (data.nextFollowUpAt) {
    const followUp = await FollowUp.create({
      lead: leadId,
      assignedTo: lead.assignedTo || userId,
      createdBy: userId,
      followUpDate: data.nextFollowUpAt,
      type: data.nextFollowUpType || 'Call',
      note: `Follow-up after call: ${data.notes || ''}`,
      status: 'PENDING',
    });

    await createActivity({
      lead: leadId,
      user: userId,
      type: 'FOLLOWUP_CREATED',
      description: `Follow-up scheduled for ${new Date(data.nextFollowUpAt).toLocaleDateString()}`,
      metadata: { followUpId: followUp._id, date: data.nextFollowUpAt },
    });
  }

  return call;
};

const getCallsByLead = async (leadId, user) => {
  const calls = await Call.find({ lead: leadId })
    .populate('calledBy', 'name email avatar')
    .sort({ callDate: -1 });
  return calls;
};

const getAllCalls = async (query, user) => {
  const { page = 1, limit = 20, startDate, endDate } = query;
  const filter = {};
  if (startDate || endDate) {
    filter.callDate = {};
    if (startDate) filter.callDate.$gte = new Date(startDate);
    if (endDate) filter.callDate.$lte = new Date(endDate);
  }
  if (user.role === 'SALES_EXECUTIVE') filter.calledBy = user._id;

  const skip = (page - 1) * limit;
  const [calls, total] = await Promise.all([
    Call.find(filter)
      .populate('lead', 'name companyName phone status')
      .populate('calledBy', 'name email avatar')
      .sort({ callDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Call.countDocuments(filter),
  ]);

  return { data: calls, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / limit) } };
};

module.exports = { logCall, getCallsByLead, getAllCalls };
