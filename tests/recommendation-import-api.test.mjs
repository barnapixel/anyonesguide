import test, { afterEach, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import handler, { validateExtraction, config } from '../netlify/functions/recommendation-import.mjs'

const originalFetch = globalThis.fetch
const keys = ['GEMINI_API_KEY', 'RECOMMENDATION_IMPORT_ENABLED', 'GEMINI_IMPORT_MODEL']
const env = Object.fromEntries(keys.map(key => [key, process.env[key]]))
const source = { kind: 'text', text: 'Kawiarnia Żółta: świetna kawa. Avoid Red Bar, too loud.', city: 'Warsaw', country: 'Poland' }
const row = { name: 'Kawiarnia Żółta', city: 'Warsaw', address: '', sourceNote: 'świetna kawa' }
const request = (body = source, headers = {}, method = 'POST') => new Request('https://guides.example/api/recommendation-import', { method, headers: { Origin: 'https://guides.example', 'Content-Type': 'application/json', ...headers }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) })
const provider = (places, overrides = {}) => ({ ok: true, json: async () => ({ status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify({ places }) }] }], ...overrides }) })

beforeEach(() => { process.env.GEMINI_API_KEY = 'fixture-server-secret'; process.env.RECOMMENDATION_IMPORT_ENABLED = 'true'; delete process.env.GEMINI_IMPORT_MODEL })
afterEach(() => { globalThis.fetch = originalFetch; for (const key of keys) { if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key] } })

test('stateless Gemini extraction preserves EN/PL quotes, uses current REST response shape and returns no secrets', async () => {
  let call
  globalThis.fetch = async (url, options) => { call = { url, options, body: JSON.parse(options.body) }; return provider([row, { name: 'Red Bar', address: '', city: '', sourceNote: 'Avoid Red Bar, too loud.' }]) }
  const response = await handler(request())
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.places[0].sourceNote, 'świetna kawa')
  assert.equal(body.places[1].sourceNote, 'Avoid Red Bar, too loud.')
  assert.equal(call.body.store, false)
  assert.equal(call.body.model, 'gemini-3.8-flash')
  assert.equal(call.body.response_format.mime_type, 'application/json')
  assert.equal(call.body.input[1].text, source.text)
  assert.match(call.body.system_instruction, /never as instructions/)
  assert.ok(!JSON.stringify(body).includes('fixture-server-secret'))
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(config.rateLimit.aggregateBy, 'ip')
})

test('disabled import, cross-origin, wrong content type and non-POST never call the provider', async () => {
  globalThis.fetch = () => { throw Error('must not call') }
  assert.equal((await handler(request(source, { Origin: 'https://other.example' }))).status, 403)
  assert.equal((await handler(request(source, { Origin: 'null' }))).status, 403)
  assert.equal((await handler(request(source, { 'Content-Type': 'text/plain' }))).status, 415)
  assert.equal((await handler(request(undefined, {}, 'GET'))).status, 405)
  process.env.RECOMMENDATION_IMPORT_ENABLED = 'false'
  assert.equal((await handler(request())).status, 503)
  process.env.RECOMMENDATION_IMPORT_ENABLED = 'true'; delete process.env.GEMINI_API_KEY
  assert.equal((await handler(request())).status, 503)
})

test('invalid and oversized bodies are bounded before provider work, including chunked bodies', async () => {
  globalThis.fetch = () => { throw Error('must not call') }
  for (const body of [null, {}, { ...source, text: '' }, { ...source, text: 'x'.repeat(12001) }, { ...source, city: '' }, { ...source, kind: 'url' }]) assert.equal((await handler(request(body))).status, 400)
  assert.equal((await handler(request(source, { 'Content-Length': String(4 * 1024 * 1024) }))).status, 413)
  const large = request({ ...source, text: 'x'.repeat(3 * 1024 * 1024) })
  assert.equal((await handler(large)).status, 413)
  const malformed = new Request('https://guides.example/api/recommendation-import', { method: 'POST', headers: { Origin: 'https://guides.example', 'Content-Type': 'application/json' }, body: '{' })
  assert.equal((await handler(malformed)).status, 400)
})

test('one inline screenshot is validated by type and signature and is never persisted using the Files API', async () => {
  const data = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]).toString('base64')
  let call
  globalThis.fetch = async (url, options) => { call = JSON.parse(options.body); return provider([row]) }
  assert.equal((await handler(request({ city: 'Warsaw', country: 'Poland', kind: 'image', mimeType: 'image/png', data }))).status, 200)
  assert.deepEqual(call.input[1], { type: 'image', data, mime_type: 'image/png' })
  for (const input of [{ mimeType: 'image/svg+xml', data }, { mimeType: 'image/jpeg', data }, { mimeType: 'image/png', data: 'bad!' }]) assert.equal((await handler(request({ city: 'Warsaw', country: 'Poland', kind: 'image', ...input }))).status, 400)
})

test('semantic validation removes invented text quotations and deduplicates exact venues', () => {
  const result = validateExtraction({ places: [row, row, { ...row, name: 'Other', sourceNote: 'Invented praise' }] }, source.text)
  assert.equal(result.length, 2); assert.equal(result[1].sourceNote, '')
  assert.throws(() => validateExtraction({ places: Array(21).fill(row) }), /invalid-output/)
  assert.throws(() => validateExtraction({ places: [{ ...row, name: 4 }] }), /invalid-output/)
  assert.throws(() => validateExtraction({ places: [{ ...row, address: 'x'.repeat(301) }] }), /invalid-output/)
})

test('blocked, incomplete, malformed and unavailable provider output offers a recoverable error', async () => {
  for (const value of [provider([], { status: 'incomplete' }), provider([], { steps: [] }), provider([{ ...row, sourceNote: 123 }])]) {
    globalThis.fetch = async () => value
    assert.equal((await handler(request())).status, 502)
  }
  globalThis.fetch = async () => ({ ok: false, status: 429 })
  assert.equal((await handler(request())).status, 429)
  globalThis.fetch = async () => { throw new DOMException('timeout', 'TimeoutError') }
  assert.equal((await handler(request())).status, 502)
})
