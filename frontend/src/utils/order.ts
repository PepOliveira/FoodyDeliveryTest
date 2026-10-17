import type { OrderStatus } from '../api/orders'

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  EM_PREPARO: 'Em preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
}

export const STATUS_ACTION: Record<OrderStatus, string> = {
  RECEBIDO: 'Reabrir',
  EM_PREPARO: 'Iniciar preparo',
  SAIU_PARA_ENTREGA: 'Saiu para entrega',
  ENTREGUE: 'Marcar como entregue',
  CANCELADO: 'Cancelar pedido',
}

export const FLOW: OrderStatus[] = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE']

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

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

const FINAL_STATUSES: OrderStatus[] = ['ENTREGUE', 'CANCELADO']

export function orderAgeLabel(order: { status: OrderStatus; createdAt: string; updatedAt: string }, now: number): string {
  const created = new Date(order.createdAt).getTime()
  if (FINAL_STATUSES.includes(order.status)) {
    const verb = order.status === 'ENTREGUE' ? 'Entregue' : 'Cancelado'
    return `${verb} em ${formatDuration(new Date(order.updatedAt).getTime() - created)}`
  }
  return `Aberto há ${formatDuration(now - created)}`
}

export const formatCurrency = (value: number) => currency.format(value)
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
