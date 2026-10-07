import assert from 'node:assert/strict'
import { test, before, after } from 'node:test'
import { createServer } from 'vite'
import { displayCityName } from '../shared/city-names.mjs'

let server, repository, guest, requests, saved
const guideRow = { id: 'guide-one', owner_id: 'owner', city: 'Greater London', country: 'United Kingdom', slug: 'greater-london', center_lat: 51.5, center_lng: -0.12, guide_note: 'My Greater London favourites.', intro: '', visibility: 'public', updated_at: '2026-10-05' }
const profile = { id: 'owner', display_name: 'Ada', slug: 'ada', onboarding_completed: true }
let inserted, recoveryDraft
const storage = () => { const records = new Map(); return { records, getItem: key => records.get(key) ?? null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) } }
const client = {
  from(table) {
    let rows = table === 'guides' ? [guideRow] : table === 'profiles' ? [profile] : table === 'guide_categories' ? [{ key: 'other', label: 'Other', icon: 'x', sort_order: 0 }] : []
    const query = {
      select() { return query }, eq() { return query }, in() { return query }, order() { return query }, limit() { return query },
      insert(value) { inserted = value; rows = [{ ...guideRow, ...value, id: 'new-guide' }]; return query },
      single: async () => ({ data: rows[0], error: null }), maybeSingle: async () => ({ data: rows[0], error: null }),
      then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject) },
    }
    return query
  },
  rpc: async name => ({ data: name === 'read_guest_guide' ? { draft: recoveryDraft } : profile, error: null }),
}
before(async () => {
  globalThis.__cityTestClient = client
  server = await createServer({ envDir: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', plugins: [{
    name: 'city-test-client', enforce: 'pre',
    resolveId(id) { if (id === 'virtual:city-client') return '\0' + id },
    load(id) { if (id === '\0virtual:city-client') return 'export function requireSupabase() { return globalThis.__cityTestClient }' },
    transform(source, id) { if (id.endsWith('/src/services/guideRepository.ts') || id.endsWith('/src/services/requestRepository.ts')) return source.replace("'../lib/supabase'", "'virtual:city-client'") },
  }] })
  repository = await server.ssrLoadModule('/src/services/guideRepository.ts')
  guest = await server.ssrLoadModule('/src/services/guestDrafts.ts')
  requests = await server.ssrLoadModule('/src/services/requestRepository.ts')
  saved = await server.ssrLoadModule('/src/services/savedGuides.ts')
})
after(async () => { await server.close(); delete globalThis.__cityTestClient })

test('specific administrative city aliases require the correct country and retain native spelling', () => {
  for (const country of ['GB', 'gb', 'United Kingdom', 'UK', 'Wielka Brytania', 'England']) assert.equal(displayCityName('Greater London', country), 'London')
  for (const [name, country, expected] of [['City of Edinburgh', 'GB', 'Edinburgh'], ['City of Glasgow', 'GB', 'Glasgow'], ['Dublin City', 'Ireland', 'Dublin'], ['Ville de Paris', 'FR', 'Paris'], ['Hlavní město Praha', 'CZ', 'Praha'], ['Budapest főváros', 'HU', 'Budapest'], ['Miasto stołeczne Warszawa', 'Polska', 'Warszawa'], ['m.st. Warszawa', 'PL', 'Warszawa']]) assert.equal(displayCityName(name, country), expected)
  for (const name of ['Greater Manchester', 'City of London', 'New York City', 'Kansas City', 'Ho Chi Minh City']) assert.equal(displayCityName(name, 'GB'), name)
  assert.equal(displayCityName('Greater Sudbury', 'Canada'), 'Greater Sudbury')
  assert.equal(displayCityName('Greater London', 'Canada'), 'Greater London')
  assert.equal(displayCityName('Greater London'), 'Greater London')
})

test('existing cloud editor, public guide and guide summaries share a clean label without changing stored data', async () => {
  const editor = await repository.getGuideById(guideRow.id)
  const publicGuide = await repository.getPublicGuide('ada', 'greater-london')
  const own = await repository.listMyGuides('owner'), explore = await repository.listPublicGuides()
  for (const guide of [editor, publicGuide, ...own, ...explore]) {
    assert.equal(guide.city, 'London'); assert.equal(guide.slug, 'greater-london'); assert.equal(guide.id, guideRow.id)
  }
  assert.equal(editor.title, 'Ada’s London')
  assert.equal(editor.guideNote, guideRow.guide_note)
  assert.deepEqual(editor.center, { lat: guideRow.center_lat, lng: guideRow.center_lng })
  assert.equal(guideRow.city, 'Greater London')
})

test('new cloud and guest guides save a clean city while preserving the selected location', async () => {
  const destination = { id: 'provider-id', city: 'London', sourceCity: 'Greater London', country: 'United Kingdom', lat: 51.5, lng: -0.12 }
  const guide = await repository.createGuide('owner', destination)
  assert.equal(inserted.city, 'London'); assert.equal(inserted.slug, 'greater-london'); assert.equal(guide.city, 'London')
  assert.equal(inserted.center_lat, destination.lat); assert.equal(inserted.center_lng, destination.lng)
  const draft = guest.createGuestDraft(destination, 'Boris', 'Greater London', [])
  assert.equal(draft.guide.city, 'London'); assert.equal(draft.guide.title, 'London')
  assert.equal(draft.requestedCity, 'Greater London'); assert.equal(destination.sourceCity, 'Greater London')
})

test('old guest drafts reopen and recover with clean labels, retaining invitation identity and author writing', async () => {
  const target = storage(), id = crypto.randomUUID(), key = crypto.randomUUID()
  const original = { id, key, requesterName: 'Boris', requestedCity: 'Greater London', guide: { ...guideRow, id, authorName: 'A local', title: 'Greater London', guideNote: 'I love Greater London.', country: guideRow.country, updatedAt: guideRow.updated_at, center: { lat: 51.5, lng: -0.12 }, categories: [], places: [], isPublished: false, visibility: 'draft' } }
  target.setItem('anyones-guide:request-draft:' + id, JSON.stringify(original))
  target.setItem('anyones-guide:request-invitation:' + JSON.stringify(['Boris', 'Greater London']), id)
  const loaded = guest.loadGuestDraft(id, target)
  assert.equal(loaded.guide.city, 'London'); assert.equal(loaded.guide.title, 'London')
  assert.equal(loaded.guide.guideNote, original.guide.guideNote); assert.equal(loaded.key, key)
  assert.equal(guest.findInvitationDraft('Boris', 'Greater London', target), loaded)
  recoveryDraft = original
  const recovered = await requests.recoverGuestDraft(id, key)
  assert.equal(recovered.draft.guide.city, 'London'); assert.equal(recovered.draft.requestedCity, 'Greater London')
  assert.equal(original.guide.city, 'Greater London')
})

test('saved shortcuts display London while keeping stored bytes and the existing shared path', () => {
  const target = storage(), originalWindow = globalThis.window
  const record = { guideId: 'guide-one', profileSlug: 'ada', guideSlug: 'greater-london', city: 'Greater London', country: 'United Kingdom', authorName: 'Ada', savedAt: '2026-10-05' }
  const bytes = JSON.stringify([record])
  target.setItem('anyones-guide:saved-guides:v1', bytes)
  globalThis.window = { localStorage: target }
  try {
    const [shortcut] = saved.listSavedGuides()
    assert.equal(shortcut.city, 'London'); assert.equal(shortcut.guideSlug, 'greater-london')
    assert.equal(shortcut.guideId, record.guideId)
    assert.equal(target.getItem('anyones-guide:saved-guides:v1'), bytes)
  } finally { globalThis.window = originalWindow }
})
