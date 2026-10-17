import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/context'

export function ProtectedRoute() {
  const { user } = useAuth()
  const location = useLocation()
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location }} />
}

export function PublicOnlyRoute() {
  const { user } = useAuth()
  return user ? <Navigate to="/" replace /> : <Outlet />
}
