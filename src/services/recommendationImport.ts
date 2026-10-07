import type { Guide, PlaceSearchResult } from '../types'

export type ExtractedRecommendation = { name: string; address: string; city: string; sourceNote: string }
export type ImportRow = ExtractedRecommendation & { id: string; match: PlaceSearchResult | null; chosen: boolean; note: string; savedId?: string; attempted?: boolean }
export type ImportDraft = { rows: ImportRow[]; updatedAt: number; first?: boolean }
const PREFIX = 'anyones-guide:recommendation-import:'
const TTL = 7 * 24 * 60 * 60 * 1000

export const importScope = (guide: Guide, guest = false) => `${guest ? 'guest' : guide.ownerId ? 'owner:' + guide.ownerId : 'local'}:${guide.id}`
const validMatch = (value: PlaceSearchResult | null) => value === null || Boolean(value && typeof value.id === 'string' && typeof value.name === 'string' && typeof value.address === 'string' && Number.isFinite(value.lat) && Math.abs(value.lat) <= 90 && Number.isFinite(value.lng) && Math.abs(value.lng) <= 180)
export function loadImportDraft(scope: string): ImportDraft | null {
  try {
    const draft = JSON.parse(localStorage.getItem(PREFIX + scope) ?? 'null') as ImportDraft | null
    if (!draft) return null
    if (!Number.isFinite(draft.updatedAt) || draft.updatedAt > Date.now() + 60000 || draft.updatedAt < Date.now() - TTL || (draft.first !== undefined && typeof draft.first !== 'boolean') || !Array.isArray(draft.rows) || draft.rows.length > 20 || !draft.rows.every(row =>
      row && ['id', 'name', 'address', 'city', 'sourceNote', 'note'].every(key => typeof row[key as keyof ImportRow] === 'string') && row.name.length <= 200 && row.address.length <= 300 && row.city.length <= 120 && row.sourceNote.length <= 1000 && row.note.length <= 5000 && typeof row.chosen === 'boolean' && validMatch(row.match) && (row.savedId === undefined || typeof row.savedId === 'string') && (row.attempted === undefined || typeof row.attempted === 'boolean'))) { clearImportDraft(scope); return null }
    return draft
  } catch { clearImportDraft(scope); return null }
}
export function pruneImportDrafts() {
  try {
    for (const key of Object.keys(localStorage)) if (key.startsWith(PREFIX)) loadImportDraft(key.slice(PREFIX.length))
  } catch { /* Storage may be blocked. */ }
}
export function saveImportDraft(scope: string, draft: ImportDraft): boolean {
  try { localStorage.setItem(PREFIX + scope, JSON.stringify(draft)); return true } catch { return false }
}
export function clearImportDraft(scope: string) { try { localStorage.removeItem(PREFIX + scope) } catch { /* Usable in memory. */ } }

export async function extractRecommendations(source: { kind: 'text'; text: string } | { kind: 'image'; data: string; mimeType: string }, guide: Guide, signal: AbortSignal): Promise<ExtractedRecommendation[]> {
  const response = await fetch('/api/recommendation-import', { method: 'POST', signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...source, city: guide.city, country: guide.country }) })
  if (!response.ok) throw Error(response.status === 429 ? 'import.rateLimit' : response.status === 503 || response.status === 404 ? 'import.notConfigured' : 'import.failed')
  const body = await response.json() as { places?: ExtractedRecommendation[] }
  if (!Array.isArray(body.places) || body.places.length > 20 || !body.places.every(row => row && typeof row.name === 'string' && row.name.trim() && row.name.length <= 200 && typeof row.address === 'string' && row.address.length <= 300 && typeof row.city === 'string' && row.city.length <= 120 && typeof row.sourceNote === 'string' && row.sourceNote.length <= 1000)) throw Error('import.failed')
  return body.places
}

// Re-encode locally to strip metadata and keep the request within function limits.
export async function prepareScreenshot(file: File): Promise<{ data: string; mimeType: string }> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw Error('import.imageType')
  if (!file.size || file.size > 12 * 1024 * 1024) throw Error('import.imageSize')
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.src = url
    await img.decode()
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 24000000) throw Error('import.imageSize')
    const scale = Math.min(1, 1800 / img.naturalWidth, 6000 / img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) throw Error('import.imageRead')
    context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(img, 0, 0, canvas.width, canvas.height)
    const data = canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
    if (!data || data.length * 0.75 > 2 * 1024 * 1024) throw Error('import.imageSize')
    return { data, mimeType: 'image/jpeg' }
  } catch (error) { throw error instanceof Error && error.message.startsWith('import.') ? error : Error('import.imageRead') }
  finally { URL.revokeObjectURL(url) }
}
