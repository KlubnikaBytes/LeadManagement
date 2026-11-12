import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const res = await authService.getSession()
        setUser(res.data.data)
      } catch {
        setUser(null)
      } finally {
        setInitializing(false)
      }
    }
    initAuth()
  }, [])

  const signup = useCallback(async (name, email, password) => {
    setLoading(true)
    try {
      const res = await authService.signup({ name, email, password })
      const { user: userData } = res.data.data
      setUser(userData)
      toast.success(`Admin account created successfully!`)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      const { user: userData } = res.data.data
      setUser(userData)
      toast.success(`Welcome back, ${userData.name}!`)
      return userData
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {}
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const isAdmin = user?.role === 'ADMIN'
  const isTeamLeader = user?.role === 'TEAM_LEADER'
  const isSalesExec = user?.role === 'SALES_EXECUTIVE'
  const canManageUsers = isAdmin
  const canImport = isAdmin || isTeamLeader
  const canDelete = isAdmin
  const canAssign = isAdmin || isTeamLeader

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, signup, logout, isAdmin, isTeamLeader, isSalesExec, canManageUsers, canImport, canDelete, canAssign }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
