import axios from 'axios'
import toast from 'react-hot-toast'

const rawApiUrl = import.meta.env.VITE_API_URL?.trim()
const baseURL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      window.location.href = '/login'
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export default api
