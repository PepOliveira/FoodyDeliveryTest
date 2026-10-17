import type { Order, OrderStatus } from '../api/orders'
import {
  FLOW,
  STATUS_ACTION,
  STATUS_LABEL,
  WAIT_WARNING_MS,
  formatCurrency,
  formatDateTime,
  formatDuration,
  formatTime,
  isInProgress,
  orderDurationMs,
  orderWaitMs,
} from '../utils/order'
import { whatsappUrl } from '../utils/phone'
import { ArrowIcon, ClockIcon, PhoneIcon, PinIcon } from './icons'
import { StatusBadge } from './StatusBadge'

interface Props {
  order: Order
  now: number
  updating: boolean
  onChangeStatus: (order: Order, status: OrderStatus) => void
  onCancel: (order: Order) => void
}

function Track({ status }: { status: OrderStatus }) {
  const current = FLOW.indexOf(status)
  return (
    <div
      className="track"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={FLOW.length}
      aria-valuenow={current + 1}
    >
      {FLOW.map((step, index) => (
        <span key={step} className={index <= current ? 'is-on' : undefined} />
      ))}
    </div>
  )
}

function OrderTime({ order, now }: { order: Order; now: number }) {
  if (order.status === 'ENTREGUE') {
    return (
      <>
        <span className="order__age">
          <ClockIcon />
          Entregue às {formatTime(order.updatedAt)}
        </span>
        <span>Concluído em {formatDuration(orderDurationMs(order))}</span>
      </>
    )
  }
  if (order.status === 'CANCELADO') {
    return (
      <span className="order__age">
        <ClockIcon />
        Cancelado às {formatTime(order.updatedAt)}
      </span>
    )
  }
  const waiting = orderWaitMs(order, now)
  return (
    <span className={`order__age${waiting >= WAIT_WARNING_MS ? ' order__age--warn' : ''}`} title={formatDateTime(order.createdAt)}>
      <ClockIcon />
      Aberto há {formatDuration(waiting)}
    </span>
  )
}

export function OrderCard({ order, now, updating, onChangeStatus, onCancel }: Props) {
  const cancelled = order.status === 'CANCELADO'
  const primary = order.allowedNextStatuses.find((s) => s !== 'CANCELADO')
  const canCancel = order.allowedNextStatuses.includes('CANCELADO')

  return (
    <article className={`card order${cancelled ? ' order--cancelled' : ''}`}>
      <header className="order__head">
        <div>
          <h3>
            Pedido #{order.id} · {order.customerName}
          </h3>
          <div className="order__meta">
            <OrderTime order={order} now={now} />
            {order.customerPhone && (
              <a
                className="order__phone"
                href={whatsappUrl(order.customerPhone)}
                target="_blank"
                rel="noreferrer"
                title="Abrir conversa no WhatsApp"
              >
                <PhoneIcon />
                {order.customerPhone}
              </a>
            )}
          </div>
        </div>
        <StatusBadge
          status={order.status}
          title={order.history.map((h) => `${STATUS_LABEL[h.status]} · ${formatTime(h.changedAt)}`).join('  →  ')}
        />
      </header>

      {isInProgress(order.status) && <Track status={order.status} />}

      <p className="order__address">
        <PinIcon />
        <span>
          {order.deliveryAddress}
          {order.deliveryComplement && <small>{order.deliveryComplement}</small>}
        </span>
      </p>

      <ul className="order__items">
        {order.items.map((item, i) => (
          <li key={i}>
            <span>
              <strong>{item.quantity}×</strong> {item.name}
            </span>
            <span>{formatCurrency(item.subtotal)}</span>
          </li>
        ))}
      </ul>

      <footer className="order__foot">
        <strong className="order__total">{formatCurrency(order.total)}</strong>
        <div className="order__actions">
          {canCancel && (
            <button type="button" className="btn btn--text" disabled={updating} onClick={() => onCancel(order)}>
              {STATUS_ACTION.CANCELADO}
            </button>
          )}
          {primary && (
            <button
              type="button"
              className={`btn btn--sm ${cancelled ? 'btn--outline' : 'btn--primary'}`}
              disabled={updating}
              onClick={() => onChangeStatus(order, primary)}
            >
              {STATUS_ACTION[primary]}
              {!cancelled && <ArrowIcon />}
            </button>
          )}
        </div>
      </footer>
    </article>
  )
}
