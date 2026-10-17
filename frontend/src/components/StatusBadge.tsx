import type { ComponentType } from 'react'
import type { OrderStatus } from '../api/orders'
import { STATUS_LABEL } from '../utils/order'
import { BikeIcon, CancelIcon, CheckIcon, FlameIcon, ReceiptIcon } from './icons'

const STATUS_ICON: Record<OrderStatus, ComponentType> = {
  RECEBIDO: ReceiptIcon,
  EM_PREPARO: FlameIcon,
  SAIU_PARA_ENTREGA: BikeIcon,
  ENTREGUE: CheckIcon,
  CANCELADO: CancelIcon,
}

interface Props {
  status: OrderStatus
  title?: string
}

export function StatusBadge({ status, title }: Props) {
  const StatusIcon = STATUS_ICON[status]
  return (
    <span className={`badge badge--${status.toLowerCase()}`} title={title}>
      <StatusIcon />
      {STATUS_LABEL[status]}
    </span>
  )
}
