import { formatDateTime } from '../../utils/helpers'
import { Avatar } from '../ui/Avatar'

const ACTIVITY_ICONS = {
  LEAD_CREATED: '🌱',
  LEAD_UPDATED: '✏️',
  STATUS_CHANGED: '🔄',
  CALL_LOGGED: '📞',
  NOTE_ADDED: '📝',
  FOLLOWUP_CREATED: '📅',
  FOLLOWUP_COMPLETED: '✅',
  FOLLOWUP_RESCHEDULED: '🔁',
  LEAD_ASSIGNED: '👤',
  LEAD_REASSIGNED: '👥',
  LEAD_CONVERTED: '🎉',
  LEAD_DELETED: '🗑️',
}

const ACTIVITY_COLORS = {
  LEAD_CREATED: 'border-emerald-500/50 bg-emerald-500/10',
  STATUS_CHANGED: 'border-blue-500/50 bg-blue-500/10',
  CALL_LOGGED: 'border-purple-500/50 bg-purple-500/10',
  NOTE_ADDED: 'border-amber-500/50 bg-amber-500/10',
  FOLLOWUP_CREATED: 'border-cyan-500/50 bg-cyan-500/10',
  FOLLOWUP_COMPLETED: 'border-green-500/50 bg-green-500/10',
  LEAD_CONVERTED: 'border-green-500/50 bg-green-500/10',
  LEAD_ASSIGNED: 'border-slate-500/50 bg-slate-500/10',
  LEAD_REASSIGNED: 'border-indigo-500/50 bg-indigo-500/10',
  default: 'border-slate-700 bg-slate-800/50',
}

export const ActivityTimeline = ({ activities = [], loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4">
            <div className="w-10 h-10 bg-slate-800 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-800 rounded w-3/4" />
              <div className="h-3 bg-slate-800 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities.length) {
    return <p className="text-slate-500 text-sm text-center py-8">No activity recorded yet</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-800" />
      <div className="space-y-4">
        {activities.map((activity, idx) => {
          const icon = ACTIVITY_ICONS[activity.type] || '📌'
          const colorClass = ACTIVITY_COLORS[activity.type] || ACTIVITY_COLORS.default
          return (
            <div key={activity._id || idx} className="relative flex gap-4 animate-fade-in">
              <div className={`relative z-10 w-10 h-10 rounded-full border flex items-center justify-center text-base flex-shrink-0 ${colorClass}`}>
                {icon}
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{activity.description}</p>
                    {activity.user && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar name={activity.user.name} size="xs" />
                        <span className="text-xs text-slate-500">{activity.user.name}</span>
                      </div>
                    )}
                    {activity.metadata?.notes && (
                      <p className="text-xs text-slate-400 mt-1.5 bg-slate-800 rounded-lg p-2 italic">
                        "{activity.metadata.notes}"
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 whitespace-nowrap flex-shrink-0">
                    {formatDateTime(activity.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
