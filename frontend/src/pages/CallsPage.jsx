import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Clock, CheckCircle2 } from 'lucide-react'
import { callsService } from '../services/calls.service'
import { Avatar } from '../components/ui/Avatar'
import { Pagination } from '../components/ui/Pagination'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDateTime } from '../utils/helpers'

const OUTCOME_COLORS = {
  Connected: 'text-green-400 bg-green-500/10',
  'No Answer': 'text-slate-400 bg-slate-700',
  Busy: 'text-amber-400 bg-amber-500/10',
  'Call Back Requested': 'text-blue-400 bg-blue-500/10',
  Interested: 'text-emerald-400 bg-emerald-500/10',
  'Not Interested': 'text-red-400 bg-red-500/10',
  'Wrong Number': 'text-slate-400 bg-slate-700',
  Converted: 'text-purple-400 bg-purple-500/10',
}

export const CallsPage = () => {
  const [calls, setCalls] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const fetchCalls = useCallback(async () => {
    setLoading(true)
    try {
      const res = await callsService.getAll({ page, limit: 20 })
      setCalls(res.data.data)
      setPagination(res.data.pagination)
    } catch {} finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetchCalls() }, [fetchCalls])

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Call Logs</h1>
        <p className="text-muted mt-1">{pagination.total} calls recorded</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : calls.length === 0 ? (
        <EmptyState icon="📞" title="No calls logged" description="Start calling leads and log your calls to see them here" />
      ) : (
        <div className="card overflow-hidden">
          {/* Mobile & Tablet Cards */}
          <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
            {calls.map(call => (
              <div key={call._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/leads/${call.lead?._id}`} className="min-w-0 flex-1 hover:text-primary-400">
                    <p className="font-medium text-slate-200 truncate">{call.lead?.name}</p>
                    <p className="text-xs text-slate-500">{call.lead?.phone}</p>
                  </Link>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${OUTCOME_COLORS[call.outcome] || 'text-slate-400 bg-slate-700'}`}>
                    {call.outcome}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                  <span>By: <strong className="text-slate-300 font-medium">{call.calledBy?.name}</strong></span>
                  <span>{formatDateTime(call.callDate)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{call.duration || '—'}</span>
                </div>
                {call.notes && <p className="text-xs text-slate-400 italic">"{call.notes}"</p>}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Called By</th>
                  <th>Date & Time</th>
                  <th>Duration</th>
                  <th>Outcome</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {calls.map(call => (
                  <tr key={call._id}>
                    <td>
                      <Link to={`/leads/${call.lead?._id}`} className="hover:text-primary-400 transition-colors">
                        <p className="font-medium text-slate-200">{call.lead?.name}</p>
                        <p className="text-xs text-slate-500">{call.lead?.phone}</p>
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={call.calledBy?.name} size="sm" />
                        <span className="text-sm text-slate-300">{call.calledBy?.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-slate-400">{formatDateTime(call.callDate)}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        {call.duration || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${OUTCOME_COLORS[call.outcome] || 'text-slate-400 bg-slate-700'}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs text-slate-500 max-w-xs truncate">{call.notes || '—'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
