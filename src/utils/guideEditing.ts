import type { Guide, Place } from '../types'

// Presentation priority is separate from stored author order. Stable fallback
// preserves older browser drafts that have no sortOrder or star field.
export function orderCategoryPlaces(places: Place[]) {
  return places.map((place, index) => ({ place, index })).sort((a, b) =>
    Number(Boolean(b.place.isStarred)) - Number(Boolean(a.place.isStarred))
    || (a.place.sortOrder ?? a.index) - (b.place.sortOrder ?? b.index)
    || a.index - b.index).map(item => item.place)
}

export function reorderPlaces(places: Place[], id: string, targetId: string) {
  const source = places.find(p => p.id === id), target = places.find(p => p.id === targetId)
  if (!source || !target || source.categoryId !== target.categoryId
    || Boolean(source.isStarred) !== Boolean(target.isStarred) || id === targetId) return places
  const category = places.filter(p => p.categoryId === source.categoryId)
    .map((place, index) => ({ place, index }))
    .sort((a,b) => (a.place.sortOrder ?? a.index) - (b.place.sortOrder ?? b.index) || a.index - b.index)
    .map(item => item.place)
  const group = category.filter(p => Boolean(p.isStarred) === Boolean(source.isStarred))
  const to = group.findIndex(p => p.id === targetId)
  const [moved] = group.splice(group.findIndex(p => p.id === id), 1)
  group.splice(to, 0, moved)
  let groupIndex = 0
  const normalized = category.map((p, sortOrder) => ({
    ...(Boolean(p.isStarred) === Boolean(source.isStarred) ? group[groupIndex++] : p), sortOrder,
  }))
  let categoryIndex = 0
  return places.map(p => p.categoryId === source.categoryId ? normalized[categoryIndex++] : p)
}

export function patchPlace(guide: Guide, id: string, patch: Partial<Place>) {
  const target = guide.places.find(p => p.id === id)
  const next = { ...patch }
  if (target && next.categoryId !== undefined && next.categoryId !== target.categoryId) {
    next.sortOrder = 1 + Math.max(-1, ...guide.places.filter(p => p.categoryId === next.categoryId).map(p => p.sortOrder ?? 0))
  }
  return { ...guide, places: guide.places.map(p => p.id === id ? { ...p, ...next } : p).sort((a,b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) }
}
