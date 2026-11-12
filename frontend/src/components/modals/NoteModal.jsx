import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { leadsService } from '../../services/leads.service'
import toast from 'react-hot-toast'

export const NoteModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!text.trim()) {
      toast.error('Please enter a note')
      return
    }
    setLoading(true)
    try {
      await leadsService.addNote(lead._id, { text })
      toast.success('Note added!')
      onSuccess?.()
      onClose()
      setText('')
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📝 Add Note" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Note *</label>
          <textarea
            className="input resize-none"
            rows={5}
            placeholder="Write your notes here... What was discussed? Key points, next steps, client requirements..."
            value={text}
            onChange={e => setText(e.target.value)}
            required
            autoFocus
          />
          <p className="text-xs text-slate-600 mt-1">{text.length} characters</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : '💾 Save Note'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
