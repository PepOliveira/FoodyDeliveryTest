import { useState, type FormEvent } from 'react'
import { ordersApi, type Order } from '../api/orders'
import { getErrorMessage } from '../api/client'
import { formatCurrency } from '../utils/order'

interface Props {
  onClose: () => void
  onCreated: (order: Order) => void
}

interface ItemDraft {
  name: string
  quantity: string
  unitPrice: string
}

const emptyItem = (): ItemDraft => ({ name: '', quantity: '1', unitPrice: '' })

export function NewOrderModal({ onClose, onCreated }: Props) {
  const [customerName, setCustomerName] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)

  function updateItem(index: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const order = await ordersApi.create({
        customerName,
        deliveryAddress,
        items: items.map((i) => ({
          name: i.name,
          quantity: Number(i.quantity),
          unitPrice: Number(i.unitPrice),
        })),
      })
      onCreated(order)
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-order-title" onClick={onClose}>
      <form className="modal__panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2 id="new-order-title">Novo pedido</h2>

        <div className="form">
          <label className="field">
            <span>Cliente</span>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required autoFocus />
          </label>
          <label className="field">
            <span>Endereço de entrega</span>
            <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required />
          </label>

          <fieldset className="items">
            <legend>Itens</legend>
            {items.map((item, index) => (
              <div className="items__row" key={index}>
                <input
                  placeholder="Item"
                  aria-label={`Nome do item ${index + 1}`}
                  value={item.name}
                  onChange={(e) => updateItem(index, { name: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min={1}
                  step={1}
                  aria-label={`Quantidade do item ${index + 1}`}
                  value={item.quantity}
                  onChange={(e) => updateItem(index, { quantity: e.target.value })}
                  required
                />
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  placeholder="Preço"
                  aria-label={`Preço unitário do item ${index + 1}`}
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, { unitPrice: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  aria-label={`Remover item ${index + 1}`}
                  disabled={items.length === 1}
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                >
                  ✕
                </button>
              </div>
            ))}
            <button type="button" className="btn btn--outline btn--sm" onClick={() => setItems((p) => [...p, emptyItem()])}>
              + Adicionar item
            </button>
          </fieldset>

          <p className="modal__total">
            Total: <strong>{formatCurrency(total)}</strong>
          </p>

          {error && <div className="alert alert--error" role="alert">{error}</div>}
        </div>

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Criar pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
