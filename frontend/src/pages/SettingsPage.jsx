import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'
import { authService } from '../services/auth.service'
import { Edit2, Check, X, User, Mail, Phone, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export const SettingsPage = () => {
  const { user, updateCurrentUser } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setPhone(user.phone || '')
    }
  }, [user])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setSaving(true)
    try {
      const res = await authService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
      })
      const updatedUser = res.data.data
      updateCurrentUser(updatedUser)
      setIsEditing(false)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.name || '')
    setPhone(user?.phone || '')
    setIsEditing(false)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-muted mt-1">Account and system settings</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-kb-sand mb-5">
          <div>
            <h3 className="section-header">Profile Information</h3>
            <p className="text-xs text-kb-muted mt-0.5">Manage your personal account details</p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Profile
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <Avatar name={user?.name} size="xl" />
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-kb-cocoa">{user?.name}</p>
                <span className="badge badge-accent text-[11px] uppercase tracking-wider font-semibold">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-kb-muted">
                <Mail className="w-3.5 h-3.5 text-kb-umber" />
                <span>{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex items-center gap-2 text-sm text-kb-muted">
                  <Phone className="w-3.5 h-3.5 text-kb-umber" />
                  <span>{user?.phone}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 mb-2">
              <Avatar name={name || user?.name} size="lg" />
              <div>
                <p className="text-sm font-semibold text-kb-cocoa">Editing Profile</p>
                <p className="text-xs text-kb-muted">Change your display name below</p>
              </div>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-kb-umber" />
                Full Name <span className="text-kb-strawberry">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input w-full text-sm"
                placeholder="Enter your name"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-kb-umber" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input w-full text-sm bg-kb-parchment/60 text-kb-muted cursor-not-allowed"
              />
              <p className="text-[11px] text-kb-muted mt-1">
                Admin email is configured via system security settings.
              </p>
            </div>

            <div>
              <label className="label flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-kb-umber" />
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input w-full text-sm"
                placeholder="Optional contact number"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-kb-sand">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
