import { useEffect, useState } from 'react'
export function useSearch<T>(query: string, enabled: boolean, search: (query: string, signal: AbortSignal) => Promise<T[]>) {
  const [results, setResults] = useState<T[]>([]), [loading, setLoading] = useState(false), [failed, setFailed] = useState(false)
  useEffect(() => {
    setResults([]); setFailed(false)
    if (!enabled || query.trim().length < 2) { setLoading(false); return }
    const controller = new AbortController(); setLoading(true)
    const timer = setTimeout(async () => {
      try { const found = await search(query, controller.signal); if (!controller.signal.aborted) setResults(found) }
      catch { if (!controller.signal.aborted) setFailed(true) }
      finally { if (!controller.signal.aborted) setLoading(false) }
    }, 280)
    return () => { clearTimeout(timer); controller.abort() }
  }, [query, enabled, search])
  return { results, loading, failed }
}
