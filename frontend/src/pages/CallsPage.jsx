import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { callsService } from '../services/calls.service'
import { Avatar } from '../components/ui/Avatar'
import { Pagination } from '../components/ui/Pagination'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { formatDateTime } from '../utils/helpers'

const OUTCOME_COLORS = {
  Connected: 'bg-kb-won-bg text-kb-won-fg border border-kb-won-border',
  'No Answer': 'bg-kb-cold-bg text-kb-cold-fg border border-kb-cold-border',
  Busy: 'bg-kb-amber-bg text-kb-amber-fg border border-kb-amber-border',
  'Call Back Requested': 'bg-kb-umber-bg text-kb-umber-fg border border-kb-umber-border',
  Interested: 'bg-kb-teal-bg text-kb-teal-fg border border-kb-teal-border',
  'Not Interested': 'bg-kb-lost-bg text-kb-lost-fg border border-kb-lost-border',
  'Wrong Number': 'bg-kb-cold-bg text-kb-cold-fg border border-kb-cold-border',
  Converted: 'bg-kb-won-bg text-kb-won-fg border border-kb-won-border',
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
              <div key={call._id} className="p-4 rounded-xl bg-kb-cream-deep border border-kb-sand space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/leads/${call.lead?._id}`} className="min-w-0 flex-1 group">
                    <p className="font-medium text-kb-cocoa group-hover:text-kb-strawberry transition-colors truncate">{call.lead?.name}</p>
                    <p className="text-xs text-kb-muted">{call.lead?.phone}</p>
                  </Link>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 whitespace-nowrap ${OUTCOME_COLORS[call.outcome] || 'bg-kb-cold-bg text-kb-cold-fg border border-kb-cold-border'}`}>
                    {call.outcome}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-kb-muted">
                  <span>By: <strong className="text-kb-cocoa font-medium">{call.calledBy?.name}</strong></span>
                  <span>{formatDateTime(call.callDate)}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{call.duration || '—'}</span>
                </div>
                {call.notes && <p className="text-xs text-kb-text italic">"{call.notes}"</p>}
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block table-container border-0 rounded-none">
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
                      <Link to={`/leads/${call.lead?._id}`} className="group transition-colors">
                        <p className="font-medium text-kb-cocoa group-hover:text-kb-strawberry transition-colors">{call.lead?.name}</p>
                        <p className="text-xs text-kb-muted">{call.lead?.phone}</p>
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Avatar name={call.calledBy?.name} size="sm" />
                        <span className="text-sm text-kb-text">{call.calledBy?.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-kb-muted">{formatDateTime(call.callDate)}</td>
                    <td>
                      <span className="flex items-center gap-1 text-sm text-kb-muted">
                        <Clock className="w-3 h-3" />
                        {call.duration || '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${OUTCOME_COLORS[call.outcome] || 'bg-kb-cold-bg text-kb-cold-fg border border-kb-cold-border'}`}>
                        {call.outcome}
                      </span>
                    </td>
                    <td>
                      <p className="text-xs text-kb-muted max-w-xs truncate">{call.notes || '—'}</p>
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
