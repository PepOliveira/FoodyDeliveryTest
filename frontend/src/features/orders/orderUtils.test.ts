import { describe, expect, it } from 'vitest'
import { buildOrder } from '../../test/factories'
import {
  FLOW,
  IN_PROGRESS,
  WAIT_WARNING_MS,
  formatCurrency,
  formatDuration,
  isInProgress,
  orderDurationMs,
  orderWaitMs,
} from './orderUtils'

const MINUTE = 60_000

describe('formatDuration', () => {
  it('describes very short durations', () => {
    expect(formatDuration(0)).toBe('menos de 1 min')
    expect(formatDuration(30_000)).toBe('menos de 1 min')
    expect(formatDuration(-5 * MINUTE)).toBe('menos de 1 min')
  })

  it('uses minutes below one hour', () => {
    expect(formatDuration(5 * MINUTE)).toBe('5 min')
    expect(formatDuration(59 * MINUTE)).toBe('59 min')
  })

  it('uses hours and zero padded minutes below one day', () => {
    expect(formatDuration(60 * MINUTE)).toBe('1h 00min')
    expect(formatDuration(125 * MINUTE)).toBe('2h 05min')
  })

  it('uses days beyond that', () => {
    expect(formatDuration(3 * 24 * 60 * MINUTE)).toBe('3 d')
  })
})

describe('order status helpers', () => {
  it('knows which statuses are in progress', () => {
    expect(IN_PROGRESS).toEqual(['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA'])
    expect(isInProgress('EM_PREPARO')).toBe(true)
    expect(isInProgress('ENTREGUE')).toBe(false)
    expect(isInProgress('CANCELADO')).toBe(false)
  })

  it('keeps the happy path in delivery order', () => {
    expect(FLOW).toEqual(['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE'])
  })

  it('warns after ten minutes of waiting', () => {
    expect(WAIT_WARNING_MS).toBe(10 * MINUTE)
  })
})

describe('order timing', () => {
  const createdAt = '2026-10-17T10:00:00.000Z'

  it('measures how long an order has been waiting', () => {
    const order = buildOrder({ createdAt })
    const now = new Date('2026-10-17T10:12:00.000Z').getTime()
    expect(orderWaitMs(order, now)).toBe(12 * MINUTE)
  })

  it('measures how long an order took to finish', () => {
    const order = buildOrder({ createdAt, updatedAt: '2026-10-17T10:38:00.000Z' })
    expect(orderDurationMs(order)).toBe(38 * MINUTE)
  })
})

describe('formatCurrency', () => {
  it('formats values as Brazilian reais', () => {
    expect(formatCurrency(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50')
  })
})
