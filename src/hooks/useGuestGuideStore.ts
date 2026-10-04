import { orderCategoryPlaces, patchPlace, reorderPlaces } from '../utils/guideEditing'
import { useCallback, useRef, useState } from 'react'
import { loadGuestDraft, saveGuestDraft, type GuestDraft } from '../services/guestDrafts'
import { guessCategory } from '../utils/category'
import type { CategoryId, Guide, Place, PlaceSearchResult } from '../types'

export function useGuestGuideStore(id: string) {
  const [draft, setDraft] = useState(() => loadGuestDraft(id))
  const draftRef = useRef(draft)
  const [storageError, setStorageError] = useState(() => draft ? !saveGuestDraft(draft) : false)
  const change = useCallback((update: (guide: Guide) => Guide, requireDurable = false) => {
    const current = draftRef.current
    if (!current) return
    const next: GuestDraft = { ...current, guide: { ...update(current.guide), updatedAt: new Date().toISOString() } }
    const durable = saveGuestDraft(next)
    if (requireDurable && !durable) {
      saveGuestDraft(current)
      setStorageError(true)
      throw new Error('storage')
    }
    draftRef.current = next
    setStorageError(!durable)
    setDraft(next)
  }, [])

  const updatePlace = (id: string, patch: Partial<Place>) => change(guide => patchPlace(guide, id, patch))
  const updateGuideNote = (guideNote: string) => change(guide => ({ ...guide, guideNote }))
  const removePlace = (id: string) => change(guide => ({ ...guide, places: guide.places.filter(place => place.id !== id) }))
  const reorderPlace = (id: string, targetId: string) => change(guide => ({ ...guide, places: reorderPlaces(guide.places, id, targetId) }))
  const movePlace = (id: string, direction: -1 | 1) => {
    const source = draftRef.current?.guide.places.find(place => place.id === id)
    const category = orderCategoryPlaces(draftRef.current?.guide.places.filter(place => place.categoryId === source?.categoryId && Boolean(place.isStarred) === Boolean(source?.isStarred)) ?? [])
    const target = category[category.findIndex(place => place.id === id) + direction]
    if (target) reorderPlace(id, target.id)
  }
  const addSearchResult = async (result: PlaceSearchResult, categoryId?: CategoryId, note = '', requireDurable = false) => {
    const draft = draftRef.current
    if (!draft) throw new Error('Draft unavailable.')
    const existing = draft.guide.places.find(place => place.externalId === result.id || (place.name === result.name && place.address === result.address))
    if (existing) {
      if (requireDurable && !saveGuestDraft(draft)) { setStorageError(true); throw new Error('storage') }
      return existing
    }
    if (draft.guide.places.length >= 100) throw new Error('A guide can include up to 100 places.')
    const selected = draft.guide.categories.some(c => c.id === categoryId) ? categoryId! : guessCategory(result.sourceCategory, result.name)
    const place: Place = { id: crypto.randomUUID(), externalId: result.id, provider: result.provider ?? 'geoapify', name: result.name, subtitle: result.subtitle, address: result.address, lat: result.lat, lng: result.lng, categoryId: selected, note, sortOrder: 1 + Math.max(-1, ...draft.guide.places.filter(p => p.categoryId === selected).map(p => p.sortOrder ?? 0)), isStarred: false }
    change(guide => ({ ...guide, places: [...guide.places, place] }), requireDurable)
    return place
  }
  const saveFirstPlace = (result: PlaceSearchResult, note: string) => addSearchResult(result, undefined, note, true)
  return { draft, storageError, saveFirstPlace, updatePlace, updateGuideNote, removePlace, reorderPlace, movePlace, addSearchResult }
}
