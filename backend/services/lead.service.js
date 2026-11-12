const Lead = require('../models/Lead.model');
const Activity = require('../models/Activity.model');
const Notification = require('../models/Notification.model');
const { paginate, buildSortQuery, createActivity } = require('../utils/helpers');

const getLeads = async (query, user) => {
  const {
    page = 1, limit = 20, search, status, source, typeOfReach, businessCategory,
    assignedTo, createdBy, member, priority, followUp, sortBy = 'createdAt', sortOrder = 'desc',
  } = query;

  const { page: pageNum, limit: limitNum, skip } = paginate(page, limit, query._export ? 50000 : 100);
  const filter = { isDeleted: false };
  const andConditions = [];

  // Role-based filtering
  if (user.role === 'SALES_EXECUTIVE') {
    andConditions.push({ $or: [{ assignedTo: user._id }, { createdBy: user._id }] });
  } else if (user.role === 'TEAM_LEADER') {
    const User = require('../models/User.model');
    const teamMembers = await User.find({ teamLeader: user._id, isActive: true }).select('_id');
    const memberIds = teamMembers.map(m => m._id);
    memberIds.push(user._id);
    andConditions.push({ $or: [{ assignedTo: { $in: memberIds } }, { createdBy: { $in: memberIds } }] });
  }

  if (search) {
    andConditions.push({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { pocJobTitle: { $regex: search, $options: 'i' } },
        { businessCategory: { $regex: search, $options: 'i' } },
        { businessSubCategory: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { website: { $regex: search, $options: 'i' } },
        { typeOfReach: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ],
    });
  }
  if (status) filter.status = status;
  if (source) filter.source = source;
  if (typeOfReach) andConditions.push({ $or: [{ typeOfReach }, { source: typeOfReach }] });
  if (businessCategory) andConditions.push({ $or: [{ businessCategory }, { businessType: businessCategory }] });
  if (user.role !== 'SALES_EXECUTIVE') {
    if (member) {
      andConditions.push({ $or: [{ assignedTo: member }, { createdBy: member }] });
    }
    if (createdBy) {
      filter.createdBy = createdBy;
    }
    if (assignedTo === 'unassigned') {
      andConditions.push({ $or: [{ assignedTo: null }, { assignedTo: { $exists: false } }] });
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
  }
  if (priority) filter.priority = priority;
  if (andConditions.length > 0) filter.$and = andConditions;

  if (followUp) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (followUp === 'today') {
      filter.nextFollowUpAt = { $gte: today, $lt: tomorrow };
    } else if (followUp === 'tomorrow') {
      filter.nextFollowUpAt = { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 86400000) };
    } else if (followUp === 'this_week') {
      filter.nextFollowUpAt = { $gte: today, $lt: weekEnd };
    } else if (followUp === 'overdue') {
      filter.nextFollowUpAt = { $lt: today, $ne: null };
    } else if (followUp === 'all_scheduled') {
      filter.nextFollowUpAt = { $ne: null };
    } else if (followUp === 'none') {
      filter.nextFollowUpAt = null;
    }
  }

  const sort = buildSortQuery(sortBy, sortOrder);
  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  return {
    data: leads,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

const getLeadById = async (id, user) => {
  const filter = { _id: id, isDeleted: false };
  if (user.role === 'SALES_EXECUTIVE') {
    filter.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
  }

  const lead = await Lead.findOne(filter)
    .populate('assignedTo', 'name email avatar role')
    .populate('createdBy', 'name email')
    .populate('convertedBy', 'name email');

  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });
  return lead;
};

const createLead = async (data, user) => {
  const userId = user?._id || user;
  const userRole = user?.role;

  // Auto-assign to creator if Sales Executive and no assignee specified
  if (!data.assignedTo) {
    delete data.assignedTo;
    if (userRole === 'SALES_EXECUTIVE') {
      data.assignedTo = userId;
    }
  }

  // Sync typeOfReach & source, businessCategory & businessType
  if (data.typeOfReach && !data.source) data.source = data.typeOfReach;
  if (data.source && !data.typeOfReach) data.typeOfReach = data.source;
  if (data.businessCategory && !data.businessType) data.businessType = data.businessCategory;
  if (data.businessType && !data.businessCategory) data.businessCategory = data.businessType;

  // Check for duplicate phone
  const existing = await Lead.findOne({
    $or: [
      { phone: data.phone, isDeleted: false },
      ...(data.email ? [{ email: data.email, isDeleted: false }] : []),
    ],
  });

  const lead = await Lead.create({ ...data, createdBy: userId });

  await createActivity({
    lead: lead._id,
    user: userId,
    type: 'LEAD_CREATED',
    description: `Lead created: ${lead.name}`,
    metadata: { source: lead.source || lead.typeOfReach, status: lead.status },
  });

  if (lead.assignedTo) {
    await createActivity({
      lead: lead._id,
      user: userId,
      type: 'LEAD_ASSIGNED',
      description: `Lead assigned`,
      metadata: { assignedTo: lead.assignedTo },
    });
    if (lead.assignedTo.toString() !== userId.toString()) {
      await Notification.create({
        user: lead.assignedTo,
        title: 'New Lead Assigned',
        message: `Lead "${lead.name}" has been assigned to you`,
        type: 'LEAD_ASSIGNED',
        lead: lead._id,
      });
    }
  }

  return { lead, duplicate: existing };
};

const updateLead = async (id, data, userId, userRole) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  if (
    userRole === 'SALES_EXECUTIVE' &&
    lead.assignedTo?.toString() !== userId.toString() &&
    lead.createdBy?.toString() !== userId.toString()
  ) {
    throw Object.assign(new Error('Not authorized to update this lead'), { statusCode: 403 });
  }

  if (data.assignedTo === '') {
    data.assignedTo = null;
  }

  const oldAssignedTo = lead.assignedTo?.toString();
  const oldStatus = lead.status;

  // Sync typeOfReach & source, businessCategory & businessType
  if (data.typeOfReach && !data.source) data.source = data.typeOfReach;
  if (data.source && !data.typeOfReach) data.typeOfReach = data.source;
  if (data.businessCategory && !data.businessType) data.businessType = data.businessCategory;
  if (data.businessType && !data.businessCategory) data.businessCategory = data.businessType;

  Object.assign(lead, data);

  if (data.status && data.status !== oldStatus) {
    await createActivity({
      lead: lead._id,
      user: userId,
      type: 'STATUS_CHANGED',
      description: `Status changed: ${oldStatus} → ${data.status}`,
      metadata: { from: oldStatus, to: data.status },
    });

    if (data.status === 'CONVERTED') {
      lead.convertedAt = new Date();
      lead.convertedBy = userId;
    }
  }

  if (data.assignedTo && data.assignedTo.toString() !== oldAssignedTo) {
    await createActivity({
      lead: lead._id,
      user: userId,
      type: 'LEAD_REASSIGNED',
      description: `Lead reassigned`,
      metadata: { from: oldAssignedTo, to: data.assignedTo },
    });
    await Notification.create({
      user: data.assignedTo,
      title: 'Lead Assigned to You',
      message: `Lead "${lead.name}" has been assigned to you`,
      type: 'LEAD_ASSIGNED',
      lead: lead._id,
    });
  }

  await lead.save();

  await createActivity({
    lead: lead._id,
    user: userId,
    type: 'LEAD_UPDATED',
    description: `Lead information updated`,
    metadata: {},
  });

  return lead;
};

const changeLeadStatus = async (id, status, userId, extra = {}) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const oldStatus = lead.status;
  lead.status = status;

  if (status === 'CONVERTED') {
    lead.convertedAt = new Date();
    lead.convertedBy = userId;
    if (extra.conversionNotes) lead.conversionNotes = extra.conversionNotes;
    if (extra.finalService) lead.finalService = extra.finalService;
    if (extra.finalBudget) lead.finalBudget = extra.finalBudget;
  }

  await lead.save();

  await createActivity({
    lead: lead._id,
    user: userId,
    type: 'STATUS_CHANGED',
    description: `Status changed: ${oldStatus} → ${status}`,
    metadata: { from: oldStatus, to: status, ...extra },
  });

  return lead;
};

const assignLead = async (id, assignedTo, userId) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const oldAssignedTo = lead.assignedTo;
  lead.assignedTo = assignedTo;
  await lead.save();

  const type = oldAssignedTo ? 'LEAD_REASSIGNED' : 'LEAD_ASSIGNED';
  await createActivity({
    lead: lead._id,
    user: userId,
    type,
    description: oldAssignedTo ? `Lead reassigned` : `Lead assigned`,
    metadata: { from: oldAssignedTo, to: assignedTo },
  });

  await Notification.create({
    user: assignedTo,
    title: 'Lead Assigned to You',
    message: `Lead "${lead.name}" has been assigned to you`,
    type: 'LEAD_ASSIGNED',
    lead: lead._id,
  });

  return lead;
};

const deleteLead = async (id, userId) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  lead.isDeleted = true;
  await lead.save();

  await createActivity({
    lead: lead._id,
    user: userId,
    type: 'LEAD_DELETED',
    description: `Lead deleted: ${lead.name}`,
    metadata: {},
  });

  return lead;
};

const checkDuplicate = async (phone, email, website) => {
  const orConditions = [];
  if (phone) orConditions.push({ phone, isDeleted: false });
  if (email) orConditions.push({ email, isDeleted: false });
  if (website) orConditions.push({ website, isDeleted: false });

  if (!orConditions.length) return null;

  return Lead.findOne({ $or: orConditions }).populate('assignedTo', 'name email');
};

module.exports = { getLeads, getLeadById, createLead, updateLead, changeLeadStatus, assignLead, deleteLead, checkDuplicate };
