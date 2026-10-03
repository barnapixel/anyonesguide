import type { Place } from '../types'

// Simple, consistent symbols remain legible inside the same round badges on every device.
const categoryIconPaths: Record<string, string> = {
  eat: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>',
  coffee: '<path d="M10 2v2M14 2v2M6 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/>',
  drink: '<path d="M17 11h1a3 3 0 0 1 0 6h-1M9 12v6M13 12v6"/><path d="M14 7.5c-1 0-1.44.5-3 .5s-2-.5-3-.5-1.72.5-2.5.5a2.5 2.5 0 0 1 0-5c.78 0 1.57.5 2.5.5S9.44 2 11 2s2 1.5 3 1.5 1.72-.5 2.5-.5a2.5 2.5 0 0 1 0 5c-.78 0-1.5-.5-2.5-.5Z"/><path d="M5 8v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V8"/>',
  see: '<path d="M10 18v-7M14 18v-7M18 18v-7M6 18v-7M3 22h18"/><path d="M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"/>',
  shop: '<path d="m2.05 2.05 1.099-.028a1 1 0 0 1 1.008.815l2.69 14.347A1 1 0 0 0 7.83 18H18"/><path d="M4.563 5h16.435a1 1 0 0 1 .981 1.204l-1.026 6.226A2 2 0 0 1 18.962 14H6.25"/><circle cx="18" cy="20" r="2"/><circle cx="8" cy="20" r="2"/>',
}

function categorySvg(categoryId: string) {
  const paths = Object.hasOwn(categoryIconPaths, categoryId)
    ? categoryIconPaths[categoryId]
    : '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/>'
  return `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" color="#fffdf8" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}

export function createPlaceMarkerElement(place: Place, selected: boolean, onSelectPlace: (place: Place) => void, starLabel: string) {
  const button = document.createElement('button')
  button.className = `map-pin ${place.isStarred ? 'starred' : ''} ${selected ? 'selected' : ''}`
  button.type = 'button'
  button.setAttribute('aria-label', place.isStarred ? `${place.name}. ${starLabel}` : place.name)
  button.innerHTML = categorySvg(place.categoryId) + (place.isStarred ? '<span class="map-author-star" aria-hidden="true"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1Z"/></svg></span>' : '')
  button.onclick = () => onSelectPlace(place)
  return button
}
