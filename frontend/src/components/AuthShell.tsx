import type { ReactNode } from 'react'
import { Logo } from './Logo'

interface Props {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="auth">
      <aside className="auth__hero">
        <Logo height={56} />
        <h2>Acompanhe cada entrega em tempo real.</h2>
        <p>Do preparo até a porta do cliente, tudo em um só lugar.</p>
      </aside>
      <section className="auth__panel">
        <div className="auth__card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          <p className="auth__footer">{footer}</p>
        </div>
      </section>
    </div>
  )
}
