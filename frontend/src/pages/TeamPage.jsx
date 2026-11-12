import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Eye, Download } from 'lucide-react'
import { analyticsService } from '../services/analytics.service'
import { usersService } from '../services/users.service'
import { leadsService } from '../services/leads.service'
import { downloadBlob, sanitizeFilename } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import toast from 'react-hot-toast'

const RoleTag = ({ role }) => {
  const colors = {
    ADMIN: 'bg-red-500/20 text-red-400',
    TEAM_LEADER: 'bg-amber-500/20 text-amber-400',
    SALES_EXECUTIVE: 'bg-blue-500/20 text-blue-400',
  }
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[role] || 'bg-slate-700 text-slate-400'}`}>{role?.replace('_', ' ')}</span>
}

export const TeamPage = () => {
  const { isAdmin } = useAuth()
  const [performance, setPerformance] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toggleConfirm, setToggleConfirm] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'SALES_EXECUTIVE', phone: '' })
  const [creating, setCreating] = useState(false)
  const [memberQuery, setMemberQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filteredPerformance = useMemo(() => {
    const q = memberQuery.trim().toLowerCase()
    return performance.filter((p) => {
      if (q && !p.user.name?.toLowerCase().includes(q) && !p.user.email?.toLowerCase().includes(q)) return false
      if (roleFilter && p.user.role !== roleFilter) return false
      if (statusFilter === 'active' && p.user.isActive === false) return false
      if (statusFilter === 'inactive' && p.user.isActive !== false) return false
      return true
    })
  }, [performance, memberQuery, roleFilter, statusFilter])

  useEffect(() => {
    analyticsService.getTeam().then(res => setPerformance(res.data.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await usersService.create(form)
      toast.success('User created!')
      setShowCreateModal(false)
      setForm({ name: '', email: '', password: '', role: 'SALES_EXECUTIVE', phone: '' })
      const res = await analyticsService.getTeam()
      setPerformance(res.data.data)
    } catch {} finally {
      setCreating(false)
    }
  }

  const handleToggle = async (userId) => {
    try {
      await usersService.toggleStatus(userId)
      toast.success('User status updated')
      const res = await analyticsService.getTeam()
      setPerformance(res.data.data)
    } catch {}
    setToggleConfirm(null)
  }

  const handleExportMember = async (member) => {
    try {
      const res = await leadsService.export({ member: member._id })
      const dateTag = new Date().toISOString().slice(0, 10)
      downloadBlob(res.data, `leads_${sanitizeFilename(member.name)}_${dateTag}.xlsx`)
      toast.success(`Exported leads for ${member.name}`)
    } catch {
      toast.error('Failed to export member leads')
    }
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="text-muted mt-1">Team performance and management</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-sm self-start sm:self-auto">
            + Add Team Member
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Team Members', value: performance.length },
              { label: 'Total Leads', value: performance.reduce((s, p) => s + p.totalLeads, 0) },
              { label: 'Total Calls', value: performance.reduce((s, p) => s + p.totalCalls, 0) },
              { label: 'Total Converted', value: performance.reduce((s, p) => s + p.convertedLeads, 0) },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="text-2xl font-bold text-slate-100">{s.value.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Performance Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h2 className="section-header">Team Members & Performance</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any count or View Leads to filter that member&apos;s leads
                </p>
              </div>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-44">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value)}
                    placeholder="Search member..."
                    className="input pl-8 py-1.5 text-xs w-full"
                  />
                </div>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="input py-1.5 text-xs w-full sm:w-36"
                >
                  <option value="">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="TEAM_LEADER">Team Leader</option>
                  <option value="SALES_EXECUTIVE">Sales Executive</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input py-1.5 text-xs w-full sm:w-32"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Mobile & Tablet Card Grid */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
              {filteredPerformance.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No team members match the current filters.
                </div>
              ) : filteredPerformance.map((p) => (
                <div key={p.user._id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={p.user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-200 truncate">{p.user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{p.user.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${p.user.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                      {p.user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleTag role={p.user.role} />
                    <span className="text-xs text-slate-400">Calls: <strong className="text-slate-200">{p.totalCalls}</strong></span>
                    <span className="text-xs text-slate-400">Conv: <strong className="text-green-400">{p.convertedLeads}</strong> ({p.conversionRate}%)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center bg-slate-950/60 border border-slate-800 rounded-lg p-2">
                    <Link to={`/leads?createdBy=${p.user._id}`} className="hover:bg-slate-800/50 rounded p-1">
                      <p className="text-sm font-bold text-primary-400">{p.addedLeads ?? 0}</p>
                      <p className="text-[11px] text-slate-500">Added</p>
                    </Link>
                    <Link to={`/leads?assignedTo=${p.user._id}`} className="hover:bg-slate-800/50 rounded p-1">
                      <p className="text-sm font-bold text-sky-400">{p.assignedLeads ?? 0}</p>
                      <p className="text-[11px] text-slate-500">Assigned</p>
                    </Link>
                    <Link to={`/leads?member=${p.user._id}`} className="hover:bg-slate-800/50 rounded p-1">
                      <p className="text-sm font-bold text-slate-200">{p.totalLeads}</p>
                      <p className="text-[11px] text-slate-500">Total</p>
                    </Link>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Link to={`/leads?member=${p.user._id}`} className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">
                      <Eye className="w-3.5 h-3.5" /> View Leads
                    </Link>
                    <button onClick={() => handleExportMember(p.user)} className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center">
                      <Download className="w-3.5 h-3.5" /> Excel
                    </button>
                    {isAdmin && (
                      <button onClick={() => setToggleConfirm(p.user)} className="btn-ghost text-xs py-1.5 px-2.5 text-amber-400 hover:text-amber-300">
                        {p.user.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role &amp; Status</th>
                    <th>Added</th>
                    <th>Assigned</th>
                    <th>Total</th>
                    <th>Calls &amp; Conv.</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 text-sm">
                        No team members match the current filters.
                      </td>
                    </tr>
                  ) : filteredPerformance.map((p, idx) => (
                    <tr key={p.user._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${idx === 0 ? 'bg-amber-500 text-white' : idx === 1 ? 'bg-slate-400 text-white' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {idx + 1}
                          </span>
                          <Avatar name={p.user.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-200 truncate">{p.user.name}</p>
                            <p className="text-xs text-slate-500 truncate">{p.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RoleTag role={p.user.role} />
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${p.user.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                            {p.user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/leads?createdBy=${p.user._id}`}
                          className="font-semibold text-primary-400 hover:text-primary-300 hover:underline"
                          title={`View leads added by ${p.user.name}`}
                        >
                          {p.addedLeads ?? 0}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/leads?assignedTo=${p.user._id}`}
                          className="font-semibold text-sky-400 hover:text-sky-300 hover:underline"
                          title={`View leads assigned to ${p.user.name}`}
                        >
                          {p.assignedLeads ?? 0}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/leads?member=${p.user._id}`}
                          className="font-semibold text-slate-200 hover:text-primary-300 hover:underline"
                          title={`View all leads for ${p.user.name}`}
                        >
                          {p.totalLeads}
                        </Link>
                      </td>
                      <td>
                        <div className="text-xs space-y-0.5 whitespace-nowrap">
                          <p className="text-slate-300">
                            Calls: <strong className="text-slate-100">{p.totalCalls}</strong> · Int: <strong className="text-emerald-400">{p.interestedLeads}</strong>
                          </p>
                          <p>
                            Conv: <strong className="text-green-400">{p.convertedLeads}</strong>{' '}
                            <span className={`font-semibold ${p.conversionRate >= 10 ? 'text-green-400' : p.conversionRate >= 5 ? 'text-amber-400' : 'text-slate-400'}`}>
                              ({p.conversionRate}%)
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/leads?member=${p.user._id}`}
                            className="btn-ghost text-xs px-2 py-1.5 text-primary-400 hover:text-primary-300 inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Leads
                          </Link>
                          <button
                            onClick={() => handleExportMember(p.user)}
                            className="btn-ghost text-xs px-2 py-1.5 text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1"
                            title={`Export ${p.user.name}'s leads to Excel`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Excel
                          </button>
                          {isAdmin && (
                            <button onClick={() => setToggleConfirm(p.user)} className="btn-ghost text-xs px-2 py-1.5 text-amber-400 hover:text-amber-300">
                              {p.user.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add Team Member" size="md">
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" className="input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password *</label>
              <input type="password" className="input" required minLength={6} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input type="tel" className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Role *</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { value: 'SALES_EXECUTIVE', label: 'Sales Executive' },
                  { value: 'TEAM_LEADER', label: 'Team Leader' },
                  { value: 'ADMIN', label: 'Admin' },
                ].map(r => (
                  <button key={r.value} type="button" onClick={() => setForm(p => ({ ...p, role: r.value }))} className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${form.role === r.value ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={creating} className="btn-primary flex-1">{creating ? 'Creating...' : 'Create User'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!toggleConfirm}
        onClose={() => setToggleConfirm(null)}
        onConfirm={() => handleToggle(toggleConfirm?._id)}
        title="Toggle User Status"
        message={`Toggle active/inactive status for ${toggleConfirm?.name}?`}
        confirmText="Confirm"
        variant="warning"
      />
    </div>
  )
}
