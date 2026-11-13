import { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { CheckCircle2, AlertCircle, Phone, RotateCcw } from 'lucide-react'
import { followupsService } from '../services/followups.service'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Avatar } from '../components/ui/Avatar'
import { Pagination } from '../components/ui/Pagination'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { formatDate, isFollowUpOverdue } from '../utils/helpers'
import toast from 'react-hot-toast'

const TabButton = ({ active, onClick, children, count }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
      active
        ? 'bg-kb-strawberry text-kb-white'
        : 'bg-kb-white border border-kb-sand text-kb-muted hover:text-kb-cocoa hover:bg-kb-cream-deep'
    }`}
  >
    {children}
    {count !== undefined && (
      <span
        className={`text-xs rounded-full px-1.5 py-0.5 ${active ? 'text-kb-white' : 'bg-kb-cream-deep text-kb-cocoa'}`}
        style={active ? { backgroundColor: 'var(--kb-white-soft)' } : undefined}
      >
        {count}
      </span>
    )}
  </button>
)

export const FollowUpsPage = () => {
  const { search: searchParams } = useLocation()
  const params = new URLSearchParams(searchParams)
  const [range, setRange] = useState(params.get('range') || 'today')
  const [followUps, setFollowUps] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [rescheduleModal, setRescheduleModal] = useState(null)
  const [newDate, setNewDate] = useState('')
  const [rescheduleNote, setRescheduleNote] = useState('')

  const fetchFollowUps = useCallback(async () => {
    setLoading(true)
    try {
      const res = await followupsService.getAll({ range, page, limit: 20 })
      setFollowUps(res.data.data)
      setPagination(res.data.pagination)
    } catch {} finally {
      setLoading(false)
    }
  }, [range, page])

  useEffect(() => {
    const p = new URLSearchParams(searchParams)
    setRange(p.get('range') || 'today')
    setPage(1)
  }, [searchParams])

  useEffect(() => { fetchFollowUps() }, [fetchFollowUps])

  const handleComplete = async (id) => {
    try {
      await followupsService.update(id, { status: 'COMPLETED' })
      toast.success('Follow-up completed!')
      fetchFollowUps()
    } catch {}
  }

  const handleMissed = async (id) => {
    try {
      await followupsService.update(id, { status: 'MISSED' })
      toast.success('Marked as missed')
      fetchFollowUps()
    } catch {}
  }

  const handleReschedule = async () => {
    if (!newDate) { toast.error('Select a new date'); return }
    try {
      await followupsService.update(rescheduleModal._id, { followUpDate: newDate, rescheduleNote })
      toast.success('Follow-up rescheduled!')
      setRescheduleModal(null)
      setNewDate('')
      setRescheduleNote('')
      fetchFollowUps()
    } catch {}
  }

  const FOLLOW_UP_STATUS_ICON = { PENDING: '⏳', COMPLETED: '✅', MISSED: '❌', CANCELLED: '🚫' }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Follow-ups</h1>
        <p className="text-muted mt-1">Track and manage your follow-up schedule</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabButton active={range === 'today'} onClick={() => { setRange('today'); setPage(1) }}>📅 Today</TabButton>
        <TabButton active={range === 'overdue'} onClick={() => { setRange('overdue'); setPage(1) }}>⚠ Overdue</TabButton>
        <TabButton active={range === 'upcoming'} onClick={() => { setRange('upcoming'); setPage(1) }}>🗓 Upcoming</TabButton>
        <TabButton active={range === 'all'} onClick={() => { setRange('all'); setPage(1) }}>All</TabButton>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : followUps.length === 0 ? (
        <EmptyState
          icon={range === 'overdue' ? '⚠' : '📅'}
          title={range === 'today' ? "No follow-ups for today" : range === 'overdue' ? "No overdue follow-ups" : "No follow-ups found"}
          description="Great job staying on top of your follow-ups!"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-kb-sand">
            {followUps.map(fu => {
              const isOverdue = fu.status === 'PENDING' && isFollowUpOverdue(fu.followUpDate)
              return (
                <div key={fu._id} className={`p-4 hover:bg-kb-cream-deep transition-colors ${isOverdue ? 'bg-kb-lost-bg' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border ${isOverdue ? 'bg-kb-white border-kb-lost-border' : 'bg-kb-cream-deep border-kb-sand'}`}>
                      {FOLLOW_UP_STATUS_ICON[fu.status]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/leads/${fu.lead?._id}`} className="font-semibold text-kb-cocoa hover:text-kb-strawberry transition-colors">
                            {fu.lead?.companyName || fu.lead?.name}
                          </Link>
                          {fu.lead?.companyName && <span className="text-kb-muted text-sm ml-2">· {fu.lead?.name}</span>}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`text-xs font-medium ${isOverdue ? 'text-kb-crimson' : 'text-kb-muted'}`}>
                              {isOverdue ? '⚠ ' : ''}{formatDate(fu.followUpDate)}
                            </span>
                            <span className="text-xs bg-kb-cream-deep border border-kb-sand text-kb-cocoa px-2 py-0.5 rounded-full">{fu.type}</span>
                            {fu.lead?.status && <StatusBadge status={fu.lead.status} />}
                          </div>
                          {fu.note && <p className="text-xs text-kb-muted mt-1.5 italic">"{fu.note}"</p>}
                        </div>
                        {fu.assignedTo && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Avatar name={fu.assignedTo.name} size="sm" />
                            <span className="text-xs text-kb-muted hidden sm:inline">{fu.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {fu.status === 'PENDING' && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {fu.lead?.phone && (
                          <a href={`tel:${fu.lead.phone}`} className="btn-icon text-kb-teal-fg hover:bg-kb-teal-bg" title="Call">
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleComplete(fu._id)} className="btn-icon text-kb-won-fg hover:bg-kb-won-bg" title="Complete">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRescheduleModal(fu)} className="btn-icon text-kb-amber-fg hover:bg-kb-amber-bg" title="Reschedule">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleMissed(fu._id)} className="btn-icon text-kb-crimson hover:bg-kb-lost-bg" title="Mark Missed">
                          <AlertCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal isOpen={!!rescheduleModal} onClose={() => setRescheduleModal(null)} title="🔁 Reschedule Follow-up" size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">New Date & Time</label>
            <input type="datetime-local" className="input" value={newDate} onChange={e => setNewDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Reason (Optional)</label>
            <input type="text" className="input" placeholder="Why rescheduling?" value={rescheduleNote} onChange={e => setRescheduleNote(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRescheduleModal(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleReschedule} className="btn-primary flex-1">Reschedule</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
