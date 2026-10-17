import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type AxiosResponse } from 'axios'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../../api/auth'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

vi.mock('../../api/auth', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
  },
}))

const authResponse = { token: 'jwt-token', user: { id: 1, name: 'Ana', email: 'ana@test.com' } }

function renderLogin() {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<p>Home</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email = 'ana@test.com', password = 'secret123') {
  await userEvent.type(screen.getByLabelText('E-mail'), email)
  await userEvent.type(screen.getByLabelText('Senha'), password)
  await userEvent.click(screen.getByRole('button', { name: /Entrar/ }))
}

beforeEach(() => {
  vi.mocked(authApi.login).mockResolvedValue(authResponse)
})

describe('LoginPage', () => {
  it('renders the form', () => {
    renderLogin()

    expect(screen.getByRole('heading', { name: 'Que bom ter você de volta' })).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
    expect(screen.getByRole('link', { name: 'Cadastre-se' })).toHaveAttribute('href', '/register')
  })

  it('toggles password visibility', async () => {
    renderLogin()

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
    expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  })

  it('signs in, stores the session and goes to the orders page', async () => {
    renderLogin()

    await fillAndSubmit()

    expect(await screen.findByText('Home')).toBeInTheDocument()
    expect(authApi.login).toHaveBeenCalledWith({ email: 'ana@test.com', password: 'secret123' })
    expect(localStorage.getItem('foody.token')).toBe('jwt-token')
  })

  it('keeps the session only in the tab when "Manter conectado" is unchecked', async () => {
    renderLogin()

    await userEvent.click(screen.getByRole('checkbox', { name: /Manter conectado/ }))
    await fillAndSubmit()

    await screen.findByText('Home')
    expect(sessionStorage.getItem('foody.token')).toBe('jwt-token')
    expect(localStorage.getItem('foody.token')).toBeNull()
  })

  it('shows the API message and stays on the page when the login fails', async () => {
    const response = { status: 401, data: { title: 'Unauthorized', detail: 'Invalid e-mail or password' } }
    vi.mocked(authApi.login).mockRejectedValue(
      new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, response as AxiosResponse),
    )
    renderLogin()

    await fillAndSubmit('ana@test.com', 'wrong-password')

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid e-mail or password')
    expect(screen.queryByText('Home')).not.toBeInTheDocument()
    expect(localStorage.getItem('foody.token')).toBeNull()
  })

  it('explains when the server cannot be reached', async () => {
    vi.mocked(authApi.login).mockRejectedValue(new AxiosError('Network Error', 'ERR_NETWORK'))
    renderLogin()

    await fillAndSubmit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível conectar ao servidor.')
  })
})
