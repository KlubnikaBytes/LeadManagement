import { X } from 'lucide-react'
import { STATUSES, SOURCES, PRIORITIES } from '../../utils/constants'
import { Select } from '../ui/Select'
import { useState, useEffect } from 'react'
import { leadsService } from '../../services/leads.service'

export const LeadFilters = ({ filters, onChange, salesUsers = [] }) => {
  const hasFilters = Object.values(filters).some(v => v && v !== '')
  const [dynamicOptions, setDynamicOptions] = useState({ sources: [], statuses: [] })

  useEffect(() => {
    leadsService.getOptions().then(res => setDynamicOptions(res.data.data)).catch(() => {})
  }, [])

  const handleChange = (key, value) => onChange({ ...filters, [key]: value })

  const clearAll = () => onChange({ status: '', source: '', member: '', createdBy: '', assignedTo: '', priority: '', followUp: '' })

  const followUpOptions = [
    { value: 'today', label: "Today's Follow-ups" },
    { value: 'overdue', label: 'Overdue' },
    { value: 'tomorrow', label: "Tomorrow's Follow-ups" },
    { value: 'this_week', label: 'This Week' },
    { value: 'none', label: 'No Follow-up Set' },
  ]

  return (
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
        <button onClick={clearAll} className="btn-ghost text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 justify-center sm:justify-start">
          <X className="w-4 h-4" />
          Clear Filters
        </button>
      )}
    </div>
  )
}
