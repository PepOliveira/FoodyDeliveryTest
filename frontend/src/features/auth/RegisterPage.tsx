import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/client'
import { useAuth } from './context'
import { AuthShell } from './AuthShell'
import { ArrowIcon, MailIcon, UserIcon } from '../../components/ui/icons'
import { InputField, PasswordField } from '../../components/ui/InputField'
import { SlowServerHint } from '../../components/ui/SlowServerHint'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ name, email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Crie sua conta"
      subtitle="Cadastre-se para começar a rastrear pedidos."
      footer={
        <>
          Já tem conta? <Link to="/login">Entrar</Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="form">
        <InputField
          label="Nome"
          icon={<UserIcon />}
          placeholder="Seu nome"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
          autoFocus
        />
        <InputField
          label="E-mail"
          icon={<MailIcon />}
          type="email"
          placeholder="voce@seunegocio.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordField
          label="Senha"
          placeholder="Mínimo de 6 caracteres"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          maxLength={72}
        />
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <button type="submit" className="btn btn--primary btn--block btn--lg" disabled={loading}>
          {loading ? 'Criando conta...' : (
            <>
              Criar conta <ArrowIcon />
            </>
          )}
        </button>
        <SlowServerHint active={loading} />
      </form>
    </AuthShell>
  )
}
