import { useState, useCallback } from 'react'
import { analyticsService } from '../services/analytics.service'

export const useAnalytics = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await analyticsService.getDashboard()
      setStats(res.data.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  return { stats, loading, error, fetchDashboard }
}
