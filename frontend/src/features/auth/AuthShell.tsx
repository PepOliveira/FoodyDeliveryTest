import type { ReactNode } from 'react'
import { Logo } from '../../components/ui/Logo'
import { TrackingPreview } from './TrackingPreview'

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
        <h2>
          <span>Acompanhe</span> <span>cada entrega</span> <span>em tempo real<span className="auth__dot">.</span></span>
        </h2>
        <p>Do preparo até a porta do cliente, tudo em um só lugar.</p>
        <TrackingPreview />
      </aside>
      <section className="auth__panel">
        <div className="auth__brand">
          <Logo height={44} />
        </div>
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
