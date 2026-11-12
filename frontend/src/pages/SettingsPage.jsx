import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'

export const SettingsPage = () => {
  const { user } = useAuth()

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted mt-1">Account and system settings</p>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-slate-300 mb-4">Profile</h3>
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="xl" />
          <div>
            <p className="text-xl font-bold text-slate-100">{user?.name}</p>
            <p className="text-slate-500">{user?.email}</p>
            <p className="text-xs text-slate-600 mt-1">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
