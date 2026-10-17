import { ClockIcon } from '../../components/ui/icons'

const STEPS = ['Recebido', 'Em preparo', 'A caminho', 'Entregue']

export function TrackingPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <svg className="preview__route" viewBox="0 0 520 420" fill="none">
        <circle cx="432" cy="86" r="64" className="radar radar--1" />
        <circle cx="432" cy="86" r="108" className="radar radar--2" />
        <circle cx="432" cy="86" r="156" className="radar radar--3" />
        <path
          d="M20 400C60 330 130 300 200 330S330 330 372 220 425 110 432 92"
          stroke="rgba(255,255,255,.55)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 11"
        />
        <circle cx="432" cy="86" r="22" fill="rgba(255,255,255,.28)" />
        <circle cx="432" cy="86" r="9" fill="#fff" />
      </svg>

      <div className="preview__card">
        <div className="preview__top">
          <span className="preview__order">Pedido #2048</span>
          <span className="live">
            <span className="live__dot" /> Ao vivo
          </span>
        </div>
        <strong className="preview__status">Saiu para entrega</strong>
        <div className="steps">
          {STEPS.map((step, i) => (
            <div key={step} className={`steps__item${i < 2 ? ' is-done' : i === 2 ? ' is-current' : ''}`}>
              <span className="steps__bar" />
              <span className="steps__label">{step}</span>
            </div>
          ))}
        </div>
        <div className="preview__eta">
          <span className="preview__eta-icon">
            <ClockIcon />
          </span>
          <span>
            <small>Previsão de chegada</small>
            <strong>cerca de 12 min</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
