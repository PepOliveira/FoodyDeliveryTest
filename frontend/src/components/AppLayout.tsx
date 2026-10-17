import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/context'
import { Logo } from './Logo'

export function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <div className="app">
      <header className="topbar">
        <div className="container topbar__inner">
          <Logo />
          <div className="topbar__user">
            <span className="topbar__name">Olá, {user?.name}</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="container main">
        <Outlet />
      </main>
    </div>
  )
}
