import type { Place } from '../types'

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Strip only an exact, comma-delimited guide city suffix, optionally accompanied
// by a familiar numeric postcode and the exact country. Unknown formats survive.
// Keep the complete stored address for the place sheet and directions.
export function compactPlaceLocation(place: Place, city = '', country = '') {
  const compact = (value: string) => {
    let line = value.trim()
    if (!city.trim()) return line
    if (country.trim()) line = line.replace(new RegExp(`,\\s*${escape(country.trim())}$`, 'i'), '')
    const suffix = new RegExp(`(?:^|,\\s*)(?:(?:\\d{2}-\\d{3}|\\d{5})\\s+)?${escape(city.trim())}$`, 'i')
    // Do not remove just a country from an address whose city wasn't recognised.
    if (!suffix.test(line)) return value.trim()
    return line.replace(suffix, '').replace(new RegExp(`^${escape(place.name.trim())},\\s*`, 'i'), '').trim()
  }
  const subtitle = place.subtitle?.trim() ?? ''
  return subtitle ? compact(subtitle) || compact(place.address) : compact(place.address)
}
