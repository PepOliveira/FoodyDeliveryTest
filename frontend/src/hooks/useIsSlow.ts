import { useEffect, useState } from 'react'

export function useIsSlow(active: boolean, thresholdMs: number): boolean {
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = window.setTimeout(() => setSlow(true), thresholdMs)
    return () => {
      window.clearTimeout(id)
      setSlow(false)
    }
  }, [active, thresholdMs])

  return slow
}
