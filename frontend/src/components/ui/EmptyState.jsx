export const EmptyState = ({ icon = '📋', title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4 opacity-60">{icon}</div>
    <h3 className="text-lg font-semibold text-kb-cocoa mb-2">{title}</h3>
    {description && <p className="text-kb-muted text-sm mb-6 max-w-sm">{description}</p>}
    {action}
  </div>
)
