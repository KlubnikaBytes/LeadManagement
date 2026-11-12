import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAnalytics } from '../hooks/useAnalytics'
import { useAuth } from '../context/AuthContext'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import {
  Users, Phone, TrendingUp, Calendar, AlertCircle, CheckCircle2,
  XCircle, Clock, Plus, Upload, BarChart3, Star,
} from 'lucide-react'
import { useSocketEvent } from '../hooks/useSocketEvent'

const StatCard = ({ icon: Icon, label, value, color, link, change }) => (
  <Link to={link || '#'} className="stat-card group cursor-pointer">
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-2xl font-bold text-slate-100">{value?.toLocaleString() ?? '—'}</p>
      <p className="text-sm text-slate-500 mt-0.5 truncate">{label}</p>
    </div>
  </Link>
)

export const DashboardPage = () => {
  const { stats, loading, error, fetchDashboard } = useAnalytics()
  const { user, isAdmin, isTeamLeader, canImport } = useAuth()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  useSocketEvent('lead_updated', fetchDashboard)
  useSocketEvent('user_updated', fetchDashboard)

  if (loading && !stats) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted mt-1">Welcome back, {user?.name}! Here's what's happening.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/leads/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
          {canImport && (
            <Link to="/import" className="btn-secondary">
              <Upload className="w-4 h-4" />
              Import
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Today's Follow-ups", icon: Calendar, count: stats?.todayFollowUps, link: '/followups?range=today', color: 'bg-blue-500' },
          { label: 'Overdue', icon: AlertCircle, count: stats?.overdueFollowUps, link: '/followups?range=overdue', color: 'bg-red-500' },
          { label: 'New Leads', icon: Star, count: stats?.newLeads, link: '/leads?status=NEW', color: 'bg-emerald-500' },
          { label: 'Interested', icon: TrendingUp, count: stats?.interestedLeads, link: '/leads?status=INTERESTED', color: 'bg-purple-500' },
        ].map(item => (
          <Link key={item.label} to={item.link} className="card p-4 hover:border-slate-700 transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.color}/20 flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 text-${item.color.split('-')[1]}-400`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-100">{item.count ?? '—'}</p>
                <p className="text-xs text-slate-500">{item.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats?.totalLeads} color="bg-primary-600" link="/leads" />
        <StatCard icon={Star} label="New Leads" value={stats?.newLeads} color="bg-slate-600" link="/leads?status=NEW" />
        <StatCard icon={Phone} label="Total Calls" value={stats?.totalCalls} color="bg-blue-600" link="/calls" />
        <StatCard icon={TrendingUp} label="Interested" value={stats?.interestedLeads} color="bg-emerald-600" link="/leads?status=INTERESTED" />
        <StatCard icon={Clock} label="Call Later" value={stats?.callLaterLeads} color="bg-amber-600" link="/leads?status=CALL_LATER" />
        <StatCard icon={Calendar} label="Follow-up" value={stats?.followUpLeads} color="bg-purple-600" link="/leads?status=FOLLOW_UP" />
        <StatCard icon={CheckCircle2} label="Converted" value={stats?.convertedLeads} color="bg-green-600" link="/leads?status=CONVERTED" />
        <StatCard icon={XCircle} label="Not Interested" value={stats?.notInterestedLeads} color="bg-red-600" link="/leads?status=NOT_INTERESTED" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Follow-ups */}
        <div className="md:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Today's Follow-ups</h2>
            <Link to="/followups?range=today" className="text-sm text-primary-400 hover:text-primary-300">View all →</Link>
          </div>
          {stats?.todayFollowUps === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No follow-ups scheduled for today</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-400">{stats?.todayFollowUps}</p>
                <p className="text-sm text-slate-400">follow-ups due today</p>
              </div>
              <Link to="/followups?range=today" className="ml-auto btn-secondary text-sm">View</Link>
            </div>
          )}
          {stats?.overdueFollowUps > 0 && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-400">{stats?.overdueFollowUps}</p>
                <p className="text-sm text-slate-400">overdue follow-ups</p>
              </div>
              <Link to="/followups?range=overdue" className="ml-auto btn-danger text-sm">Handle Now</Link>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card p-5">
          <h2 className="section-header mb-4">Conversion Overview</h2>
          <div className="space-y-3">
            {[
              { label: 'Conversion Rate', value: stats?.totalLeads ? `${((stats?.convertedLeads / stats?.totalLeads) * 100).toFixed(1)}%` : '0%', color: 'text-emerald-400' },
              { label: 'Lost Leads', value: stats?.lostLeads || 0, color: 'text-red-400' },
              { label: 'In Pipeline', value: (stats?.interestedLeads || 0) + (stats?.followUpLeads || 0), color: 'text-primary-400' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          <Link to="/analytics" className="btn-secondary w-full justify-center mt-4 text-sm">
            <BarChart3 className="w-4 h-4" />
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}
