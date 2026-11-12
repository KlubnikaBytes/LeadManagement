import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { leadsService } from '../../services/leads.service'
import { usersService } from '../../services/users.service'
import toast from 'react-hot-toast'

export const AssignModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  const isReassign = Boolean(lead?.primaryAssignedTo || lead?.assignedTo)

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true)
      setNote('')
      usersService.getSalesUsers().then(res => {
        setUsers(res.data.data)
        setSelectedUser(lead?.assignedTo?._id || '')
      }).finally(() => setLoadingUsers(false))
    }
  }, [isOpen, lead])

  const handleSubmit = async () => {
    if (!selectedUser) return
    setLoading(true)
    try {
      await leadsService.assign(lead._id, {
        assignedTo: selectedUser,
        ...(note.trim() ? { note: note.trim() } : {}),
      })
      toast.success(isReassign ? 'Lead reassigned successfully!' : 'Primary assignee saved!')
      onSuccess?.()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isReassign ? '👤 Reassign Lead' : '👤 Primary Assign Lead'} size="sm">
      {lead && (
        <div className="mb-3 p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Created By</span>
            <span className="text-slate-200 font-medium">{lead.createdBy?.name || 'System'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Primary Assigned</span>
            <span className="text-primary-300 font-medium">{lead.primaryAssignedTo?.name || 'Not assigned yet'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Currently Assigned</span>
            <span className="text-sky-300 font-medium">{lead.assignedTo?.name || 'Unassigned'}</span>
          </div>
        </div>
      )}

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {loadingUsers ? (
          <div className="text-center py-4 text-slate-500">Loading users...</div>
        ) : (
          users.map(u => (
            <button
              key={u._id}
              type="button"
              onClick={() => setSelectedUser(u._id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedUser === u._id ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-600'}`}
            >
              <Avatar name={u.name} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">{u.name}</p>
                <p className="text-xs text-slate-500">{u.role?.replace('_', ' ')}</p>
              </div>
              {selectedUser === u._id && <span className="ml-auto text-primary-400">✓</span>}
            </button>
          ))
        )}
      </div>

      <div className="mt-3">
        <label className="label text-xs">{isReassign ? 'Reassignment Note (Optional)' : 'Assignment Note (Optional)'}</label>
        <input
          type="text"
          className="input text-sm py-2"
          placeholder="e.g. Territory handover, workload balance..."
          value={note}
          onChange={e => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-3 mt-4">
        <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button type="button" onClick={handleSubmit} disabled={loading || !selectedUser} className="btn-primary flex-1">
          {loading ? 'Saving...' : isReassign ? 'Confirm Reassign' : 'Primary Assign'}
        </button>
      </div>
    </Modal>
  )
}
