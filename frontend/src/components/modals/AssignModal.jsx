import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Avatar } from '../ui/Avatar'
import { leadsService } from '../../services/leads.service'
import { usersService } from '../../services/users.service'
import toast from 'react-hot-toast'

export const AssignModal = ({ isOpen, onClose, lead, onSuccess }) => {
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true)
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
      await leadsService.assign(lead._id, { assignedTo: selectedUser })
      toast.success('Lead assigned successfully!')
      onSuccess?.()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👤 Assign Lead" size="sm">
      <div className="space-y-3">
        {loadingUsers ? (
          <div className="text-center py-4 text-slate-500">Loading users...</div>
        ) : (
          users.map(u => (
            <button
              key={u._id}
              onClick={() => setSelectedUser(u._id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${selectedUser === u._id ? 'border-primary-500 bg-primary-500/10' : 'border-slate-700 hover:border-slate-600'}`}
            >
              <Avatar name={u.name} size="sm" />
              <div className="text-left">
                <p className="text-sm font-medium text-slate-200">{u.name}</p>
                <p className="text-xs text-slate-500">{u.role}</p>
              </div>
              {selectedUser === u._id && <span className="ml-auto text-primary-400">✓</span>}
            </button>
          ))
        )}
      </div>
      <div className="flex gap-3 mt-4">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleSubmit} disabled={loading || !selectedUser} className="btn-primary flex-1">
          {loading ? 'Assigning...' : 'Assign Lead'}
        </button>
      </div>
    </Modal>
  )
}
