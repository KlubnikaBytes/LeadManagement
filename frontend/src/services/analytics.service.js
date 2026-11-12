import api from './api'

export const analyticsService = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getLeads: (params) => api.get('/analytics/leads', { params }),
  getCalls: (params) => api.get('/analytics/calls', { params }),
  getTeam: () => api.get('/analytics/team'),
}
