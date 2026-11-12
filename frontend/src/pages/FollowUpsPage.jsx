import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Calendar, Clock, CheckCircle2, AlertCircle, Phone, RotateCcw } from 'lucide-react'
import { followupsService } from '../services/followups.service'
import { StatusBadge } from '../components/ui/StatusBadge'
import { Avatar } from '../components/ui/Avatar'
import { Pagination } from '../components/ui/Pagination'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { formatDate, formatDateTime, isFollowUpOverdue } from '../utils/helpers'
import { FOLLOWUP_TYPES } from '../utils/constants'
import toast from 'react-hot-toast'

const TabButton = ({ active, onClick, children, count }) => (
  <button onClick={onClick} className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${active ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
    {children}
    {count !== undefined && <span className={`text-xs rounded-full px-1.5 py-0.5 ${active ? 'bg-white/20' : 'bg-slate-700'}`}>{count}</span>}
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
          <div className="divide-y divide-slate-800">
            {followUps.map(fu => {
              const isOverdue = fu.status === 'PENDING' && isFollowUpOverdue(fu.followUpDate)
              return (
                <div key={fu._id} className={`p-4 hover:bg-slate-800/30 transition-colors ${isOverdue ? 'bg-red-500/5' : ''}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${isOverdue ? 'bg-red-500/20' : 'bg-slate-800'}`}>
                      {FOLLOW_UP_STATUS_ICON[fu.status]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link to={`/leads/${fu.lead?._id}`} className="font-semibold text-slate-200 hover:text-primary-400 transition-colors">
                            {fu.lead?.name}
                          </Link>
                          {fu.lead?.companyName && <span className="text-slate-500 text-sm ml-2">· {fu.lead.companyName}</span>}
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                              {isOverdue ? '⚠ ' : ''}{formatDate(fu.followUpDate)}
                            </span>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">{fu.type}</span>
                            {fu.lead?.status && <StatusBadge status={fu.lead.status} />}
                          </div>
                          {fu.note && <p className="text-xs text-slate-500 mt-1.5 italic">"{fu.note}"</p>}
                        </div>
                        {fu.assignedTo && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Avatar name={fu.assignedTo.name} size="sm" />
                            <span className="text-xs text-slate-500 hidden sm:inline">{fu.assignedTo.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {fu.status === 'PENDING' && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {fu.lead?.phone && (
                          <a href={`tel:${fu.lead.phone}`} className="btn-icon text-emerald-400 hover:bg-emerald-500/10" title="Call">
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleComplete(fu._id)} className="btn-icon text-green-400 hover:bg-green-500/10" title="Complete">
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setRescheduleModal(fu)} className="btn-icon text-blue-400 hover:bg-blue-500/10" title="Reschedule">
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleMissed(fu._id)} className="btn-icon text-red-400 hover:bg-red-500/10" title="Mark Missed">
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
