import { useState, useMemo, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { Phone, Eye, Edit, Trash2, Lock, ChevronDown, ChevronRight, Users, User } from 'lucide-react'
import { StatusBadge, PriorityBadge } from '../ui/StatusBadge'
import { Avatar } from '../ui/Avatar'
import { formatDate, formatRelative, isFollowUpOverdue, isFollowUpToday } from '../../utils/helpers'

export const LeadTable = ({ leads, onCall, onDelete, canDelete, loading }) => {
  const [expandedCompanies, setExpandedCompanies] = useState(new Set())

  const toggleExpand = (companyKey) => {
    if (!companyKey) return
    setExpandedCompanies(prev => {
      const next = new Set(prev)
      if (next.has(companyKey)) next.delete(companyKey)
      else next.add(companyKey)
      return next
    })
  }

  // Deduplicate and group rows by company name so a company with multiple POCs appears once as a parent row
  const groupedLeads = useMemo(() => {
    const seen = new Set()
    const result = []
    for (const lead of leads) {
      const key = lead.companyName?.trim() ? lead.companyName.trim().toLowerCase() : null
      if (key) {
        if (seen.has(key)) continue
        seen.add(key)
      }
      result.push(lead)
    }
    return result
  }, [leads])

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
        {groupedLeads.map(lead => {
          const canViewSales = lead.canViewSalesSection !== false
          const companyKey = lead.companyName?.trim() ? lead.companyName.trim().toLowerCase() : null
          const pocs = (lead.companyPocs && lead.companyPocs.length > 0) ? lead.companyPocs : [lead]
          const hasMultiplePocs = pocs.length > 1
          const isExpanded = companyKey ? expandedCompanies.has(companyKey) : false

          return (
            <div key={lead._id} className="p-4 rounded-xl bg-kb-cream-deep border border-kb-sand space-y-3 hover:border-kb-umber transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link to={`/leads/${lead._id}`} className="font-bold text-base text-kb-cocoa hover:text-kb-strawberry transition-colors truncate">
                      {lead.companyName || lead.name || '—'}
                    </Link>
                    {hasMultiplePocs && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleExpand(companyKey)
                        }}
                        className="text-[10px] bg-kb-strawberry-tint text-kb-strawberry font-bold px-2 py-0.5 rounded-full border border-kb-strawberry/20 flex items-center gap-1 hover:bg-kb-strawberry hover:text-kb-white transition-colors cursor-pointer"
                      >
                        <Users className="w-3 h-3" />
                        <span>{pocs.length} POCs</span>
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
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
                </div>
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
                  {lead.assignedByName && (
                    <span>By: <strong className="text-kb-strawberry font-medium">{lead.assignedByName}</strong></span>
                  )}
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

              {/* Mobile Expanded POCs Sub-list */}
              {hasMultiplePocs && isExpanded && (
                <div className="pt-2 border-t border-kb-sand space-y-2 animate-slide-up">
                  <p className="text-[11px] font-semibold text-kb-cocoa uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-kb-strawberry" />
                    All Company Contacts ({pocs.length})
                  </p>
                  <div className="space-y-1.5">
                    {pocs.map((poc, pIdx) => (
                      <div key={poc._id || pIdx} className="p-2.5 rounded-lg bg-kb-white border border-kb-sand flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <Link to={`/leads/${poc._id}`} className="font-semibold text-kb-cocoa hover:text-kb-strawberry transition-colors">
                            {poc.name}
                          </Link>
                          {poc.pocJobTitle && <span className="text-[10px] text-kb-muted ml-1.5">({poc.pocJobTitle})</span>}
                          <p className="text-[11px] font-mono text-kb-strawberry mt-0.5">{poc.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {poc.canViewSalesSection !== false && <StatusBadge status={poc.status} />}
                          <Link to={`/leads/${poc._id}`} className="btn-ghost text-xs py-1 px-2 text-kb-strawberry">
                            View →
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
            {groupedLeads.map(lead => {
              const canViewSales = lead.canViewSalesSection !== false
              const companyKey = lead.companyName?.trim() ? lead.companyName.trim().toLowerCase() : null
              const pocs = (lead.companyPocs && lead.companyPocs.length > 0) ? lead.companyPocs : [lead]
              const hasMultiplePocs = pocs.length > 1
              const isExpanded = companyKey ? expandedCompanies.has(companyKey) : false

              return (
                <Fragment key={lead._id}>
                  <tr className={isExpanded ? 'bg-kb-cream-deep/40' : ''}>
                    <td className="max-w-[270px]">
                      <div className="flex items-center gap-2">
                        {hasMultiplePocs && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleExpand(companyKey)
                            }}
                            className="w-5 h-5 rounded hover:bg-kb-sand flex items-center justify-center text-kb-umber hover:text-kb-cocoa transition-colors flex-shrink-0"
                            title={`${pocs.length} POCs available - Click to expand / collapse`}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-kb-strawberry" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-kb-umber" />
                            )}
                          </button>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/leads/${lead._id}`}
                              className="font-bold text-sm text-kb-cocoa hover:text-kb-strawberry transition-colors truncate"
                            >
                              {lead.companyName || lead.name || '—'}
                            </Link>
                            {hasMultiplePocs && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  toggleExpand(companyKey)
                                }}
                                className="text-[10px] bg-kb-strawberry-tint text-kb-strawberry font-bold px-1.5 py-0.2 rounded border border-kb-strawberry/20 hover:bg-kb-strawberry hover:text-kb-white transition-colors cursor-pointer whitespace-nowrap"
                                title="Click to view all POCs"
                              >
                                {pocs.length} POCs
                              </button>
                            )}
                          </div>
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
                        </div>
                      </div>
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
                        {lead.assignedByName && (
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="text-kb-muted">By:</span>
                            <span className="text-kb-strawberry font-medium">{lead.assignedByName}</span>
                          </div>
                        )}
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

                  {/* Desktop Accordion Sub-rows for Multiple POCs */}
                  {hasMultiplePocs && isExpanded && (
                    <tr className="bg-kb-cream/40 border-b border-kb-sand/80 animate-slide-up">
                      <td colSpan={6} className="p-0">
                        <div className="py-2.5 px-4 sm:px-8 bg-kb-cream-deep/60 border-l-[3px] border-kb-strawberry space-y-2">
                          <div className="flex items-center justify-between text-xs text-kb-muted pb-1 border-b border-kb-sand">
                            <span className="font-semibold text-kb-cocoa uppercase tracking-wider flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-kb-strawberry" />
                              All Contacts for {lead.companyName} ({pocs.length} POCs)
                            </span>
                            <span className="text-[11px] text-kb-muted">
                              Click any contact to view their individual record &amp; history
                            </span>
                          </div>
                          <div className="divide-y divide-kb-sand bg-kb-white rounded-xl border border-kb-sand overflow-hidden">
                            {pocs.map((poc, pIdx) => {
                              const pocCanViewSales = poc.canViewSalesSection !== false
                              return (
                                <div
                                  key={poc._id || pIdx}
                                  className="p-3 flex items-center justify-between gap-3 hover:bg-kb-cream-deep transition-colors text-xs"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-kb-cream flex items-center justify-center font-bold text-kb-cocoa border border-kb-sand flex-shrink-0">
                                      {poc.name?.charAt(0).toUpperCase() || 'P'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <Link
                                          to={`/leads/${poc._id}`}
                                          className="font-semibold text-sm text-kb-cocoa hover:text-kb-strawberry transition-colors truncate"
                                        >
                                          {poc.name}
                                        </Link>
                                        {poc.pocJobTitle && (
                                          <span className="text-[10px] bg-kb-cream-deep px-1.5 py-0.2 rounded border border-kb-sand text-kb-muted font-medium">
                                            {poc.pocJobTitle}
                                          </span>
                                        )}
                                        {poc._id === lead._id && (
                                          <span className="text-[10px] bg-kb-strawberry-tint text-kb-strawberry px-1.5 py-0.2 rounded font-semibold border border-kb-strawberry/20">
                                            Primary
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 mt-0.5 text-kb-muted font-mono">
                                        <a href={`tel:${poc.phone}`} className="text-kb-strawberry hover:underline">
                                          {poc.phone}
                                        </a>
                                        {poc.email && <span className="font-sans">· {poc.email}</span>}
                                        {poc.typeOfReach && <span className="font-sans">· {poc.typeOfReach}</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {pocCanViewSales ? (
                                      <>
                                        <StatusBadge status={poc.status} />
                                        <PriorityBadge priority={poc.priority} />
                                      </>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-[11px] bg-kb-amber-bg text-kb-amber-fg px-2 py-0.5 rounded-full border border-kb-amber-border font-medium">
                                        <Lock className="w-3 h-3" /> Client Info
                                      </span>
                                    )}
                                    {poc.assignedTo && (
                                      <span className="hidden md:inline text-kb-muted text-[11px]">
                                        Assigned: <strong className="text-kb-cocoa font-medium">{poc.assignedTo.name}</strong>
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1 ml-2">
                                      <Link to={`/leads/${poc._id}`} className="btn-ghost text-xs py-1 px-2.5" title="View details">
                                        <Eye className="w-3.5 h-3.5" /> View
                                      </Link>
                                      {pocCanViewSales && (
                                        <>
                                          <button
                                            type="button"
                                            onClick={() => onCall && onCall(poc)}
                                            className="btn-ghost text-xs py-1 px-2 text-kb-teal-fg hover:bg-kb-teal-bg"
                                            title="Call"
                                          >
                                            <Phone className="w-3.5 h-3.5" />
                                          </button>
                                          <Link to={`/leads/${poc._id}/edit`} className="btn-ghost text-xs py-1 px-2" title="Edit">
                                            <Edit className="w-3.5 h-3.5" />
                                          </Link>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
