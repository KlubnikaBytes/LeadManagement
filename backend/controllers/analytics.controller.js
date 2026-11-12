const analyticsService = require('../services/analytics.service');

const parseDateRange = (query) => {
  const { period, startDate, endDate } = query;
  const now = new Date();

  if (startDate && endDate) return { start: startDate, end: endDate };

  switch (period) {
    case 'today':
      return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(), end: now.toISOString() };
    case '7days':
      return { start: new Date(now - 7 * 86400000).toISOString(), end: now.toISOString() };
    case '30days':
      return { start: new Date(now - 30 * 86400000).toISOString(), end: now.toISOString() };
    case 'this_month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), end: now.toISOString() };
    default:
      return { start: new Date(now - 30 * 86400000).toISOString(), end: now.toISOString() };
  }
};

const getDashboard = async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user);
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

const getLeadsAnalytics = async (req, res, next) => {
  try {
    const dateRange = parseDateRange(req.query);
    const [byStatus, bySource, overTime, funnel] = await Promise.all([
      analyticsService.getLeadsByStatus(req.user, dateRange),
      analyticsService.getLeadsBySource(req.user, dateRange),
      analyticsService.getLeadsOverTime(req.user, dateRange),
      analyticsService.getConversionFunnel(req.user),
    ]);
    res.json({ success: true, data: { byStatus, bySource, overTime, funnel } });
  } catch (err) {
    next(err);
  }
};

const getCallsAnalytics = async (req, res, next) => {
  try {
    const dateRange = parseDateRange(req.query);
    const callsPerDay = await analyticsService.getCallsPerDay(req.user, dateRange);
    res.json({ success: true, data: { callsPerDay } });
  } catch (err) {
    next(err);
  }
};

const getTeamAnalytics = async (req, res, next) => {
  try {
    const performance = await analyticsService.getTeamPerformance();
    res.json({ success: true, data: performance });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getLeadsAnalytics, getCallsAnalytics, getTeamAnalytics };
