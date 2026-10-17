import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi, type AuthResponse, type User } from '../api/auth'
import { AUTH_EXPIRED_EVENT, tokenStorage } from '../api/client'
import { AuthContext, type AuthContextValue } from './context'

const USER_KEY = 'foody.user'

function loadStoredUser(): User | null {
  if (!tokenStorage.get()) return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadStoredUser)

  const logout = useCallback(() => {
    tokenStorage.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const startSession = useCallback((data: AuthResponse) => {
    tokenStorage.set(data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    setUser(data.user)
  }, [])

  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout)
  }, [logout])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login: async (payload) => startSession(await authApi.login(payload)),
      register: async (payload) => startSession(await authApi.register(payload)),
      logout,
    }),
    [user, startSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
