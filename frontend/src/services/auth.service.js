import api from './api'

export const authService = {
  signup: (data) => api.post('/auth/signup', data),
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  getSession: () => api.get('/auth/session'),
  getProfile: () => api.get('/auth/me'),
}
