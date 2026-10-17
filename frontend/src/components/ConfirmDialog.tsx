interface Props {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ title, message, confirmLabel, cancelLabel, busy, onConfirm, onCancel }: Props) {
  return (
    <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onClick={onCancel}>
      <div className="modal__panel modal__panel--sm" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p className="muted confirm__message">{message}</p>
        <div className="modal__actions modal__actions--end">
          <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={busy} autoFocus>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
