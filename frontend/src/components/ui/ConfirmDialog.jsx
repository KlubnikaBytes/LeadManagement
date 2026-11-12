import { Modal } from './Modal'
import { AlertTriangle } from 'lucide-react'

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', variant = 'danger' }) => {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>
        <div>
          <p className="text-slate-300 text-sm">{message || 'Are you sure you want to proceed?'}</p>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary text-sm">Cancel</button>
        <button onClick={() => { onConfirm(); onClose() }} className={`${btnClass} text-sm`}>{confirmText}</button>
      </div>
    </Modal>
  )
}
