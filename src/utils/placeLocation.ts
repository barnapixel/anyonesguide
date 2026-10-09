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

// A row promises a street, so ambiguous districts, cities and venue subtitles
// are omitted. Full addresses are never mutated and remain in place details.
export function placeStreet(place: Place, city = '', country = '') {
  const normalized = (value: string) => value.normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').toLowerCase().trim()
  const streetType = /^(?:\d{1,5}[a-z]?\s+)?(?:ul\.?|ulica|al\.?|aleja|aleje|pl\.?|plac|rue|avenue|av\.?|boulevard|bd\.?|calle|carrer|via|piazza|viale)\s|\b(?:street|st\.?|road|rd\.?|lane|ln\.?|drive|dr\.?|avenue|ave\.?|way|court|ct\.?|square|place|terrace|grove|crescent|close|straße|strasse)\s*(?:[NSEW])?$/i
  const houseNumber = String.raw`\d{1,4}(?:\s?\p{L})?(?:\s*[-/–]\s*\d{1,4}(?:\s?\p{L})?)*`
  const streetName = String.raw`(?=[^,]*\p{L})[\p{L}\p{N}\s.'’()–-]+`
  const numberedStreet = new RegExp(`^(?:${houseNumber}\\s+${streetName}|${streetName}\\s+${houseNumber})$`, 'iu')
  const bareStreet = /^[\p{L}][\p{L}\s.'’–-]*$/u
  for (const source of [place.address, place.subtitle ?? '']) {
    const parts = source.split(',').map(part => part.trim()).filter(Boolean)
    // A provider can prepend a venue under a different name. Examine only
    // the first two fields, accepting explicit streets rather than geography.
    const hasVenuePrefix = normalized(parts[0] ?? '') === normalized(place.name)
    if (hasVenuePrefix) parts.shift()
    const localityIndex = city ? parts.findIndex(part => {
      const locality = part.match(/^(?:\d{2}-\d{3}|\d{5})\s+(.+)$/u)
      return locality && normalized(locality[1]) === normalized(city)
    }) : -1
    for (const [index, part] of parts.slice(0, 2).entries()) {
      const line = part.replace(/\s+(?:lok\.?|lokal|apt\.?|apartment|suite|unit)\s+[\p{L}\d/-]+$/iu, '')
      if (!line || [place.name, city, country].some(value => value && normalized(line) === normalized(value))) continue
      if (/^(?:\d{2}-\d{3}|\d{5})(?:\s|$)/u.test(line)) continue
      if (city && normalized(line.replace(/\s+(?:\d{2}-\d{3}|\d{5})$/, '')) === normalized(city)) continue
      if (/^(?:district|borough|postcode|postal code|kod pocztowy|dzielnica|county|powiat|województwo)\b/i.test(line)) continue
      // City/country spelling and district suffixes do not decide whether a
      // reliable street is displayed. Full addresses remain untouched.
      if (streetType.test(line) || numberedStreet.test(line)) return line
      // A formatted venue/street/postcode-city address can identify a street
      // even when the provider has no house number or "ul." prefix. Keep plain
      // subtitles and recognisable district-only labels out of this fallback.
      const addressContext = localityIndex > 0 && ((hasVenuePrefix && index === 0) || index === localityIndex - 1)
      const districtOnly = /^(?:srodmiescie|stare miasto|old town|centrum|city centre|city center)$/u.test(normalized(line))
      if (addressContext && bareStreet.test(line) && !districtOnly) return line
    }
  }
  return ''
}
