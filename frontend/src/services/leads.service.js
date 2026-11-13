import api from './api'

export const leadsService = {
  getAll: (params) => api.get('/leads', { params }),
  getOptions: () => api.get('/leads/options'),
  addOption: (data) => api.post('/leads/options', data),
  getById: (id) => api.get(`/leads/${id}`),
  create: (data) => api.post('/leads', data),
  update: (id, data) => api.put(`/leads/${id}`, data),
  delete: (id) => api.delete(`/leads/${id}`),
  changeStatus: (id, data) => api.patch(`/leads/${id}/status`, data),
  assign: (id, data) => api.patch(`/leads/${id}/assign`, data),
  checkDuplicate: (params) => api.get('/leads/check-duplicate', { params }),
  import: (formData) => api.post('/leads/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  downloadTemplate: () => api.get('/leads/import-template', { responseType: 'blob' }),
  export: (params) => api.get('/leads/export', { params, responseType: 'blob' }),

  // Calls
  logCall: (leadId, data) => api.post(`/leads/${leadId}/calls`, data),
  getCalls: (leadId) => api.get(`/leads/${leadId}/calls`),

  // Follow-ups
  createFollowUp: (leadId, data) => api.post(`/leads/${leadId}/followups`, data),

  // Notes
  addNote: (leadId, data) => api.post(`/leads/${leadId}/notes`, data),
  getNotes: (leadId) => api.get(`/leads/${leadId}/notes`),

  // Activities
  getActivities: (leadId, params) => api.get(`/leads/${leadId}/activities`, { params }),
}
