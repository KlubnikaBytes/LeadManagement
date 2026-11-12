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
    ADMIN: 'bg-kb-lost-bg text-kb-lost-fg border border-kb-lost-border',
    TEAM_LEADER: 'bg-kb-amber-bg text-kb-amber-fg border border-kb-amber-border',
    SALES_EXECUTIVE: 'bg-kb-new-bg text-kb-new-fg border border-kb-new-border',
  }
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[role] || 'bg-kb-cold-bg text-kb-cold-fg border border-kb-cold-border'}`}>
      {role?.replace('_', ' ')}
    </span>
  )
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
              { label: 'Team Members', value: performance.length, accent: false },
              { label: 'Total Leads', value: performance.reduce((s, p) => s + p.totalLeads, 0), accent: true },
              { label: 'Total Calls', value: performance.reduce((s, p) => s + p.totalCalls, 0), accent: false },
              { label: 'Total Converted', value: performance.reduce((s, p) => s + p.convertedLeads, 0), accent: true },
            ].map(s => (
              <div
                key={s.label}
                className={`rounded-xl p-4 text-center border ${
                  s.accent ? 'bg-kb-cocoa border-kb-espresso text-kb-white' : 'card'
                }`}
              >
                <p className={`text-2xl font-bold ${s.accent ? 'text-kb-coral' : 'text-kb-cocoa'}`}>{s.value.toLocaleString()}</p>
                <p className={`text-xs mt-1 ${s.accent ? 'text-kb-white' : 'text-kb-muted'}`}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Performance Table */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-kb-sand flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <h2 className="section-header">Team Members & Performance</h2>
                <p className="text-xs text-kb-muted mt-0.5">
                  Click any count or View Leads to filter that member&apos;s leads
                </p>
              </div>
              <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-44">
                  <Search className="w-3.5 h-3.5 text-kb-umber absolute left-3 top-1/2 -translate-y-1/2" />
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
                <div className="text-center py-8 text-kb-muted text-sm">
                  No team members match the current filters.
                </div>
              ) : filteredPerformance.map((p) => (
                <div key={p.user._id} className="p-4 rounded-xl bg-kb-cream-deep border border-kb-sand space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={p.user.name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-semibold text-kb-cocoa truncate">{p.user.name}</p>
                        <p className="text-xs text-kb-muted truncate">{p.user.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 border ${p.user.isActive !== false ? 'bg-kb-won-bg text-kb-won-fg border-kb-won-border' : 'bg-kb-cold-bg text-kb-cold-fg border-kb-cold-border'}`}>
                      {p.user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleTag role={p.user.role} />
                    <span className="text-xs text-kb-muted">Calls: <strong className="text-kb-cocoa">{p.totalCalls}</strong></span>
                    <span className="text-xs text-kb-muted">Conv: <strong className="text-kb-won-fg">{p.convertedLeads}</strong> ({p.conversionRate}%)</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center bg-kb-white border border-kb-sand rounded-lg p-2">
                    <Link to={`/leads?createdBy=${p.user._id}`} className="hover:bg-kb-cream-deep rounded p-1">
                      <p className="text-sm font-bold text-kb-strawberry">{p.addedLeads ?? 0}</p>
                      <p className="text-[11px] text-kb-muted">Added</p>
                    </Link>
                    <Link to={`/leads?assignedTo=${p.user._id}`} className="hover:bg-kb-cream-deep rounded p-1">
                      <p className="text-sm font-bold text-kb-cocoa">{p.assignedLeads ?? 0}</p>
                      <p className="text-[11px] text-kb-muted">Assigned</p>
                    </Link>
                    <Link to={`/leads?member=${p.user._id}`} className="hover:bg-kb-cream-deep rounded p-1">
                      <p className="text-sm font-bold text-kb-cocoa">{p.totalLeads}</p>
                      <p className="text-[11px] text-kb-muted">Total</p>
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
                      <button onClick={() => setToggleConfirm(p.user)} className="btn-ghost text-xs py-1.5 px-2.5 text-kb-amber-fg hover:bg-kb-amber-bg">
                        {p.user.isActive !== false ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block table-container border-0 rounded-none">
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
                      <td colSpan={7} className="text-center py-8 text-kb-muted text-sm">
                        No team members match the current filters.
                      </td>
                    </tr>
                  ) : filteredPerformance.map((p, idx) => (
                    <tr key={p.user._id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            idx === 0
                              ? 'bg-kb-strawberry text-kb-white'
                              : idx === 1
                              ? 'bg-kb-cocoa text-kb-white'
                              : idx === 2
                              ? 'bg-kb-umber text-kb-white'
                              : 'bg-kb-cream-deep text-kb-muted'
                          }`}>
                            {idx + 1}
                          </span>
                          <Avatar name={p.user.name} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-kb-cocoa truncate">{p.user.name}</p>
                            <p className="text-xs text-kb-muted truncate">{p.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <RoleTag role={p.user.role} />
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${p.user.isActive !== false ? 'bg-kb-won-bg text-kb-won-fg border-kb-won-border' : 'bg-kb-cold-bg text-kb-cold-fg border-kb-cold-border'}`}>
                            {p.user.isActive !== false ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Link
                          to={`/leads?createdBy=${p.user._id}`}
                          className="font-semibold text-kb-strawberry hover:text-kb-strawberry-hover hover:underline"
                          title={`View leads added by ${p.user.name}`}
                        >
                          {p.addedLeads ?? 0}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/leads?assignedTo=${p.user._id}`}
                          className="font-semibold text-kb-cocoa hover:text-kb-strawberry hover:underline"
                          title={`View leads assigned to ${p.user.name}`}
                        >
                          {p.assignedLeads ?? 0}
                        </Link>
                      </td>
                      <td>
                        <Link
                          to={`/leads?member=${p.user._id}`}
                          className="font-semibold text-kb-cocoa hover:text-kb-strawberry hover:underline"
                          title={`View all leads for ${p.user.name}`}
                        >
                          {p.totalLeads}
                        </Link>
                      </td>
                      <td>
                        <div className="text-xs space-y-0.5 whitespace-nowrap">
                          <p className="text-kb-text">
                            Calls: <strong className="text-kb-cocoa">{p.totalCalls}</strong> · Int: <strong className="text-kb-teal-fg">{p.interestedLeads}</strong>
                          </p>
                          <p>
                            Conv: <strong className="text-kb-won-fg">{p.convertedLeads}</strong>{' '}
                            <span className={`font-semibold ${p.conversionRate >= 10 ? 'text-kb-won-fg' : p.conversionRate >= 5 ? 'text-kb-amber-fg' : 'text-kb-muted'}`}>
                              ({p.conversionRate}%)
                            </span>
                          </p>
                        </div>
                      </td>
                      <td className="whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Link
                            to={`/leads?member=${p.user._id}`}
                            className="btn-ghost text-xs px-2 py-1.5 text-kb-strawberry hover:text-kb-strawberry-hover inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Leads
                          </Link>
                          <button
                            onClick={() => handleExportMember(p.user)}
                            className="btn-ghost text-xs px-2 py-1.5 text-kb-teal-fg hover:bg-kb-teal-bg inline-flex items-center gap-1"
                            title={`Export ${p.user.name}'s leads to Excel`}
                          >
                            <Download className="w-3.5 h-3.5" />
                            Excel
                          </button>
                          {isAdmin && (
                            <button onClick={() => setToggleConfirm(p.user)} className="btn-ghost text-xs px-2 py-1.5 text-kb-amber-fg hover:bg-kb-amber-bg">
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
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm(p => ({ ...p, role: r.value }))}
                    className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${
                      form.role === r.value
                        ? 'border-kb-strawberry bg-kb-strawberry-tint text-kb-strawberry font-semibold'
                        : 'border-kb-sand bg-kb-white text-kb-muted hover:border-kb-umber hover:text-kb-cocoa'
                    }`}
                  >
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
