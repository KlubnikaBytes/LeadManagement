import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Trash2, RotateCcw, AlertTriangle, Search, Filter, RefreshCw,
  Building2, User, Phone, Mail, Globe, Calendar, CheckCircle2, X
} from 'lucide-react'
import { leadsService } from '../services/leads.service'
import { usersService } from '../services/users.service'
import { StatusBadge, PriorityBadge } from '../components/ui/StatusBadge'
import { Avatar } from '../components/ui/Avatar'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState } from '../components/ui/EmptyState'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDate, formatRelative } from '../utils/helpers'
import { STATUSES, BUSINESS_CATEGORIES_MAP } from '../utils/constants'
import { useSocket } from '../context/SocketContext'
import toast from 'react-hot-toast'

export const DeletedLeadsPage = () => {
  const socket = useSocket()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState('')
  const [businessCategory, setBusinessCategory] = useState('')
  const [businessSubCategory, setBusinessSubCategory] = useState('')
  const [deletedBy, setDeletedBy] = useState('')
  const [dateRange, setDateRange] = useState('')

  // Modals
  const [restoreTarget, setRestoreTarget] = useState(null)
  const [purgeTarget, setPurgeTarget] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  // Fetch users for deletedBy filter
  useEffect(() => {
    usersService.getAll()
      .then(res => setUsers(res.data?.data || []))
      .catch(() => {})
  }, [])

  const fetchDeletedLeads = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 20,
      }
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim()
      if (status) params.status = status
      if (businessCategory) params.businessCategory = businessCategory
      if (businessSubCategory) params.businessSubCategory = businessSubCategory
      if (deletedBy) params.deletedBy = deletedBy
      if (dateRange) params.dateRange = dateRange

      const res = await leadsService.getDeleted(params)
      setLeads(res.data?.data || [])
      setPagination(res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch deleted leads')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, status, businessCategory, businessSubCategory, deletedBy, dateRange])

  useEffect(() => {
    fetchDeletedLeads(1)
  }, [fetchDeletedLeads])

  // Socket listener for real-time refresh
  useEffect(() => {
    if (!socket) return
    const handleUpdate = () => fetchDeletedLeads(pagination.page)
    socket.on('lead_updated', handleUpdate)
    return () => socket.off('lead_updated', handleUpdate)
  }, [socket, fetchDeletedLeads, pagination.page])

  // Available sub-categories based on selected category
  const availableSubCategories = useMemo(() => {
    if (!businessCategory || !BUSINESS_CATEGORIES_MAP[businessCategory]) return []
    return BUSINESS_CATEGORIES_MAP[businessCategory]
  }, [businessCategory])

  const handleRestore = async () => {
    if (!restoreTarget) return
    setActionLoading(true)
    try {
      await leadsService.restore(restoreTarget._id)
      toast.success(`Lead "${restoreTarget.companyName || restoreTarget.name}" restored successfully`)
      setRestoreTarget(null)
      fetchDeletedLeads(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to restore lead')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePermanentPurge = async () => {
    if (!purgeTarget) return
    setActionLoading(true)
    try {
      await leadsService.permanentDelete(purgeTarget._id)
      toast.success(`Lead "${purgeTarget.companyName || purgeTarget.name}" permanently purged from database`)
      setPurgeTarget(null)
      fetchDeletedLeads(pagination.page)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to permanently purge lead')
    } finally {
      setActionLoading(false)
    }
  }

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setBusinessCategory('')
    setBusinessSubCategory('')
    setDeletedBy('')
    setDateRange('')
  }

  const hasActiveFilters = Boolean(
    debouncedSearch || status || businessCategory || businessSubCategory || deletedBy || dateRange
  )

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-kb-sand">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-kb-lost-bg border border-kb-lost-border flex items-center justify-center text-kb-crimson shadow-sm">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-kb-cocoa">Deleted Leads Archive</h1>
              <p className="text-xs sm:text-sm text-kb-muted mt-0.5">
                Soft-deleted leads archive. View who removed each lead, restore to active pipeline, or permanently purge.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDeletedLeads(pagination.page)}
            className="btn-secondary text-xs sm:text-sm flex items-center gap-1.5"
            disabled={loading}
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 space-y-3 bg-kb-white shadow-sm border border-kb-sand">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-kb-taupe absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company, POC, phone, email..."
              className="input pl-9 pr-8 text-xs sm:text-sm w-full"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-kb-taupe hover:text-kb-cocoa"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Business Category */}
          <div className="md:col-span-2">
            <select
              value={businessCategory}
              onChange={(e) => {
                setBusinessCategory(e.target.value)
                setBusinessSubCategory('')
              }}
              className="select text-xs sm:text-sm w-full"
            >
              <option value="">All Categories</option>
              {Object.keys(BUSINESS_CATEGORIES_MAP).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Business Sub-Category */}
          <div className="md:col-span-2">
            <select
              value={businessSubCategory}
              onChange={(e) => setBusinessSubCategory(e.target.value)}
              disabled={!businessCategory}
              className="select text-xs sm:text-sm w-full disabled:opacity-50"
            >
              <option value="">All Sub-Categories</option>
              {availableSubCategories.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="md:col-span-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="select text-xs sm:text-sm w-full"
            >
              <option value="">All Statuses</option>
              {STATUSES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Deleted By */}
          <div className="md:col-span-2">
            <select
              value={deletedBy}
              onChange={(e) => setDeletedBy(e.target.value)}
              className="select text-xs sm:text-sm w-full"
            >
              <option value="">Deleted By: All</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role?.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Row: Date Range & Clear */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-kb-sand/60 text-xs text-kb-muted">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-kb-cocoa">Deleted When:</span>
            {['', 'today', 'this_week', 'this_month'].map(r => (
              <button
                key={r}
                onClick={() => setDateRange(r)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors ${
                  dateRange === r
                    ? 'bg-kb-espresso text-kb-white border-kb-espresso'
                    : 'bg-kb-cream/50 text-kb-muted border-kb-sand hover:bg-kb-cream-deep'
                }`}
              >
                {r === '' ? 'All Time' : r === 'today' ? 'Today' : r === 'this_week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-kb-strawberry hover:underline flex items-center gap-1 font-medium"
            >
              <X className="w-3.5 h-3.5" /> Reset all filters
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="card p-12 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-kb-muted mt-3">Loading deleted leads archive...</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="card p-8">
          <EmptyState
            icon="🗑️"
            title={hasActiveFilters ? 'No deleted leads match your filters' : 'Trash is empty'}
            description={
              hasActiveFilters
                ? 'Try clearing some search terms or filter criteria to see more records.'
                : 'No soft-deleted leads exist in the system. When a team member deletes a lead, it will safely appear here.'
            }
            action={
              hasActiveFilters ? (
                <button onClick={resetFilters} className="btn-secondary text-xs sm:text-sm mt-2">
                  Clear Filters
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden shadow-sm border border-kb-sand">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="bg-kb-espresso text-kb-white text-[11px] uppercase tracking-wider text-left border-b border-kb-cocoa">
                  <th className="py-3 px-4">Company & Lead</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Original Status</th>
                  <th className="py-3 px-4">Deleted By & Date</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kb-sand text-xs text-kb-text">
                {leads.map((lead) => {
                  const companyTitle = lead.companyName || lead.name || 'Unnamed Lead'
                  const pocName = lead.name && lead.name !== lead.companyName ? lead.name : (lead.pocName || '')
                  const category = lead.businessCategory || lead.businessType || 'General'
                  const subCategory = lead.businessSubCategory || ''

                  return (
                    <tr key={lead._id} className="hover:bg-kb-cream/40 transition-colors">
                      {/* Company & Lead */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-kb-cocoa text-sm flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-kb-strawberry flex-shrink-0" />
                          <span>{companyTitle}</span>
                        </div>
                        {pocName && (
                          <div className="text-[11px] text-kb-muted mt-0.5 flex items-center gap-1">
                            <User className="w-3 h-3 flex-shrink-0 text-kb-taupe" />
                            <span>POC: {pocName}</span>
                            {lead.jobTitle && <span className="text-kb-taupe">({lead.jobTitle})</span>}
                          </div>
                        )}
                        {lead.website && (
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-kb-teal-fg hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            <span className="truncate max-w-[180px]">{lead.website.replace(/^https?:\/\//, '')}</span>
                          </a>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3 px-4 space-y-1">
                        {(lead.phone || lead.companyPhone || lead.alternatePhone) && (
                          <div className="flex items-center gap-1 text-kb-cocoa font-mono">
                            <Phone className="w-3 h-3 text-kb-taupe flex-shrink-0" />
                            <span>{lead.phone || lead.companyPhone || lead.alternatePhone}</span>
                          </div>
                        )}
                        {(lead.email || lead.companyEmail) && (
                          <div className="flex items-center gap-1 text-kb-muted truncate max-w-[190px]">
                            <Mail className="w-3 h-3 text-kb-taupe flex-shrink-0" />
                            <span>{lead.email || lead.companyEmail}</span>
                          </div>
                        )}
                        {!lead.phone && !lead.companyPhone && !lead.email && !lead.companyEmail && (
                          <span className="text-kb-taupe text-[11px] italic">No direct contact info</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-kb-cocoa text-xs">{category}</div>
                        {subCategory && (
                          <div className="text-[10px] text-kb-muted mt-0.5 font-normal">{subCategory}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <StatusBadge status={lead.status} />
                          {lead.priority && (
                            <div>
                              <PriorityBadge priority={lead.priority} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Deleted By & Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar name={lead.deletedBy?.name || 'Admin'} size="xs" />
                          <div>
                            <div className="font-semibold text-kb-cocoa text-xs">
                              {lead.deletedBy?.name || 'Admin / System'}
                            </div>
                            <div className="text-[10px] text-kb-taupe">
                              {lead.deletedBy?.role?.replace('_', ' ') || 'Admin'}
                            </div>
                          </div>
                        </div>
                        <div className="text-[10px] text-kb-muted mt-1 flex items-center gap-1" title={lead.deletedAt ? formatDate(lead.deletedAt) : ''}>
                          <Calendar className="w-3 h-3 text-kb-taupe" />
                          <span>{lead.deletedAt ? formatRelative(lead.deletedAt) : 'Recently'}</span>
                        </div>
                      </td>

                      {/* Assigned To */}
                      <td className="py-3 px-4">
                        {lead.assignedTo ? (
                          <div className="flex items-center gap-1.5">
                            <Avatar name={lead.assignedTo?.name} size="xs" />
                            <span className="text-xs text-kb-cocoa font-medium">{lead.assignedTo?.name}</span>
                          </div>
                        ) : (
                          <span className="text-kb-taupe text-[11px] italic">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Restore Button */}
                          <button
                            onClick={() => setRestoreTarget(lead)}
                            className="btn-ghost text-xs py-1 px-2.5 text-kb-teal-fg hover:bg-kb-teal-bg flex items-center gap-1 font-medium"
                            title="Restore lead back to active leads"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>

                          {/* Permanent Purge Button */}
                          <button
                            onClick={() => setPurgeTarget(lead)}
                            className="btn-ghost text-xs py-1 px-2 text-kb-crimson hover:bg-kb-lost-bg"
                            title="Permanently remove from database (Cannot be undone)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination
              pagination={pagination}
              onPageChange={(page) => fetchDeletedLeads(page)}
            />
          )}
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Lead"
        message={`Are you sure you want to restore "${restoreTarget?.companyName || restoreTarget?.name}"? It will be moved back to the active leads pipeline.`}
        confirmText="Restore Lead"
        variant="primary"
      />

      {/* Permanent Purge Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(purgeTarget)}
        onClose={() => setPurgeTarget(null)}
        onConfirm={handlePermanentPurge}
        title="Permanently Purge Lead?"
        message={`WARNING: This will permanently delete "${purgeTarget?.companyName || purgeTarget?.name}" from MongoDB. This action is irreversible and cannot be restored.`}
        confirmText="Delete Permanently"
        variant="danger"
      />
    </div>
  )
}
export default DeletedLeadsPage
