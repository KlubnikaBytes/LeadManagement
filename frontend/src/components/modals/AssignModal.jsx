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
        <div className="mb-3 p-3 rounded-xl bg-kb-cream-deep border border-kb-sand text-xs space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-kb-muted">Created By</span>
            <span className="text-kb-cocoa font-medium">{lead.createdBy?.name || 'System'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-kb-muted">Primary Assigned</span>
            <span className="text-kb-strawberry font-medium">{lead.primaryAssignedTo?.name || 'Not assigned yet'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-kb-muted">Currently Assigned</span>
            <span className="text-kb-cocoa font-semibold">{lead.assignedTo?.name || 'Unassigned'}</span>
          </div>
        </div>
      )}

      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {loadingUsers ? (
          <div className="text-center py-4 text-kb-muted">Loading users...</div>
        ) : (
          users.map(u => (
            <button
              key={u._id}
              type="button"
              onClick={() => setSelectedUser(u._id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                selectedUser === u._id
                  ? 'border-kb-strawberry bg-kb-strawberry-tint'
                  : 'border-kb-sand bg-kb-white hover:border-kb-umber hover:bg-kb-cream'
              }`}
            >
              <Avatar name={u.name} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-kb-cocoa">{u.name}</p>
                <p className="text-xs text-kb-muted">{u.role?.replace('_', ' ')}</p>
              </div>
              {selectedUser === u._id && <span className="ml-auto text-kb-strawberry font-bold">✓</span>}
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
