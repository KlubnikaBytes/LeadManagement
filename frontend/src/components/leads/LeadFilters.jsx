import { X, Calendar } from 'lucide-react'
import { STATUSES, SOURCES, PRIORITIES } from '../../utils/constants'
import { Select } from '../ui/Select'
import { useState, useEffect } from 'react'
import { leadsService } from '../../services/leads.service'

export const LeadFilters = ({ filters, onChange, salesUsers = [] }) => {
  const hasFilters = Object.entries(filters).some(([k, v]) => {
    if (k === 'dateField') return false
    return v && v !== ''
  })
  const [dynamicOptions, setDynamicOptions] = useState({ sources: [], statuses: [] })

  useEffect(() => {
    leadsService.getOptions().then(res => setDynamicOptions(res.data.data)).catch(() => {})
  }, [])

  const handleChange = (key, value) => onChange({ ...filters, [key]: value })

  const clearAll = () => onChange({
    status: '',
    source: '',
    member: '',
    createdBy: '',
    assignedTo: '',
    priority: '',
    followUp: '',
    dateField: 'createdAt',
    dateRange: '',
    startDate: '',
    endDate: '',
  })

  const followUpOptions = [
    { value: 'today', label: "Today's Follow-ups" },
    { value: 'overdue', label: 'Overdue' },
    { value: 'tomorrow', label: "Tomorrow's Follow-ups" },
    { value: 'this_week', label: 'This Week' },
    { value: 'none', label: 'No Follow-up Set' },
  ]

  const dateRangeOptions = [
    { value: 'today', label: 'Date: Today' },
    { value: 'yesterday', label: 'Date: Yesterday' },
    { value: 'last_7_days', label: 'Date: Last 7 Days' },
    { value: 'this_month', label: 'Date: This Month' },
    { value: 'last_month', label: 'Date: Last Month' },
    { value: 'custom', label: 'Date: Custom Range...' },
  ]

  const dateFieldOptions = [
    { value: 'createdAt', label: 'On: Created Date' },
    { value: 'lastContactedAt', label: 'On: Last Contact' },
    { value: 'nextFollowUpAt', label: 'On: Next Follow-up' },
    { value: 'updatedAt', label: 'On: Last Updated' },
  ]

  const isDateFilterActive = Boolean(filters.dateRange || filters.startDate || filters.endDate)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:flex xl:flex-wrap xl:items-center gap-2.5 sm:gap-3">
        <Select
          value={filters.status || ''}
          onChange={(v) => handleChange('status', v)}
          options={Array.from(new Set([...STATUSES.map(s => s.value), ...dynamicOptions.statuses])).map(s => {
            const found = STATUSES.find(st => st.value === s)
            return found || { value: s, label: s }
          })}
          placeholder="All Statuses"
          className="w-full xl:w-40"
        />
        <Select
          value={filters.source || ''}
          onChange={(v) => handleChange('source', v)}
          options={Array.from(new Set([...SOURCES, ...dynamicOptions.sources]))}
          placeholder="Type of Reach"
          className="w-full xl:w-44"
        />
        <Select
          value={filters.priority || ''}
          onChange={(v) => handleChange('priority', v)}
          options={PRIORITIES.map(p => ({ value: p, label: p.charAt(0) + p.slice(1).toLowerCase() }))}
          placeholder="All Priorities"
          className="w-full xl:w-36"
        />
        <Select
          value={filters.followUp || ''}
          onChange={(v) => handleChange('followUp', v)}
          options={followUpOptions}
          placeholder="Follow-up"
          className="w-full xl:w-44"
        />

        {/* Date Range Preset Filter */}
        <Select
          value={filters.dateRange || ''}
          onChange={(v) => {
            if (v !== 'custom') {
              onChange({ ...filters, dateRange: v, startDate: '', endDate: '' })
            } else {
              handleChange('dateRange', v)
            }
          }}
          options={dateRangeOptions}
          placeholder="Date: All Time"
          className={`w-full xl:w-44 ${isDateFilterActive ? 'border-kb-strawberry text-kb-strawberry font-medium' : ''}`}
        />

        {/* Date Field Type (Created Date, Last Contact, Next Follow-up, Updated) */}
        {isDateFilterActive && (
          <Select
            value={filters.dateField || 'createdAt'}
            onChange={(v) => handleChange('dateField', v)}
            options={dateFieldOptions}
            className="w-full xl:w-44 text-kb-cocoa font-medium bg-kb-cream-deep border-kb-sand"
          />
        )}

        {salesUsers.length > 0 && (
          <>
            <Select
              value={filters.member || ''}
              onChange={(v) => handleChange('member', v)}
              options={salesUsers.map(u => ({ value: u._id, label: u.name }))}
              placeholder="Member (Any)"
              className="w-full xl:w-40"
            />
            <Select
              value={filters.createdBy || ''}
              onChange={(v) => handleChange('createdBy', v)}
              options={salesUsers.map(u => ({ value: u._id, label: u.name }))}
              placeholder="Added By: All"
              className="w-full xl:w-40"
            />
            <Select
              value={filters.assignedTo || ''}
              onChange={(v) => handleChange('assignedTo', v)}
              options={[
                { value: 'unassigned', label: 'Unassigned' },
                ...salesUsers.map(u => ({ value: u._id, label: u.name })),
              ]}
              placeholder="Assigned To: All"
              className="w-full xl:w-44"
            />
          </>
        )}
        {hasFilters && (
          <button onClick={clearAll} className="btn-ghost text-sm text-kb-crimson hover:text-kb-crimson-hover hover:bg-kb-lost-bg justify-center sm:justify-start">
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      {/* Custom Date Range Picker Bar */}
      {filters.dateRange === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 bg-kb-cream-deep rounded-xl border border-kb-sand animate-fade-in text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-kb-cocoa">
            <Calendar className="w-4 h-4 text-kb-strawberry" />
            <span>Custom Date Range:</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-kb-muted font-medium">From:</label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="input py-1 px-2.5 text-xs bg-kb-white border border-kb-sand rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-kb-muted font-medium">To:</label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="input py-1 px-2.5 text-xs bg-kb-white border border-kb-sand rounded-lg"
            />
          </div>
          {(filters.startDate || filters.endDate) && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, startDate: '', endDate: '' })}
              className="text-xs text-kb-crimson hover:underline font-semibold ml-auto sm:ml-0"
            >
              Reset Custom Dates
            </button>
          )}
        </div>
      )}
    </div>
  )
}
