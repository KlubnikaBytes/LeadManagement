import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analytics.service'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { STATUS_LABELS } from '../utils/constants'

const CATEGORICAL_SERIES = [
  'var(--kb-chart-1)',
  'var(--kb-chart-2)',
  'var(--kb-chart-3)',
  'var(--kb-chart-4)',
  'var(--kb-chart-5)',
  'var(--kb-chart-6)',
]

const STATUS_COLORS = {
  NEW: 'var(--kb-cocoa)',
  CONTACTED: 'var(--kb-status-amber-fg)',
  INTERESTED: 'var(--kb-status-teal-fg)',
  CALL_LATER: 'var(--kb-umber)',
  FOLLOW_UP: 'var(--kb-status-umber-fg)',
  NOT_INTERESTED: 'var(--kb-taupe)',
  CONVERTED: 'var(--kb-status-won-fg)',
  LOST: 'var(--kb-strawberry)',
}

const FUNNEL_STAGE_COLORS = [
  'var(--kb-cream-deep)',
  'var(--kb-sand)',
  'var(--kb-coral)',
  'var(--kb-strawberry)',
  'var(--kb-crimson)',
]

const DonutChart = ({ data }) => {
  const total = data.reduce((s, d) => s + d.count, 0)
  if (!total) return <div className="text-center text-kb-muted py-8">No data</div>

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
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0">
        <svg viewBox="0 0 160 160" className="w-36 h-36 -rotate-90">
          {segments.map((seg, i) => {
            const dashArray = (seg.percent / 100) * circumference
            const dashOffset = -strokeOffset
            strokeOffset += dashArray
            const color = STATUS_COLORS[seg._id] || CATEGORICAL_SERIES[i % CATEGORICAL_SERIES.length]
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
            <p className="text-2xl font-bold text-kb-cocoa">{total}</p>
            <p className="text-xs text-kb-muted">Total</p>
          </div>
        </div>
      </div>
      <div className="flex-1 space-y-2 min-w-0 w-full">
        {segments.map((seg, i) => {
          const swatchColor = STATUS_COLORS[seg._id] || CATEGORICAL_SERIES[i % CATEGORICAL_SERIES.length]
          return (
            <div key={seg._id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: swatchColor }} />
              <span className="text-xs text-kb-muted truncate flex-1">{STATUS_LABELS[seg._id] || seg._id}</span>
              <span className="text-xs font-bold text-kb-cocoa flex-shrink-0">{seg.count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const BarChartSimple = ({ data, keyField = '_id', valueField = 'count', color = 'var(--kb-strawberry)' }) => {
  const max = Math.max(...data.map(d => d[valueField]), 1)
  return (
    <div className="space-y-2.5">
      {data.slice(0, 10).map(item => (
        <div key={item[keyField]} className="flex items-center gap-3">
          <span className="text-xs text-kb-muted w-28 truncate flex-shrink-0">{item[keyField]}</span>
          <div
            className="flex-1 rounded-full h-2.5 overflow-hidden border border-kb-sand"
            style={{ backgroundColor: 'var(--kb-sand-grid)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(item[valueField] / max) * 100}%`, backgroundColor: color }}
            />
          </div>
          <span className="text-xs font-bold text-kb-cocoa w-8 text-right">{item[valueField]}</span>
        </div>
      ))}
    </div>
  )
}

const FunnelChart = ({ data }) => {
  const max = data[0]?.count || 1
  return (
    <div className="space-y-3">
      {data.map((item, i) => {
        const width = (item.count / max) * 100
        const pct = i > 0 && data[i - 1].count > 0 ? ((item.count / data[i - 1].count) * 100).toFixed(0) : null
        const stageColor = FUNNEL_STAGE_COLORS[Math.min(i, FUNNEL_STAGE_COLORS.length - 1)]
        return (
          <div key={item.stage}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-kb-cocoa font-medium">{item.stage}</span>
              <div className="flex items-center gap-2">
                {pct && <span className="text-xs text-kb-muted">↓ {pct}%</span>}
                <span className="text-sm font-bold text-kb-cocoa">{item.count.toLocaleString()}</span>
              </div>
            </div>
            <div className="bg-kb-cream rounded-full h-7 overflow-hidden border border-kb-sand">
              <div
                className="h-full rounded-full flex items-center px-3 text-xs font-medium transition-all duration-700"
                style={{ width: `${Math.max(width, 6)}%`, backgroundColor: stageColor }}
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="text-muted mt-1">Insights and performance metrics</p>
        </div>
        <div className="flex flex-wrap gap-1 bg-kb-white border border-kb-sand rounded-xl p-1 self-start sm:self-auto">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                period === opt.value
                  ? 'bg-kb-strawberry text-kb-white'
                  : 'text-kb-muted hover:text-kb-cocoa hover:bg-kb-cream-deep'
              }`}
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
            {data?.bySource && <BarChartSimple data={data.bySource} color="var(--kb-strawberry)" />}
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
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {data.overTime.slice(-14).map(item => {
                  const max = Math.max(...data.overTime.map(d => d.count), 1)
                  return (
                    <div key={item._id} className="flex items-center gap-3">
                      <span className="text-xs text-kb-muted w-20 flex-shrink-0">{item._id}</span>
                      <div
                        className="flex-1 rounded-full h-2.5 border border-kb-sand"
                        style={{ backgroundColor: 'var(--kb-sand-grid)' }}
                      >
                        <div className="h-full rounded-full bg-kb-strawberry" style={{ width: `${(item.count / max) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold text-kb-cocoa w-6 text-right">{item.count}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-kb-muted text-sm text-center py-8">No data for this period</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
