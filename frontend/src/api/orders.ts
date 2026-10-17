import { api } from './client'

export type OrderStatus = 'RECEBIDO' | 'EM_PREPARO' | 'SAIU_PARA_ENTREGA' | 'ENTREGUE' | 'CANCELADO'

export interface OrderItem {
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface StatusChange {
  status: OrderStatus
  changedAt: string
}

export interface Order {
  id: number
  customerName: string
  customerPhone: string | null
  deliveryAddress: string
  deliveryComplement: string | null
  items: OrderItem[]
  status: OrderStatus
  allowedNextStatuses: OrderStatus[]
  total: number
  history: StatusChange[]
  createdAt: string
  updatedAt: string
}

export interface CreateOrderPayload {
  customerName: string
  customerPhone: string
  deliveryAddress: string
  deliveryComplement?: string
  items: { name: string; quantity: number; unitPrice: number }[]
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

export type OrderSummary = Record<OrderStatus, number>

export interface ListParams {
  statuses?: OrderStatus[]
  q?: string
  page?: number
  size?: number
}

export const ordersApi = {
  list: ({ statuses, q, page, size }: ListParams = {}) =>
    api
      .get<PageResponse<Order>>('/orders', {
        params: { status: statuses, q: q || undefined, page, size },
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data),
  summary: (q?: string) =>
    api.get<OrderSummary>('/orders/summary', { params: { q: q || undefined } }).then((r) => r.data),
  create: (payload: CreateOrderPayload) => api.post<Order>('/orders', payload).then((r) => r.data),
  updateStatus: (id: number, status: OrderStatus) =>
    api.patch<Order>(`/orders/${id}/status`, { status }).then((r) => r.data),
}
