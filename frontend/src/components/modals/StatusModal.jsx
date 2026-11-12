import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { StatusBadge } from '../ui/StatusBadge'
import { leadsService } from '../../services/leads.service'
import { STATUSES } from '../../utils/constants'
import toast from 'react-hot-toast'

export const StatusModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [status, setStatus] = useState(lead?.status || '')
  const [conversionNotes, setConversionNotes] = useState('')
  const [finalService, setFinalService] = useState('')
  const [finalBudget, setFinalBudget] = useState('')
  const [loading, setLoading] = useState(false)
  const [dynamicStatuses, setDynamicStatuses] = useState([])
  const [isCustom, setIsCustom] = useState(false)

  useEffect(() => {
    leadsService.getOptions().then(res => setDynamicStatuses(res.data.data.statuses)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!status) return
    setLoading(true)
    try {
      await leadsService.changeStatus(lead._id, {
        status,
        ...(status === 'CONVERTED' ? { conversionNotes, finalService, finalBudget } : {}),
      })
      toast.success('Status updated!')
      onSuccess?.()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔄 Change Lead Status" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-xl">
          <StatusBadge status={lead?.status} size="lg" />
          <span className="text-slate-400">→</span>
          <StatusBadge status={status || lead?.status} size="lg" />
        </div>

        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {Array.from(new Set([...STATUSES.map(s => s.value), ...dynamicStatuses])).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setIsCustom(false) }}
              className={`p-3 rounded-xl border text-sm font-medium transition-all text-left truncate ${status === s && !isCustom ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-600'}`}
            >
              {s}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { setStatus(''); setIsCustom(true) }}
            className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${isCustom ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-600'}`}
          >
            + Custom Status
          </button>
        </div>

        {isCustom && (
          <input
            type="text"
            className="input"
            placeholder="Type custom status..."
            value={status}
            onChange={e => setStatus(e.target.value)}
            autoFocus
          />
        )}

        {status === 'CONVERTED' && (
          <div className="space-y-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
            <p className="text-emerald-400 text-sm font-semibold">🎉 Conversion Details</p>
            <input type="text" className="input" placeholder="Final Service / Project" value={finalService} onChange={e => setFinalService(e.target.value)} />
            <input type="text" className="input" placeholder="Final Budget" value={finalBudget} onChange={e => setFinalBudget(e.target.value)} />
            <textarea className="input resize-none" rows={2} placeholder="Conversion notes..." value={conversionNotes} onChange={e => setConversionNotes(e.target.value)} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading || status === lead?.status} className="btn-primary flex-1">
            {loading ? 'Updating...' : '✓ Update Status'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
