import type { PlaceSearchResult } from '../types'

export type FirstPlaceDraft = { query: string; selected: PlaceSearchResult | null; note: string; updatedAt: number }
const prefix = 'anyones-guide:first-place:v1:'
const maxAge = 7 * 24 * 60 * 60 * 1000
const memory = new Map<string, FirstPlaceDraft | null>()
const text = (value: unknown, limit: number) => typeof value === 'string' && value.length <= limit

export function isFirstPlaceDraft(value: unknown): value is FirstPlaceDraft {
  if (!value || typeof value !== 'object') return false
  const draft = value as FirstPlaceDraft, place = draft.selected
  return text(draft.query, 300) && text(draft.note, 5000) && Number.isFinite(draft.updatedAt)
    && draft.updatedAt <= Date.now() + 60000 && Date.now() - draft.updatedAt < maxAge
    && (place === null || Boolean(place && text(place.id, 1000) && place.id.trim()
      && text(place.name, 300) && place.name.trim() && text(place.address, 1500)
      && (place.subtitle === undefined || text(place.subtitle, 500))
      && (place.sourceCategory === undefined || text(place.sourceCategory, 300))
      && (place.provider === undefined || ['geoapify', 'demo', 'manual'].includes(place.provider))
      && Number.isFinite(place.lat) && place.lat >= -90 && place.lat <= 90
      && Number.isFinite(place.lng) && place.lng >= -180 && place.lng <= 180))
}

export function loadFirstPlaceDraft(scope: string): FirstPlaceDraft | null {
  const key = prefix + scope
  try {
    const raw = memory.has(key) ? null : globalThis.localStorage?.getItem(key) ?? 'null'
    if (raw && raw.length > 64000) return null
    const draft: unknown = memory.has(key) ? memory.get(key) : JSON.parse(raw ?? 'null')
    if (isFirstPlaceDraft(draft)) { memory.set(key, draft); return draft }
  } catch { /* Damaged or blocked storage must not prevent creation. */ }
  return null
}

export function saveFirstPlaceDraft(scope: string, draft: FirstPlaceDraft): boolean {
  const key = prefix + scope
  if (!isFirstPlaceDraft(draft)) return false
  memory.set(key, draft)
  try {
    if (!globalThis.localStorage) return false
    globalThis.localStorage.setItem(key, JSON.stringify(draft))
    return true
  } catch { return false }
}

export function clearFirstPlaceDraft(scope: string) {
  const key = prefix + scope
  memory.set(key, null)
  try { globalThis.localStorage?.removeItem(key) } catch { /* Saved places do not depend on cleanup. */ }
}
