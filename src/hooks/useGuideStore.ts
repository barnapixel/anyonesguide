import { orderCategoryPlaces, patchPlace, reorderPlaces } from '../utils/guideEditing'
import { useCallback, useEffect, useState } from 'react'
import { categories, demoGuide } from '../data/demo'
import { guessCategory } from '../utils/category'
import type { CategoryId, Guide, GuideVisibility, Place, PlaceSearchResult } from '../types'

const STORAGE_KEY = 'anyones-guide:v0:guide'

function loadGuide(): Guide {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Guide>
      const visibility = parsed.visibility ?? (parsed.isPublished === false ? 'draft' : 'unlisted')
      const places = parsed.places ?? demoGuide.places
      const savedCategories = parsed.categories ?? categories
      const visibleCategories = savedCategories.filter(category => category.id !== 'stay' || places.some(place => place.categoryId === 'stay'))
      return { ...demoGuide, ...parsed, visibility, categories: visibleCategories, isPublished: visibility !== 'draft', places }
    }
  } catch {
    // Ignore malformed local state and return the bundled demo.
  }
  return demoGuide
}

export function useGuideStore() {
  const [guide, setGuide] = useState<Guide>(() => loadGuide())

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(guide)) }
    catch { /* The demo can still be read when storage is disabled. */ }
  }, [guide])

  const updatePlace = useCallback((id: string, patch: Partial<Place>) => setGuide(current => ({ ...patchPlace(current, id, patch), updatedAt: new Date().toISOString() })), [])

  const updateGuideNote = useCallback((guideNote: string) => {
    setGuide(current => ({ ...current, guideNote, updatedAt: new Date().toISOString() }))
  }, [])

  const addPlace = useCallback((place: Place) => {
    setGuide(current => {
      if (current.places.some(existing => existing.id === place.id || (existing.name === place.name && existing.address === place.address))) {
        return current
      }
      return {
        ...current,
        updatedAt: new Date().toISOString(),
        places: [...current.places, place],
      }
    })
  }, [])

  const removePlace = useCallback((placeId: string) => {
    setGuide(current => ({ ...current, updatedAt: new Date().toISOString(), places: current.places.filter(place => place.id !== placeId) }))
  }, [])

  const movePlace = useCallback((placeId: string, direction: -1 | 1) => {
    setGuide(current => {
      const place = current.places.find(p => p.id === placeId)
      if (!place) return current
      const sameCategory = orderCategoryPlaces(current.places.filter(p => p.categoryId === place.categoryId && Boolean(p.isStarred) === Boolean(place.isStarred)))
      const target = sameCategory[sameCategory.findIndex(p => p.id === placeId) + direction]
      if (!target) return current
      return { ...current, updatedAt: new Date().toISOString(), places: reorderPlaces(current.places, placeId, target.id) }
    })
  }, [])


  const reorderPlace = useCallback((id: string, targetId: string) => setGuide(current => ({ ...current, places: reorderPlaces(current.places, id, targetId), updatedAt: new Date().toISOString() })), [])

  const addSearchResult = useCallback(async (result: PlaceSearchResult, categoryId?: CategoryId, note = '', requireDurable = false) => {
    const id = `place-${result.id}`
    const existing = guide.places.find(place => place.id === id || place.externalId === result.id || (place.name === result.name && place.address === result.address))
    if (existing) {
      if (requireDurable) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(guide)) } catch { throw new Error('storage') } }
      return existing
    }
    const selected = guide.categories.some(c => c.id === categoryId) ? categoryId! : guessCategory(result.sourceCategory, result.name)
    const place: Place = {
      id,
      externalId: result.id,
      provider: result.provider ?? 'demo',
      name: result.name,
      subtitle: result.subtitle,
      address: result.address,
      lat: result.lat,
      lng: result.lng,
      categoryId: selected,
      note,
      isStarred: false,
      sortOrder: 1 + Math.max(-1, ...guide.places.filter(p => p.categoryId === selected).map(p => p.sortOrder ?? 0)),
    }
    if (requireDurable) {
      const next = { ...guide, places: [...guide.places, place], updatedAt: new Date().toISOString() }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch { throw new Error('storage') }
      setGuide(next)
    } else addPlace(place)
    return place
  }, [guide, addPlace])


  const setVisibility = useCallback((visibility: GuideVisibility) => {
    setGuide(current => ({ ...current, visibility, isPublished: visibility !== 'draft', updatedAt: new Date().toISOString() }))
  }, [])

  const resetGuide = useCallback(() => setGuide(demoGuide), [])

  const saveFirstPlace = (result: PlaceSearchResult, note: string) => addSearchResult(result, undefined, note, true)
  return { guide, saveFirstPlace, setGuide, updatePlace, updateGuideNote, addPlace, addSearchResult, removePlace, movePlace, reorderPlace, setVisibility, resetGuide }
}
