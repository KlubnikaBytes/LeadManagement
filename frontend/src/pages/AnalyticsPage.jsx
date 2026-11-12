import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analytics.service'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { BarChart3, TrendingUp, Users, Target } from 'lucide-react'
import { STATUS_LABELS } from '../utils/constants'

const STATUS_COLORS = {
  NEW: '#6b7280',
  CONTACTED: '#3b82f6',
  INTERESTED: '#10b981',
  CALL_LATER: '#f59e0b',
  FOLLOW_UP: '#8b5cf6',
  NOT_INTERESTED: '#ef4444',
  CONVERTED: '#22c55e',
  LOST: '#64748b',
}

const DonutChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return <div className="text-center text-slate-500 py-8">No data</div>

  let cumulativePercent = 0
  const segments = data.map(item => {
    const percent = (item.count / total) * 100
    const start = cumulativePercent
    cumulativePercent += percent
    return { ...item, percent, start }
  })

  const radius = 60
  const circumference = 2 * Math.PI * radius
  let strokeOffset = 0

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 160 160" className="w-36 h-36 -rotate-90">
          {segments.map((seg, i) => {
            const dashArray = (seg.percent / 100) * circumference
            const dashOffset = -strokeOffset
            strokeOffset += dashArray
            const color = STATUS_COLORS[seg._id] || '#6b7280'
            return (
              <circle
                key={seg._id}
                cx="80" cy="80" r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth="20"
                strokeDasharray={`${dashArray} ${circumference - dashArray}`}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-100">{total}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        {segments.map(seg => (
          <div key={seg._id} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLORS[seg._id] || '#6b7280' }} />
            <span className="text-xs text-slate-400 truncate flex-1">{STATUS_LABELS[seg._id] || seg._id}</span>
            <span className="text-xs font-bold text-slate-200 flex-shrink-0">{seg.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const BarChartSimple = ({ data, keyField = '_id', valueField = 'count', color = '#6366f1' }) => {
  const max = Math.max(...data.map(d => d[valueField]), 1)
  return (
    <div className="space-y-2">
      {data.slice(0, 10).map(item => (
        <div key={item[keyField]} className="flex items-center gap-3">
          <span className="text-xs text-slate-500 w-28 truncate flex-shrink-0">{item[keyField]}</span>
          <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item[valueField] / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-bold text-slate-300 w-8 text-right">{item[valueField]}</span>
        </div>
      ))}
    </div>
  )
}

const FunnelChart = ({ data }) => {
  const max = data[0]?.count || 1
  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const width = (item.count / max) * 100
        const pct = i > 0 && data[i-1].count > 0 ? ((item.count / data[i-1].count) * 100).toFixed(0) : null
        return (
          <div key={item.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-300 font-medium">{item.stage}</span>
              <div className="flex items-center gap-2">
                {pct && <span className="text-xs text-slate-500">↓ {pct}%</span>}
                <span className="text-sm font-bold text-slate-100">{item.count.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-slate-800 rounded-full h-7 overflow-hidden">
              <div
                className="h-full rounded-full flex items-center px-3 text-xs text-white font-medium transition-all duration-700"
                style={{ width: `${Math.max(width, 5)}%`, background: `linear-gradient(to right, #6366f1, #8b5cf6)` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export const AnalyticsPage = () => {
  const [data, setData] = useState(null)
  const [callData, setCallData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('30days')

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      try {
        const [leadsRes, callsRes] = await Promise.all([
          analyticsService.getLeads({ period }),
          analyticsService.getCalls({ period }),
        ])
        setData(leadsRes.data.data)
        setCallData(callsRes.data.data)
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [period])

  const PERIOD_OPTIONS = [
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: 'this_month', label: 'This Month' },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-muted mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${period === opt.value ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Status Distribution */}
          <div className="card p-5">
            <h3 className="section-header mb-4">Leads by Status</h3>
            {data?.byStatus && <DonutChart data={data.byStatus} />}
          </div>

          {/* Source Distribution */}
          <div className="card p-5">
            <h3 className="section-header mb-4">Leads by Source</h3>
            {data?.bySource && <BarChartSimple data={data.bySource} color="#10b981" />}
          </div>

          {/* Conversion Funnel */}
          <div className="card p-5">
            <h3 className="section-header mb-4">Conversion Funnel</h3>
            {data?.funnel && <FunnelChart data={data.funnel} />}
          </div>

          {/* Leads Over Time */}
          <div className="card p-5">
            <h3 className="section-header mb-4">Leads Created Over Time</h3>
            {data?.overTime && data.overTime.length > 0 ? (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {data.overTime.slice(-14).map(item => {
                  const max = Math.max(...data.overTime.map(d => d.count), 1)
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 w-20 flex-shrink-0">{item._id}</span>
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div className="h-full rounded-full bg-primary-500" style={{ width: `${(item.count / max) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-300 w-6 text-right">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">No data for this period</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
