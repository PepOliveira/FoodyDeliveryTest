import type { Order, PageResponse } from '../api/orders'

export function buildOrder(overrides: Partial<Order> = {}): Order {
  const createdAt = overrides.createdAt ?? new Date().toISOString()
  return {
    id: 1,
    customerName: 'Maria Souza',
    customerPhone: '(11) 98888-0001',
    deliveryAddress: 'Av. Paulista, 1000',
    deliveryComplement: null,
    items: [{ name: 'Hambúrguer', quantity: 2, unitPrice: 32.9, subtotal: 65.8 }],
    status: 'RECEBIDO',
    allowedNextStatuses: ['EM_PREPARO', 'CANCELADO'],
    total: 65.8,
    history: [{ status: 'RECEBIDO', changedAt: createdAt }],
    createdAt,
    updatedAt: createdAt,
    ...overrides,
  }
}

export function buildPage(content: Order[], overrides: Partial<PageResponse<Order>> = {}): PageResponse<Order> {
  return {
    content,
    page: 0,
    size: 20,
    totalElements: content.length,
    totalPages: 1,
    last: true,
    ...overrides,
  }
}

export const emptySummary = {
  RECEBIDO: 0,
  EM_PREPARO: 0,
  SAIU_PARA_ENTREGA: 0,
  ENTREGUE: 0,
  CANCELADO: 0,
}
