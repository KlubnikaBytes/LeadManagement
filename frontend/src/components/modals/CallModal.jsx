import { useState } from 'react'
import { Phone, PhoneCall, PhoneOff, PhoneMissed } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { leadsService } from '../../services/leads.service'
import { CALL_OUTCOMES, FOLLOWUP_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

const OUTCOME_ICONS = {
  Connected: '✅',
  'No Answer': '📵',
  Busy: '🔴',
  'Call Back Requested': '🔁',
  Interested: '🌟',
  'Not Interested': '❌',
  'Wrong Number': '❓',
  Converted: '🎉',
}

export const CallModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [step, setStep] = useState(1) // 1 = initiate, 2 = log
  const [outcome, setOutcome] = useState('')
  const [duration, setDuration] = useState('')
  const [notes, setNotes] = useState('')
  const [nextFollowUpAt, setNextFollowUpAt] = useState('')
  const [nextFollowUpType, setNextFollowUpType] = useState('Call')
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setStep(1)
    setOutcome('')
    setDuration('')
    setNotes('')
    setNextFollowUpAt('')
    setNextFollowUpType('Call')
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleOutcomeSelect = (o) => {
    setOutcome(o)
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!outcome) {
      toast.error('Please select a call outcome')
      return
    }
    setLoading(true)
    try {
      await leadsService.logCall(lead._id, {
        outcome,
        duration,
        notes,
        nextFollowUpAt: nextFollowUpAt || null,
        nextFollowUpType,
      })
      toast.success('Call logged successfully')
      onSuccess?.()
      handleClose()
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  if (!lead) return null

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={step === 1 ? `📞 Call ${lead.name}` : '📝 Log Call Details'} size="md">
      {step === 1 ? (
        <div className="space-y-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-slate-100">{lead.name}</p>
            <p className="text-slate-500 text-sm">{lead.companyName}</p>
            <a href={`tel:${lead.phone}`} className="mt-2 inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 font-mono text-lg font-semibold">
              <Phone className="w-5 h-5" />
              {lead.phone}
            </a>
          </div>

          <p className="text-center text-slate-400 text-sm font-medium">What happened during the call?</p>

          <div className="grid grid-cols-2 gap-2">
            {CALL_OUTCOMES.map(o => (
              <button
                key={o}
                onClick={() => handleOutcomeSelect(o)}
                className="flex items-center gap-2 p-3 rounded-xl border border-slate-700 hover:border-primary-500 hover:bg-primary-500/5 transition-all duration-200 text-sm text-slate-300 hover:text-slate-100"
              >
                <span>{OUTCOME_ICONS[o]}</span>
                {o}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="card p-3 flex items-center gap-3">
            <span className="text-2xl">{OUTCOME_ICONS[outcome]}</span>
            <div>
              <p className="font-semibold text-slate-200">{outcome}</p>
              <p className="text-xs text-slate-500">Call outcome for {lead.name}</p>
            </div>
            <button type="button" onClick={() => setStep(1)} className="ml-auto text-xs text-primary-400 hover:text-primary-300">Change</button>
          </div>

          <div>
            <label className="label">Call Duration</label>
            <input type="text" className="input" placeholder="e.g. 5:30" value={duration} onChange={e => setDuration(e.target.value)} />
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="What was discussed? Key points, objections, interests..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Schedule Follow-up (Optional)</label>
              <input type="datetime-local" className="input" value={nextFollowUpAt} onChange={e => setNextFollowUpAt(e.target.value)} />
            </div>
            <div>
              <label className="label">Follow-up Type</label>
              <select className="input" value={nextFollowUpType} onChange={e => setNextFollowUpType(e.target.value)}>
                {FOLLOWUP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Saving...' : '💾 Save Call Log'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
