import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthProvider } from '../features/auth/AuthProvider'
import { session } from '../api/session'
import { ProtectedRoute, PublicOnlyRoute } from './ProtectedRoute'

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<p>Login page</p>} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<p>Orders page</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('route guards', () => {
  it('sends anonymous visitors to the login page', () => {
    renderAt('/')

    expect(screen.getByText('Login page')).toBeInTheDocument()
    expect(screen.queryByText('Orders page')).not.toBeInTheDocument()
  })

  it('lets signed in users reach protected pages', () => {
    session.save('jwt', { id: 1, name: 'Ana', email: 'ana@test.com' }, true)

    renderAt('/')

    expect(screen.getByText('Orders page')).toBeInTheDocument()
  })

  it('keeps signed in users away from the login page', () => {
    session.save('jwt', { id: 1, name: 'Ana', email: 'ana@test.com' }, true)

    renderAt('/login')

    expect(screen.getByText('Orders page')).toBeInTheDocument()
    expect(screen.queryByText('Login page')).not.toBeInTheDocument()
  })
})
