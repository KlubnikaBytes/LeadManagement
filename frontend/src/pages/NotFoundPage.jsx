import { Link } from 'react-router-dom'

export const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-950">
    <div className="text-center">
      <p className="text-8xl font-black text-slate-800 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-200 mb-2">Page Not Found</h1>
      <p className="text-slate-500 mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/dashboard" className="btn-primary">Go to Dashboard</Link>
    </div>
  </div>
)
