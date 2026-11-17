const Lead = require('../models/Lead.model');
const Activity = require('../models/Activity.model');
const Notification = require('../models/Notification.model');
const { paginate, buildSortQuery, createActivity } = require('../utils/helpers');

const canAccessSalesSection = (lead, user) => {
  if (!user) return false;
  if (user.role === 'ADMIN' || user.role === 'TEAM_LEADER') return true;
  const userId = user._id.toString();
  const assignedId = (lead.assignedTo?._id || lead.assignedTo)?.toString();
  if (assignedId) return assignedId === userId;
  const createdId = (lead.createdBy?._id || lead.createdBy)?.toString();
  return createdId === userId;
};

const sanitizeLeadForUser = (leadDoc, user) => {
  const lead = leadDoc?.toObject ? leadDoc.toObject() : { ...leadDoc };
  const canViewSalesSection = canAccessSalesSection(lead, user);
  if (canViewSalesSection) {
    return { ...lead, canViewSalesSection: true };
  }
  return {
    ...lead,
    status: null,
    priority: null,
    interestedIn: null,
    estimatedBudget: null,
    notes: null,
    lastContactedAt: null,
    nextFollowUpAt: null,
    totalCalls: null,
    convertedAt: null,
    convertedBy: null,
    conversionNotes: null,
    finalService: null,
    finalBudget: null,
    assignmentHistory: [],
    canViewSalesSection: false,
  };
};

const getLeads = async (query, user) => {
  const {
    page = 1, limit = 20, search, status, source, typeOfReach, businessCategory, businessSubCategory,
    assignedTo, createdBy, member, mine, priority, followUp, sortBy = 'createdAt', sortOrder = 'desc',
    dateField = 'createdAt', dateRange, startDate, endDate,
  } = query;

  const { page: pageNum, limit: limitNum, skip } = paginate(page, limit, query._export ? 50000 : 100);
  const filter = { isDeleted: false };
  const andConditions = [];

  // Sales Executives can browse all Client & Lead Info; personal/Section-4 filters stay scoped to their own leads
  if (user.role === 'SALES_EXECUTIVE') {
    if (mine === 'true' || status || priority || followUp) {
      andConditions.push({
        $or: [
          { assignedTo: user._id },
          { createdBy: user._id, assignedTo: null },
          { createdBy: user._id, assignedTo: { $exists: false } },
        ],
      });
    }
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
        { companyEmail: { $regex: search, $options: 'i' } },
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
  if (businessSubCategory) filter.businessSubCategory = businessSubCategory;
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

  // Date Filtering (Created Date, Last Contacted, Next Follow-up, Last Updated)
  const allowedDateFields = ['createdAt', 'lastContactedAt', 'nextFollowUpAt', 'updatedAt'];
  const targetDateField = allowedDateFields.includes(dateField) ? dateField : 'createdAt';

  if (dateRange || startDate || endDate) {
    const now = new Date();
    let rangeStart = null;
    let rangeEnd = null;

    if (dateRange === 'today') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRange === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      rangeStart = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 0, 0, 0, 0);
      rangeEnd = new Date(y.getFullYear(), y.getMonth(), y.getDate(), 23, 59, 59, 999);
    } else if (dateRange === 'last_7_days') {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      rangeStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (dateRange === 'this_month') {
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (dateRange === 'last_month') {
      rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      rangeEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (dateRange === 'custom' || startDate || endDate) {
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (!isNaN(parsedStart.getTime())) {
          rangeStart = new Date(parsedStart.getFullYear(), parsedStart.getMonth(), parsedStart.getDate(), 0, 0, 0, 0);
        }
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (!isNaN(parsedEnd.getTime())) {
          rangeEnd = new Date(parsedEnd.getFullYear(), parsedEnd.getMonth(), parsedEnd.getDate(), 23, 59, 59, 999);
        }
      }
    }

    if (rangeStart && rangeEnd && rangeStart > rangeEnd) {
      const temp = rangeStart;
      rangeStart = rangeEnd;
      rangeEnd = temp;
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(23, 59, 59, 999);
    }

    if (rangeStart || rangeEnd) {
      const dateCondition = {};
      if (rangeStart) dateCondition.$gte = rangeStart;
      if (rangeEnd) dateCondition.$lte = rangeEnd;
      andConditions.push({ [targetDateField]: dateCondition });
    }
  }

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
  const [rawLeads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email avatar role')
      .populate('primaryAssignedTo', 'name email avatar role')
      .populate('reassignedBy', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Lead.countDocuments(filter),
  ]);

  const companyNames = Array.from(
    new Set(rawLeads.map((l) => (l.companyName ? l.companyName.trim() : '')).filter(Boolean))
  );

  const companyPocsMap = new Map();
  if (companyNames.length > 0) {
    const siblings = await Lead.find({
      companyName: { $in: companyNames },
      isDeleted: false,
    })
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort({ createdAt: 1 })
      .lean();

    for (const sib of siblings) {
      if (!sib.companyName) continue;
      const key = sib.companyName.trim().toLowerCase();
      if (!companyPocsMap.has(key)) companyPocsMap.set(key, []);
      companyPocsMap.get(key).push(sanitizeLeadForUser(sib, user));
    }
  }

  const leads = rawLeads.map((l) => {
    const sanitized = sanitizeLeadForUser(l, user);
    if (l.companyName && l.companyName.trim()) {
      const key = l.companyName.trim().toLowerCase();
      sanitized.companyPocs = companyPocsMap.get(key) || [sanitized];
    } else {
      sanitized.companyPocs = [sanitized];
    }
    return sanitized;
  });

  return {
    data: leads,
    pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
  };
};

const getLeadById = async (id, user) => {
  const filter = { _id: id, isDeleted: false };

  const lead = await Lead.findOne(filter)
    .populate('assignedTo', 'name email avatar role')
    .populate('primaryAssignedTo', 'name email avatar role')
    .populate('reassignedBy', 'name email avatar role')
    .populate('createdBy', 'name email avatar role')
    .populate('convertedBy', 'name email')
    .populate('assignmentHistory.assignedTo', 'name email role')
    .populate('assignmentHistory.assignedBy', 'name email role');

  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const leadObj = sanitizeLeadForUser(lead.toObject ? lead.toObject() : lead, user);
  if (lead.companyName && lead.companyName.trim()) {
    const siblings = await Lead.find({
      companyName: lead.companyName.trim(),
      isDeleted: false,
    })
      .populate('assignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .sort({ createdAt: 1 })
      .lean();

    leadObj.companyPocs = siblings.map((s) => sanitizeLeadForUser(s, user));
  } else {
    leadObj.companyPocs = [leadObj];
  }
  return leadObj;
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

  // Check for duplicate phone or email if provided
  const dupConditions = [];
  if (data.phone) dupConditions.push({ phone: data.phone, isDeleted: false });
  if (data.email) dupConditions.push({ email: data.email, isDeleted: false });
  const existing = dupConditions.length > 0 ? await Lead.findOne({ $or: dupConditions }) : null;

  const leadPayload = { ...data, createdBy: userId };
  if (data.totalCalls !== undefined) {
    leadPayload.totalCalls = Math.max(0, Number(data.totalCalls) || 0);
  }
  if (userRole === 'ADMIN') {
    if (leadPayload.assignedTo) {
      leadPayload.primaryAssignedTo = leadPayload.primaryAssignedTo || leadPayload.assignedTo;
      leadPayload.primaryAssignedAt = new Date();
      leadPayload.assignedBy = userId;
      leadPayload.assignedByName = data.assignedByName || '';
      leadPayload.assignmentHistory = [
        {
          assignedTo: leadPayload.assignedTo,
          assignedBy: userId,
          type: 'PRIMARY',
          assignedAt: new Date(),
          note: data.assignedByName ? `Assigned by ${data.assignedByName}` : undefined,
        },
      ];
    }
  } else {
    // Non-admins cannot assign leads
    delete leadPayload.assignedTo;
    delete leadPayload.primaryAssignedTo;
    delete leadPayload.assignedBy;
    delete leadPayload.assignedByName;
  }

  const lead = await Lead.create(leadPayload);

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

  if (!canAccessSalesSection(lead, { _id: userId, role: userRole })) {
    throw Object.assign(new Error('Not authorized to update this lead'), { statusCode: 403 });
  }

  if (userRole !== 'ADMIN') {
    delete data.assignedTo;
    delete data.primaryAssignedTo;
    delete data.assignedBy;
    delete data.assignedByName;
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

  // Preserve original primaryAssignedTo unless never set
  const incomingAssignedTo = data.assignedTo;
  delete data.primaryAssignedTo;
  if (data.totalCalls !== undefined) {
    data.totalCalls = Math.max(0, Number(data.totalCalls) || 0);
  }
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

  if (userRole === 'ADMIN' && data.assignedByName !== undefined) {
    lead.assignedByName = data.assignedByName;
  }

  if (userRole === 'ADMIN' && incomingAssignedTo && incomingAssignedTo.toString() !== oldAssignedTo) {
    const isPrimary = !lead.primaryAssignedTo;
    if (isPrimary) {
      lead.primaryAssignedTo = incomingAssignedTo;
      lead.primaryAssignedAt = new Date();
    } else {
      lead.reassignedBy = userId;
      lead.reassignedAt = new Date();
    }
    lead.assignedBy = userId;
    lead.assignmentHistory = lead.assignmentHistory || [];
    lead.assignmentHistory.push({
      assignedTo: incomingAssignedTo,
      assignedBy: userId,
      type: isPrimary ? 'PRIMARY' : 'REASSIGN',
      assignedAt: new Date(),
      note: data.assignedByName ? `Assigned by ${data.assignedByName}` : undefined,
    });

    await createActivity({
      lead: lead._id,
      user: userId,
      type: isPrimary ? 'LEAD_ASSIGNED' : 'LEAD_REASSIGNED',
      description: isPrimary ? 'Lead primary assigned' : 'Lead reassigned',
      metadata: { from: oldAssignedTo, to: incomingAssignedTo },
    });
    if (incomingAssignedTo.toString() !== userId.toString()) {
      await Notification.create({
        user: incomingAssignedTo,
        title: isPrimary ? 'New Lead Assigned to You' : 'Lead Reassigned to You',
        message: `Lead "${lead.name}" has been assigned to you`,
        type: 'LEAD_ASSIGNED',
        lead: lead._id,
      });
    }
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

const changeLeadStatus = async (id, status, user, extra = {}) => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const userId = user?._id || user;
  if (user?.role && !canAccessSalesSection(lead, user)) {
    throw Object.assign(new Error('Not authorized to update lead status'), { statusCode: 403 });
  }

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

const assignLead = async (id, assignedTo, userId, note = '', assignedByName = '') => {
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const oldAssignedTo = lead.assignedTo;
  const isPrimary = !lead.primaryAssignedTo;
  lead.assignedTo = assignedTo;

  if (isPrimary) {
    lead.primaryAssignedTo = assignedTo;
    lead.primaryAssignedAt = new Date();
  } else {
    lead.reassignedBy = userId;
    lead.reassignedAt = new Date();
  }

  lead.assignedBy = userId;
  if (assignedByName) {
    lead.assignedByName = assignedByName;
  }

  lead.assignmentHistory = lead.assignmentHistory || [];
  lead.assignmentHistory.push({
    assignedTo,
    assignedBy: userId,
    type: isPrimary ? 'PRIMARY' : 'REASSIGN',
    assignedAt: new Date(),
    note: assignedByName ? `Assigned by ${assignedByName}: ${note || ''}`.trim() : (note || undefined),
  });

  await lead.save();

  const type = isPrimary ? 'LEAD_ASSIGNED' : 'LEAD_REASSIGNED';
  await createActivity({
    lead: lead._id,
    user: userId,
    type,
    description: isPrimary ? 'Lead primary assigned' : 'Lead reassigned',
    metadata: { from: oldAssignedTo, to: assignedTo, note },
  });

  await Notification.create({
    user: assignedTo,
    title: isPrimary ? 'New Lead Assigned to You' : 'Lead Reassigned to You',
    message: `Lead "${lead.name}" has been ${isPrimary ? 'assigned' : 'reassigned'} to you`,
    type: 'LEAD_ASSIGNED',
    lead: lead._id,
  });

  return lead;
};

const deleteLead = async (id, user) => {
  const userId = user?._id || user;
  const userRole = user?.role;
  const lead = await Lead.findOne({ _id: id, isDeleted: false });
  if (!lead) throw Object.assign(new Error('Lead not found'), { statusCode: 404 });

  const isAdminOrLeader = userRole === 'ADMIN' || userRole === 'TEAM_LEADER';
  const isCreator = lead.createdBy?.toString() === userId.toString();
  const isAssignee = lead.assignedTo?.toString() === userId.toString();

  if (!isAdminOrLeader && !isCreator && !isAssignee) {
    throw Object.assign(
      new Error('You are only authorized to delete leads that you created or that are assigned to you'),
      { statusCode: 403 }
    );
  }

  lead.isDeleted = true;
  lead.deletedAt = new Date();
  lead.deletedBy = userId;
  await lead.save();

  await createActivity({
    lead: lead._id,
    user: userId,
    type: 'LEAD_DELETED',
    description: `Lead moved to trash: ${lead.name || lead.companyName || 'Lead'}`,
    metadata: { deletedBy: userId, deletedAt: lead.deletedAt },
  });

  return lead;
};

const restoreLead = async (id, user) => {
  const userId = user?._id || user;
  const userRole = user?.role;
  const lead = await Lead.findOne({ _id: id, isDeleted: true });
  if (!lead) throw Object.assign(new Error('Deleted lead not found'), { statusCode: 404 });

  if (userRole !== 'ADMIN' && userRole !== 'TEAM_LEADER') {
    throw Object.assign(new Error('Only Admins or Team Leaders can restore deleted leads'), { statusCode: 403 });
  }

  lead.isDeleted = false;
  lead.restoredAt = new Date();
  lead.restoredBy = userId;
  await lead.save();

  await createActivity({
    lead: lead._id,
    user: userId,
    type: 'LEAD_RESTORED',
    description: `Lead restored from trash: ${lead.name || lead.companyName || 'Lead'}`,
    metadata: { restoredBy: userId, restoredAt: lead.restoredAt },
  });

  return lead;
};

const permanentDeleteLead = async (id, user) => {
  if (user?.role !== 'ADMIN') {
    throw Object.assign(new Error('Only Admins can permanently purge deleted leads'), { statusCode: 403 });
  }
  const lead = await Lead.findOneAndDelete({ _id: id, isDeleted: true });
  if (!lead) throw Object.assign(new Error('Deleted lead not found'), { statusCode: 404 });
  return lead;
};

const getDeletedLeads = async (query, user) => {
  if (user?.role !== 'ADMIN') {
    throw Object.assign(new Error('Only Admins can view deleted leads archive'), { statusCode: 403 });
  }

  const {
    page = 1, limit = 20, search, status, businessCategory, businessSubCategory,
    deletedBy, createdBy, assignedTo, sortBy = 'deletedAt', sortOrder = 'desc',
    dateField = 'deletedAt', dateRange, startDate, endDate,
  } = query;

  const { page: pageNum, limit: limitNum, skip } = paginate(page, limit, 100);
  const filter = { isDeleted: true };
  const andConditions = [];

  if (search) {
    const s = search.trim();
    andConditions.push({
      $or: [
        { name: { $regex: s, $options: 'i' } },
        { companyName: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
        { alternatePhone: { $regex: s, $options: 'i' } },
        { companyPhone: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { companyEmail: { $regex: s, $options: 'i' } },
        { website: { $regex: s, $options: 'i' } },
      ],
    });
  }

  if (status) filter.status = status;
  if (businessCategory) andConditions.push({ $or: [{ businessCategory }, { businessType: businessCategory }] });
  if (businessSubCategory) filter.businessSubCategory = businessSubCategory;
  if (deletedBy) filter.deletedBy = deletedBy;
  if (createdBy) filter.createdBy = createdBy;
  if (assignedTo) filter.assignedTo = assignedTo;

  // Date range filtering
  if (dateRange || (startDate && endDate)) {
    const now = new Date();
    let start, end;
    if (dateRange === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    } else if (dateRange === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start = new Date(now.setDate(diff));
      start.setHours(0, 0, 0, 0);
      end = new Date();
      end.setHours(23, 59, 59, 999);
    } else if (dateRange === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }
    if (start && end) {
      filter[dateField || 'deletedAt'] = { $gte: start, $lte: end };
    }
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const sort = { [sortBy || 'deletedAt']: sortOrder === 'asc' ? 1 : -1 };

  const [total, leads] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.find(filter)
      .populate('assignedTo', 'name email avatar role')
      .populate('primaryAssignedTo', 'name email avatar role')
      .populate('createdBy', 'name email avatar role')
      .populate('deletedBy', 'name email avatar role')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  return {
    data: leads,
    pagination: {
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum) || 1,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    },
  };
};

const checkDuplicate = async (phone, email, website, companyEmail) => {
  const orConditions = [];
  if (phone) orConditions.push({ phone, isDeleted: false });
  if (email) orConditions.push({ email, isDeleted: false });
  if (companyEmail) orConditions.push({ companyEmail, isDeleted: false });
  if (website) orConditions.push({ website, isDeleted: false });

  if (!orConditions.length) return null;

  return Lead.findOne({ $or: orConditions }).populate('assignedTo', 'name email');
};

const searchCompanies = async (query) => {
  const q = (query || '').trim();
  if (!q) return [];

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const matches = await Lead.find({
    companyName: { $regex: escaped, $options: 'i' },
    isDeleted: false,
  })
    .select(
      'companyName companyEmail website businessCategory businessSubCategory address city state country pincode businessDescription name pocJobTitle phone email status priority'
    )
    .sort({ updatedAt: -1 })
    .lean();

  const map = new Map();
  for (const lead of matches) {
    if (!lead.companyName || !lead.companyName.trim()) continue;
    const key = lead.companyName.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        companyName: lead.companyName.trim(),
        companyEmail: lead.companyEmail || '',
        website: lead.website || '',
        businessCategory: lead.businessCategory || '',
        businessSubCategory: lead.businessSubCategory || '',
        address: lead.address || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || 'India',
        pincode: lead.pincode || '',
        businessDescription: lead.businessDescription || '',
        pocs: [],
      });
    }
    const item = map.get(key);
    item.pocs.push({
      leadId: lead._id,
      name: lead.name,
      pocJobTitle: lead.pocJobTitle || '',
      phone: lead.phone,
      email: lead.email || '',
      status: lead.status,
    });
  }

  return Array.from(map.values()).slice(0, 8);
};

module.exports = {
  getLeads,
  getDeletedLeads,
  getLeadById,
  createLead,
  updateLead,
  changeLeadStatus,
  assignLead,
  deleteLead,
  restoreLead,
  permanentDeleteLead,
  checkDuplicate,
  searchCompanies,
  canAccessSalesSection,
  sanitizeLeadForUser,
};
