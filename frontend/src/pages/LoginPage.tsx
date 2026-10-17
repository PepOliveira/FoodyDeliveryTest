import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { useAuth } from '../auth/context'
import { AuthShell } from '../components/AuthShell'
import { ArrowIcon, MailIcon } from '../components/icons'
import { InputField, PasswordField } from '../components/InputField'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password }, remember)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Que bom ter você de volta"
      subtitle="Acesse sua conta para gerenciar os pedidos."
      footer={
        <>
          Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form">
        <InputField
          label="E-mail"
          icon={<MailIcon />}
          type="email"
          placeholder="voce@seunegocio.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
        <PasswordField
          label="Senha"
          placeholder="Digite sua senha"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <label className="check">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          Manter conectado neste dispositivo
        </label>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
          {loading ? 'Entrando...' : (
            <>
              Entrar <ArrowIcon />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  )
}
