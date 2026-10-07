import type { Guide, SavedGuide } from '../types'
import { displayCityName } from '../../shared/city-names.mjs'

const STORAGE_KEY = 'anyones-guide:saved-guides:v1'
const CHANGE_EVENT = 'anyones-guide:saved-guides-changed'

function safeParse(raw: string | null): SavedGuide[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is SavedGuide => Boolean(
      item &&
      typeof item.guideId === 'string' &&
      typeof item.profileSlug === 'string' &&
      typeof item.guideSlug === 'string' &&
      typeof item.city === 'string' &&
      typeof item.authorName === 'string'
    )).map(item => ({ ...item, city: displayCityName(item.city, item.country) }))
  } catch {
    return []
  }
}

export function listSavedGuides(): SavedGuide[] {
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY))
      .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt))
  } catch {
    // Private browsing or disabled storage must not prevent a guide from loading.
    return []
  }
}

function writeSavedGuides(items: SavedGuide[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function isGuideSaved(guideId: string) {
  return listSavedGuides().some(item => item.guideId === guideId)
}

export function saveGuide(guide: Guide) {
  if (!guide.profileSlug) throw new Error('This guide cannot be saved yet.')
  const existing = listSavedGuides().filter(item => item.guideId !== guide.id)
  const next: SavedGuide = {
    guideId: guide.id,
    profileSlug: guide.profileSlug,
    guideSlug: guide.slug,
    city: displayCityName(guide.city, guide.country),
    country: guide.country,
    authorName: guide.authorName,
    intro: guide.intro,
    placeCount: guide.places.length,
    savedAt: new Date().toISOString(),
  }
  writeSavedGuides([next, ...existing])
  return next
}

export function removeSavedGuide(guideId: string) {
  writeSavedGuides(listSavedGuides().filter(item => item.guideId !== guideId))
}

export function subscribeSavedGuides(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, listener)
  }
}
