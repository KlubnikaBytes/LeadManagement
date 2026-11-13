import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  Phone, Mail, Globe, MapPin, Calendar, Edit, ArrowLeft, Building2, User,
  Clock, Tag, DollarSign, Send, Briefcase, ExternalLink, MessageSquare, Lock, UserCheck
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
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDate, formatDateTime, formatRelative, isFollowUpOverdue, isFollowUpToday } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { useSocketEvent } from '../hooks/useSocketEvent'

const DetailItem = ({ icon: Icon, label, value, isLink, linkHref }) => {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 p-3 bg-kb-cream-deep rounded-xl border border-kb-sand">
      {Icon && <Icon className="w-4 h-4 text-kb-umber mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-kb-muted font-medium uppercase tracking-wider">{label}</p>
        {isLink ? (
          <a
            href={linkHref || value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-kb-strawberry hover:text-kb-strawberry-hover hover:underline flex items-center gap-1 mt-0.5 break-all"
          >
            {value} <ExternalLink className="w-3 h-3 flex-shrink-0" />
          </a>
        ) : (
          <p className="text-sm font-medium text-kb-cocoa mt-0.5 break-words">{value}</p>
        )}
      </div>
    </div>
  )
}

export const LeadDetailsPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { canDelete, canAssign } = useAuth()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [activitiesLoading, setActivitiesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [modal, setModal] = useState(null)

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

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* Top Bar: Back & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/leads" className="btn-ghost text-sm">
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
          {canDelete && (
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
                {(lead.companyName || lead.name).charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-kb-cocoa truncate">{lead.companyName || lead.name}</h1>
                <div className="flex items-center gap-1.5 flex-wrap text-sm text-kb-muted mt-1 truncate">
                  <User className="w-3.5 h-3.5 text-kb-umber flex-shrink-0" />
                  <span className="font-semibold text-kb-text">{lead.name}</span>
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
              <div className="flex items-center gap-2 mb-1.5">
                <Calendar
                  className={`w-4 h-4 ${
                    nextFollowUpOverdue ? 'text-kb-crimson' : nextFollowUpToday ? 'text-kb-amber-fg' : 'text-kb-umber'
                  }`}
                />
                <h3 className="font-semibold text-sm text-kb-cocoa">Next Follow-up</h3>
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
                <div className="bg-kb-cream-deep rounded-xl p-2.5 border border-kb-sand">
                  <p className="text-kb-muted text-xs">📞 Total Calls</p>
                  <p className="text-sm font-bold text-kb-cocoa mt-0.5">{lead.totalCalls}</p>
                </div>
                <div className="bg-kb-cream-deep rounded-xl p-2.5 border border-kb-sand">
                  <p className="text-kb-muted text-xs">🕒 Last Contact</p>
                  <p className="text-sm font-semibold text-kb-cocoa mt-0.5">
                    {lead.lastContactedAt ? formatRelative(lead.lastContactedAt) : 'Never'}
                  </p>
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
                        icon={Tag}
                        label="Business Category"
                        value={lead.businessCategory || lead.businessType}
                      />
                      <DetailItem
                        icon={Tag}
                        label="Business Sub-Category"
                        value={lead.businessSubCategory}
                      />
                    </div>

                    {fullLocation && (
                      <DetailItem icon={MapPin} label="Full Address & Location" value={fullLocation} />
                    )}

                    {lead.businessDescription && (
                      <div className="p-4 bg-kb-cream-deep rounded-xl border border-kb-sand">
                        <p className="text-xs font-semibold text-kb-muted uppercase tracking-wider mb-1">
                          About the Business
                        </p>
                        <p className="text-sm text-kb-text leading-relaxed whitespace-pre-wrap">
                          {lead.businessDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: POINT OF CONTACT (POC) DETAILS */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-2 pb-2 border-b border-kb-sand">
                      <User className="w-4 h-4 text-kb-strawberry" />
                      <h3 className="text-sm font-bold text-kb-cocoa uppercase tracking-wider">
                        2. Point of Contact (POC) Details
                      </h3>
                    </div>

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
                    {lead.pocTalkNotes ? (
                      <div className="p-4 bg-kb-strawberry-tint rounded-xl border border-kb-lost-border">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="w-4 h-4 text-kb-strawberry" />
                          <p className="text-xs font-bold text-kb-crimson uppercase tracking-wider">
                            Notes About Talk / Conversation with POC
                          </p>
                        </div>
                        <p className="text-sm text-kb-cocoa leading-relaxed whitespace-pre-wrap">
                          {lead.pocTalkNotes}
                        </p>
                      </div>
                    ) : (
                      <div className="p-4 bg-kb-cream rounded-xl border border-dashed border-kb-sand text-center">
                        <p className="text-xs text-kb-muted">No specific conversation notes recorded with POC yet.</p>
                        {canViewSales && (
                          <Link to={`/leads/${id}/edit`} className="text-xs text-kb-strawberry hover:underline mt-1 inline-block font-medium">
                            + Add conversation notes
                          </Link>
                        )}
                      </div>
                    )}
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
                        label="Outreach Channel"
                        value={lead.typeOfReach || lead.source || 'Cold Call'}
                      />
                      <DetailItem
                        icon={Tag}
                        label="Reach Campaign / Channel Details"
                        value={lead.reachNotes || '—'}
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

                        {lead.notes && (
                          <div className="p-4 bg-kb-cream-deep rounded-xl border border-kb-sand">
                            <p className="text-xs font-semibold text-kb-muted uppercase tracking-wider mb-1">
                              General / Internal Notes
                            </p>
                            <p className="text-sm text-kb-text leading-relaxed whitespace-pre-wrap">{lead.notes}</p>
                          </div>
                        )}
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
    </div>
  )
}
