import { STATUS_LABELS, PRIORITY_LABELS } from '../../utils/constants'

export const StatusBadge = ({ status, size = 'sm' }) => {
  const label = STATUS_LABELS[status] || status
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-sm' : 'px-2.5 py-0.5 text-xs'
  return (
    <span className={`badge font-semibold ${sizeClass} status-${status}`}>
      {label}
    </span>
  )
}

export const PriorityBadge = ({ priority }) => {
  const label = PRIORITY_LABELS[priority] || priority
  const icons = { LOW: '↓', MEDIUM: '→', HIGH: '↑', URGENT: '⚡' }
  return (
    <span className={`badge text-xs font-semibold priority-${priority}`}>
      {icons[priority]} {label}
    </span>
  )
}
