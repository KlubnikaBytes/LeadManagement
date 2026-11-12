import { Toaster } from 'react-hot-toast'

export const ToastProvider = () => (
  <Toaster
    position="top-right"
    toastOptions={{
      duration: 4000,
      style: {
        background: 'var(--kb-espresso)',
        color: 'var(--kb-cream)',
        border: '1px solid var(--kb-cocoa)',
        borderRadius: '12px',
        fontSize: '14px',
      },
      success: {
        iconTheme: { primary: 'var(--kb-coral)', secondary: 'var(--kb-espresso)' },
      },
      error: {
        iconTheme: { primary: 'var(--kb-strawberry)', secondary: 'var(--kb-white)' },
      },
    }}
  />
)
