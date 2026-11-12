import { Link } from 'react-router-dom'

export const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-kb-cream">
    <div className="text-center">
      <p className="text-8xl font-black text-kb-sand mb-4">404</p>
      <h1 className="text-2xl font-bold text-kb-cocoa mb-2">Page Not Found</h1>
      <p className="text-kb-muted mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary inline-flex">Go to Dashboard</Link>
    </div>
  </div>
)
