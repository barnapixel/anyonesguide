import type { Coordinates } from '../types'

const EARTH_RADIUS_M = 6_371_000
const toRad = (value: number) => (value * Math.PI) / 180

export function distanceMeters(a: Coordinates, b: Coordinates) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function formatDistance(meters: number, locale: 'en' | 'pl' = 'en') {
  if (meters < 950) return `${Math.max(50, Math.round(meters / 50) * 50)} m`
  const km = meters / 1000
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: km < 10 ? 1 : 0, minimumFractionDigits: km < 10 ? 1 : 0 }).format(km)} km`
}
