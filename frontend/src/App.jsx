import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui/Toast'
import { AppLayout } from './layouts/AppLayout'
import { PageLoader } from './components/ui/LoadingSpinner'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { DashboardPage } from './pages/DashboardPage'
import { LeadsPage } from './pages/LeadsPage'
import { LeadDetailsPage } from './pages/LeadDetailsPage'
import { LeadFormPage } from './pages/LeadFormPage'
import { FollowUpsPage } from './pages/FollowUpsPage'
import { CallsPage } from './pages/CallsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { TeamPage } from './pages/TeamPage'
import { ImportPage } from './pages/ImportPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { NotFoundPage } from './pages/NotFoundPage'

const ProtectedRoute = ({ children, roles }) => {
  const { user, initializing } = useAuth()
  if (initializing) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />
  return children
}

const AppRoutes = () => {
  const { user, initializing } = useAuth()

  if (initializing) return <PageLoader />

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />} />

      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/new" element={<LeadFormPage />} />
        <Route path="/leads/:id" element={<LeadDetailsPage />} />
        <Route path="/leads/:id/edit" element={<LeadFormPage />} />

        <Route path="/followups" element={<FollowUpsPage />} />
        <Route path="/calls" element={<CallsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/reports" element={<ReportsPage />} />

        <Route path="/team" element={
          <ProtectedRoute roles={['ADMIN', 'TEAM_LEADER']}><TeamPage /></ProtectedRoute>
        } />
        <Route path="/import" element={
          <ProtectedRoute><ImportPage /></ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute roles={['ADMIN']}><SettingsPage /></ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

import { SocketProvider } from './context/SocketContext'

const App = () => (
  <AuthProvider>
    <SocketProvider>
      <ToastProvider />
      <AppRoutes />
    </SocketProvider>
  </AuthProvider>
)

export default App
