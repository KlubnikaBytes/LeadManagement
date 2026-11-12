import api from './api'

export const usersService = {
  getAll: (params) => api.get('/users', { params }),
  getSalesUsers: () => api.get('/users/sales'),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/status`),
}
