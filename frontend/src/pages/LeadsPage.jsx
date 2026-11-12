import { useState, useEffect, useCallback } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { Plus, Download, RefreshCw, Filter, Users, X } from 'lucide-react'
import { useLeads } from '../hooks/useLeads'
import { useAuth } from '../context/AuthContext'
import { LeadTable } from '../components/leads/LeadTable'
import { LeadFilters } from '../components/leads/LeadFilters'
import { Pagination } from '../components/ui/Pagination'
import { SearchBar } from '../components/ui/SearchBar'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { CallModal } from '../components/modals/CallModal'
import { EmptyState } from '../components/ui/EmptyState'
import { leadsService } from '../services/leads.service'
import { usersService } from '../services/users.service'
import { useDebounce } from '../hooks/useDebounce'
import { downloadBlob, sanitizeFilename } from '../utils/helpers'
import toast from 'react-hot-toast'
import { useSocketEvent } from '../hooks/useSocketEvent'
export const LeadsPage = () => {
  const { search: searchParams } = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(searchParams)

  const parseFiltersFromParams = (urlParams) => ({
    status: urlParams.get('status') || '',
    source: urlParams.get('source') || '',
    member: urlParams.get('member') || '',
    createdBy: urlParams.get('createdBy') || '',
    assignedTo: urlParams.get('assignedTo') || '',
    priority: urlParams.get('priority') || '',
    followUp: urlParams.get('followUp') || '',
    mine: urlParams.get('mine') || '',
  })

  const [filters, setFilters] = useState(() => parseFiltersFromParams(params))
  const [searchQuery, setSearchQuery] = useState(params.get('search') || '')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('createdAt')
  const [showFilters, setShowFilters] = useState(false)
  const [salesUsers, setSalesUsers] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [callLead, setCallLead] = useState(null)
  const [exporting, setExporting] = useState(false)

  const { leads, pagination, loading, error, fetchLeads } = useLeads()
  const { isAdmin, isTeamLeader, isSalesExec, canDelete } = useAuth()

  const debouncedSearch = useDebounce(searchQuery, 500)

  const applyFilters = (nextFilters) => {
    setFilters(nextFilters)
    setPage(1)
    const nextParams = new URLSearchParams()
    Object.entries(nextFilters).forEach(([k, v]) => { if (v) nextParams.set(k, v) })
    const qs = nextParams.toString()
    navigate(qs ? `/leads?${qs}` : '/leads', { replace: true })
  }

  // Sync state when URL query params change (e.g. clicking sidebar links or team member links)
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams)
    setFilters(parseFiltersFromParams(currentParams))
    setPage(1)
  }, [searchParams])

  useEffect(() => {
    if (isAdmin || isTeamLeader) {
      usersService.getSalesUsers().then(res => setSalesUsers(res.data.data)).catch(() => {})
    }
  }, [isAdmin, isTeamLeader])

  const loadLeads = useCallback(() => {
    const queryParams = {
      page,
      limit: 20,
      ...filters,
      search: debouncedSearch || undefined,
      sortBy,
    }
    Object.keys(queryParams).forEach(k => !queryParams[k] && delete queryParams[k])
    fetchLeads(queryParams)
  }, [page, filters, debouncedSearch, sortBy, fetchLeads])


  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  useSocketEvent('lead_updated', loadLeads)
  useSocketEvent('user_updated', loadLeads)

  const handleDelete = async (lead) => {
    try {
      await leadsService.delete(lead._id)
      toast.success('Lead deleted')
      loadLeads()
    } catch {}
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const exportParams = { ...filters, search: debouncedSearch || undefined }
      Object.keys(exportParams).forEach((k) => !exportParams[k] && delete exportParams[k])
      const res = await leadsService.export(exportParams)
      const memberId = filters.member || filters.createdBy || filters.assignedTo
      const memberName = memberId === 'unassigned'
        ? 'unassigned'
        : salesUsers.find((u) => u._id === memberId)?.name
      const dateTag = new Date().toISOString().slice(0, 10)
      const fileName = memberName
        ? `leads_${sanitizeFilename(memberName)}_${dateTag}.xlsx`
        : `leads_export_${dateTag}.xlsx`
      downloadBlob(res.data, fileName)
      toast.success('Excel file downloaded!')
    } catch {
      toast.error('Failed to export leads')
    } finally {
      setExporting(false)
    }
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="text-muted mt-1">
            {pagination.total.toLocaleString()} lead{pagination.total !== 1 ? 's' : ''} total
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={handleExport} disabled={exporting} className="btn-secondary text-sm">
            <Download className="w-4 h-4" />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <Link to="/leads/new" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="card p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2.5 sm:gap-3">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by name, phone, email, company..."
            className="w-full sm:flex-1 sm:min-w-48"
          />
          {isSalesExec && (
            <div className="inline-flex rounded-xl bg-kb-cream-deep border border-kb-sand p-1">
              <button
                type="button"
                onClick={() => applyFilters({ ...filters, mine: '' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  !filters.mine ? 'bg-kb-strawberry text-kb-white' : 'text-kb-muted hover:text-kb-cocoa'
                }`}
              >
                All Clients
              </button>
              <button
                type="button"
                onClick={() => applyFilters({ ...filters, mine: 'true' })}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filters.mine === 'true' ? 'bg-kb-strawberry text-kb-white' : 'text-kb-muted hover:text-kb-cocoa'
                }`}
              >
                My Assigned
              </button>
            </div>
          )}
          {(isAdmin || isTeamLeader) && salesUsers.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Users className="w-4 h-4 text-kb-umber shrink-0" />
              <select
                value={filters.member || ''}
                onChange={(e) => applyFilters({ ...filters, member: e.target.value })}
                className="input py-2 text-sm w-full sm:w-48"
                aria-label="Filter by team member"
              >
                <option value="">All Team Members</option>
                {salesUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn-secondary text-sm flex-1 sm:flex-initial justify-center ${activeFiltersCount > 0 ? 'border-kb-strawberry text-kb-strawberry bg-kb-strawberry-tint' : ''}`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && <span className="bg-kb-strawberry text-kb-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>}
            </button>
            <button onClick={loadLeads} className="btn-icon flex-shrink-0" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {(filters.member || filters.createdBy || filters.assignedTo) && salesUsers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {filters.member && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-kb-strawberry-tint text-kb-crimson border border-kb-lost-border font-medium">
                Member: {salesUsers.find(u => u._id === filters.member)?.name || 'Selected'}
                <button onClick={() => applyFilters({ ...filters, member: '' })} className="hover:text-kb-cocoa" aria-label="Clear member filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.createdBy && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-kb-umber-bg text-kb-umber-fg border border-kb-umber-border font-medium">
                Added by: {salesUsers.find(u => u._id === filters.createdBy)?.name || 'Selected'}
                <button onClick={() => applyFilters({ ...filters, createdBy: '' })} className="hover:text-kb-cocoa" aria-label="Clear added by filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.assignedTo && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-kb-new-bg text-kb-new-fg border border-kb-new-border font-medium">
                Assigned to: {filters.assignedTo === 'unassigned' ? 'Unassigned' : (salesUsers.find(u => u._id === filters.assignedTo)?.name || 'Selected')}
                <button onClick={() => applyFilters({ ...filters, assignedTo: '' })} className="hover:text-kb-cocoa" aria-label="Clear assigned to filter">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}

        {showFilters && (
          <div className="pt-3 border-t border-kb-sand animate-slide-up">
            <LeadFilters
              filters={filters}
              onChange={applyFilters}
              salesUsers={salesUsers}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="card p-6 text-center">
          <p className="text-kb-crimson font-medium mb-3">{error}</p>
          <button onClick={loadLeads} className="btn-secondary text-sm">Retry</button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="card overflow-hidden">
          {leads.length === 0 && !loading ? (
            <EmptyState
              icon="👥"
              title="No leads found"
              description={debouncedSearch || activeFiltersCount > 0 ? "Try adjusting your search or filters" : "Add your first lead to get started"}
              action={<Link to="/leads/new" className="btn-primary text-sm">+ Add Lead</Link>}
            />
          ) : (
            <>
              <LeadTable
                leads={leads}
                onCall={setCallLead}
                onDelete={(lead) => setConfirmDelete(lead)}
                canDelete={canDelete}
                loading={loading}
              />
              <Pagination pagination={pagination} onPageChange={setPage} />
            </>
          )}
        </div>
      )}

      {/* Modals */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDelete(confirmDelete)}
        title="Delete Lead"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Lead"
      />
      <CallModal
        isOpen={!!callLead}
        onClose={() => setCallLead(null)}
        lead={callLead}
        onSuccess={loadLeads}
      />
    </div>
  )
}
