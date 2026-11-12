import { Link } from 'react-router-dom'
import { Phone, Eye, Edit, Trash2, Calendar, MessageSquare, MoreVertical } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge'
import { Avatar } from '../ui/Avatar'
import { formatDate, formatRelative, isFollowUpOverdue, isFollowUpToday } from '../../utils/helpers'
import { useState } from 'react'

export const LeadTable = ({ leads, onCall, onDelete, onStatusChange, canDelete, loading }) => {
  const [activeMenu, setActiveMenu] = useState(null)

  if (loading) {
    return (
      <>
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-800 space-y-3 animate-pulse">
              <div className="h-4 bg-slate-800 rounded w-1/2" />
              <div className="h-3 bg-slate-800 rounded w-1/3" />
              <div className="h-6 bg-slate-800 rounded w-2/3" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block table-container">
          <table className="table">
            <thead>
              <TableHeader />
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-slate-800 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    )
  }

  return (
    <div onClick={() => setActiveMenu(null)}>
      {/* Mobile & Tablet Card Grid */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
        {leads.map(lead => (
          <div key={lead._id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <Link to={`/leads/${lead._id}`} className="min-w-0 flex-1 group">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="font-semibold text-slate-100 group-hover:text-primary-400 transition-colors truncate">{lead.name}</p>
                  {lead.pocJobTitle && (
                    <span className="text-[11px] text-primary-300 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20 font-medium">
                      {lead.pocJobTitle}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  <span className="text-slate-300 font-medium">{lead.companyName || '—'}</span>
                  {(lead.businessCategory || lead.businessType) && (
                    <span className="text-slate-500"> · {lead.businessCategory || lead.businessType}</span>
                  )}
                </p>
              </Link>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <StatusBadge status={lead.status} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <a href={`tel:${lead.phone}`} className="text-primary-400 hover:text-primary-300 font-mono font-medium">
                {lead.phone}
              </a>
              <span className="text-slate-700">•</span>
              <span className="text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                {lead.typeOfReach || lead.source}
              </span>
              <PriorityBadge priority={lead.priority} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>Added: <strong className="text-slate-300 font-medium">{lead.createdBy?.name || '—'}</strong></span>
                <span>Assigned: <strong className="text-slate-300 font-medium">{lead.assignedTo?.name || 'Unassigned'}</strong></span>
                {lead.nextFollowUpAt && (
                  <span className={`font-medium ${isFollowUpOverdue(lead.nextFollowUpAt) ? 'text-red-400' : isFollowUpToday(lead.nextFollowUpAt) ? 'text-amber-400' : 'text-slate-400'}`}>
                    {isFollowUpOverdue(lead.nextFollowUpAt) ? '⚠ ' : isFollowUpToday(lead.nextFollowUpAt) ? '📅 ' : ''}
                    {formatDate(lead.nextFollowUpAt)}
                  </span>
                )}
              </div>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Phone className="w-3 h-3 text-slate-500" />
                {lead.totalCalls}
              </span>
            </div>

            <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-800/70">
              <Link to={`/leads/${lead._id}`} className="btn-ghost text-xs py-1.5 px-2.5">
                <Eye className="w-3.5 h-3.5" /> View
              </Link>
              <button onClick={() => onCall && onCall(lead)} className="btn-ghost text-xs py-1.5 px-2.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                <Phone className="w-3.5 h-3.5" /> Call
              </button>
              <Link to={`/leads/${lead._id}/edit`} className="btn-ghost text-xs py-1.5 px-2.5">
                <Edit className="w-3.5 h-3.5" /> Edit
              </Link>
              {canDelete && (
                <button onClick={() => onDelete && onDelete(lead)} className="btn-ghost text-xs py-1.5 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Zero-Scroll Desktop Table */}
      <div className="hidden lg:block table-container">
      <table className="table">
        <thead>
          <TableHeader />
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead._id}>
              <td className="max-w-[230px]">
                <Link to={`/leads/${lead._id}`} className="group block">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="font-semibold text-slate-100 group-hover:text-primary-400 transition-colors truncate">{lead.name}</p>
                    {lead.pocJobTitle && (
                      <span className="text-[11px] text-primary-300 bg-primary-500/10 px-1.5 py-0.5 rounded border border-primary-500/20 font-medium whitespace-nowrap">
                        {lead.pocJobTitle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    <span className="text-slate-300 font-medium">{lead.companyName || '—'}</span>
                    {(lead.businessCategory || lead.businessType) && (
                      <span className="text-slate-500"> · {lead.businessCategory || lead.businessType}</span>
                    )}
                  </p>
                </Link>
              </td>
              <td>
                <div className="space-y-1">
                  <a href={`tel:${lead.phone}`} className="text-primary-400 hover:text-primary-300 font-mono text-sm block whitespace-nowrap">
                    {lead.phone}
                  </a>
                  <span className="inline-block text-slate-300 text-[11px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 font-medium whitespace-nowrap">
                    {lead.typeOfReach || lead.source}
                  </span>
                </div>
              </td>
              <td>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge status={lead.status} />
                  <PriorityBadge priority={lead.priority} />
                </div>
              </td>
              <td>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-slate-500">Added:</span>
                    {lead.createdBy ? (
                      <span className="inline-flex items-center gap-1 text-slate-200 font-medium">
                        <Avatar name={lead.createdBy.name} size="sm" />
                        {lead.createdBy.name}
                      </span>
                    ) : <span className="text-slate-600">—</span>}
                  </div>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-slate-500">Assigned:</span>
                    {lead.assignedTo ? (
                      <span className="text-sky-300 font-medium">{lead.assignedTo.name}</span>
                    ) : <span className="text-slate-500">Unassigned</span>}
                  </div>
                </div>
              </td>
              <td>
                <div className="space-y-1 text-xs whitespace-nowrap">
                  <div>
                    {lead.nextFollowUpAt ? (
                      <span className={`font-medium ${isFollowUpOverdue(lead.nextFollowUpAt) ? 'text-red-400' : isFollowUpToday(lead.nextFollowUpAt) ? 'text-amber-400' : 'text-slate-300'}`}>
                        {isFollowUpOverdue(lead.nextFollowUpAt) ? '⚠ ' : isFollowUpToday(lead.nextFollowUpAt) ? '📅 ' : 'Follow-up: '}
                        {formatDate(lead.nextFollowUpAt)}
                      </span>
                    ) : <span className="text-slate-500">No follow-up</span>}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span>{lead.lastContactedAt ? `Last: ${formatRelative(lead.lastContactedAt)}` : 'Not contacted'}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-slate-300">
                      <Phone className="w-3 h-3 text-slate-500" />
                      {lead.totalCalls}
                    </span>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap">
                <div className="flex items-center gap-0.5">
                  <Link to={`/leads/${lead._id}`} className="btn-icon p-1.5" title="View">
                    <Eye className="w-4 h-4" />
                  </Link>
                  <button onClick={() => onCall && onCall(lead)} className="btn-icon p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" title="Call">
                    <Phone className="w-4 h-4" />
                  </button>
                  <Link to={`/leads/${lead._id}/edit`} className="btn-icon p-1.5" title="Edit">
                    <Edit className="w-4 h-4" />
                  </Link>
                  {canDelete && (
                    <button onClick={() => onDelete && onDelete(lead)} className="btn-icon p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10" title="Delete">
                      <Trash2 className="w-4 h-4" />
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
  )
}

const TableHeader = () => (
  <tr>
    <th>POC &amp; Business</th>
    <th>Contact &amp; Reach</th>
    <th>Status &amp; Priority</th>
    <th>Team</th>
    <th>Activity &amp; Follow-up</th>
    <th>Actions</th>
  </tr>
)
