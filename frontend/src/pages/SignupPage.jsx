import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Eye, EyeOff, UserPlus } from 'lucide-react'

export const SignupPage = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const { signup, loading } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await signup(name, email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-kb-cream flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-col justify-center px-16 w-1/2 kb-brand-panel border-r border-kb-cocoa">
        <div className="max-w-md">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-kb-cream p-1.5 ring-2 ring-kb-strawberry flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/klubnika-logo.png" alt="Klubnika Bytes" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-kb-white">KlubCRM</h1>
              <p className="text-kb-taupe text-sm">Sales Management System</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-kb-white mb-4 leading-tight">
            Set up your <span className="text-kb-coral">admin account</span> to get started.
          </h2>
          <p className="text-kb-dark-muted text-lg mb-10">
            Create the first admin account to set up your team, import leads, and manage your entire sales pipeline.
          </p>
        </div>
      </div>

      {/* Right - Signup Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 bg-kb-cream">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-full bg-kb-white p-1 ring-2 ring-kb-strawberry flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/klubnika-logo.png" alt="Klubnika Bytes" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-kb-cocoa">KlubCRM</h1>
              <p className="text-xs text-kb-muted">Klubnika Bytes</p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-kb-cocoa">Create Admin Account</h2>
              <p className="text-kb-muted mt-1">Register the main admin for the CRM</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-kb-lost-bg border border-kb-lost-border rounded-xl text-kb-crimson text-sm font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label" htmlFor="password">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-kb-umber hover:text-kb-cocoa">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-kb-sand border-t-kb-white animate-spin" />
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-kb-sand text-center">
              <p className="text-sm text-kb-muted">
                Already have an account? <a href="/login" className="text-kb-strawberry hover:text-kb-strawberry-hover font-semibold">Sign In</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
