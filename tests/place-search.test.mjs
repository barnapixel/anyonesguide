import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('place search keeps structured street data and reports provider failures without demo suggestions', async () => {
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = 'test-key'
  process.env.VITE_GEOAPIFY_API_KEY = 'test-key'
  const server = await createServer({ envDir:false, server: { middlewareMode: true }, appType: 'custom' })
  const originalFetch = globalThis.fetch
  try {
    const { searchPlaces } = await server.ssrLoadModule('/src/services/placeSearch.ts')
    globalThis.fetch = async () => ({ ok: false, status: 503 })
    await assert.rejects(searchPlaces('cafe', { lat: 54.35, lng: 18.65 }), /503/)
    globalThis.fetch = async () => { throw new DOMException('Cancelled', 'AbortError') }
    assert.deepEqual(await searchPlaces('cafe', { lat: 54.35, lng: 18.65 }), [])
    const address='Cafe, 80-001 Gdansk, Polska'
    globalThis.fetch = async () => Response.json({results:[
      {name:'Cafe',formatted:address,address_line2:'80-001 Gdansk',street:'3 Maja',housenumber:'7 A',lat:54.35,lon:18.65,place_id:'street-data'},
      {name:'Park',formatted:'Park, Gdansk, Poland',address_line2:'Gdansk, Poland',lat:54.35,lon:18.65,place_id:'no-street'},
    ]})
    const results=await searchPlaces('cafe', { lat: 54.35, lng: 18.65 })
    assert.equal(results[0].subtitle,'3 Maja 7 A');assert.equal(results[0].address,address)
    assert.equal(results[0].id,'street-data');assert.equal(results[0].lat,54.35);assert.equal(results[0].lng,18.65)
    assert.equal(results[1].subtitle,'Gdansk, Poland')
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    delete process.env.VITE_GEOAPIFY_API_KEY
  }
})
