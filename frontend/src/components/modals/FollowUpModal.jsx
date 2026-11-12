import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { leadsService } from '../../services/leads.service'
import { FOLLOWUP_TYPES } from '../../utils/constants'
import toast from 'react-hot-toast'

export const FollowUpModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [followUpDate, setFollowUpDate] = useState('')
  const [type, setType] = useState('Call')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!followUpDate) {
      toast.error('Please select a follow-up date')
      return
    }
    setLoading(true)
    try {
      await leadsService.createFollowUp(lead._id, { followUpDate, type, note })
      toast.success('Follow-up scheduled!')
      onSuccess?.()
      onClose()
      setFollowUpDate('')
      setType('Call')
      setNote('')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📅 Schedule Follow-up" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Follow-up Date & Time *</label>
          <input type="datetime-local" className="input" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} required />
        </div>
        <div>
          <label className="label">Follow-up Type</label>
          <div className="grid grid-cols-3 gap-2">
            {FOLLOWUP_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${type === t ? 'border-primary-500 bg-primary-500/10 text-primary-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Notes (Optional)</label>
          <textarea className="input resize-none" rows={2} placeholder="What to discuss..." value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Scheduling...' : '📅 Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
