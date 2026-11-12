import api from './api'

export const followupsService = {
  getAll: (params) => api.get('/followups', { params }),
  update: (id, data) => api.patch(`/followups/${id}`, data),
}
