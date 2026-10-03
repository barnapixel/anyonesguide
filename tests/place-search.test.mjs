import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createServer } from 'vite'

test('live place-search failure is shown as an error, never as demo suggestions', async () => {
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
  } finally {
    globalThis.fetch = originalFetch
    await server.close()
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_PUBLISHABLE_KEY
    delete process.env.VITE_GEOAPIFY_API_KEY
  }
})
