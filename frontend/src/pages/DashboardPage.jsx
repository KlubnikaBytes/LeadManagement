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

const StatCard = ({ icon: Icon, label, value, highlight = false, iconBg = 'bg-kb-cream-deep', iconColor = 'text-kb-cocoa', link }) => (
  <Link
    to={link || '#'}
    className={`rounded-xl p-5 flex items-start gap-4 transition-all duration-200 cursor-pointer group border ${
      highlight
        ? 'bg-kb-cocoa border-kb-espresso text-kb-white shadow-sm hover:bg-kb-cocoa-hover'
        : 'bg-kb-white border-kb-sand text-kb-text shadow-sm hover:border-kb-umber'
    }`}
  >
    <div className={`w-12 h-12 rounded-xl ${highlight ? 'bg-kb-dark-surface border border-kb-dark-border' : iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
      <Icon className={`w-6 h-6 ${highlight ? 'text-kb-coral' : iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className={`text-2xl font-bold ${highlight ? 'text-kb-coral' : 'text-kb-cocoa'}`}>{value?.toLocaleString() ?? '—'}</p>
      <p className={`text-sm mt-0.5 truncate ${highlight ? 'text-kb-white' : 'text-kb-muted'}`}>{label}</p>
    </div>
  </Link>
)

export const DashboardPage = () => {
  const { stats, loading, error, fetchDashboard } = useAnalytics()
  const { user, canImport } = useAuth()

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
          { label: "Today's Follow-ups", icon: Calendar, count: stats?.todayFollowUps, link: '/followups?range=today', iconBg: 'bg-kb-amber-bg', iconColor: 'text-kb-amber-fg', numColor: 'text-kb-cocoa' },
          { label: 'Overdue', icon: AlertCircle, count: stats?.overdueFollowUps, link: '/followups?range=overdue', iconBg: 'bg-kb-lost-bg', iconColor: 'text-kb-crimson', numColor: 'text-kb-crimson' },
          { label: 'New Leads', icon: Star, count: stats?.newLeads, link: '/leads?status=NEW', iconBg: 'bg-kb-cream-deep', iconColor: 'text-kb-cocoa', numColor: 'text-kb-cocoa' },
          { label: 'Interested', icon: TrendingUp, count: stats?.interestedLeads, link: '/leads?status=INTERESTED', iconBg: 'bg-kb-teal-bg', iconColor: 'text-kb-teal-fg', numColor: 'text-kb-teal-fg' },
        ].map(item => (
          <Link key={item.label} to={item.link} className="card p-4 hover:border-kb-umber transition-colors group">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${item.iconBg} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-xl font-bold ${item.numColor}`}>{item.count ?? '—'}</p>
                <p className="text-xs text-kb-muted truncate">{item.label}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Leads" value={stats?.totalLeads} highlight link="/leads" />
        <StatCard icon={Star} label="New Leads" value={stats?.newLeads} iconBg="bg-kb-new-bg" iconColor="text-kb-new-fg" link="/leads?status=NEW" />
        <StatCard icon={Phone} label="Total Calls" value={stats?.totalCalls} iconBg="bg-kb-umber-bg" iconColor="text-kb-umber-fg" link="/calls" />
        <StatCard icon={TrendingUp} label="Interested" value={stats?.interestedLeads} iconBg="bg-kb-teal-bg" iconColor="text-kb-teal-fg" link="/leads?status=INTERESTED" />
        <StatCard icon={Clock} label="Call Later" value={stats?.callLaterLeads} iconBg="bg-kb-amber-bg" iconColor="text-kb-amber-fg" link="/leads?status=CALL_LATER" />
        <StatCard icon={Calendar} label="Follow-up" value={stats?.followUpLeads} iconBg="bg-kb-umber-bg" iconColor="text-kb-umber-fg" link="/leads?status=FOLLOW_UP" />
        <StatCard icon={CheckCircle2} label="Converted" value={stats?.convertedLeads} highlight link="/leads?status=CONVERTED" />
        <StatCard icon={XCircle} label="Not Interested" value={stats?.notInterestedLeads} iconBg="bg-kb-cold-bg" iconColor="text-kb-cold-fg" link="/leads?status=NOT_INTERESTED" />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Today's Follow-ups */}
        <div className="md:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-header">Today's Follow-ups</h2>
            <Link to="/followups?range=today" className="text-sm text-kb-strawberry hover:text-kb-strawberry-hover font-medium">View all →</Link>
          </div>
          {stats?.todayFollowUps === 0 ? (
            <div className="text-center py-8 text-kb-muted">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50 text-kb-umber" />
              <p className="text-sm">No follow-ups scheduled for today</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-kb-amber-bg border border-kb-amber-border rounded-xl">
              <div className="w-12 h-12 bg-kb-white rounded-xl border border-kb-amber-border flex items-center justify-center">
                <Calendar className="w-6 h-6 text-kb-amber-fg" />
              </div>
              <div>
                <p className="text-2xl font-bold text-kb-amber-fg">{stats?.todayFollowUps}</p>
                <p className="text-sm text-kb-text">follow-ups due today</p>
              </div>
              <Link to="/followups?range=today" className="ml-auto btn-secondary text-sm">View</Link>
            </div>
          )}
          {stats?.overdueFollowUps > 0 && (
            <div className="flex items-center gap-3 p-4 bg-kb-lost-bg border border-kb-lost-border rounded-xl mt-3">
              <div className="w-12 h-12 bg-kb-white rounded-xl border border-kb-lost-border flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-kb-crimson" />
              </div>
              <div>
                <p className="text-2xl font-bold text-kb-crimson">{stats?.overdueFollowUps}</p>
                <p className="text-sm text-kb-text">overdue follow-ups</p>
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
              { label: 'Conversion Rate', value: stats?.totalLeads ? `${((stats?.convertedLeads / stats?.totalLeads) * 100).toFixed(1)}%` : '0%', color: 'text-kb-won-fg' },
              { label: 'Lost Leads', value: stats?.lostLeads || 0, color: 'text-kb-crimson' },
              { label: 'In Pipeline', value: (stats?.interestedLeads || 0) + (stats?.followUpLeads || 0), color: 'text-kb-strawberry' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-kb-cream-deep border border-kb-sand rounded-xl">
                <span className="text-sm text-kb-muted">{item.label}</span>
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
