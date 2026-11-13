import { Link } from 'react-router-dom'
import { Phone, Eye, Edit, Trash2, Lock } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge'
import { Avatar } from '../ui/Avatar'
import { formatDate, formatRelative, isFollowUpOverdue, isFollowUpToday } from '../../utils/helpers'

export const LeadTable = ({ leads, onCall, onDelete, canDelete, loading }) => {
  if (loading) {
    return (
      <>
        <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-kb-sand bg-kb-cream space-y-3 animate-pulse">
              <div className="h-4 bg-kb-cream-deep rounded w-1/2" />
              <div className="h-3 bg-kb-cream-deep rounded w-1/3" />
              <div className="h-6 bg-kb-cream-deep rounded w-2/3" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block table-container border-0 rounded-none">
          <table className="table">
            <thead>
              <TableHeader />
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j}><div className="h-4 bg-kb-cream-deep rounded w-3/4" /></td>
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
    <div>
      {/* Mobile & Tablet Card Grid */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 p-3 sm:p-4">
        {leads.map(lead => {
          const canViewSales = lead.canViewSalesSection !== false
          return (
            <div key={lead._id} className="p-4 rounded-xl bg-kb-cream-deep border border-kb-sand space-y-3 hover:border-kb-umber transition-colors">
              <div className="flex items-start justify-between gap-2">
                <Link to={`/leads/${lead._id}`} className="min-w-0 flex-1 group">
                  <p className="font-bold text-base text-kb-cocoa group-hover:text-kb-strawberry transition-colors truncate">
                    {lead.companyName || lead.name || '—'}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap text-xs text-kb-muted mt-0.5">
                    <span className="text-kb-text font-medium">{lead.name}</span>
                    {lead.pocJobTitle && (
                      <span className="text-[11px] text-kb-cocoa bg-kb-white px-1.5 py-0.5 rounded border border-kb-sand font-medium whitespace-nowrap">
                        {lead.pocJobTitle}
                      </span>
                    )}
                    {(lead.businessCategory || lead.businessType) && (
                      <span className="text-kb-umber">· {lead.businessCategory || lead.businessType}</span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {canViewSales ? (
                    <StatusBadge status={lead.status} />
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] bg-kb-amber-bg text-kb-amber-fg px-2 py-0.5 rounded-full border border-kb-amber-border font-medium">
                      <Lock className="w-3 h-3" /> Client Info
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <a href={`tel:${lead.phone}`} className="text-kb-strawberry hover:text-kb-strawberry-hover font-mono font-semibold">
                  {lead.phone}
                </a>
                <span className="text-kb-sand">•</span>
                <span className="text-kb-cocoa bg-kb-white px-2 py-0.5 rounded-full border border-kb-sand font-medium">
                  {lead.typeOfReach || lead.source}
                </span>
                {canViewSales && <PriorityBadge priority={lead.priority} />}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-kb-muted pt-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>Added: <strong className="text-kb-cocoa font-medium">{lead.createdBy?.name || '—'}</strong></span>
                  {lead.primaryAssignedTo && lead.primaryAssignedTo._id !== lead.assignedTo?._id && (
                    <span>Primary: <strong className="text-kb-strawberry font-medium">{lead.primaryAssignedTo.name}</strong></span>
                  )}
                  <span>Assigned: <strong className="text-kb-cocoa font-medium">{lead.assignedTo?.name || 'Unassigned'}</strong></span>
                  {canViewSales && lead.nextFollowUpAt && (
                    <span className={`font-medium ${isFollowUpOverdue(lead.nextFollowUpAt) ? 'text-kb-crimson' : isFollowUpToday(lead.nextFollowUpAt) ? 'text-kb-amber-fg' : 'text-kb-muted'}`}>
                      {isFollowUpOverdue(lead.nextFollowUpAt) ? '⚠ ' : isFollowUpToday(lead.nextFollowUpAt) ? '📅 ' : ''}
                      {formatDate(lead.nextFollowUpAt)}
                    </span>
                  )}
                </div>
                {canViewSales && (
                  <span className="inline-flex items-center gap-1 text-kb-cocoa font-medium">
                    <Phone className="w-3 h-3 text-kb-umber" />
                    {lead.totalCalls}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-kb-sand">
                <Link to={`/leads/${lead._id}`} className="btn-ghost text-xs py-1.5 px-2.5">
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
                {canViewSales && (
                  <>
                    <button onClick={() => onCall && onCall(lead)} className="btn-ghost text-xs py-1.5 px-2.5 text-kb-teal-fg hover:bg-kb-teal-bg">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </button>
                    <Link to={`/leads/${lead._id}/edit`} className="btn-ghost text-xs py-1.5 px-2.5">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Link>
                  </>
                )}
                {canDelete && (
                  <button onClick={() => onDelete && onDelete(lead)} className="btn-ghost text-xs py-1.5 px-2 text-kb-crimson hover:bg-kb-lost-bg" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Zero-Scroll Desktop Table */}
      <div className="hidden lg:block table-container border-0 rounded-none">
        <table className="table">
          <thead>
            <TableHeader />
          </thead>
          <tbody>
            {leads.map(lead => {
              const canViewSales = lead.canViewSalesSection !== false
              return (
                <tr key={lead._id}>
                  <td className="max-w-[250px]">
                    <Link to={`/leads/${lead._id}`} className="group block">
                      <p className="font-bold text-sm text-kb-cocoa group-hover:text-kb-strawberry transition-colors truncate">
                        {lead.companyName || lead.name || '—'}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap text-xs text-kb-muted mt-0.5 truncate">
                        <span className="text-kb-text font-medium">{lead.name}</span>
                        {lead.pocJobTitle && (
                          <span className="text-[11px] text-kb-cocoa bg-kb-cream-deep px-1.5 py-0.5 rounded border border-kb-sand font-medium whitespace-nowrap">
                            {lead.pocJobTitle}
                          </span>
                        )}
                        {(lead.businessCategory || lead.businessType) && (
                          <span className="text-kb-umber"> · {lead.businessCategory || lead.businessType}</span>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <a href={`tel:${lead.phone}`} className="text-kb-strawberry hover:text-kb-strawberry-hover font-mono text-sm font-medium block whitespace-nowrap">
                        {lead.phone}
                      </a>
                      <span className="inline-block text-kb-cocoa text-[11px] bg-kb-cream-deep px-2 py-0.5 rounded-full border border-kb-sand font-medium whitespace-nowrap">
                        {lead.typeOfReach || lead.source}
                      </span>
                    </div>
                  </td>
                  <td>
                    {canViewSales ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={lead.status} />
                        <PriorityBadge priority={lead.priority} />
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-kb-amber-bg text-kb-amber-fg px-2.5 py-0.5 rounded-full border border-kb-amber-border font-medium whitespace-nowrap">
                        <Lock className="w-3 h-3" /> Client Info Only
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-kb-muted">Added:</span>
                        {lead.createdBy ? (
                          <span className="inline-flex items-center gap-1 text-kb-cocoa font-medium">
                            <Avatar name={lead.createdBy.name} size="sm" />
                            {lead.createdBy.name}
                          </span>
                        ) : <span className="text-kb-taupe">—</span>}
                      </div>
                      {lead.primaryAssignedTo && lead.primaryAssignedTo._id !== lead.assignedTo?._id && (
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <span className="text-kb-muted">Primary:</span>
                          <span className="text-kb-strawberry font-medium">{lead.primaryAssignedTo.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <span className="text-kb-muted">Assigned:</span>
                        {lead.assignedTo ? (
                          <span className="text-kb-cocoa font-medium">{lead.assignedTo.name}</span>
                        ) : <span className="text-kb-umber">Unassigned</span>}
                      </div>
                    </div>
                  </td>
                  <td>
                    {canViewSales ? (
                      <div className="space-y-1 text-xs whitespace-nowrap">
                        <div>
                          {lead.nextFollowUpAt ? (
                            <span className={`font-medium ${isFollowUpOverdue(lead.nextFollowUpAt) ? 'text-kb-crimson' : isFollowUpToday(lead.nextFollowUpAt) ? 'text-kb-amber-fg' : 'text-kb-cocoa'}`}>
                              {isFollowUpOverdue(lead.nextFollowUpAt) ? '⚠ ' : isFollowUpToday(lead.nextFollowUpAt) ? '📅 ' : 'Follow-up: '}
                              {formatDate(lead.nextFollowUpAt)}
                            </span>
                          ) : <span className="text-kb-muted">No follow-up</span>}
                        </div>
                        <div className="flex items-center gap-2 text-kb-muted">
                          <span>{lead.lastContactedAt ? `Last: ${formatRelative(lead.lastContactedAt)}` : 'Not contacted'}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1 text-kb-cocoa font-medium">
                            <Phone className="w-3 h-3 text-kb-umber" />
                            {lead.totalCalls}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-kb-muted whitespace-nowrap">
                        <Lock className="w-3 h-3" /> Assigned Exec Only
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="flex items-center gap-0.5">
                      <Link to={`/leads/${lead._id}`} className="btn-icon p-1.5" title="View">
                        <Eye className="w-4 h-4" />
                      </Link>
                      {canViewSales && (
                        <>
                          <button onClick={() => onCall && onCall(lead)} className="btn-icon p-1.5 text-kb-teal-fg hover:bg-kb-teal-bg" title="Call">
                            <Phone className="w-4 h-4" />
                          </button>
                          <Link to={`/leads/${lead._id}/edit`} className="btn-icon p-1.5" title="Edit">
                            <Edit className="w-4 h-4" />
                          </Link>
                        </>
                      )}
                      {canDelete && (
                        <button onClick={() => onDelete && onDelete(lead)} className="btn-icon p-1.5 text-kb-crimson hover:bg-kb-lost-bg" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const TableHeader = () => (
  <tr>
    <th>Company &amp; POC</th>
    <th>Contact &amp; Reach</th>
    <th>Status &amp; Priority</th>
    <th>Team</th>
    <th>Activity &amp; Follow-up</th>
    <th>Actions</th>
  </tr>
)
