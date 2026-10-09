import { appConfig } from '../config'
import { fallbackSearchResults } from '../data/demo'
import type { Coordinates, DestinationSearchResult, PlaceSearchResult } from '../types'
import { destinationSuggestions, needsDestinationResolution } from './destinationSuggestions'

const API_KEY = appConfig.geoapifyApiKey
export const isLivePlaceSearchEnabled = appConfig.geoapifyEnabled

function isAbortError(error: unknown) {
  return (error instanceof DOMException && error.name === 'AbortError') || (error instanceof Error && error.name === 'AbortError')
}

function fallbackSearch(query: string) {
  const normalized = query.trim().toLowerCase()
  if (normalized.length < 2) return []
  return fallbackSearchResults
    .filter(result => `${result.name} ${result.address}`.toLowerCase().includes(normalized))
    .slice(0, 6)
    .map(result => ({ ...result, provider: 'demo' }))
}

export async function searchPlaces(query: string, center: Coordinates, signal?: AbortSignal): Promise<PlaceSearchResult[]> {
  if (!API_KEY) {
    if (!appConfig.cloudEnabled) return fallbackSearch(query)
    throw new Error('Place search is not configured.')
  }
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const params = new URLSearchParams({
    text: trimmed,
    format: 'json',
    limit: '7',
    lang: 'en',
    bias: `proximity:${center.lng},${center.lat}`,
    filter: `circle:${center.lng},${center.lat},30000`,
    apiKey: API_KEY,
  })

  try {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`, { signal })
    if (!response.ok) throw new Error(`Geoapify search failed: ${response.status}`)
    const data = await response.json() as { results?: Array<Record<string, unknown>> }
    if (data.results !== undefined && !Array.isArray(data.results)) throw new Error('Invalid search response.')
    return (data.results ?? []).filter(result => result && typeof result === 'object' && typeof result.lat === 'number' && typeof result.lon === 'number' && [result.name,result.address_line1,result.city].some(value => typeof value === 'string' && value.trim().length > 0)).map((result, index) => {
      const lat = Number(result.lat)
      const lng = Number(result.lon)
      const name = String(result.name ?? result.address_line1 ?? 'Unnamed place')
      const address = String(result.formatted ?? result.address_line2 ?? name)
      // Preserve the provider's structured street in the existing subtitle
      // field. The complete formatted address remains untouched for details.
      const street = typeof result.street === 'string' ? result.street.trim() : ''
      const houseNumber = typeof result.housenumber === 'string' || typeof result.housenumber === 'number' ? String(result.housenumber).trim() : ''
      const sourceId = String(result.place_id ?? (result.datasource as { raw?: { osm_id?: string | number } } | undefined)?.raw?.osm_id ?? `${name}-${lat}-${lng}-${index}`)
      return {
        id: sourceId,
        provider: 'geoapify',
        name,
        subtitle: street ? [street, houseNumber].filter(Boolean).join(' ') : String(result.address_line2 ?? result.city ?? ''),
        address,
        lat,
        lng,
        sourceCategory: typeof result.category === 'string' ? result.category : undefined,
      }
    }).filter(result => Number.isFinite(result.lat) && result.lat >= -90 && result.lat <= 90 && Number.isFinite(result.lng) && result.lng >= -180 && result.lng <= 180)
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return []
    throw error
  }
}

export async function searchDestinations(query: string, signal?: AbortSignal): Promise<DestinationSearchResult[]> {
  const trimmed = query.trim()
  if (!API_KEY || trimmed.length < 2) return []
  const params = new URLSearchParams({
    text: trimmed,
    type: 'city',
    format: 'json',
    limit: '20',
    lang: 'en',
    apiKey: API_KEY,
  })
  try {
    const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?${params.toString()}`, { signal })
    if (!response.ok) throw new Error(`Geoapify destination search failed: ${response.status}`)
    const data = await response.json() as { results?: unknown[] }
    if (data.results !== undefined && !Array.isArray(data.results)) throw new Error('Invalid search response.')
    const results = data.results ?? []
    if (signal?.aborted) return []
    if (needsDestinationResolution(trimmed, results)) {
      try {
        // Autocomplete handles prefixes. The city geocoder supplies popularity
        // ranking for complete ambiguous names and understands country/region qualifiers.
        const resolved = await fetch(`https://api.geoapify.com/v1/geocode/search?${params.toString()}`, { signal })
        if (!resolved.ok) throw new Error(`Geoapify city resolution failed: ${resolved.status}`)
        const ranked = await resolved.json() as { results?: unknown[] }
        if (ranked.results !== undefined && !Array.isArray(ranked.results)) throw new Error('Invalid city response.')
        if (signal?.aborted) return []
        if (ranked.results?.length) return destinationSuggestions(trimmed, ranked.results, true)
      } catch (error) {
        if (signal?.aborted || isAbortError(error)) return []
        // Keep usable autocomplete matches if the optional ranking request fails.
      }
    }
    return destinationSuggestions(trimmed, results)
  } catch (error) {
    if (signal?.aborted || isAbortError(error)) return []
    throw error
  }
}
