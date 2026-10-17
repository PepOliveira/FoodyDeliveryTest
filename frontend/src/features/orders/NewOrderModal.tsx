import { useEffect, useState, type FormEvent } from 'react'
import { ordersApi, type Order } from '../../api/orders'
import { getErrorMessage } from '../../api/client'
import { formatCurrency } from './orderUtils'
import { formatPhone } from '../../lib/phone'
import { CloseIcon, TrashIcon } from '../../components/ui/icons'

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
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [deliveryComplement, setDeliveryComplement] = useState('')
  const [items, setItems] = useState<ItemDraft[]>([emptyItem()])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const total = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

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
        customerPhone,
        deliveryAddress,
        deliveryComplement: deliveryComplement.trim() || undefined,
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
      <form className="modal__panel modal__panel--form" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="modal__header">
          <h2 id="new-order-title">Novo pedido</h2>
          <button
            type="button"
            className="btn btn--ghost btn--icon"
            aria-label="Fechar"
            title="Fechar"
            onClick={onClose}
            disabled={saving}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="modal__body">
          <div className="form">
            <div className="form__row">
              <label className="field">
                <span>Cliente</span>
                <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required autoFocus />
              </label>
              <label className="field">
                <span>Telefone</span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                  minLength={14}
                  required
                />
              </label>
            </div>
            <label className="field">
              <span>Endereço de entrega</span>
              <input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required />
            </label>
            <label className="field">
              <span>
                Complemento <small className="muted">(opcional)</small>
              </span>
              <input
                placeholder="Apto, bloco, ponto de referência..."
                value={deliveryComplement}
                onChange={(e) => setDeliveryComplement(e.target.value)}
                maxLength={200}
              />
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
                    className="btn btn--icon btn--danger"
                    aria-label={`Remover item ${index + 1}`}
                    title="Remover item"
                    disabled={items.length === 1}
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn--outline btn--sm" onClick={() => setItems((p) => [...p, emptyItem()])}>
                + Adicionar item
              </button>
            </fieldset>

            {error && <div className="alert alert--error" role="alert">{error}</div>}
          </div>
        </div>

        <div className="modal__footer">
          <p className="modal__total">
            Total <strong>{formatCurrency(total)}</strong>
          </p>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Criar pedido'}
          </button>
        </div>
      </form>
    </div>
  )
}
