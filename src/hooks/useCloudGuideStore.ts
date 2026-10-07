import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { guessCategory } from '../utils/category'
import { orderCategoryPlaces, patchPlace, reorderPlaces } from '../utils/guideEditing'
import { getGuideSaveQueue } from '../services/guideSaves'
import { addPlaceToGuide, getGuideById, persistGuideEdits, updateGuideVisibility } from '../services/guideRepository'
import type { CategoryId, Guide, GuideVisibility, Place, PlaceSearchResult, SaveStatus } from '../types'

export function useCloudGuideStore(guideId: string, userId: string) {
  const [guide, setGuide] = useState<Guide | null>(null)
  const ref = useRef<Guide | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const queue = useMemo(() => getGuideSaveQueue(userId, guideId, edits => persistGuideEdits(guideId, edits)), [guideId, userId])
  const state = useSyncExternalStore(queue.subscribe, queue.getSnapshot)
  useEffect(() => { if (guide) return queue.activate() }, [Boolean(guide), queue])
  const change = (next: Guide) => { ref.current = next; setGuide(next) }
  useEffect(() => {
    let active = true
    setLoading(true); setError(null); ref.current = null; setGuide(null)
    void getGuideById(guideId).then(next => {
      if (!active) return
      if (next.ownerId !== userId) throw new Error('Owner mismatch')
      for (const edit of queue.getSnapshot().edits) {
        if (edit.kind === 'guideNote') next = { ...next, guideNote: edit.value }
        else if (edit.remove) next = { ...next, places: next.places.filter(p => p.guidePlaceId !== edit.linkId) }
        else next = patchPlace(next, edit.clientId, { ...(edit.note !== undefined ? { note: edit.note } : {}), ...(edit.categoryId !== undefined ? { categoryId: edit.categoryId } : {}), ...(edit.sortOrder !== undefined ? { sortOrder: edit.sortOrder } : {}), ...(edit.isStarred !== undefined ? { isStarred: edit.isStarred } : {}) })
      }
      change(next); void queue.flush().catch(() => {})
    }).catch(() => { if (active) setError('load') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false; void queue.flush().catch(() => {}) }
  }, [guideId, userId, queue, attempt])
  useEffect(() => {
    const retry = () => { void queue.flush().catch(() => {}) }
    const unload = (event: BeforeUnloadEvent) => { const s = queue.getSnapshot(); if (s.edits.length && !s.durable) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('online', retry); window.addEventListener('beforeunload', unload)
    return () => { window.removeEventListener('online', retry); window.removeEventListener('beforeunload', unload) }
  }, [queue])
  const updateGuideNote = (value: string) => { if (!ref.current) return; change({ ...ref.current, guideNote: value }); queue.stage({ kind: 'guideNote', value }) }
  const updatePlace = (id: string, patch: Partial<Place>) => {
    const current = ref.current, target = current?.places.find(p => p.id === id)
    if (!current || !target?.guidePlaceId) return
    const next = patchPlace(current, id, patch), updated = next.places.find(p => p.id === id)!
    change(next)
    queue.stage({ kind: 'place', clientId: id, linkId: target.guidePlaceId, ...(patch.note !== undefined ? { note: updated.note } : {}), ...(patch.categoryId !== undefined ? { categoryId: updated.categoryId, sortOrder: updated.sortOrder } : {}), ...(patch.isStarred !== undefined ? { isStarred: updated.isStarred } : {}) })
  }
  const removePlace = (id: string) => {
    const current = ref.current, target = current?.places.find(p => p.id === id)
    if (!current || !target?.guidePlaceId) return
    change({ ...current, places: current.places.filter(p => p.id !== id) }); queue.stage({ kind: 'place', clientId: id, linkId: target.guidePlaceId, remove: true })
  }
  const reorderPlace = (id: string, targetId: string) => {
    const current = ref.current
    if (!current) return
    const places = reorderPlaces(current.places, id, targetId), category = current.places.find(p => p.id === id)?.categoryId
    if (places === current.places) return
    change({ ...current, places })
    for (const p of places) if (p.categoryId === category && p.guidePlaceId) queue.stage({ kind: 'place', clientId: p.id, linkId: p.guidePlaceId, sortOrder: p.sortOrder })
  }
  const movePlace = (id: string, direction: -1 | 1) => {
    const current = ref.current, source = current?.places.find(p => p.id === id), group = orderCategoryPlaces(current?.places.filter(p => p.categoryId === source?.categoryId && Boolean(p.isStarred) === Boolean(source?.isStarred)) ?? [])
    const target = group[group.findIndex(p => p.id === id) + direction]; if (target) reorderPlace(id, target.id)
  }
  const addSearchResult = async (result: PlaceSearchResult, categoryId?: CategoryId) => {
    await queue.flush()
    const current = ref.current
    if (!current) throw new Error('Loading')
    const existing = current.places.find(p => p.externalId === result.id || p.name === result.name && p.address === result.address)
    if (existing) return existing
    const guessed = current.categories.some(c => c.id === categoryId) ? categoryId! : guessCategory(result.sourceCategory, result.name)
    const place = await addPlaceToGuide(current, result, current.categories.some(c => c.id === guessed) ? guessed : 'other')
    if (ref.current) change({ ...ref.current, places: [...ref.current.places, place] })
    return place
  }
  const saveFirstPlace = async (result: PlaceSearchResult, note: string, categoryId?: CategoryId) => {
    const pending = ref.current?.places.find(p => p.externalId === result.id || p.name === result.name && p.address === result.address)
    if (pending && pending.note !== note) updatePlace(pending.id, { note })
    const place = await addSearchResult(result, categoryId)
    if (place.note !== note) updatePlace(place.id, { note })
    await queue.flush()
    return ref.current?.places.find(p => p.id === place.id) ?? place
  }
  const setVisibility = async (visibility: GuideVisibility) => {
    await queue.flush(); await updateGuideVisibility(guideId, visibility)
    if (ref.current) change({ ...ref.current, visibility, isPublished: visibility !== 'draft' })
  }
  const saveStatusByPlaceId: Record<string, SaveStatus> = {}
  for (const edit of state.edits) if (edit.kind === 'place') saveStatusByPlaceId[edit.clientId] = state.status
  const reload = useCallback(() => setAttempt(v => v + 1), [])
  return { guide, loading, error, reload, updatePlace, updateGuideNote, flushGuideNote: queue.flush, flushAll: queue.flush, guideNoteSaveStatus: state.status, saveStatus: state.status, storageUnavailable: state.edits.length > 0 && !state.durable, saveFirstPlace, addSearchResult, removePlace, reorderPlace, movePlace, setVisibility, saveStatusByPlaceId }
}
