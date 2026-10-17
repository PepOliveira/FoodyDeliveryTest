import { useEffect, useMemo, useState } from 'react'
import { ordersApi, type Order, type OrderStatus, type OrderSummary } from '../../api/orders'
import { getErrorMessage } from '../../api/client'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { LiveIndicator } from './LiveIndicator'
import { NewOrderModal } from './NewOrderModal'
import { OrderCard } from './OrderCard'
import { PlusIcon, SearchIcon } from '../../components/ui/icons'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useNow } from '../../hooks/useNow'
import { useOrders } from './useOrders'
import { IN_PROGRESS, STATUS_LABEL } from './orderUtils'

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
const SEARCH_DEBOUNCE_MS = 300

function statusesFor(filter: Filter): OrderStatus[] {
  if (filter === 'ANDAMENTO') return IN_PROGRESS
  if (filter === 'TODOS') return []
  return [filter]
}

function countFor(filter: Filter, summary: OrderSummary | null): number {
  if (!summary) return 0
  const statuses = filter === 'TODOS' ? (Object.keys(summary) as OrderStatus[]) : statusesFor(filter)
  return statuses.reduce((total, status) => total + (summary[status] ?? 0), 0)
}

export function OrdersPage() {
  const [filter, setFilter] = useState<Filter>('ANDAMENTO')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const now = useNow(CLOCK_INTERVAL_MS)
  const query = useDebouncedValue(search.trim(), SEARCH_DEBOUNCE_MS)
  const statuses = useMemo(() => statusesFor(filter), [filter])

  const { orders, summary, hasMore, loading, loadingMore, error, refresh, loadMore } = useOrders({ statuses, query })

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, POLL_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [refresh])

  async function changeStatus(order: Order, status: OrderStatus) {
    setUpdatingId(order.id)
    setActionError(null)
    try {
      await ordersApi.updateStatus(order.id, status)
      await refresh()
    } catch (err) {
      setActionError(getErrorMessage(err))
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

  function handleCreated() {
    setShowForm(false)
    setSearch('')
    setFilter('ANDAMENTO')
    void refresh()
  }

  const totalOrders = countFor('TODOS', summary)
  const emptyTitle =
    totalOrders === 0 && !query
      ? 'Nenhum pedido ainda'
      : query
        ? 'Nenhum pedido encontrado'
        : filter === 'ANDAMENTO'
          ? 'Nenhum pedido em andamento'
          : 'Nenhum pedido com esse status'
  const emptyHint =
    totalOrders === 0 && !query
      ? 'Crie o primeiro pedido para começar o rastreamento.'
      : 'Tente outra busca ou outro filtro.'
  const visibleError = actionError ?? error

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
            {FILTER_LABEL[f]} <span className="chip__count">{countFor(f, summary)}</span>
          </button>
        ))}
      </div>

      {visibleError && <div className="alert alert--error" role="alert">{visibleError}</div>}

      {loading ? (
        <p className="state">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <div className="state card">
          <h3>{emptyTitle}</h3>
          <p className="muted">{emptyHint}</p>
        </div>
      ) : (
        <>
          <div className="orders">
            {orders.map((order) => (
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
          {hasMore && (
            <div className="load-more">
              <button type="button" className="btn btn--ghost" onClick={() => void loadMore()} disabled={loadingMore}>
                {loadingMore ? 'Carregando...' : 'Carregar mais'}
              </button>
            </div>
          )}
        </>
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
