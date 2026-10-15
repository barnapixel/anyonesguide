import { appConfig } from '../config'
import type { Coordinates, PlaceSearchResult, RecommendationKind } from '../types'

export type AreaDraft = {
  id: string
  point: Coordinates
  name: string
  note: string
  kind: 'area' | 'street'
  confirmed: boolean
  nameEdited: boolean
  attempted?: boolean
  updatedAt: number
}
const prefix = 'anyones-guide:area-draft:v1:'
const memory = new Map<string, AreaDraft | null>()
export const validPoint = (p: Coordinates) => Boolean(p && Number.isFinite(p.lat) && Math.abs(p.lat) <= 90 && Number.isFinite(p.lng) && Math.abs(p.lng) <= 180)
export function isAreaDraft(d: unknown): d is AreaDraft {
  if (!d || typeof d !== 'object') return false
  const value = d as AreaDraft
  return typeof value.id === 'string' && /^[0-9a-f-]{36}$/i.test(value.id) && validPoint(value.point)
    && typeof value.name === 'string' && value.name.length <= 300 && typeof value.note === 'string' && value.note.length <= 5000
    && ['area','street'].includes(value.kind) && typeof value.confirmed === 'boolean' && typeof value.nameEdited === 'boolean'
    && (value.attempted === undefined || typeof value.attempted === 'boolean')
    && Number.isFinite(value.updatedAt) && value.updatedAt <= Date.now() + 60000 && value.updatedAt > Date.now() - 7 * 86400000
}
export function loadAreaDraft(scope: string): AreaDraft | null {
  try {
    const raw = memory.has(scope) ? memory.get(scope) : JSON.parse(localStorage.getItem(prefix + scope) ?? 'null')
    if (isAreaDraft(raw)) return raw
  } catch { /* An unreadable draft must not prevent creating a recommendation. */ }
  return null
}
export function saveAreaDraft(scope: string, draft: AreaDraft) {
  if (!isAreaDraft(draft)) return false
  memory.set(scope, draft)
  try { localStorage.setItem(prefix + scope, JSON.stringify(draft)); return true } catch { return false }
}
export function clearAreaDraft(scope: string) {
  memory.set(scope, null)
  try { localStorage.removeItem(prefix + scope) } catch { /* The successful save is independent of cleanup. */ }
}
export function areaSearchResult(draft: AreaDraft): PlaceSearchResult {
  if (!isAreaDraft(draft) || !draft.name.trim() || !draft.confirmed) throw Error('Invalid area recommendation.')
  return { id: draft.id, provider: 'manual', recommendationKind: draft.kind, name: draft.name.trim(), address: '', subtitle: '', ...draft.point }
}

const clean = (value: unknown) => typeof value === 'string' && value.trim().length <= 300 ? value.trim() : ''
export function areaNames(row: Record<string, unknown>): { area: string; street: string } {
  // Suggest geographic names, never a returned business/building or a full address.
  const city = clean(row.city)
  const area = [row.neighbourhood, row.quarter, row.suburb, row.district].map(clean).find(name => name && name !== city) ?? ''
  const street = clean(row.street) || (row.result_type === 'street' ? clean(row.name) : '')
  // A distant snapped result isn't a good street suggestion at this pin.
  return { area, street: typeof row.distance === 'number' && row.distance > 150 ? '' : street }
}
export async function suggestAreaNames(point: Coordinates, locale: 'en' | 'pl', signal: AbortSignal) {
  if (!appConfig.geoapifyApiKey || !validPoint(point)) throw Error('Unavailable name suggestion.')
  const params = new URLSearchParams({ lat: String(point.lat), lon: String(point.lng), type: 'street', format: 'json', lang: locale, apiKey: appConfig.geoapifyApiKey })
  const response = await fetch(`https://api.geoapify.com/v1/geocode/reverse?${params}`, { signal })
  if (!response.ok) throw Error('Unavailable name suggestion.')
  const data = await response.json()
  return areaNames(data.results?.[0] ?? {})
}
export async function searchMapLocations(query: string, center: Coordinates, signal?: AbortSignal): Promise<PlaceSearchResult[]> {
  if (!appConfig.geoapifyApiKey || query.trim().length < 2) return []
  const params = new URLSearchParams({ text: query.trim(), format: 'json', lang: 'en', limit: '6', bias: `proximity:${center.lng},${center.lat}`, apiKey: appConfig.geoapifyApiKey })
  const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params}`, { signal })
  if (!response.ok) throw Error('Map search unavailable.')
  const data = await response.json()
  if (!Array.isArray(data.results)) throw Error('Invalid map search response.')
  return data.results.filter((r: Record<string, unknown>) => typeof r.lat === 'number' && typeof r.lon === 'number' && validPoint({ lat: r.lat, lng: r.lon })).map((r: Record<string, unknown>) => ({
    id: String(r.place_id ?? `${r.lat}:${r.lon}`), provider: 'geoapify', name: clean(r.name) || clean(r.address_line1),
    subtitle: clean(r.city), address: typeof r.formatted === 'string' ? r.formatted.slice(0,1500) : '', lat: Number(r.lat), lng: Number(r.lon),
  })).filter((r: PlaceSearchResult) => Boolean(r.name))
}
export const isAreaKind = (kind?: RecommendationKind) => kind === 'area' || kind === 'street'
