import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ordersApi } from '../../api/orders'
import { buildOrder, buildPage, emptySummary } from '../../test/factories'
import { OrdersPage } from './OrdersPage'

vi.mock('../../api/orders', () => ({
  ordersApi: {
    list: vi.fn(),
    summary: vi.fn(),
    updateStatus: vi.fn(),
    create: vi.fn(),
  },
}))

const summary = { RECEBIDO: 2, EM_PREPARO: 1, SAIU_PARA_ENTREGA: 1, ENTREGUE: 3, CANCELADO: 1 }
const inProgress = ['RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA']

function chip(label: string) {
  return screen.getByRole('tab', { name: new RegExp(`^${label}`) })
}

beforeEach(() => {
  vi.mocked(ordersApi.list).mockResolvedValue(buildPage([buildOrder({ id: 7, customerName: 'Pedro Martins' })]))
  vi.mocked(ordersApi.summary).mockResolvedValue(summary)
  vi.mocked(ordersApi.updateStatus).mockResolvedValue(buildOrder())
})

describe('OrdersPage', () => {
  it('opens on the in-progress filter and loads the first page', async () => {
    render(<OrdersPage />)

    expect(await screen.findByText(/Pedro Martins/)).toBeInTheDocument()
    expect(chip('Em andamento')).toHaveAttribute('aria-selected', 'true')
    expect(ordersApi.list).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: inProgress, q: '', page: 0, size: 20 }),
    )
  })

  it('shows the counts that come from the server', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    expect(within(chip('Em andamento')).getByText('4')).toBeInTheDocument()
    expect(within(chip('Recebido')).getByText('2')).toBeInTheDocument()
    expect(within(chip('Entregue')).getByText('3')).toBeInTheDocument()
    expect(within(chip('Todos')).getByText('8')).toBeInTheDocument()
  })

  it('queries only the chosen status when a tab is selected', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(chip('Entregue'))

    await waitFor(() =>
      expect(ordersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ statuses: ['ENTREGUE'], page: 0 })),
    )
  })

  it('queries every status for the "Todos" tab', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(chip('Todos'))

    await waitFor(() =>
      expect(ordersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ statuses: [] })),
    )
  })

  it('searches on the server after the user stops typing', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar pedidos' }), 'maria')

    await waitFor(() =>
      expect(ordersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'maria', page: 0 })),
    )
    expect(ordersApi.summary).toHaveBeenLastCalledWith('maria')
  })

  it('loads the next page and appends it', async () => {
    vi.mocked(ordersApi.list)
      .mockResolvedValueOnce(
        buildPage([buildOrder({ id: 2, customerName: 'Primeira Pagina' })], { last: false, totalPages: 2 }),
      )
      .mockResolvedValueOnce(
        buildPage([buildOrder({ id: 1, customerName: 'Segunda Pagina' })], { page: 1, last: true, totalPages: 2 }),
      )
    render(<OrdersPage />)
    await screen.findByText(/Primeira Pagina/)

    await userEvent.click(screen.getByRole('button', { name: 'Carregar mais' }))

    expect(await screen.findByText(/Segunda Pagina/)).toBeInTheDocument()
    expect(screen.getByText(/Primeira Pagina/)).toBeInTheDocument()
    expect(ordersApi.list).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 }))
    expect(screen.queryByRole('button', { name: 'Carregar mais' })).not.toBeInTheDocument()
  })

  it('invites the user to create the first order when there is none', async () => {
    vi.mocked(ordersApi.list).mockResolvedValue(buildPage([]))
    vi.mocked(ordersApi.summary).mockResolvedValue(emptySummary)
    render(<OrdersPage />)

    expect(await screen.findByText('Nenhum pedido ainda')).toBeInTheDocument()
  })

  it('explains when a search finds nothing', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)
    vi.mocked(ordersApi.list).mockResolvedValue(buildPage([]))

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar pedidos' }), 'zzz')

    expect(await screen.findByText('Nenhum pedido encontrado')).toBeInTheDocument()
  })

  it('shows an error when the orders cannot be loaded', async () => {
    vi.mocked(ordersApi.list).mockRejectedValue(new Error('boom'))
    render(<OrdersPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocorreu um erro inesperado.')
  })

  it('advances an order through the API and refreshes the list', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(screen.getByRole('button', { name: /Iniciar preparo/ }))

    await waitFor(() => expect(ordersApi.updateStatus).toHaveBeenCalledWith(7, 'EM_PREPARO'))
    await waitFor(() => expect(vi.mocked(ordersApi.list).mock.calls.length).toBeGreaterThan(1))
  })

  it('asks for confirmation before cancelling and lets the user go back', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Cancelar o pedido #7?')

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(ordersApi.updateStatus).not.toHaveBeenCalled()
  })

  it('cancels the order once confirmed', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, cancelar' }))

    await waitFor(() => expect(ordersApi.updateStatus).toHaveBeenCalledWith(7, 'CANCELADO'))
  })

  it('shows the API message when a status change is rejected', async () => {
    vi.mocked(ordersApi.updateStatus).mockRejectedValue(new Error('conflict'))
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(screen.getByRole('button', { name: /Iniciar preparo/ }))

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('opens and closes the new order form', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(screen.getByRole('button', { name: /Novo pedido/ }))
    expect(screen.getByRole('dialog', { name: 'Novo pedido' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes the new order form with Escape', async () => {
    render(<OrdersPage />)
    await screen.findByText(/Pedro Martins/)

    await userEvent.click(screen.getByRole('button', { name: /Novo pedido/ }))
    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
