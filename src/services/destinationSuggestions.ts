import type { DestinationSearchResult } from '../types'
import { displayCityName } from '../../shared/city-names.mjs'

type Candidate = { destination: DestinationSearchResult; names: string[]; context: string[]; region: string; importance: number; popularity: number; order: number }
type SearchIntent = { city: string; qualifiers: string[] }

function normalize(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').replace(/ł/gi, 'l').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}
function label(value: unknown) { return typeof value === 'string' ? value.trim() : '' }
function score(value: unknown) { return typeof value === 'number' && Number.isFinite(value) ? value : 0 }

function candidates(results: unknown[]): Candidate[] {
  return results.flatMap((value, order) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return []
    const result = value as Record<string, unknown>
    // City searches can also return districts, postcodes and other subdivisions.
    // Their parent city must not be displayed with the subdivision's coordinates.
    const kind = label(result.result_type)
    if (kind && !['city', 'town', 'village', 'municipality', 'unknown'].includes(kind)) return []
    const sourceCity = (kind && kind !== 'unknown' ? label(result.name) : '') || label(result.city) || label(result.name) || label(result.address_line1)
    const country = label(result.country)
    const city = displayCityName(sourceCity, label(result.country_code) || country)
    const { lat, lon: lng } = result
    if (!city || typeof lat !== 'number' || typeof lng !== 'number' || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return []
    const code = label(result.country_code).toUpperCase()
    const countryNames = [country, code]
    if (/^[A-Z]{2}$/.test(code)) {
      for (const locale of ['en', 'pl']) {
        try { countryNames.push(new Intl.DisplayNames([locale], { type: 'region' }).of(code) ?? '') } catch { /* The provider's labels still work in older browsers. */ }
      }
      if (code === 'US') countryNames.push('USA', 'US')
      if (code === 'GB') countryNames.push('UK', 'Great Britain')
    }
    const rank = result.rank && typeof result.rank === 'object' ? result.rank as Record<string, unknown> : {}
    return [{
      destination: { id: label(result.place_id) || `${sourceCity}-${country}-${lat}-${lng}`, city, ...(city !== sourceCity ? { sourceCity } : {}), country, lat, lng },
      names: [...new Set([city, sourceCity, label(result.name), label(result.address_line1)].filter(Boolean).map(normalize))],
      context: [...countryNames, label(result.state), label(result.state_code), label(result.county)].filter(Boolean).map(normalize),
      region: normalize(label(result.state)), importance: score(rank.importance), popularity: score(rank.popularity), order,
    }]
  })
}

function matchesContext(candidate: Candidate, qualifiers: string[]) {
  const words = candidate.context.flatMap(value => value.split(' '))
  return qualifiers.every(part => part.split(' ').every(word => words.some(context => word.length < 3 ? context === word : context.startsWith(word))))
}

function intent(query: string, items: Candidate[]): SearchIntent {
  const parts = query.split(',').map(normalize)
  if (parts.length > 1 && parts.slice(1).some(Boolean)) return { city: parts[0], qualifiers: parts.slice(1).filter(Boolean) }
  const text = normalize(query)
  // Also accept "Paris Canada". Do not mistake multiword cities such as
  // "New York" for a city followed by a country.
  if (items.some(item => item.names.some(name => name.startsWith(text)))) return { city: text, qualifiers: [] }
  const names = [...new Set(items.flatMap(item => item.names))].sort((a, b) => b.length - a.length)
  for (const name of names) {
    if (!text.startsWith(`${name} `)) continue
    return { city: name, qualifiers: [text.slice(name.length + 1)] }
  }
  return { city: text, qualifiers: [] }
}

export function needsDestinationResolution(query: string, results: unknown[]) {
  const items = candidates(results)
  const search = intent(query, items)
  if (search.qualifiers.length) return true
  if (results.length && !items.length) return true
  // The provider can return an English city name for a localized query.
  // Resolve multiword queries that autocomplete cannot match as a prefix.
  if (normalize(query).includes(' ') && !items.some(item => item.names.some(name => name.startsWith(normalize(query))))) return true
  const exact = items.filter(item => item.names.includes(search.city))
  // Multiple representations of one city need deduplication only. Homonyms
  // across countries or regions need the geocoder's popularity ranking.
  return new Set(exact.map(item => `${normalize(item.destination.country)}|${item.region}`)).size > 1
}

export function destinationSuggestions(query: string, results: unknown[], useProviderOrder = false): DestinationSearchResult[] {
  let items = candidates(results)
  const search = intent(query, items)
  if (search.qualifiers.length) {
    items = items.filter(item => matchesContext(item, search.qualifiers))
  }
  const match = (item: Candidate) => item.names.includes(search.city) ? 2 : item.names.some(name => name.startsWith(search.city)) ? 1 : 0
  items.sort((a, b) => match(b) - match(a) || (useProviderOrder || search.qualifiers.length ? a.order - b.order : b.importance - a.importance || b.popularity - a.popularity || a.order - b.order))
  const seen = new Set<string>()
  return items.filter(item => {
    const name = normalize(item.destination.city)
    if (seen.has(name)) return false
    seen.add(name)
    return true
  }).slice(0, 6).map(item => item.destination)
}
