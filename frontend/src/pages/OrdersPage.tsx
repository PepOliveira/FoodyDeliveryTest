import { useCallback, useEffect, useMemo, useState } from 'react'
import { ordersApi, type Order, type OrderStatus } from '../api/orders'
import { getErrorMessage } from '../api/client'
import { NewOrderModal } from '../components/NewOrderModal'
import { OrderCard } from '../components/OrderCard'
import { STATUS_LABEL } from '../utils/order'

type Filter = 'TODOS' | OrderStatus
const FILTERS: Filter[] = ['TODOS', 'RECEBIDO', 'EM_PREPARO', 'SAIU_PARA_ENTREGA', 'ENTREGUE', 'CANCELADO']

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>('TODOS')
  const [showForm, setShowForm] = useState(false)
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setOrders(await ordersApi.list())
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

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

  const counts = useMemo(() => {
    const map = new Map<Filter, number>([['TODOS', orders.length]])
    orders.forEach((o) => map.set(o.status, (map.get(o.status) ?? 0) + 1))
    return map
  }, [orders])

  const visible = filter === 'TODOS' ? orders : orders.filter((o) => o.status === filter)

  async function handleChangeStatus(order: Order, status: OrderStatus) {
    if (status === 'CANCELADO' && !window.confirm(`Cancelar o pedido #${order.id}?`)) return
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

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev])
    setFilter('TODOS')
    setShowForm(false)
  }

  return (
    <>
      <div className="page-head">
        <h1>Pedidos</h1>
        <div className="page-head__actions">
          <button type="button" className="btn btn--ghost" onClick={() => void load()} disabled={loading}>
            Atualizar
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setShowForm(true)}>
            + Novo pedido
          </button>
        </div>
      </div>

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
            {f === 'TODOS' ? 'Todos' : STATUS_LABEL[f]} <span className="chip__count">{counts.get(f) ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <div className="alert alert--error" role="alert">{error}</div>}

      {loading && orders.length === 0 ? (
        <p className="state">Carregando pedidos...</p>
      ) : visible.length === 0 ? (
        <div className="state card">
          <h3>{orders.length === 0 ? 'Nenhum pedido ainda' : 'Nenhum pedido com esse status'}</h3>
          <p className="muted">
            {orders.length === 0 ? 'Crie o primeiro pedido para começar o rastreamento.' : 'Tente outro filtro.'}
          </p>
        </div>
      ) : (
        <div className="orders">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              updating={updatingId === order.id}
              onChangeStatus={handleChangeStatus}
            />
          ))}
        </div>
      )}

      {showForm && <NewOrderModal onClose={() => setShowForm(false)} onCreated={handleCreated} />}
    </>
  )
}
