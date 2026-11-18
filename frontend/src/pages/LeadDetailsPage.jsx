import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Phone, Mail, Globe, MapPin, Calendar, Edit, ArrowLeft, Building2, User,
  Clock, Tag, DollarSign, Send, Briefcase, ExternalLink, MessageSquare, Lock, UserCheck,
  Users, Plus, PhoneCall, Trash2
} from 'lucide-react'

const LinkedinIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
)
import { leadsService } from '../services/leads.service'
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge'
import { Avatar } from '../components/ui/Avatar'
import { ActivityTimeline } from '../components/leads/ActivityTimeline'
import { CallModal } from '../components/modals/CallModal'
import { FollowUpModal } from '../components/modals/FollowUpModal'
import { NoteModal } from '../components/modals/NoteModal'
import { StatusModal } from '../components/modals/StatusModal'
import { AssignModal } from '../components/modals/AssignModal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDate, formatDateTime, formatRelative, isFollowUpOverdue, isFollowUpToday, toLocalDatetimeInput, toUtcIsoString } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { useSocketEvent } from '../hooks/useSocketEvent'

const DetailItem = ({ icon: Icon, label, value, isLink, linkHref }) => {
  const displayValue = value && String(value).trim() !== '' ? String(value).trim() : '—'
  const hasValue = displayValue !== '—'

  return (
    <div className="flex items-start gap-3 p-3 bg-kb-cream-deep rounded-xl border border-kb-sand">
      {Icon && <Icon className="w-4 h-4 text-kb-umber mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-kb-muted font-medium uppercase tracking-wider">{label}</p>
        {hasValue && isLink ? (
          <a
            href={linkHref || displayValue}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-kb-strawberry hover:text-kb-strawberry-hover hover:underline flex items-center gap-1 mt-0.5 break-all"
          >
            {displayValue} <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : (
          <p className={`text-sm font-medium mt-0.5 break-words ${hasValue ? 'text-kb-cocoa' : 'text-kb-muted'}`}>
            {displayValue}
          </p>
        )}
      </div>
    </div>
  )
}

export const LeadDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canDelete, canAssign, canDeleteLead } = useAuth()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [modal, setModal] = useState(null)
  const [pocToDelete, setPocToDelete] = useState(null)
  const [editLastContactDate, setEditLastContactDate] = useState('')
  const [editTotalCallsCount, setEditTotalCallsCount] = useState(0)
  const [savingQuickMetric, setSavingQuickMetric] = useState(false)

  const fetchLead = async () => {
    try {
      const res = await leadsService.getById(id)
      const fetched = res.data.data
      setLead(fetched)
      if (fetched.canViewSalesSection !== false) {
        fetchActivities()
        fetchNotes()
      } else {
        setActivities([])
        setNotes([])
        setActiveTab('overview')
      }
    } catch {
      navigate('/leads')
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    setActivitiesLoading(true)
    try {
      const res = await leadsService.getActivities(id, { limit: 50 })
      setActivities(res.data.data)
    } catch {} finally {
      setActivitiesLoading(false)
    }
  }

  const fetchNotes = async () => {
    try {
      const res = await leadsService.getNotes(id)
      setNotes(res.data.data)
    } catch {}
  }

  useEffect(() => {
    fetchLead()
  }, [id])

  const handleModalSuccess = () => {
    fetchLead()
  }

  const openEditLastContact = () => {
    setEditLastContactDate(toLocalDatetimeInput(lead?.lastContactedAt))
    setModal('editLastContact')
  }

  const handleSaveLastContact = async (e) => {
    e.preventDefault()
    setSavingQuickMetric(true)
    try {
      const isoDate = editLastContactDate ? toUtcIsoString(editLastContactDate) : null
      await leadsService.update(id, { lastContactedAt: isoDate })
      toast.success(isoDate ? 'Last contact date updated!' : 'Last contact reset to Never')
      setModal(null)
      fetchLead()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update last contact')
    } finally {
      setSavingQuickMetric(false)
    }
  }

  const openEditTotalCalls = () => {
    setEditTotalCallsCount(lead?.totalCalls !== undefined ? lead.totalCalls : 0)
    setModal('editTotalCalls')
  }

  const handleSaveTotalCalls = async (e) => {
    e.preventDefault()
    setSavingQuickMetric(true)
    try {
      const calls = Math.max(0, parseInt(editTotalCallsCount, 10) || 0)
      await leadsService.update(id, { totalCalls: calls })
      toast.success('Total calls updated!')
      setModal(null)
      fetchLead()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update total calls')
    } finally {
      setSavingQuickMetric(false)
    }
  }

  const handleClearFollowUp = async () => {
    if (!window.confirm('Clear scheduled next follow-up?')) return
    try {
      await leadsService.update(id, { nextFollowUpAt: null })
      toast.success('Scheduled follow-up cleared!')
      fetchLead()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clear follow-up')
    }
  }

  useSocketEvent('lead_updated', handleModalSuccess)
  useSocketEvent('user_updated', handleModalSuccess)

  const handleDelete = async () => {
    try {
      await leadsService.delete(id)
      toast.success('Lead deleted')
      navigate('/leads')
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!lead) return null

  const canViewSales = lead.canViewSalesSection !== false
  const nextFollowUpOverdue = canViewSales && lead.nextFollowUpAt && isFollowUpOverdue(lead.nextFollowUpAt)
  const nextFollowUpToday = canViewSales && lead.nextFollowUpAt && isFollowUpToday(lead.nextFollowUpAt)

  const fullLocation = [lead.address, lead.city, lead.state, lead.country, lead.pincode].filter(Boolean).join(', ')

  const backUrl = (() => {
    const savedSearch = sessionStorage.getItem('crm_leads_search')
    if (savedSearch) return `/leads${savedSearch.startsWith('?') ? savedSearch : `?${savedSearch}`}`
    const savedPage = sessionStorage.getItem('crm_leads_page')
    if (savedPage && savedPage !== '1') return `/leads?page=${savedPage}`
    return '/leads'
  })()

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Bar: Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={backUrl} className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </Link>
        <div className="flex items-center gap-2">
          {canViewSales && (
            <Link to={`/leads/${id}/edit`} className="btn-secondary text-sm">
              <Edit className="w-4 h-4" />
              Edit Lead
            </Link>
          )}
          {(canDelete || canDeleteLead?.(lead)) && (
            <button onClick={() => setModal('delete')} className="btn-danger text-sm">
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* ========================================================
            LEFT COLUMN: KEY SUMMARY & QUICK ACTIONS
           ======================================================== */}
        <div className="xl:col-span-1 space-y-4">
          
          {/* Identity Card */}
          <div className="card p-5 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-13 h-13 bg-kb-cocoa rounded-2xl flex items-center justify-center text-kb-coral font-bold text-xl flex-shrink-0 border border-kb-espresso shadow-sm">
                {(lead.companyName || lead.name || 'L').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-kb-cocoa truncate">{lead.companyName || lead.name || 'Unnamed Lead'}</h1>
                <div className="flex items-center gap-1.5 flex-wrap text-sm text-kb-muted mt-1 truncate">
                  <User className="w-3.5 h-3.5 text-kb-umber flex-shrink-0" />
                  <span className="font-semibold text-kb-text">{lead.name || '—'}</span>
                  {lead.pocJobTitle && (
                    <span className="text-xs font-semibold text-kb-strawberry">({lead.pocJobTitle})</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-kb-sand">
              {canViewSales ? (
                <>
                  <StatusBadge status={lead.status} size="lg" />
                  <PriorityBadge priority={lead.priority} />
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs bg-kb-amber-bg text-kb-amber-fg font-medium px-2.5 py-1 rounded-full border border-kb-amber-border">
                  <Lock className="w-3 h-3" /> Client Info Only
                </span>
              )}
              {(lead.businessCategory || lead.businessType) && (
                <span className="text-xs bg-kb-cream-deep text-kb-cocoa font-medium px-2.5 py-1 rounded-full border border-kb-sand">
                  {lead.businessCategory || lead.businessType}
                </span>
              )}
            </div>

            {/* Quick Contact Buttons */}
            <div className="space-y-2 pt-2 border-t border-kb-sand">
              <a
                href={`tel:${lead.phone}`}
                className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors group"
              >
                <div className="w-8 h-8 bg-kb-teal-bg border border-kb-teal-border rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-kb-teal-fg" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-kb-muted">Primary Phone (POC)</p>
                  <p className="text-sm font-mono font-semibold text-kb-cocoa group-hover:text-kb-strawberry transition-colors truncate">
                    {lead.phone}
                  </p>
                </div>
              </a>

              {lead.alternatePhone && (
                <a
                  href={`tel:${lead.alternatePhone}`}
                  className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-kb-white border border-kb-sand rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-kb-umber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-kb-muted">Alt Phone / WhatsApp</p>
                    <p className="text-sm font-mono text-kb-cocoa truncate">{lead.alternatePhone}</p>
                  </div>
                </a>
              )}

              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 bg-kb-umber-bg border border-kb-umber-border rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-kb-umber-fg" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-kb-muted">Email Address</p>
                    <p className="text-sm text-kb-cocoa group-hover:text-kb-strawberry transition-colors truncate">
                      {lead.email}
                    </p>
                  </div>
                </a>
              )}

              {lead.pocLinkedIn && (
                <a
                  href={lead.pocLinkedIn.startsWith('http') ? lead.pocLinkedIn : `https://${lead.pocLinkedIn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 bg-kb-white border border-kb-sand rounded-lg flex items-center justify-center">
                    <LinkedinIcon className="w-4 h-4 text-kb-cocoa" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-kb-muted">POC LinkedIn</p>
                    <p className="text-sm text-kb-strawberry group-hover:underline flex items-center gap-1 truncate font-medium">
                      View LinkedIn Profile <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </p>
                  </div>
                </a>
              )}

              {lead.website && (
                <a
                  href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 bg-kb-white border border-kb-sand rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-kb-umber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-kb-muted">Company Website</p>
                    <p className="text-sm text-kb-strawberry group-hover:underline transition-colors truncate font-medium">
                      {lead.website}
                    </p>
                  </div>
                </a>
              )}

              {lead.companyEmail && (
                <a
                  href={`mailto:${lead.companyEmail}`}
                  className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 bg-kb-white border border-kb-sand rounded-lg flex items-center justify-center">
                    <Mail className="w-4 h-4 text-kb-umber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-kb-muted">Company / Business Email</p>
                    <p className="text-sm text-kb-strawberry group-hover:underline transition-colors truncate font-medium">
                      {lead.companyEmail}
                    </p>
                  </div>
                </a>
              )}

              {lead.companyPhone && (
                <a
                  href={`tel:${lead.companyPhone}`}
                  className="flex items-center gap-3 p-2.5 bg-kb-cream-deep hover:bg-kb-cream border border-kb-sand rounded-xl transition-colors group"
                >
                  <div className="w-8 h-8 bg-kb-white border border-kb-sand rounded-lg flex items-center justify-center">
                    <Phone className="w-4 h-4 text-kb-umber" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-kb-muted">Company / Business Phone</p>
                    <p className="text-sm font-mono text-kb-cocoa group-hover:text-kb-strawberry transition-colors truncate">
                      {lead.companyPhone}
                    </p>
                  </div>
                </a>
              )}
            </div>
          </div>

          {/* Ownership Snapshot (Creation / Primary Assign / Current Reassign) */}
          <div className="card p-4 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-kb-sand">
              <UserCheck className="w-4 h-4 text-kb-strawberry" />
              <h3 className="font-semibold text-sm text-kb-cocoa">Lead Ownership</h3>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-kb-muted">Created By</span>
              <span className="text-kb-cocoa font-medium">{lead.createdBy?.name || 'System'}</span>
            </div>
            {lead.assignedByName && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-kb-muted">Assigned By</span>
                <span className="text-kb-strawberry font-medium">{lead.assignedByName}</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2">
              <span className="text-kb-muted">Primary Assigned</span>
              <span className="text-kb-strawberry font-medium">
                {lead.primaryAssignedTo?.name || 'Not assigned yet'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-kb-muted">Current Assigned</span>
              <span className="text-kb-cocoa font-semibold">{lead.assignedTo?.name || 'Unassigned'}</span>
            </div>
            {lead.reassignedBy && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-kb-muted">Reassigned By</span>
                <span className="text-kb-amber-fg font-medium">{lead.reassignedBy.name}</span>
              </div>
            )}
          </div>

          {/* Company POCs & Contacts Card */}
          {lead.companyName && (
            <div className="card p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-kb-sand">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-kb-strawberry" />
                  <h3 className="font-semibold text-sm text-kb-cocoa">
                    Company Contacts ({lead.companyPocs?.length || 1})
                  </h3>
                </div>
                <Link
                  to={`/leads/new?company=${encodeURIComponent(lead.companyName)}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-kb-strawberry hover:text-kb-strawberry-hover hover:underline"
                  title="Add another POC for this company"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add POC</span>
                </Link>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {(lead.companyPocs && lead.companyPocs.length > 0 ? lead.companyPocs : [lead]).map((poc) => {
                  const isCurrent = poc._id === lead._id
                  return (
                    <div
                      key={poc._id}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-kb-strawberry-tint/60 border-kb-strawberry/40 shadow-xs'
                          : 'bg-kb-cream-deep/60 hover:bg-kb-cream border-kb-sand/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {isCurrent ? (
                              <span className="font-bold text-sm text-kb-cocoa truncate">{poc.name}</span>
                            ) : (
                              <Link
                                to={`/leads/${poc._id}`}
                                className="font-bold text-sm text-kb-cocoa hover:text-kb-strawberry hover:underline truncate"
                              >
                                {poc.name}
                              </Link>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-kb-strawberry text-white">
                                Current
                              </span>
                            )}
                          </div>
                          {poc.pocJobTitle && (
                            <p className="text-xs text-kb-muted mt-0.5 truncate">{poc.pocJobTitle}</p>
                          )}
                          {poc.phone && (
                            <p className="text-xs font-mono text-kb-text-muted mt-0.5 truncate">📞 {poc.phone}</p>
                          )}
                        </div>

                        {!isCurrent && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Link
                              to={`/leads/${poc._id}`}
                              className="btn-secondary text-[11px] py-1 px-2.5"
                            >
                              View
                            </Link>
                            {(canDelete || canDeleteLead?.(poc)) && (
                              <button
                                type="button"
                                onClick={() => setPocToDelete(poc)}
                                className="btn-ghost text-xs py-1 px-1.5 text-kb-crimson hover:bg-kb-lost-bg"
                                title="Delete this POC"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action Operations */}
          {canViewSales && (
            <div className="card p-4 space-y-2">
              <button onClick={() => setModal('call')} className="btn-primary w-full justify-center">
                📞 Log Call
              </button>
              <button onClick={() => setModal('note')} className="btn-secondary w-full justify-center">
                📝 Add Note
              </button>
              <button onClick={() => setModal('followup')} className="btn-secondary w-full justify-center">
                📅 Schedule Follow-up
              </button>
              <button onClick={() => setModal('status')} className="btn-secondary w-full justify-center">
                🔄 Change Status
              </button>
              {canAssign && (
                <button onClick={() => setModal('assign')} className="btn-secondary w-full justify-center">
                  {lead.primaryAssignedTo ? '👤 Reassign Lead' : '👤 Primary Assign Lead'}
                </button>
              )}
            </div>
          )}

          {/* Follow-up Reminder Card */}
          {canViewSales && lead.nextFollowUpAt && (
            <div
              className={`card p-4 border ${
                nextFollowUpOverdue
                  ? 'border-kb-lost-border bg-kb-lost-bg'
                  : nextFollowUpToday
                  ? 'border-kb-amber-border bg-kb-amber-bg'
                  : 'border-kb-sand'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <Calendar
                    className={`w-4 h-4 ${
                      nextFollowUpOverdue ? 'text-kb-crimson' : nextFollowUpToday ? 'text-kb-amber-fg' : 'text-kb-umber'
                    }`}
                  />
                  <h3 className="font-semibold text-sm text-kb-cocoa">Next Follow-up</h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setModal('followup')}
                    className="text-kb-strawberry hover:underline font-semibold"
                    title="Reschedule follow-up"
                  >
                    ✏️ Edit
                  </button>
                  <span className="text-kb-sand">|</span>
                  <button
                    type="button"
                    onClick={handleClearFollowUp}
                    className="text-kb-muted hover:text-kb-crimson font-medium"
                    title="Clear follow-up"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <p
                className={`text-base font-bold ${
                  nextFollowUpOverdue ? 'text-kb-crimson' : nextFollowUpToday ? 'text-kb-amber-fg' : 'text-kb-cocoa'
                }`}
              >
                {nextFollowUpOverdue ? '⚠ Overdue — ' : nextFollowUpToday ? '📅 Today — ' : ''}
                {formatDateTime(lead.nextFollowUpAt)}
              </p>
              <p className="text-xs text-kb-muted mt-1">{formatRelative(lead.nextFollowUpAt)}</p>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {canViewSales && (
              <>
                <div className="bg-kb-cream-deep rounded-xl p-2.5 border border-kb-sand flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-kb-muted text-xs">📞 Total Calls</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={openEditTotalCalls}
                        className="text-[10px] text-kb-muted hover:text-kb-cocoa hover:underline font-semibold"
                        title="Edit call count directly"
                      >
                        ✏️ Edit
                      </button>
                      <span className="text-kb-sand">·</span>
                      <button
                        type="button"
                        onClick={() => setModal('call')}
                        className="text-[10px] text-kb-strawberry hover:underline font-semibold"
                        title="Log a new call"
                      >
                        + Log Call
                      </button>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-kb-cocoa mt-0.5">
                    {lead.totalCalls || 0}
                    <span className="text-xs font-normal text-kb-muted ml-1">
                      {(lead.totalCalls || 0) === 1 ? 'call' : 'calls'}
                    </span>
                  </p>
                </div>
                <div className="bg-kb-cream-deep rounded-xl p-2.5 border border-kb-sand flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <p className="text-kb-muted text-xs">🕒 Last Contact</p>
                    <button
                      type="button"
                      onClick={openEditLastContact}
                      className="text-[10px] text-kb-strawberry hover:underline font-semibold"
                      title="Edit last contact date"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-kb-cocoa mt-0.5">
                    {lead.lastContactedAt ? formatRelative(lead.lastContactedAt) : 'Never'}
                  </p>
                  {lead.lastContactedAt && (
                    <p className="text-[10px] text-kb-muted mt-0.5 truncate" title={formatDateTime(lead.lastContactedAt)}>
                      {formatDate(lead.lastContactedAt)}
                    </p>
                  )}
                </div>
              </>
            )}
            <div className="bg-kb-cream-deep rounded-xl p-2.5 border border-kb-sand">
              <p className="text-kb-muted text-xs">🗓️ Created</p>
              <p className="text-sm font-semibold text-kb-cocoa mt-0.5">{formatDate(lead.createdAt)}</p>
            </div>
            <div className="bg-kb-cream-deep rounded-xl p-2.5 border border-kb-sand">
              <p className="text-kb-muted text-xs">✏️ Updated</p>
              <p className="text-sm font-semibold text-kb-cocoa mt-0.5">{formatRelative(lead.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: TABBED DETAILED SECTIONS & TIMELINE
           ======================================================== */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Navigation Tabs */}
          <div className="card">
            <div className="flex border-b border-kb-sand overflow-x-auto">
              {(canViewSales
                ? [
                    { key: 'overview', label: 'Lead Overview' },
                    { key: 'activity', label: 'Activity Timeline', count: activities.length },
                    { key: 'notes', label: 'Notes', count: notes.length },
                  ]
                : [{ key: 'overview', label: 'Client & Lead Info' }]
              ).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab.key
                      ? 'border-kb-strawberry text-kb-strawberry bg-kb-cream'
                      : 'border-transparent text-kb-muted hover:text-kb-cocoa'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="text-xs bg-kb-cream-deep text-kb-cocoa px-2 py-0.5 rounded-full font-bold border border-kb-sand">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-5">
              
              {/* TAB 1: STRUCTURED OVERVIEW (4 REQUESTED SECTIONS) */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  
                  {/* SECTION 1: PROSPECTIVE BUSINESS INFORMATION */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-kb-sand">
                      <Building2 className="w-4 h-4 text-kb-strawberry" />
                      <h3 className="text-sm font-bold text-kb-cocoa uppercase tracking-wider">
                        1. Prospective Business Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem icon={Building2} label="Company / Business Name" value={lead.companyName} />
                      <DetailItem
                        icon={Globe}
                        label="Website"
                        value={lead.website}
                        isLink
                        linkHref={lead.website?.startsWith('http') ? lead.website : `https://${lead.website}`}
                      />
                      <DetailItem
                        icon={Mail}
                        label="Company / Business Email"
                        value={lead.companyEmail}
                        isLink
                        linkHref={lead.companyEmail ? `mailto:${lead.companyEmail}` : null}
                      />
                      <DetailItem
                        icon={Phone}
                        label="Company / Business Phone"
                        value={lead.companyPhone}
                        isLink={!!lead.companyPhone}
                        linkHref={lead.companyPhone ? `tel:${lead.companyPhone}` : null}
                      />
                      <DetailItem
                        icon={Tag}
                        label="Business Category"
                        value={lead.businessCategory || lead.businessType}
                      />
                      <DetailItem
                        icon={Tag}
                        label="Business Sub-Category"
                        value={lead.businessSubCategory}
                      />
                      <DetailItem icon={MapPin} label="Full Address & Location" value={fullLocation} />
                    </div>

                    <div className="p-4 bg-kb-cream-deep rounded-xl border border-kb-sand">
                      <p className="text-xs font-semibold text-kb-muted uppercase tracking-wider mb-1">
                        About the Business / Description
                      </p>
                      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${lead.businessDescription ? 'text-kb-text' : 'text-kb-muted'}`}>
                        {lead.businessDescription || '—'}
                      </p>
                    </div>
                  </div>

                  {/* SECTION 2: POINT OF CONTACT (POC) DETAILS */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-kb-sand">
                      <User className="w-4 h-4 text-kb-strawberry" />
                      <h3 className="text-sm font-bold text-kb-cocoa uppercase tracking-wider">
                        2. Point of Contact (POC) Details
                      </h3>
                    </div>

                    {lead.companyPocs && lead.companyPocs.length > 1 && (
                      <div className="p-3 bg-kb-cream-deep rounded-xl border border-kb-sand flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-semibold text-kb-cocoa">Switch POC:</span>
                          {lead.companyPocs.map((poc) => {
                            const isCurrent = poc._id === lead._id
                            return isCurrent ? (
                              <span
                                key={poc._id}
                                className="px-2.5 py-1 rounded-full text-xs font-bold bg-kb-strawberry text-white shadow-xs"
                              >
                                {poc.name} {poc.pocJobTitle ? `(${poc.pocJobTitle})` : ''}
                              </span>
                            ) : (
                              <Link
                                key={poc._id}
                                to={`/leads/${poc._id}`}
                                className="px-2.5 py-1 rounded-full text-xs font-medium bg-kb-white hover:bg-kb-cream text-kb-cocoa border border-kb-sand hover:border-kb-strawberry transition-colors"
                              >
                                {poc.name} {poc.pocJobTitle ? `(${poc.pocJobTitle})` : ''}
                              </Link>
                            )
                          })}
                        </div>
                        <Link
                          to={`/leads/new?company=${encodeURIComponent(lead.companyName)}`}
                          className="text-xs font-semibold text-kb-strawberry hover:underline inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Another POC
                        </Link>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem icon={User} label="POC Full Name" value={lead.name} />
                      <DetailItem icon={Briefcase} label="Job Title / Designation" value={lead.pocJobTitle} />
                      <DetailItem icon={Phone} label="Primary Phone" value={lead.phone} />
                      <DetailItem icon={Phone} label="Alternate Phone / WhatsApp" value={lead.alternatePhone} />
                      <DetailItem icon={Mail} label="Email Address" value={lead.email} />
                      <DetailItem
                        icon={LinkedinIcon}
                        label="LinkedIn Profile"
                        value={lead.pocLinkedIn}
                        isLink
                        linkHref={lead.pocLinkedIn?.startsWith('http') ? lead.pocLinkedIn : `https://${lead.pocLinkedIn}`}
                      />
                    </div>

                    {/* Notes About Talk with POC */}
                    <div className={`p-4 rounded-xl border ${lead.pocTalkNotes ? 'bg-kb-strawberry-tint border-kb-lost-border' : 'bg-kb-cream-deep border-kb-sand'}`}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <MessageSquare className={`w-4 h-4 ${lead.pocTalkNotes ? 'text-kb-strawberry' : 'text-kb-muted'}`} />
                        <p className={`text-xs font-bold uppercase tracking-wider ${lead.pocTalkNotes ? 'text-kb-crimson' : 'text-kb-muted'}`}>
                          Notes About Talk / Conversation with POC
                        </p>
                      </div>
                      {lead.pocTalkNotes ? (
                        <p className="text-sm text-kb-cocoa leading-relaxed whitespace-pre-wrap">
                          {lead.pocTalkNotes}
                        </p>
                      ) : (
                        <p className="text-sm text-kb-muted">
                          —
                          {canViewSales && (
                            <Link to={`/leads/${id}/edit`} className="text-xs text-kb-strawberry hover:underline ml-2 inline-block font-medium">
                              + Add conversation notes
                            </Link>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SECTION 3: TYPE OF REACH */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-kb-sand">
                      <Send className="w-4 h-4 text-kb-strawberry" />
                      <h3 className="text-sm font-bold text-kb-cocoa uppercase tracking-wider">
                        3. Type of Reach
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <DetailItem
                        icon={Send}
                        label="Outreach Channel / Type of Reach"
                        value={lead.typeOfReach || lead.source || 'Cold Call'}
                      />
                      <DetailItem
                        icon={Tag}
                        label="Reach Campaign / Channel Details"
                        value={lead.reachNotes}
                      />
                    </div>
                  </div>

                  {/* SECTION 4: SALES & ENGAGEMENT DETAILS */}
                  {canViewSales ? (
                    <>
                      <div className="space-y-3 pt-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-kb-sand">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-kb-strawberry" />
                            <h3 className="text-sm font-bold text-kb-cocoa uppercase tracking-wider">
                              4. Sales & Engagement Details
                            </h3>
                          </div>
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => setModal('assign')}
                              className="text-xs text-kb-strawberry hover:text-kb-strawberry-hover font-semibold"
                            >
                              {lead.primaryAssignedTo ? 'Reassign Lead →' : 'Primary Assign →'}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <DetailItem icon={Tag} label="Pipeline Status" value={lead.status} />
                          <DetailItem icon={Tag} label="Priority" value={lead.priority} />
                          <DetailItem icon={DollarSign} label="Interested In" value={lead.interestedIn} />
                          <DetailItem icon={DollarSign} label="Estimated Budget" value={lead.estimatedBudget} />
                          <DetailItem
                            icon={User}
                            label="Created By"
                            value={lead.createdBy?.name || 'System'}
                          />
                          <DetailItem
                            icon={UserCheck}
                            label="Primary Assigned To"
                            value={
                              lead.primaryAssignedTo?.name
                                ? `${lead.primaryAssignedTo.name}${lead.primaryAssignedAt ? ` (${formatDate(lead.primaryAssignedAt)})` : ''}`
                                : 'Not assigned yet'
                            }
                          />
                          <DetailItem
                            icon={User}
                            label="Currently Assigned / Reassigned To"
                            value={lead.assignedTo?.name || 'Unassigned'}
                          />
                          <DetailItem
                            icon={Calendar}
                            label="Next Scheduled Follow-up"
                            value={lead.nextFollowUpAt ? formatDateTime(lead.nextFollowUpAt) : 'None scheduled'}
                          />
                          <DetailItem
                            icon={PhoneCall}
                            label="Total Calls Made / Logged"
                            value={`${lead.totalCalls || 0} ${(lead.totalCalls || 0) === 1 ? 'call' : 'calls'}`}
                          />
                        </div>

                        {lead.assignmentHistory?.length > 0 && (
                          <div className="p-3.5 bg-kb-cream-deep rounded-xl border border-kb-sand space-y-2">
                            <p className="text-xs font-semibold text-kb-muted uppercase tracking-wider">
                              Assignment Trail (Creation → Primary → Reassign)
                            </p>
                            <div className="space-y-1.5">
                              {lead.assignmentHistory.map((item, idx) => (
                                <div key={idx} className="flex flex-wrap items-center justify-between gap-2 text-xs text-kb-text">
                                  <span>
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1.5 ${
                                      item.type === 'PRIMARY'
                                        ? 'bg-kb-strawberry-tint text-kb-crimson border border-kb-lost-border'
                                        : 'bg-kb-amber-bg text-kb-amber-fg border border-kb-amber-border'
                                    }`}>
                                      {item.type}
                                    </span>
                                    {item.assignedTo?.name || 'Executive'}
                                    {item.assignedBy?.name ? ` (by ${item.assignedBy.name})` : ''}
                                    {item.note ? ` — "${item.note}"` : ''}
                                  </span>
                                  <span className="text-kb-muted">{formatDateTime(item.assignedAt)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="p-4 bg-kb-cream-deep rounded-xl border border-kb-sand">
                          <p className="text-xs font-semibold text-kb-muted uppercase tracking-wider mb-1">
                            General / Internal Notes
                          </p>
                          <p className={`text-sm leading-relaxed whitespace-pre-wrap ${lead.notes ? 'text-kb-text' : 'text-kb-muted'}`}>
                            {lead.notes || '—'}
                          </p>
                        </div>
                      </div>

                      {/* Conversion Details (if converted) */}
                      {lead.status === 'CONVERTED' && lead.convertedAt && (
                        <div className="p-4 border border-kb-won-border bg-kb-won-bg rounded-xl">
                          <p className="text-kb-won-fg font-bold text-sm mb-1">🎉 Lead Converted</p>
                          <p className="text-xs text-kb-cocoa">Converted on {formatDate(lead.convertedAt)}</p>
                          {lead.finalService && <p className="text-xs text-kb-cocoa mt-1">Service: {lead.finalService}</p>}
                          {lead.finalBudget && <p className="text-xs text-kb-cocoa mt-1">Budget: {lead.finalBudget}</p>}
                          {lead.conversionNotes && <p className="text-xs text-kb-muted mt-1.5 italic">"{lead.conversionNotes}"</p>}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-5 rounded-xl border border-kb-amber-border bg-kb-amber-bg space-y-2 mt-2">
                      <div className="flex items-center gap-2 text-kb-amber-fg font-semibold text-sm">
                        <Lock className="w-4 h-4" />
                        <span>4. Sales &amp; Engagement Details (Restricted)</span>
                      </div>
                      <p className="text-xs text-kb-text leading-relaxed">
                        Client &amp; Lead Info (Sections 1–3) is shared across the sales team. Sales pipeline, budget,
                        follow-ups, call logs, and internal notes are visible only to the assigned Sales Executive
                        {lead.assignedTo?.name ? ` (${lead.assignedTo.name})` : ''} and Managers/Admins.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ACTIVITY TIMELINE */}
              {activeTab === 'activity' && (
                <ActivityTimeline activities={activities} loading={activitiesLoading} />
              )}

              {/* TAB 3: NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <div className="flex justify-end mb-2">
                    <button onClick={() => setModal('note')} className="btn-primary text-xs py-1.5 px-3">
                      + Add New Note
                    </button>
                  </div>
                  {notes.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-kb-muted text-sm">No notes recorded yet</p>
                      <button onClick={() => setModal('note')} className="btn-secondary text-sm mt-3">
                        Add First Note
                      </button>
                    </div>
                  ) : (
                    notes.map(note => (
                      <div key={note._id} className="p-4 bg-kb-cream-deep rounded-xl border border-kb-sand">
                        <p className="text-kb-cocoa text-sm leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-kb-sand">
                          <Avatar name={note.createdBy?.name} size="xs" />
                          <span className="text-xs text-kb-text font-medium">{note.createdBy?.name}</span>
                          <span className="text-xs text-kb-taupe">•</span>
                          <span className="text-xs text-kb-muted">{formatDateTime(note.createdAt)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CallModal isOpen={modal === 'call'} onClose={() => setModal(null)} lead={lead} onSuccess={handleModalSuccess} />
      <FollowUpModal isOpen={modal === 'followup'} onClose={() => setModal(null)} lead={lead} onSuccess={handleModalSuccess} />
      <NoteModal isOpen={modal === 'note'} onClose={() => setModal(null)} lead={lead} onSuccess={handleModalSuccess} />
      <StatusModal isOpen={modal === 'status'} onClose={() => setModal(null)} lead={lead} onSuccess={handleModalSuccess} />
      <AssignModal isOpen={modal === 'assign'} onClose={() => setModal(null)} lead={lead} onSuccess={handleModalSuccess} />
      <ConfirmDialog
        isOpen={modal === 'delete'}
        onClose={() => setModal(null)}
        onConfirm={handleDelete}
        title="Delete Lead"
        message={`Are you sure you want to delete "${lead.name}"? This action cannot be undone.`}
        confirmText="Delete Lead"
      />

      {/* Edit Last Contact Date Modal */}
      <Modal
        isOpen={modal === 'editLastContact'}
        onClose={() => setModal(null)}
        title="🕒 Edit Last Contact Date & Time"
        size="sm"
      >
        <form onSubmit={handleSaveLastContact} className="space-y-4">
          <div>
            <label className="label">Last Contact Date & Time</label>
            <input
              type="datetime-local"
              className="input w-full"
              value={editLastContactDate}
              onChange={e => setEditLastContactDate(e.target.value)}
            />
            <p className="text-[11px] text-kb-muted mt-1">
              Select when you last communicated with this lead.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditLastContactDate(toLocalDatetimeInput(new Date()))}
              className="btn-secondary text-xs py-1 px-2.5 flex-1"
            >
              Set to Now
            </button>
            <button
              type="button"
              onClick={() => setEditLastContactDate('')}
              className="btn-ghost text-xs py-1 px-2.5 text-kb-crimson hover:bg-kb-lost-bg flex-1"
            >
              Clear (Never)
            </button>
          </div>

          <div className="flex gap-2 pt-3 border-t border-kb-sand">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={savingQuickMetric} className="btn-primary flex-1 text-sm">
              {savingQuickMetric ? 'Saving...' : '💾 Save Date'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Total Calls Count Modal */}
      <Modal
        isOpen={modal === 'editTotalCalls'}
        onClose={() => setModal(null)}
        title="📞 Edit Total Calls Count"
        size="sm"
      >
        <form onSubmit={handleSaveTotalCalls} className="space-y-4">
          <div>
            <label className="label">Total Calls Made / Logged</label>
            <input
              type="number"
              min="0"
              className="input w-full"
              value={editTotalCallsCount}
              onChange={e => setEditTotalCallsCount(e.target.value)}
              placeholder="0"
              required
            />
            <p className="text-[11px] text-kb-muted mt-1">
              Independent counter for calls. Updating this will not touch follow-up or contact history.
            </p>
          </div>

          <div className="flex gap-2 pt-3 border-t border-kb-sand">
            <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={savingQuickMetric} className="btn-primary flex-1 text-sm">
              {savingQuickMetric ? 'Saving...' : '💾 Save Count'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete POC Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(pocToDelete)}
        onClose={() => setPocToDelete(null)}
        onConfirm={async () => {
          if (!pocToDelete) return
          try {
            await leadsService.delete(pocToDelete._id)
            toast.success(`POC "${pocToDelete.name}" moved to trash`)
            setPocToDelete(null)
            fetchLead()
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to delete POC')
          }
        }}
        title="Delete POC"
        message={`Are you sure you want to delete POC "${pocToDelete?.name}"? This contact will be moved to the Deleted Leads archive.`}
        confirmText="Delete POC"
      />
    </div>
  )
}
