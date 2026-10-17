import type { Order, OrderStatus } from '../api/orders'
import { FLOW, STATUS_ACTION, STATUS_LABEL, formatCurrency, formatDateTime } from '../utils/order'
import { StatusBadge } from './StatusBadge'

interface Props {
  order: Order
  updating: boolean
  onChangeStatus: (order: Order, status: OrderStatus) => void
}

function Progress({ status }: { status: OrderStatus }) {
  const current = FLOW.indexOf(status)
  return (
    <ol className="progress" aria-label="Progresso do pedido">
      {FLOW.map((step, index) => (
        <li
          key={step}
          className={index < current ? 'is-done' : index === current ? 'is-current' : undefined}
        >
          <span className="progress__dot" />
          <span className="progress__label">{STATUS_LABEL[step]}</span>
        </li>
      ))}
    </ol>
  )
}

export function OrderCard({ order, updating, onChangeStatus }: Props) {
  const cancelled = order.status === 'CANCELADO'
  const actions = order.allowedNextStatuses

  return (
    <article className={`card order${cancelled ? ' order--cancelled' : ''}`}>
      <header className="order__head">
        <div>
          <h3>
            Pedido #{order.id} · {order.customerName}
          </h3>
          <p className="muted">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      {!cancelled && <Progress status={order.status} />}

      <p className="order__address">📍 {order.deliveryAddress}</p>

      <ul className="order__items">
        {order.items.map((item, i) => (
          <li key={i}>
            <span>
              {item.quantity}× {item.name}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <footer className="order__foot">
        <strong className="order__total">{formatCurrency(order.total)}</strong>
        {actions.length > 0 && (
          <div className="order__actions">
            {actions.map((next) => (
              <button
                key={next}
                type="button"
                className={`btn btn--sm ${next === 'CANCELADO' ? 'btn--ghost btn--danger' : 'btn--primary'}`}
                disabled={updating}
                onClick={() => onChangeStatus(order, next)}
              >
                {STATUS_ACTION[next]}
              </button>
            ))}
          </div>
        )}
      </footer>
    </article>
  )
}
