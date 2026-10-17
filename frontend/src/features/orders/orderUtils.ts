import type { Order, OrderStatus } from '../../api/orders'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export const STATUS_ACTION: Record<OrderStatus, string> = {
  RECEBIDO: 'Restaurar pedido',
  EM_PREPARO: 'Iniciar preparo',
  SAIU_PARA_ENTREGA: 'Enviar para entrega',
  ENTREGUE: 'Marcar como entregue',
  CANCELADO: 'Cancelar',
}

export const FLOW: OrderStatus[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']

export const IN_PROGRESS: OrderStatus[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA']

export const isInProgress = (status: OrderStatus) => IN_PROGRESS.includes(status)

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export const WAIT_WARNING_MS = 10 * MINUTE

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

export const formatCurrency = (value: number) => currency.format(value)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
export const formatTime = (iso: string) => time.format(new Date(iso))

export function formatDuration(ms: number): string {
  const safe = Math.max(ms, 0)
  if (safe < MINUTE) return 'menos de 1 min'
  if (safe < HOUR) return `${Math.floor(safe / MINUTE)} min`
  if (safe < DAY) {
    const minutes = Math.floor((safe % HOUR) / MINUTE)
    return `${Math.floor(safe / HOUR)}h ${String(minutes).padStart(2, '0')}min`
  }
  return `${Math.floor(safe / DAY)} d`
}

export const orderWaitMs = (order: Order, now: number) => now - new Date(order.createdAt).getTime()

export const orderDurationMs = (order: Order) =>
  new Date(order.updatedAt).getTime() - new Date(order.createdAt).getTime()
