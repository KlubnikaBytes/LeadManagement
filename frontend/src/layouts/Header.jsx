import { useState, useEffect } from 'react'
import { Menu, Bell, Search, Plus, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Avatar } from '../components/ui/Avatar'
import { notificationsService } from '../services/notifications.service'
import { Link, useNavigate } from 'react-router-dom'
import { formatRelative } from '../utils/helpers'

export const Header = ({ onMenuClick }) => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await notificationsService.getAll({ limit: 10 })
      setNotifications(res.data.data)
      setUnreadCount(res.data.unreadCount)
    } catch {}
  }

  const handleMarkRead = async () => {
    try {
      await notificationsService.markAllRead()
      setUnreadCount(0)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch {}
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/leads?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="bg-slate-950 border-b border-slate-800 px-3 sm:px-4 lg:px-6 py-3 flex items-center justify-between gap-2 sm:gap-4 flex-shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden btn-icon flex-shrink-0" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        {searchOpen ? (
          <form onSubmit={handleSearch} className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0 max-w-md">
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="input flex-1 min-w-0 py-1.5 sm:py-2 text-sm"
            />
            <button type="submit" className="btn-primary text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 sm:py-2 flex-shrink-0">Go</button>
            <button type="button" onClick={() => setSearchOpen(false)} className="btn-icon flex-shrink-0" aria-label="Close search">
              <X className="w-4 h-4" />
            </button>
          </form>
        ) : (
          <button onClick={() => setSearchOpen(true)} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm">
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search leads...</span>
            <kbd className="hidden sm:inline text-xs bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-600">/</kbd>
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <Link to="/leads/new" className="btn-primary text-sm py-2 px-2.5 sm:px-4">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Lead</span>
        </Link>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="btn-icon relative" aria-label="Notifications">
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-[calc(100vw-1.5rem)] max-w-sm sm:w-80 card shadow-2xl z-50 animate-slide-up">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h3 className="font-semibold text-slate-200">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkRead} className="text-xs text-primary-400 hover:text-primary-300">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n._id} className={`p-3 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${!n.isRead ? 'bg-primary-500/5' : ''}`}>
                      <p className="text-sm font-medium text-slate-200">{n.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-xs text-slate-600 mt-1">{formatRelative(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <Avatar name={user?.name} size="sm" />
      </div>
    </header>
  )
}
