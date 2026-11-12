import axios from 'axios'
import toast from 'react-hot-toast'

const TOKEN_STORAGE_KEY = 'leadflow_auth_token'

export const getAuthToken = () => {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export const setAuthToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {}
}

export const clearAuthToken = () => setAuthToken(null)

const rawApiUrl = import.meta.env.VITE_API_URL?.trim()
const baseURL = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '/api'

const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
})

// Attach Bearer token for cross-origin deployments where third-party cookies may be blocked
api.interceptors.request.use((config) => {
  const token = getAuthToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/')
    if (error.response?.status === 401 && !isAuthEndpoint) {
      clearAuthToken()
      if (window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
        window.location.href = '/login'
      }
    }
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    if (error.response?.status !== 401) {
      toast.error(message)
    }
    return Promise.reject(error)
  }
)

export default api
