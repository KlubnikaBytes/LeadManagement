import { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { leadsService } from '../services/leads.service'
import { usersService } from '../services/users.service'
import { useAuth } from '../context/AuthContext'
import { downloadBlob, sanitizeFilename } from '../utils/helpers'
import { STATUSES, REACH_TYPES, PRIORITIES } from '../utils/constants'
import toast from 'react-hot-toast'

export const ReportsPage = () => {
  const { isAdmin, isTeamLeader } = useAuth()
  const [filters, setFilters] = useState({ status: '', typeOfReach: '', priority: '', member: '', createdBy: '', assignedTo: '' })
  const [salesUsers, setSalesUsers] = useState([])
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (isAdmin || isTeamLeader) {
      usersService.getSalesUsers().then(res => setSalesUsers(res.data.data)).catch(() => {})
    }
  }, [isAdmin, isTeamLeader])

  const handleExport = async (type) => {
    setExporting(true)
    try {
      let params = {}
      if (type === 'converted') {
        params = { status: 'CONVERTED' }
      } else if (type === 'followup') {
        params = { followUp: 'all_scheduled' }
      } else if (type === 'overdue') {
        params = { followUp: 'overdue' }
      } else if (type === 'filtered') {
        params = { ...filters }
        Object.keys(params).forEach((k) => !params[k] && delete params[k])
      }
      const res = await leadsService.export(params)
      const dateTag = new Date().toISOString().slice(0, 10)
      downloadBlob(res.data, `${sanitizeFilename(type)}_leads_${dateTag}.xlsx`)
      toast.success('Excel report downloaded!')
    } catch {
      toast.error('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-muted mt-1">Extract lead data to Excel (.xlsx)</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { id: 'all', title: 'All Leads Report', desc: 'Export every accessible lead with complete 4-part CRM details', icon: '📋' },
          { id: 'converted', title: 'Converted Leads Report', desc: 'Export all converted leads and deal details', icon: '🎉' },
          { id: 'followup', title: 'Scheduled Follow-ups Report', desc: 'Export leads with scheduled follow-up dates', icon: '📅' },
          { id: 'overdue', title: 'Overdue Follow-ups Report', desc: 'Export leads whose follow-up date has passed', icon: '⚠️' },
        ].map(r => (
          <div key={r.id} className="card p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="text-2xl sm:text-3xl flex-shrink-0">{r.icon}</span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-kb-cocoa">{r.title}</h3>
                  <p className="text-sm text-kb-muted mt-0.5">{r.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleExport(r.id)}
                disabled={exporting}
                className="btn-secondary text-sm flex-shrink-0 self-start sm:self-center w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-4 sm:p-5">
        <h3 className="section-header mb-4">Custom Filtered Excel Export</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="label">Filter by Status</label>
            <select className="input" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Filter by Type of Reach</label>
            <select className="input" value={filters.typeOfReach} onChange={e => setFilters(p => ({ ...p, typeOfReach: e.target.value }))}>
              <option value="">All Channels</option>
              {REACH_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Filter by Priority</label>
            <select className="input" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
              <option value="">All Priorities</option>
              {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          {(isAdmin || isTeamLeader) && salesUsers.length > 0 && (
            <>
              <div>
                <label className="label">Member (Added or Assigned)</label>
                <select className="input" value={filters.member} onChange={e => setFilters(p => ({ ...p, member: e.target.value }))}>
                  <option value="">All Members</option>
                  {salesUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Added By</label>
                <select className="input" value={filters.createdBy} onChange={e => setFilters(p => ({ ...p, createdBy: e.target.value }))}>
                  <option value="">Anyone</option>
                  {salesUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Assigned To</label>
                <select className="input" value={filters.assignedTo} onChange={e => setFilters(p => ({ ...p, assignedTo: e.target.value }))}>
                  <option value="">Anyone</option>
                  <option value="unassigned">Unassigned</option>
                  {salesUsers.map(u => <option key={u._id} value={u._id}>{u.name}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
        <button onClick={() => handleExport('filtered')} disabled={exporting} className="btn-primary text-sm w-full sm:w-auto justify-center">
          <Download className="w-4 h-4" />
          {exporting ? 'Exporting...' : 'Download Filtered Excel (.xlsx)'}
        </button>
      </div>
    </div>
  )
}
