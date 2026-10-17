import type { OrderStatus } from '../api/orders'
import { STATUS_LABEL } from '../utils/order'

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge badge--${status.toLowerCase()}`}>{STATUS_LABEL[status]}</span>
}
