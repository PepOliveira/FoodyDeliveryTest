import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildOrder } from '../../test/factories'
import { OrderCard } from './OrderCard'

const MINUTE = 60_000
const createdAt = '2026-10-17T10:00:00.000Z'
const at = (minutes: number) => new Date(createdAt).getTime() + minutes * MINUTE

function setup(overrides = {}, now = at(3)) {
  const onChangeStatus = vi.fn()
  const onCancel = vi.fn()
  const order = buildOrder({ createdAt, updatedAt: createdAt, ...overrides })
  render(<OrderCard order={order} now={now} updating={false} onChangeStatus={onChangeStatus} onCancel={onCancel} />)
  return { order, onChangeStatus, onCancel }
}

describe('OrderCard', () => {
  it('shows the customer, address, items and total', () => {
    setup({ deliveryComplement: 'Conjunto 52' })

    expect(screen.getByText(/Pedido #1 · Maria Souza/)).toBeInTheDocument()
    expect(screen.getByText(/Av\. Paulista, 1000/)).toBeInTheDocument()
    expect(screen.getByText('Conjunto 52')).toBeInTheDocument()
    expect(screen.getByText('Hambúrguer', { exact: false })).toBeInTheDocument()
    expect(screen.getAllByText(/65,80/).length).toBeGreaterThan(0)
  })

  it('links the phone number to WhatsApp', () => {
    setup()

    const link = screen.getByRole('link', { name: /98888-0001/ })
    expect(link).toHaveAttribute('href', 'https://wa.me/5511988880001')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('omits the phone for orders created before the field existed', () => {
    setup({ customerPhone: null })

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('shows how long the order has been open', () => {
    setup({}, at(5))

    expect(screen.getByText('Aberto há 5 min')).toBeInTheDocument()
  })

  it('highlights orders waiting ten minutes or more', () => {
    setup({}, at(12))

    expect(screen.getByText('Aberto há 12 min')).toHaveClass('order__age--warn')
  })

  it('does not highlight recent orders', () => {
    setup({}, at(9))

    expect(screen.getByText('Aberto há 9 min')).not.toHaveClass('order__age--warn')
  })

  it('shows a progress bar only while the order is in progress', () => {
    setup({ status: 'EM_PREPARO', allowedNextStatuses: ['SAIU_PARA_ENTREGA', 'CANCELADO'] })

    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '2')
  })

  it('moves the order forward with the primary action', async () => {
    const { order, onChangeStatus } = setup()

    await userEvent.click(screen.getByRole('button', { name: /Iniciar preparo/ }))

    expect(onChangeStatus).toHaveBeenCalledWith(order, 'EM_PREPARO')
  })

  it('asks the page to confirm a cancellation instead of cancelling directly', async () => {
    const { order, onCancel, onChangeStatus } = setup()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledWith(order)
    expect(onChangeStatus).not.toHaveBeenCalled()
  })

  it('does not offer cancelling once the order left for delivery', () => {
    setup({ status: 'SAIU_PARA_ENTREGA', allowedNextStatuses: ['ENTREGUE'] })

    expect(screen.queryByRole('button', { name: 'Cancelar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Marcar como entregue/ })).toBeInTheDocument()
  })

  it('shows completion time and duration for delivered orders and no actions', () => {
    setup({
      status: 'ENTREGUE',
      allowedNextStatuses: [],
      updatedAt: '2026-10-17T10:38:00.000Z',
    })

    expect(screen.getByText(/Entregue às \d{2}:\d{2}/)).toBeInTheDocument()
    expect(screen.getByText('Concluído em 38 min')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('offers restoring a cancelled order', async () => {
    const { order, onChangeStatus } = setup({ status: 'CANCELADO', allowedNextStatuses: ['RECEBIDO'] })

    expect(screen.getByText(/Cancelado às \d{2}:\d{2}/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Restaurar pedido' }))

    expect(onChangeStatus).toHaveBeenCalledWith(order, 'RECEBIDO')
  })

  it('lists the status history as the badge tooltip', () => {
    setup({
      status: 'EM_PREPARO',
      allowedNextStatuses: ['SAIU_PARA_ENTREGA', 'CANCELADO'],
      history: [
        { status: 'RECEBIDO', changedAt: createdAt },
        { status: 'EM_PREPARO', changedAt: '2026-10-17T10:05:00.000Z' },
      ],
    })

    const title = screen.getByText('Em preparo', { selector: '.badge' }).getAttribute('title')
    expect(title).toMatch(/Recebido · \d{2}:\d{2}.*Em preparo · \d{2}:\d{2}/)
  })
})
