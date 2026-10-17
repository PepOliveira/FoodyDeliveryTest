import { useIsSlow } from '../../hooks/useIsSlow'

const SLOW_AFTER_MS = 4000

export function SlowServerHint({ active }: { active: boolean }) {
  const slow = useIsSlow(active, SLOW_AFTER_MS)
  if (!active || !slow) return null
  return (
    <p className="hint" role="status">
      Acordando o servidor... a primeira requisição pode levar até 1 minuto.
    </p>
  )
}
