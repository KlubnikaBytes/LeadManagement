import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/auth.service'
import { setAuthToken, clearAuthToken } from '../services/api'
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
        const sessionUser = res.data.data
        if (!sessionUser) clearAuthToken()
        setUser(sessionUser)
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
      const { user: userData, token } = res.data.data
      if (token) setAuthToken(token)
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
      const { user: userData, token } = res.data.data
      if (token) setAuthToken(token)
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
    clearAuthToken()
    setUser(null)
    toast.success('Logged out successfully')
  }, [])

  const updateCurrentUser = useCallback((userData) => {
    setUser(prev => prev ? ({ ...prev, ...userData }) : prev)
  }, [])

  const isAdmin = user?.role === 'ADMIN'
  const isTeamLeader = user?.role === 'TEAM_LEADER'
  const isSalesExec = user?.role === 'SALES_EXECUTIVE'
  const canManageUsers = isAdmin
  const canImport = !!user
  const canDelete = isAdmin
  const canAssign = isAdmin

  const canDeleteLead = useCallback((lead) => {
    if (!user) return false
    if (isAdmin || isTeamLeader) return true
    const currentUserId = user._id?.toString() || user.id?.toString()
    const createdById = (lead?.createdBy?._id || lead?.createdBy)?.toString()
    const assignedToId = (lead?.assignedTo?._id || lead?.assignedTo)?.toString()
    const primaryAssignedToId = (lead?.primaryAssignedTo?._id || lead?.primaryAssignedTo)?.toString()
    return (
      (createdById && createdById === currentUserId) ||
      (assignedToId && assignedToId === currentUserId) ||
      (primaryAssignedToId && primaryAssignedToId === currentUserId)
    )
  }, [user, isAdmin, isTeamLeader])

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, signup, logout, updateCurrentUser, isAdmin, isTeamLeader, isSalesExec, canManageUsers, canImport, canDelete, canAssign, canDeleteLead }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
