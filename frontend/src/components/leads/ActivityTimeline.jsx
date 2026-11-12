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
  LEAD_CREATED: 'border-kb-teal-border bg-kb-teal-bg',
  STATUS_CHANGED: 'border-kb-amber-border bg-kb-amber-bg',
  CALL_LOGGED: 'border-kb-umber-border bg-kb-umber-bg',
  NOTE_ADDED: 'border-kb-amber-border bg-kb-amber-bg',
  FOLLOWUP_CREATED: 'border-kb-umber-border bg-kb-umber-bg',
  FOLLOWUP_COMPLETED: 'border-kb-won-border bg-kb-won-bg',
  LEAD_CONVERTED: 'border-kb-won-border bg-kb-won-bg',
  LEAD_ASSIGNED: 'border-kb-sand bg-kb-cream-deep',
  LEAD_REASSIGNED: 'border-kb-lost-border bg-kb-strawberry-tint',
  default: 'border-kb-sand bg-kb-cream-deep',
}

export const ActivityTimeline = ({ activities = [], loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse flex gap-4">
            <div className="w-10 h-10 bg-kb-cream-deep rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-kb-cream-deep rounded w-3/4" />
              <div className="h-3 bg-kb-cream-deep rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities.length) {
    return <p className="text-kb-muted text-sm text-center py-8">No activity recorded yet</p>
  }

  return (
    <div className="relative">
      <div className="absolute left-5 top-0 bottom-0 w-px bg-kb-sand" />
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
                    <p className="text-sm font-medium text-kb-cocoa">{activity.description}</p>
                    {activity.user && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Avatar name={activity.user.name} size="xs" />
                        <span className="text-xs text-kb-muted">{activity.user.name}</span>
                      </div>
                    )}
                    {activity.metadata?.notes && (
                      <p className="text-xs text-kb-text mt-1.5 bg-kb-cream-deep border border-kb-sand rounded-lg p-2 italic">
                        "{activity.metadata.notes}"
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-kb-umber whitespace-nowrap flex-shrink-0">
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
