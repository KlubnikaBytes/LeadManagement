const Lead = require('../models/Lead.model');
const Call = require('../models/Call.model');
const FollowUp = require('../models/FollowUp.model');
const User = require('../models/User.model');

const buildLeadAccessFilter = async (user) => {
  const filter = { isDeleted: false };
  if (user.role === 'SALES_EXECUTIVE') {
    filter.$or = [{ assignedTo: user._id }, { createdBy: user._id }];
  } else if (user.role === 'TEAM_LEADER') {
    const teamMembers = await User.find({ teamLeader: user._id, isActive: true }).select('_id');
    const memberIds = teamMembers.map(m => m._id);
    memberIds.push(user._id);
    filter.$or = [{ assignedTo: { $in: memberIds } }, { createdBy: { $in: memberIds } }];
  }
  return filter;
};

const getDashboardStats = async (user) => {
  const baseFilter = await buildLeadAccessFilter(user);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const followUpBaseFilter = { status: 'PENDING' };
  if (user.role === 'SALES_EXECUTIVE') followUpBaseFilter.assignedTo = user._id;

  const [
    totalLeads, newLeads, contactedLeads, interestedLeads, callLaterLeads,
    notInterestedLeads, convertedLeads, lostLeads, followUpLeads,
    todayFollowUps, overdueFollowUps,
  ] = await Promise.all([
    Lead.countDocuments(baseFilter),
    Lead.countDocuments({ ...baseFilter, status: 'NEW' }),
    Lead.countDocuments({ ...baseFilter, status: 'CONTACTED' }),
    Lead.countDocuments({ ...baseFilter, status: 'INTERESTED' }),
    Lead.countDocuments({ ...baseFilter, status: 'CALL_LATER' }),
    Lead.countDocuments({ ...baseFilter, status: 'NOT_INTERESTED' }),
    Lead.countDocuments({ ...baseFilter, status: 'CONVERTED' }),
    Lead.countDocuments({ ...baseFilter, status: 'LOST' }),
    Lead.countDocuments({ ...baseFilter, status: 'FOLLOW_UP' }),
    FollowUp.countDocuments({ ...followUpBaseFilter, followUpDate: { $gte: today, $lt: tomorrow } }),
    FollowUp.countDocuments({ ...followUpBaseFilter, followUpDate: { $lt: today } }),
  ]);

  const callFilter = {};
  if (user.role === 'SALES_EXECUTIVE') callFilter.calledBy = user._id;

  const totalCalls = await Call.countDocuments(callFilter);

  return {
    totalLeads, newLeads, contactedLeads, interestedLeads, callLaterLeads,
    notInterestedLeads, convertedLeads, lostLeads, followUpLeads,
    todayFollowUps, overdueFollowUps, totalCalls,
  };
};

const getLeadsByStatus = async (user, dateRange) => {
  const filter = await buildLeadAccessFilter(user);
  applyDateFilter(filter, dateRange);

  const data = await Lead.aggregate([
    { $match: filter },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return data;
};

const getLeadsBySource = async (user, dateRange) => {
  const filter = await buildLeadAccessFilter(user);
  applyDateFilter(filter, dateRange);

  const data = await Lead.aggregate([
    { $match: filter },
    { $group: { _id: '$source', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return data;
};

const getLeadsOverTime = async (user, dateRange) => {
  const filter = await buildLeadAccessFilter(user);
  applyDateFilter(filter, dateRange);

  const data = await Lead.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return data;
};

const getCallsPerDay = async (user, dateRange) => {
  const filter = {};
  if (user.role === 'SALES_EXECUTIVE') filter.calledBy = user._id;
  if (dateRange) {
    filter.callDate = {};
    if (dateRange.start) filter.callDate.$gte = new Date(dateRange.start);
    if (dateRange.end) filter.callDate.$lte = new Date(dateRange.end);
  }

  const data = await Call.aggregate([
    { $match: filter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$callDate' } },
        count: { $sum: 1 },
        connected: { $sum: { $cond: [{ $eq: ['$outcome', 'Connected'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
  return data;
};

const getConversionFunnel = async (user) => {
  const filter = await buildLeadAccessFilter(user);

  const [total, contacted, interested, followUp, converted] = await Promise.all([
    Lead.countDocuments(filter),
    Lead.countDocuments({ ...filter, status: { $in: ['CONTACTED','INTERESTED','FOLLOW_UP','CONVERTED'] } }),
    Lead.countDocuments({ ...filter, status: { $in: ['INTERESTED','FOLLOW_UP','CONVERTED'] } }),
    Lead.countDocuments({ ...filter, status: { $in: ['FOLLOW_UP','CONVERTED'] } }),
    Lead.countDocuments({ ...filter, status: 'CONVERTED' }),
  ]);

  return [
    { stage: 'Total Leads', count: total },
    { stage: 'Contacted', count: contacted },
    { stage: 'Interested', count: interested },
    { stage: 'Follow-up', count: followUp },
    { stage: 'Converted', count: converted },
  ];
};

const getTeamPerformance = async () => {
  const users = await User.find({ role: { $in: ['ADMIN', 'TEAM_LEADER', 'SALES_EXECUTIVE'] } })
    .select('name email role avatar isActive')
    .sort({ isActive: -1, name: 1 })
    .lean();

  const performance = await Promise.all(
    users.map(async (u) => {
      const memberScope = { $or: [{ assignedTo: u._id }, { createdBy: u._id }], isDeleted: false };
      const [addedLeads, assignedLeads, totalLeads, interestedLeads, convertedLeads, totalCalls, connectedCalls] =
        await Promise.all([
          Lead.countDocuments({ createdBy: u._id, isDeleted: false }),
          Lead.countDocuments({ assignedTo: u._id, isDeleted: false }),
          Lead.countDocuments(memberScope),
          Lead.countDocuments({ ...memberScope, status: 'INTERESTED' }),
          Lead.countDocuments({ ...memberScope, status: 'CONVERTED' }),
          Call.countDocuments({ calledBy: u._id }),
          Call.countDocuments({ calledBy: u._id, outcome: 'Connected' }),
        ]);

      const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

      return {
        user: { _id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, isActive: u.isActive },
        addedLeads,
        assignedLeads,
        totalLeads,
        interestedLeads,
        convertedLeads,
        totalCalls,
        connectedCalls,
        conversionRate: parseFloat(conversionRate),
      };
    })
  );

  return performance.sort((a, b) => b.totalLeads - a.totalLeads || b.convertedLeads - a.convertedLeads);
};

const applyDateFilter = (filter, dateRange) => {
  if (!dateRange) return;
  filter.createdAt = {};
  if (dateRange.start) filter.createdAt.$gte = new Date(dateRange.start);
  if (dateRange.end) filter.createdAt.$lte = new Date(dateRange.end);
};

module.exports = { getDashboardStats, getLeadsByStatus, getLeadsBySource, getLeadsOverTime, getCallsPerDay, getConversionFunnel, getTeamPerformance };
