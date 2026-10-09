import { useCallback, useEffect, useState } from 'react'

export const INITIAL_VISUAL_WAIT_MS = 2500

// One bounded wait per screen identity. Subsequent interaction never hides it.
export function useInitialReveal(key: string, needsVisual: boolean) {
  const [state, setState] = useState(() => ({ key, released: !needsVisual, expired: false }))
  const release = useCallback(() => setState(current => current.key === key
    ? current.released ? current : { ...current, released: true }
    : { key, released: true, expired: false }), [key])

  useEffect(() => {
    setState(current => current.key === key ? current : { key, released: !needsVisual, expired: false })
    if (!needsVisual) { release(); return }
    const timer = window.setTimeout(() => setState(current => current.key === key && !current.released
      ? { ...current, released: true, expired: true } : current), INITIAL_VISUAL_WAIT_MS)
    return () => window.clearTimeout(timer)
  }, [key, needsVisual, release])

  return {
    revealed: !needsVisual || (state.key === key && state.released),
    waitExpired: state.key === key && state.expired,
    release,
  }
}
