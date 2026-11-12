export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} ${className}`}>
      <div className="w-full h-full rounded-full border-2 border-kb-sand border-t-kb-strawberry animate-spin" />
    </div>
  )
}

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-kb-cream">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-kb-muted text-sm animate-pulse">Loading...</p>
    </div>
  </div>
)

export const FullPageLoader = ({ message = 'Loading...' }) => (
  <div className="flex-1 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-kb-muted text-sm">{message}</p>
    </div>
  </div>
)
