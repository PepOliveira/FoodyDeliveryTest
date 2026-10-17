import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type AuthResponse, type User } from '../../api/auth'
import { AUTH_EXPIRED_EVENT } from '../../api/client'
import { session } from '../../api/session'
import { AuthContext, type AuthContextValue } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(session.getUser)

  const logout = useCallback(() => {
    session.clear()
    setUser(null)
  }, [])

  const startSession = useCallback((data: AuthResponse, remember: boolean) => {
    session.save(data.token, data.user, remember)
    setUser(data.user)
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (payload, remember = true) => startSession(await authApi.login(payload), remember),
      register: async (payload) => startSession(await authApi.register(payload), true),
      logout,
    }),
    [user, startSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
