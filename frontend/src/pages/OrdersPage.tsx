import { useEffect, useMemo, useState } from 'react'
import { ordersApi, type Order, type OrderStatus } from '../api/orders'
import { getErrorMessage } from '../api/client'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { LiveIndicator } from '../components/LiveIndicator'
import { NewOrderModal } from '../components/NewOrderModal'
import { OrderCard } from '../components/OrderCard'
import { PlusIcon, SearchIcon } from '../components/icons'
import { useNow } from '../hooks/useNow'
import { STATUS_LABEL, isInProgress } from '../utils/order'

type Filter = 'ANDAMENTO' | OrderStatus | 'TODOS'

const FILTERS: Filter[] = [
  'ANDAMENTO',
  'RECEBIDO',
  'EM_PREPARO',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
  'TODOS',
]

const FILTER_LABEL: Record<Filter, string> = {
  ...STATUS_LABEL,
  ANDAMENTO: 'Em andamento',
  TODOS: 'Todos',
}

const POLL_INTERVAL_MS = 10_000
const CLOCK_INTERVAL_MS = 30_000

function matchesSearch(order: Order, query: string): boolean {
  const text = query.trim().toLowerCase()
  if (!text) return true
  const digits = text.replace(/\D/g, '')
  const orderNumber = text.replace(/^#/, '')
  return (
    String(order.id) === orderNumber ||
    order.customerName.toLowerCase().includes(text) ||
    (digits.length > 0 && (order.customerPhone ?? '').replace(/\D/g, '').includes(digits))
  )
}

function matchesFilter(order: Order, filter: Filter): boolean {
  if (filter === 'TODOS') return true
  if (filter === 'ANDAMENTO') return isInProgress(order.status)
  return order.status === filter
}

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('ANDAMENTO')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const now = useNow(CLOCK_INTERVAL_MS)

  useEffect(() => {
    let active = true
    ordersApi
      .list()
      .then((data) => active && setOrders(data))
      .catch((err) => active && setError(getErrorMessage(err)))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden) return
      ordersApi
        .list()
        .then(setOrders)
        .catch(() => undefined)
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])

  const searched = useMemo(() => orders.filter((o) => matchesSearch(o, search)), [orders, search])

  const counts = useMemo(() => {
    const map = new Map<Filter, number>()
    FILTERS.forEach((f) => map.set(f, searched.filter((o) => matchesFilter(o, f)).length))
    return map
  }, [searched])

  const visible = useMemo(() => searched.filter((o) => matchesFilter(o, filter)), [searched, filter])

  async function changeStatus(order: Order, status: OrderStatus) {
    setUpdatingId(order.id)
    setError(null)
    try {
      const updated = await ordersApi.updateStatus(order.id, status)
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setUpdatingId(null)
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return
    const target = cancelTarget
    setCancelTarget(null)
    await changeStatus(target, 'CANCELADO')
  }

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev])
    setFilter('ANDAMENTO')
    setShowForm(false)
  }

  const emptyTitle =
    orders.length === 0
      ? 'Nenhum pedido ainda'
      : search.trim()
        ? 'Nenhum pedido encontrado'
        : filter === 'ANDAMENTO'
          ? 'Nenhum pedido em andamento'
          : 'Nenhum pedido com esse status'
  const emptyHint =
    orders.length === 0
      ? 'Crie o primeiro pedido para começar o rastreamento.'
      : 'Tente outra busca ou outro filtro.'

  return (
    <>
      <div className="page-head">
        <div className="page-head__title">
          <h1>Pedidos</h1>
          <LiveIndicator />
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>
          <PlusIcon />
          Novo pedido
        </button>
      </div>

      <label className="search">
        <SearchIcon />
        <input
          type="search"
          placeholder="Buscar por nº do pedido, nome ou telefone do cliente"
          aria-label="Buscar pedidos"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className="filters" role="tablist" aria-label="Filtrar por status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            className={`chip${filter === f ? ' is-active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {FILTER_LABEL[f]} <span className="chip__count">{counts.get(f) ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert--error" role="alert">{error}</div>}

      {loading && orders.length === 0 ? (
        <p className="state">Carregando pedidos...</p>
      ) : visible.length === 0 ? (
        <div className="state card">
          <h3>{emptyTitle}</h3>
          <p className="muted">{emptyHint}</p>
        </div>
      ) : (
        <div className="orders">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              now={now}
              updating={updatingId === order.id}
              onChangeStatus={changeStatus}
              onCancel={setCancelTarget}
            />
          ))}
        </div>
      )}

      {showForm && <NewOrderModal onClose={() => setShowForm(false)} onCreated={handleCreated} />}

      {cancelTarget && (
        <ConfirmDialog
          title={`Cancelar o pedido #${cancelTarget.id}?`}
          message="O pedido poderá ser restaurado depois, na aba Cancelado."
          confirmLabel="Sim, cancelar"
          cancelLabel="Voltar"
          onConfirm={() => void confirmCancel()}
          onCancel={() => setCancelTarget(null)}
        />
      )}
    </>
  )
}
