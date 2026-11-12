import { Toaster } from 'react-hot-toast'

export const ToastProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: '#1e293b',
        color: '#f1f5f9',
        border: '1px solid #334155',
        borderRadius: '12px',
        fontSize: '14px',
      },
      success: {
        iconTheme: { primary: '#10b981', secondary: '#f1f5f9' },
      },
      error: {
        iconTheme: { primary: '#ef4444', secondary: '#f1f5f9' },
      },
    }}
  />
)
