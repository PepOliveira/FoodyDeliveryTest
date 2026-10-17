import { useCallback, useEffect, useMemo, useState } from 'react'
import { ordersApi, type Order, type OrderStatus, type OrderSummary } from '../../api/orders'
import { getErrorMessage } from '../../api/client'

export const PAGE_SIZE = 20

interface Options {
  statuses: OrderStatus[]
  query: string
}

interface Snapshot {
  key: string
  orders: Order[]
  pages: number
  hasMore: boolean
  summary: OrderSummary
}

export function useOrders({ statuses, query }: Options) {
  const statusKey = statuses.join(',')
  const key = `${statusKey}|${query}`
  const statusList = useMemo(() => (statusKey ? (statusKey.split(',') as OrderStatus[]) : []), [statusKey])

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPages = useCallback(
    async (pages: number) => {
      const results = await Promise.all(
        Array.from({ length: pages }, (_, page) =>
          ordersApi.list({ statuses: statusList, q: query, page, size: PAGE_SIZE }),
        ),
      )
      return {
        orders: results.flatMap((r) => r.content),
        hasMore: !results[results.length - 1].last,
      }
    },
    [statusList, query],
  )

  useEffect(() => {
    let active = true
    Promise.all([fetchPages(1), ordersApi.summary(query)])
      .then(([result, summary]) => {
        if (!active) return
        setSnapshot({ key, orders: result.orders, pages: 1, hasMore: result.hasMore, summary })
        setError(null)
      })
      .catch((err) => active && setError(getErrorMessage(err)))
    return () => {
      active = false
    }
  }, [fetchPages, key, query])

  const ready = snapshot?.key === key
  const pages = ready ? snapshot.pages : 1

  const refresh = useCallback(async () => {
    try {
      const [result, summary] = await Promise.all([fetchPages(pages), ordersApi.summary(query)])
      setSnapshot((prev) =>
        prev && prev.key === key
          ? { key, orders: result.orders, pages: prev.pages, hasMore: result.hasMore, summary }
          : prev,
      )
    } catch {
      return
    }
  }, [fetchPages, pages, query, key])

  const loadMore = useCallback(async () => {
    if (!ready || !snapshot.hasMore) return
    setLoadingMore(true)
    try {
      const next = await ordersApi.list({ statuses: statusList, q: query, page: snapshot.pages, size: PAGE_SIZE })
      setSnapshot((prev) =>
        prev && prev.key === key
          ? { ...prev, orders: [...prev.orders, ...next.content], pages: prev.pages + 1, hasMore: !next.last }
          : prev,
      )
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoadingMore(false)
    }
  }, [ready, snapshot, statusList, query, key])

  return {
    orders: ready ? snapshot.orders : [],
    summary: snapshot?.summary ?? null,
    hasMore: ready && snapshot.hasMore,
    loading: !ready && !error,
    loadingMore,
    error,
    clearError: () => setError(null),
    refresh,
    loadMore,
  }
}
