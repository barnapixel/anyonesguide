import assert from 'node:assert/strict'
import { test, before, after, afterEach } from 'node:test'
import { createServer } from 'vite'

let server, suggestions, needsResolution, searchDestinations
const originalFetch = globalThis.fetch
const city = (name = 'Paris', country = 'France', extra = {}) => ({ city: name, name, country, country_code: 'fr', state: 'Île-de-France', result_type: 'city', lat: 48.8566, lon: 2.3522, place_id: `${name}-${country}`, ...extra })
const canada = extra => city('Paris', 'Canada', { country_code: 'ca', state: 'Ontario', lat: 43.194, lon: -80.384, ...extra })
const response = results => ({ ok: true, json: async () => ({ results }) })

before(async () => {
  server = await createServer({ envDir: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', plugins: [{
    name: 'destination-test-config', enforce: 'pre',
    resolveId(id) { if (id === 'virtual:destination-config') return '\0' + id },
    load(id) { if (id === '\0virtual:destination-config') return `export const appConfig = {geoapifyApiKey:'test-key',geoapifyEnabled:true,cloudEnabled:true};` },
    transform(source, id) { if (id.endsWith('/src/services/placeSearch.ts')) return source.replace("'../config'", "'virtual:destination-config'") },
  }] })
  const helpers = await server.ssrLoadModule('/src/services/destinationSuggestions.ts')
  suggestions = helpers.destinationSuggestions
  needsResolution = helpers.needsDestinationResolution
  ;({ searchDestinations } = await server.ssrLoadModule('/src/services/placeSearch.ts'))
})
afterEach(() => { globalThis.fetch = originalFetch })
after(async () => { await server.close() })

test('repeated city representations collapse to the best genuine city and retain its coordinates', () => {
  const main = city('Paris', 'France', { place_id: 'city-center', rank: { importance: 0.9 } })
  const results = [city('Paris', 'France', { result_type: 'suburb', lon: 2.5 }), ...Array.from({ length: 6 }, (_, i) => city('Paris', 'France', { place_id: `duplicate-${i}`, rank: { importance: 0.1 } })), main]
  assert.deepEqual(suggestions('Paris', results), [{ id: 'city-center', city: 'Paris', country: 'France', lat: main.lat, lng: main.lon }])
  assert.equal(needsResolution('Paris', results), false)
})

test('London aliases match either query, deduplicate and retain provider identity and coordinates', () => {
  const london = city('Greater London', 'United Kingdom', { country_code: 'gb', state: 'England', lat: 51.5074, lon: -0.1278, place_id: 'original-london-id', rank: { importance: 1 } })
  const duplicate = { ...london, name: 'London', city: 'London', place_id: 'lower-rank', rank: { importance: 0.1 } }
  for (const query of ['London', 'Greater London', 'London, UK', 'London, Wielka Brytania']) {
    assert.deepEqual(suggestions(query, [london, duplicate]), [{ id: london.place_id, city: 'London', sourceCity: 'Greater London', country: london.country, lat: london.lat, lng: london.lon }], query)
  }
  assert.equal(needsResolution('London', [london]), false)
})

test('country-aware aliases never relabel a district or another country’s destination', () => {
  const suburb = city('Greater London', 'United Kingdom', { country_code: 'gb', result_type: 'suburb', city: 'London' })
  assert.deepEqual(suggestions('London', [suburb]), [])
  assert.equal(suggestions('Greater London', [city('Greater London', 'Canada', { country_code: 'ca' })])[0].city, 'Greater London')
  assert.equal(suggestions('City of London', [city('City of London', 'United Kingdom', { country_code: 'gb' })])[0].city, 'City of London')
})

test('unqualified homonyms show one obvious city and omit smaller namesakes', () => {
  const results = [canada({ rank: { importance: 0.2 } }), city('Paris', 'France', { rank: { importance: 0.9 } })]
  assert.equal(needsResolution('Paris', results), true)
  assert.deepEqual(suggestions('Paris', results).map(item => [item.city, item.country]), [['Paris', 'France']])
})

test('country, region, country-code and Polish qualifiers select the requested homonym', () => {
  const results = [city('Paris', 'France', { rank: { importance: 10 } }), canada()]
  for (const query of ['Paris, Canada', 'Paris Canada', 'Paris, Ontario', 'Paris, Ontario, Canada', 'Paris, CA', 'Paris, Kanada', 'Paris Kanada', 'Paris, Can', 'Paryż, Kanada']) {
    assert.equal(needsResolution(query, results), true, query)
    assert.deepEqual(suggestions(query, results).map(item => item.country), ['Canada'], query)
  }
  assert.deepEqual(suggestions('Paris, Mars', results), [])
  assert.deepEqual(suggestions('Paris, Canada, Texas', results), [])
})

test('a country suffix triggers resolution even if autocomplete only returned the famous city', () => {
  assert.equal(needsResolution('Paris Canada', [city()]), true)
  assert.deepEqual(suggestions('Paris Canada', [city()]), [])
})

test('partial names keep useful distinct suggestions, not six copies of one destination', () => {
  const results = [...Array.from({ length: 6 }, () => city()), canada(), city('Parma', 'Italy', { country_code: 'it' }), city('Paradise', 'United States', { country_code: 'us' })]
  assert.deepEqual(suggestions('Par', results).map(item => item.city), ['Paris', 'Parma', 'Paradise'])
  assert.equal(needsResolution('Par', results), false)
})

test('an exact short name does not hide other prefix suggestions', () => {
  const results = [city('Par'), city('Paris'), city('Parma')]
  assert.deepEqual(suggestions('Par', results).map(item => item.city), ['Par', 'Paris', 'Parma'])
})

test('a genuine town keeps its own name instead of its parent municipality', () => {
  const results = [canada({ city: 'Brant', name: 'Paris' }), city()]
  assert.equal(suggestions('Paris, Canada', results)[0].city, 'Paris')
  assert.equal(suggestions('Paris', results).length, 1)
})

test('multiword city names and their prefixes are not mistaken for geographic qualifiers', () => {
  const results = [city('New York', 'United States', { country_code: 'us', state: 'New York' }), city('York', 'United Kingdom', { country_code: 'gb' })]
  for (const query of ['New York', 'New Yo']) {
    assert.equal(needsResolution(query, results), false)
    assert.equal(suggestions(query, results)[0].city, 'New York')
  }
  assert.equal(suggestions('San Fran', [city('San'), city('San Francisco', 'United States', { country_code: 'us' })])[0].city, 'San Francisco')
})

test('normalization deduplicates accents, case, punctuation and Polish ł', () => {
  assert.equal(suggestions('Gdansk', [city('Gdańsk'), city('GDANSK')]).length, 1)
  assert.equal(suggestions('Lodz', [city('Łódź'), city('Lodz')]).length, 1)
  assert.equal(suggestions('St Louis', [city('St. Louis'), city('St Louis')]).length, 1)
})

test('subdivisions and malformed coordinates never become city destinations', () => {
  const bad = [null, [], {}, city('', ''), city('Paris', 'France', { lat: '48.8' }), city('Paris', 'France', { lat: NaN }), city('Paris', 'France', { lon: Infinity }), city('Paris', 'France', { lat: 91 }), city('Paris', 'France', { lon: -181 }), ...['district', 'suburb', 'postcode', 'county', 'state', 'country', 'street', 'building'].map(result_type => city('Paris', 'France', { result_type }))]
  assert.deepEqual(suggestions('Paris', bad), [])
  assert.equal(needsResolution('Paris', [city('Paris', 'France', { result_type: 'district' })]), true)
})

test('a complete ambiguous search uses forward-geocoding order without hardcoded cities or location bias', async () => {
  const requests = []
  globalThis.fetch = async (url, options) => {
    requests.push({ url: new URL(url), options })
    return requests.length === 1 ? response([canada(), city()]) : response([city(), canada()])
  }
  const controller = new AbortController()
  const results = await searchDestinations(' Paris ', controller.signal)
  assert.deepEqual(results.map(item => item.country), ['France'])
  assert.deepEqual(requests.map(item => item.url.pathname), ['/v1/geocode/autocomplete', '/v1/geocode/search'])
  for (const { url, options } of requests) {
    assert.equal(url.searchParams.get('text'), 'Paris')
    assert.equal(url.searchParams.get('type'), 'city')
    assert.equal(url.searchParams.get('limit'), '20')
    assert.equal(url.searchParams.has('bias'), false)
    assert.equal(options.signal, controller.signal)
  }
})

test('qualified live queries preserve the country and resolve beyond incomplete autocomplete results', async () => {
  const requests = []
  globalThis.fetch = async url => {
    requests.push(new URL(url))
    return requests.length === 1 ? response([city()]) : response([city(), canada()])
  }
  assert.equal((await searchDestinations('Paris Canada'))[0].country, 'Canada')
  assert.equal(requests[1].searchParams.get('text'), 'Paris Canada')
})

test('prefix searches and duplicate representations do not add ranking requests', async () => {
  let count = 0
  globalThis.fetch = async () => { count++; return response([city(), city()]) }
  assert.equal((await searchDestinations('Par')).length, 1)
  assert.equal((await searchDestinations('Paris')).length, 1)
  assert.equal(count, 2)
})

test('optional ranking failure keeps clean autocomplete results; main search failure remains an error', async () => {
  let count = 0
  globalThis.fetch = async () => ++count === 1 ? response([city('Paris', 'France', { rank: { importance: 1 } }), canada()]) : { ok: false, status: 503 }
  assert.equal((await searchDestinations('Paris'))[0].country, 'France')
  globalThis.fetch = async () => ({ ok: false, status: 403 })
  await assert.rejects(searchDestinations('Paris'), /403/)
  globalThis.fetch = async () => response('malformed')
  await assert.rejects(searchDestinations('Paris'), /Invalid search response/)
})

test('cancellation during resolution never exposes stale autocomplete matches', async () => {
  const controller = new AbortController()
  let count = 0
  globalThis.fetch = async () => {
    if (++count === 1) return response([city(), canada()])
    controller.abort()
    throw new DOMException('Cancelled', 'AbortError')
  }
  assert.deepEqual(await searchDestinations('Paris', controller.signal), [])
})

test('already-aborted and short queries cannot trigger a second lookup', async () => {
  const controller = new AbortController()
  controller.abort()
  let count = 0
  globalThis.fetch = async () => { count++; return response([city(), canada()]) }
  assert.deepEqual(await searchDestinations('P'), [])
  assert.equal(count, 0)
  assert.deepEqual(await searchDestinations('Paris', controller.signal), [])
  assert.equal(count, 1)
})
