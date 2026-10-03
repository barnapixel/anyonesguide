import type { Place } from '../types'
export function mapsUrl(place: Pick<Place,'name'|'address'|'lat'|'lng'>) {
  const query = [place.name.trim(), place.address.trim()].filter(Boolean).join(', ') || `${place.lat},${place.lng}`
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}
