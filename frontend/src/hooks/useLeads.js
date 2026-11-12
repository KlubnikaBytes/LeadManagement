import { useState, useCallback } from 'react'
import { leadsService } from '../services/leads.service'
import toast from 'react-hot-toast'

export const useLeads = () => {
  const [leads, setLeads] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchLeads = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    try {
      const res = await leadsService.getAll(params)
      setLeads(res.data.data)
      setPagination(res.data.pagination)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }, [])

  return { leads, pagination, loading, error, fetchLeads, setLeads }
}
