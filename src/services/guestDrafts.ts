import type { Category, DestinationSearchResult, Guide } from '../types'
import { displayCityName } from '../../shared/city-names.mjs'

export type GuestDraft = {
  id: string
  key: string
  requesterName: string
  requestedCity: string
  invitationId?: string
  requesterAnonymous?: boolean
  guide: Guide
}

const drafts = new Map<string, GuestDraft>()
const invitations = new Map<string, string>()
const prefix = 'anyones-guide:request-draft:'
const invitationKey = (name: string, city: string, id?: string) => id
  ? 'anyones-guide:request-invitation-id:' + id
  : 'anyones-guide:request-invitation:' + JSON.stringify([name, city])
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function storage(): Storage | null {
  try { return globalThis.localStorage ?? null } catch { return null }
}

export function isGuestDraft(value: unknown): value is GuestDraft {
  if (!value || typeof value !== 'object') return false
  const d = value as GuestDraft, g = d.guide
  const point = (p: { lat: number; lng: number } | undefined) => Boolean(p && Number.isFinite(p.lat) && p.lat >= -90 && p.lat <= 90 && Number.isFinite(p.lng) && p.lng >= -180 && p.lng <= 180)
  return typeof d.id === 'string' && uuid.test(d.id) && typeof d.key === 'string' && uuid.test(d.key)
    && typeof d.requesterName === 'string' && d.requesterName.trim().length > 0 && d.requesterName.length <= 80
    && typeof d.requestedCity === 'string' && d.requestedCity.length <= 120 && Boolean(g)
    && (d.invitationId === undefined || typeof d.invitationId === 'string' && uuid.test(d.invitationId))
    && (d.requesterAnonymous === undefined || typeof d.requesterAnonymous === 'boolean')
    && ['id','slug','city','country','authorName','title','intro','guideNote','updatedAt'].every(key => typeof g[key as keyof Guide] === 'string')
    && g.city.trim().length > 0 && g.city.length <= 120 && g.country.trim().length > 0 && g.country.length <= 120 && g.guideNote.length <= 10000
    && ['draft','unlisted','public'].includes(g.visibility) && typeof g.isPublished === 'boolean' && point(g.center)
    && Array.isArray(g.categories) && g.categories.length <= 20 && g.categories.every(c => c && typeof c.id === 'string' && typeof c.label === 'string' && typeof c.icon === 'string' && Number.isFinite(c.sortOrder))
    && Array.isArray(g.places) && g.places.length <= 100 && g.places.every(p => p && typeof p.id === 'string'
      && typeof p.name === 'string' && p.name.trim().length > 0 && p.name.length <= 300 && typeof p.address === 'string' && p.address.length <= 1500
      && typeof p.note === 'string' && p.note.length <= 5000 && ['eat','coffee','drink','see','shop','other'].includes(p.categoryId) && point(p)
      && (p.subtitle === undefined || typeof p.subtitle === 'string' && p.subtitle.length <= 500)
      && (p.externalId === undefined || typeof p.externalId === 'string' && p.externalId.length <= 1000)
      && (p.provider === undefined || ['geoapify','demo','manual'].includes(p.provider))
      && (p.isStarred === undefined || typeof p.isStarred === 'boolean')
      && (p.sortOrder === undefined || Number.isInteger(p.sortOrder) && p.sortOrder >= 0))
}
// jsonb text includes spaces after structural separators. Account for UTF-8,
// escaped strings and this PostgreSQL formatting before leaving for OAuth.
export function guestSnapshotBytes(draft: GuestDraft) {
  const json = JSON.stringify(draft)
  let quoted = false, escaped = false, separators = 0
  for (const c of json) {
    if (escaped) { escaped = false; continue }
    if (quoted && c === '\\') { escaped = true; continue }
    if (c === '"') quoted = !quoted
    else if (!quoted && (c === ':' || c === ',')) separators++
  }
  return new TextEncoder().encode(json).length + separators
}

export function createGuestDraft(destination: DestinationSearchResult, requesterName: string, requestedCity: string, categories: Category[], invitationId?: string, requesterAnonymous?: boolean): GuestDraft {
  const id = crypto.randomUUID()
  const city = displayCityName(destination.city, destination.country)
  return {
    id, key: crypto.randomUUID(), requesterName, requestedCity,
    ...(invitationId ? { invitationId } : {}),
    ...(requesterAnonymous ? { requesterAnonymous: true } : {}),
    guide: {
      id, slug: 'guest-draft', city, country: destination.country,
      authorName: 'A local', title: city, intro: '', guideNote: '',
      center: { lat: destination.lat, lng: destination.lng }, categories: categories.map(category => ({ ...category })),
      places: [], visibility: 'draft', isPublished: false, updatedAt: new Date().toISOString(),
    },
  }
}

export function withGuestCityName(draft: GuestDraft): GuestDraft {
  const city = displayCityName(draft.guide.city, draft.guide.country)
  if (city === draft.guide.city) return draft
  return { ...draft, guide: { ...draft.guide, city, title: draft.guide.title === draft.guide.city ? city : draft.guide.title } }
}

export function saveGuestDraft(draft: GuestDraft, target = storage()): boolean {
  draft = withGuestCityName(draft)
  drafts.set(draft.id, draft)
  const index = invitationKey(draft.requesterName, draft.requestedCity, draft.invitationId)
  invitations.set(index, draft.id)
  try { if (!target) return false; target.setItem(prefix + draft.id, JSON.stringify(draft)); target.setItem(index, draft.id); return true }
  catch { return false }
}

export function findInvitationDraft(name: string, city: string, target = storage(), invitationId?: string): GuestDraft | null {
  const index = invitationKey(name, city, invitationId)
  let id = invitations.get(index)
  try { id ||= target?.getItem(index) ?? undefined } catch { /* Memory fallback works during this visit. */ }
  const draft = id ? loadGuestDraft(id, target) : null
  return draft && (invitationId ? draft.invitationId === invitationId : !draft.invitationId && draft.requesterName === name && draft.requestedCity === city) ? draft : null
}

export function loadGuestDraft(id: string, target = storage()): GuestDraft | null {
  if (drafts.has(id)) return drafts.get(id)!
  try {
    const raw = target?.getItem(prefix + id)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isGuestDraft(parsed) || parsed.id !== id) return null
    const draft = withGuestCityName(parsed)
    drafts.set(id, draft)
    return draft
  } catch { return null }
}

export function clearGuestDraft(id: string, target = storage()) {
  const draft = loadGuestDraft(id, target)
  if (draft) {
    const index = invitationKey(draft.requesterName, draft.requestedCity, draft.invitationId)
    if (invitations.get(index) === id) invitations.delete(index)
    try { if (target?.getItem(index) === id) target.removeItem(index) } catch { /* Continue clearing the saved draft. */ }
  }
  drafts.delete(id)
  try { target?.removeItem(prefix + id) } catch { /* The cloud guide is already saved. */ }
}
