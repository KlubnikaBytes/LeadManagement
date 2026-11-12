import api from './api'

export const callsService = {
  getAll: (params) => api.get('/calls', { params }),
}
