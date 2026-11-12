import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  LayoutDashboard, Users, Phone, Calendar, BarChart3, Upload,
  FileText, Settings, LogOut, ChevronDown, ChevronRight,
  UserCheck, AlertCircle, Star, XCircle, TrendingUp, Zap, X,
} from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '../components/ui/Avatar'

const NavItem = ({ to, icon: Icon, label, badge, end = false, onClick }) => {
  const location = useLocation()
  const currentPath = location.pathname
  const currentSearch = location.search
  const currentFull = currentPath + currentSearch

  let isActive = false
  if (to.includes('?')) {
    isActive = currentFull === to
  } else if (to === '/leads') {
    isActive = (currentPath === '/leads' && !currentSearch) || currentPath.startsWith('/leads/')
  } else if (end) {
    isActive = currentPath === to
  } else {
    isActive = currentPath === to || currentPath.startsWith(`${to}/`)
  }

  return (
    <Link to={to} onClick={onClick} className={`sidebar-link ${isActive ? 'active' : ''}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {badge && <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{badge}</span>}
    </Link>
  )
}

const NavGroup = ({ icon: Icon, label, children }) => {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(true)

  return (
    <div>
      <button onClick={() => setOpen(!open)} className="sidebar-link w-full">
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-800 pl-3">{children}</div>}
    </div>
  )
}

export const Sidebar = ({ onClose }) => {
  const { user, logout, isAdmin, isTeamLeader, canImport } = useAuth()

  return (
    <div className="flex flex-col h-full bg-slate-950 border-r border-slate-800">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-100 text-sm leading-none">KlubCRM</p>
            <p className="text-xs text-slate-500 mt-0.5">Sales Management</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden btn-icon" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" end onClick={onClose} />

        <div className="pt-2 pb-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Leads</p>
        </div>
        <NavItem to="/leads" icon={Users} label="All Leads" end onClick={onClose} />
        <NavItem to="/leads?status=NEW" icon={Star} label="New Leads" onClick={onClose} />
        <NavItem to="/leads?status=INTERESTED" icon={TrendingUp} label="Interested" onClick={onClose} />
        <NavItem to="/leads?status=FOLLOW_UP" icon={Calendar} label="Follow-ups" onClick={onClose} />
        <NavItem to="/leads?status=CONVERTED" icon={UserCheck} label="Converted" onClick={onClose} />
        <NavItem to="/leads?status=NOT_INTERESTED" icon={XCircle} label="Not Interested" onClick={onClose} />
        <NavItem to="/leads?followUp=overdue" icon={AlertCircle} label="Overdue" onClick={onClose} />

        <div className="pt-3 pb-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Activity</p>
        </div>
        <NavItem to="/calls" icon={Phone} label="Call Logs" onClick={onClose} />
        <NavItem to="/followups" icon={Calendar} label="Follow-ups" onClick={onClose} />

        <div className="pt-3 pb-1">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Insights</p>
        </div>
        <NavItem to="/analytics" icon={BarChart3} label="Analytics" onClick={onClose} />
        <NavItem to="/reports" icon={FileText} label="Reports" onClick={onClose} />

        {(isAdmin || isTeamLeader) && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Management</p>
            </div>
            <NavItem to="/team" icon={Users} label="Team" onClick={onClose} />
          </>
        )}

        {canImport && <NavItem to="/import" icon={Upload} label="Import Leads" onClick={onClose} />}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-3 mb-1">Admin</p>
            </div>
            <NavItem to="/settings" icon={Settings} label="Settings" onClick={onClose} />
          </>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-800 transition-colors">
          <Avatar name={user?.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="btn-icon text-slate-500 hover:text-red-400 hover:bg-red-500/10">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
