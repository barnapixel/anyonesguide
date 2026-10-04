// Actual Editor, AddPlaces and owner/guest stores. Only remote services/config
// are replaced; no user .env.local or network is needed for these flows.
import test, { before, after, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { createServer } from 'vite'
import React, { act } from 'react'

let dom, server, root, I18nProvider, Editor, CloudEditorPage, GuestResponsePage, PublicGuide
let createGuestDraft, saveGuestDraft, loadGuestDraft, categories
const destination = { city: 'Warsaw', country: 'Poland', lat: 52, lng: 21 }
const result = { id: 'cafe-result', name: 'Corner Café', address: 'Street', lat: 52, lng: 21, sourceCategory: 'cafe', provider: 'geoapify' }
const guide = () => ({ id: crypto.randomUUID(), ownerId: 'owner', profileSlug: 'ada', slug: 'warsaw', city: 'Warsaw', country: 'Poland', authorName: 'Ada', guideNote: '', intro: '', center: { lat: 52, lng: 21 }, categories, places: [], visibility: 'unlisted', isPublished: true })
const render = async (Component, props) => act(async () => root.render(React.createElement(I18nProvider, null, React.createElement(Component, props))))
const click = async node => act(async () => node.click())
const change = async (input, value) => act(async () => {
  const prototype = input.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, value)
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
})
const waitFor = async selector => {
  for (let i = 0; i < 100 && !document.querySelector(selector); i++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
  assert.ok(document.querySelector(selector), selector)
  return document.querySelector(selector)
}
const chip = label => [...document.querySelectorAll('.editor-chips button')].find(button => button.textContent === label)
const editorProps = current => ({ guide: current, onNavigate: path => globalThis.__start.routes.push(path), onUpdatePlace() {}, onUpdateGuideNote() {}, onRemovePlace() {}, onMovePlace() {}, onReorderPlace() {}, backPath: '/creator', previewPath: '/preview/test', publicPath: '/ada/warsaw', addPath: '/edit/test/add' })
const guestProps = (draft, mode = 'edit', search = '') => ({ draftId: draft.id, mode, search, onNavigate: path => globalThis.__start.routes.push(path), userLocation: null, locationStatus: 'idle', onRequestLocation() {} })
const cloudProps = (current, mode = 'edit', search = '') => ({ guideId: current.id, userId: 'owner', mode, search, onNavigate: path => globalThis.__start.routes.push(path) })

before(async () => {
  dom = new JSDOM('<div id="app"></div>', { url: 'https://guides.example/' })
  for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Event', 'MutationObserver', 'localStorage']) globalThis[key] = dom.window[key]
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: dom.window.navigator })
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
  window.matchMedia = () => ({ matches: true })
  window.scrollTo = () => {}
  const { createRoot } = await import('react-dom/client')
  root = createRoot(document.getElementById('app'))
  server = await createServer({ envDir: false, server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', plugins: [{
    name: 'editor-flow-services', enforce: 'pre',
    resolveId(id) { if (id.startsWith('virtual:start-')) return '\0' + id },
    load(id) {
      if (id === '\0virtual:start-config') return `export const appConfig={cloudEnabled:false,geoapifyEnabled:true,geoapifyApiKey:'',privacyOperator:'',privacyEmail:''};`
      if (id === '\0virtual:start-search') return `export const isLivePlaceSearchEnabled=true;export async function searchPlaces(){return [${JSON.stringify(result)}]};`
      if (id === '\0virtual:start-repository') return `
        export async function getGuideById(){return structuredClone(globalThis.__start.guide)}
        export async function addPlaceToGuide(guide,result,categoryId){const f=globalThis.__start;f.adds.push({categoryId});if(f.failAdd)throw Error('offline');if(f.addWait)await f.addWait;const existing=f.guide.places.find(p=>p.externalId===result.id);if(existing)return existing;const place={...result,id:crypto.randomUUID(),guidePlaceId:crypto.randomUUID(),externalId:result.id,categoryId,note:'',sortOrder:0,isStarred:false};f.guide.places.push(place);return place}
        export async function persistGuideEdits(id,edits){const f=globalThis.__start;f.saves.push(edits);if(f.failSave)throw Error('offline');for(const edit of edits){if(edit.kind==='guideNote')f.guide.guideNote=edit.value;else{const place=f.guide.places.find(p=>p.guidePlaceId===edit.linkId);if(place&&edit.note!==undefined)place.note=edit.note}}}
        export async function updateGuideVisibility(){}
      `
    },
    transform(source, id) {
      if (!id.includes('/src/')) return
      return source.replaceAll(/(['"])(?:\.\.\/|\.\/)config\1/g, "'virtual:start-config'")
        .replaceAll("'../services/placeSearch'", "'virtual:start-search'")
        .replaceAll("'../services/guideRepository'", "'virtual:start-repository'")
    },
  }] })
  ;({ I18nProvider } = await server.ssrLoadModule('/src/i18n.tsx'))
  ;({ Editor } = await server.ssrLoadModule('/src/components/Editor.tsx'))
  ;({ CloudEditorPage } = await server.ssrLoadModule('/src/components/CloudEditorPage.tsx'))
  ;({ GuestResponsePage } = await server.ssrLoadModule('/src/components/GuestResponsePage.tsx'))
  ;({ PublicGuide } = await server.ssrLoadModule('/src/components/PublicGuide.tsx'))
  ;({ createGuestDraft, saveGuestDraft, loadGuestDraft } = await server.ssrLoadModule('/src/services/guestDrafts.ts'))
  ;({ categories } = await server.ssrLoadModule('/src/data/demo.ts'))
})
afterEach(async () => { await act(async () => root.render(null)); localStorage.clear(); delete globalThis.__start })
after(async () => { await act(async () => root.unmount()); await server.close(); dom.window.close() })

test('first-place search starts without categories, repeated instructions or premature controls in EN/PL', async () => {
  globalThis.__start = { routes: [] }
  for (const [locale, question, examples] of [
    ['en', 'What’s one place you’d recommend?', 'Great coffee, a favourite meal, or a spot worth seeing.'],
    ['pl', 'Co polecisz znajomym?', 'Dobra kawa, ulubiony lokal albo miejsce, które warto zobaczyć.'],
  ]) {
    await act(async () => root.render(null))
    localStorage.setItem('anyones-guide:locale', locale)
    const current = { ...guide(), guideNote: 'Existing writing stays safe' }
    await render(Editor, { ...editorProps(current), onSaveFirstPlace: async () => { throw Error('Save not expected') }, key: locale })
    assert.equal(document.querySelector('.first-place-body h1').textContent, question)
    assert.equal(document.querySelector('.first-place-examples').textContent, examples)
    assert.equal(document.querySelector('.editor-chips'), null)
    assert.equal(document.querySelector('.editor-top-actions'), null)
    assert.equal(document.querySelector('.editor-guide-note'), null)
    assert.equal(current.guideNote, 'Existing writing stays safe')
    assert.equal(document.querySelector('.floating-add'), null)
    assert.equal(document.querySelector('.first-place-save'), null)
    assert.notEqual(document.activeElement.tagName, 'INPUT')
    await click(document.querySelector('.search-box input'))
    assert.deepEqual(globalThis.__start.routes, [])
    await change(document.querySelector('.search-box input'), 'cafe')
    await click(await waitFor('.search-results button'))
    assert.equal(document.querySelector('.first-place-body h1').textContent, question)
    assert.equal(document.querySelector('.first-place-selected h2').textContent, result.name)
    assert.equal(document.querySelectorAll('.first-place-save').length, 1)
    assert.equal(current.places.length, 0)
    assert.deepEqual(globalThis.__start.routes, [])
  }
})

test('a guest explicitly saves an inline selection and note, then sees the real row with focus and retains stars on reopening', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories, crypto.randomUUID())
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft))
  assert.match(document.querySelector('.first-place-context').textContent, /For Boris/)
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await change(document.querySelector('#first-place-note'), 'My own recommendation')
  assert.equal(loadGuestDraft(draft.id).guide.places.length, 0)
  assert.deepEqual(globalThis.__start.routes, [])
  assert.equal(document.querySelector('.editor-row'), null)
  await click(document.querySelector('.first-place-save'))
  const saved = loadGuestDraft(draft.id), place = saved.guide.places[0]
  assert.equal(place.categoryId, 'coffee')
  assert.equal(place.note, 'My own recommendation')
  assert.equal(document.querySelector('.first-place-screen'), null)
  assert.equal(document.querySelector('.editor-place-title-row strong').textContent, result.name)
  assert.equal(document.activeElement, document.querySelector('.editor-place-title-row strong'))
  assert.match(document.querySelector('[role="status"]').textContent, /saved on this device/)
  assert.ok(document.querySelector('.floating-add'))
  assert.equal(document.querySelector('.editor-guide-note').open, false)
  assert.equal(chip('All').getAttribute('aria-pressed'), 'true')
  assert.match(document.querySelector('.editor-guide-note-preview').textContent, /first visit/)
  assert.deepEqual(globalThis.__start.routes, [])
  await click(document.querySelector('.author-star-button'))
  await act(async () => root.render(null))
  await render(GuestResponsePage, guestProps(draft))
  const restored = loadGuestDraft(draft.id).guide.places[0]
  assert.equal(restored.note, 'My own recommendation')
  assert.equal(restored.isStarred, true)
  await click(chip('Eat'))
  assert.ok(document.querySelector('.editor-empty-prompt'))
  assert.equal(document.querySelector('.floating-add'), null)
})

test('failed first saves retain the selected place and note; retry saves the inferred category before showing the editor', async () => {
  const current = guide()
  globalThis.__start = { guide: current, adds: [], saves: [], routes: [], failAdd: true }
  await render(CloudEditorPage, cloudProps(current))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await change(document.querySelector('#first-place-note'), 'Do not lose this')
  assert.equal(globalThis.__start.adds.length, 0)
  await click(document.querySelector('.first-place-save'))
  assert.ok(document.querySelector('[role="alert"]'))
  assert.equal(current.places.length, 0)
  assert.equal(document.querySelector('#first-place-note').value, 'Do not lose this')
  globalThis.__start.failAdd = false
  await click(document.querySelector('.first-place-save'))
  assert.equal(current.places.length, 1)
  assert.equal(current.places[0].categoryId, 'coffee')
  assert.equal(current.places[0].note, 'Do not lose this')
  assert.ok(document.querySelector('.editor-row'))
  assert.equal(chip('All').getAttribute('aria-pressed'), 'true')
  assert.ok([...document.querySelectorAll('.editor-top-actions button')].every(button => !button.disabled))
  assert.deepEqual(globalThis.__start.routes, [])
})

test('the prompt waits for pending owner notes and a failed save keeps the editor and its retry action', async () => {
  const current = { ...guide(), guideNote: 'Existing context', places: [{ ...result, id: 'existing', guidePlaceId: crypto.randomUUID(), categoryId: 'eat', note: '', sortOrder: 0 }] }
  globalThis.__start = { guide: current, adds: [], saves: [], routes: [], failSave: true }
  await render(CloudEditorPage, cloudProps(current, 'edit', '?category=coffee'))
  assert.equal(document.querySelector('.editor-guide-note').open, false)
  assert.equal(document.querySelector('.editor-guide-note-preview').textContent, 'Existing context')
  await click(document.querySelector('.editor-guide-note summary'))
  assert.equal(document.querySelector('.editor-guide-note').open, true)
  await change(document.querySelector('#guide-note'), 'Keep this updated note')
  await click(document.querySelector('.editor-empty-prompt button'))
  assert.equal(globalThis.__start.routes.length, 0)
  assert.ok(document.querySelector('.save-feedback.error button'))
  assert.equal(document.querySelector('#guide-note').value, 'Keep this updated note')
  globalThis.__start.failSave = false
  await click(document.querySelector('.save-feedback.error button'))
  await click(document.querySelector('.editor-empty-prompt button'))
  assert.equal(globalThis.__start.routes.length, 1)
})

test('an existing recommendation is never duplicated or moved by adding it from another category prompt', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories)
  draft.guide.places = [{ ...result, id: 'existing', externalId: result.id, categoryId: 'coffee', note: 'Keep my words', isStarred: true }]
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft, 'edit', '?category=eat'))
  await click(document.querySelector('.editor-empty-prompt button'))
  const add = new URL(globalThis.__start.routes.at(-1), window.location.origin)
  await render(GuestResponsePage, guestProps(draft, 'add', add.search))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  const saved = loadGuestDraft(draft.id)
  assert.equal(saved.guide.places.length, 1)
  assert.equal(saved.guide.places[0].categoryId, 'coffee')
  assert.equal(saved.guide.places[0].note, 'Keep my words')
  assert.equal(saved.guide.places[0].isStarred, true)
  assert.equal(new URL(globalThis.__start.routes.at(-1), window.location.origin).searchParams.get('category'), 'coffee')
})

test('existing readers retain occupied-category navigation while empty/legacy editor categories stay usable', async () => {
  globalThis.__start = { routes: [] }
  const current = guide()
  current.places = [{ ...result, id: 'p', categoryId: 'eat', note: '' }]
  current.categories = [...categories, { id: 'stay', label: 'Stay', icon: 'x', sortOrder: 6 }]
  await render(Editor, { ...editorProps(current), initialCategory: 'stay' })
  assert.match(document.querySelector('.editor-empty-question').textContent, /stay/)
  await act(async () => root.render(null))
  await render(Editor, { ...editorProps(current), initialCategory: 'not-a-category' })
  assert.equal(chip('All').getAttribute('aria-pressed'), 'true')
  await act(async () => root.render(null))
  current.places = [{ ...result, id: 'p', categoryId: 'eat', note: '' }]
  await render(PublicGuide, { guide: current, onNavigate() {}, userLocation: null, locationStatus: 'idle', onRequestLocation() {}, trackUsage: false })
  assert.deepEqual([...document.querySelectorAll('.guide-chip-row button')].map(button => button.textContent), ['All', 'Eat'])
})


test('unfinished inline selection restores on reopening without adding it or sending anything', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories)
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await change(document.querySelector('#first-place-note'), 'My exact words — kept')
  await act(async () => root.render(null))
  await render(GuestResponsePage, guestProps(draft))
  assert.equal(document.querySelector('.first-place-selected h2').textContent, result.name)
  assert.equal(document.querySelector('#first-place-note').value, 'My exact words — kept')
  assert.equal(loadGuestDraft(draft.id).guide.places.length, 0)
  assert.deepEqual(globalThis.__start.routes, [])
  await click(document.querySelector('.first-place-save'))
  assert.equal(document.querySelector('.first-place-screen'), null)
  assert.equal(loadGuestDraft(draft.id).guide.places[0].note, 'My exact words — kept')
})

test('a slow first save cannot be duplicated and keeps the original screen until every write finishes', async () => {
  const current = guide()
  let release
  globalThis.__start = { guide: current, adds: [], saves: [], routes: [], addWait: new Promise(resolve => { release = resolve }) }
  await render(CloudEditorPage, cloudProps(current))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await change(document.querySelector('#first-place-note'), 'Saved together')
  await click(document.querySelector('.first-place-save'))
  await click(document.querySelector('.first-place-save'))
  assert.equal(globalThis.__start.adds.length, 1)
  assert.equal(document.querySelector('.first-place-save').disabled, true)
  assert.equal(document.querySelector('.first-place-topbar button').disabled, true)
  assert.equal(document.querySelector('#first-place-note').disabled, true)
  assert.equal(document.querySelector('.editor-row'), null)
  await act(async () => release())
  await waitFor('.editor-row')
  assert.equal(current.places.length, 1)
  assert.equal(current.places[0].note, 'Saved together')
})

test('partial cloud note failure keeps the first-place task and retries the latest writing without a duplicate', async () => {
  const current = guide()
  globalThis.__start = { guide: current, adds: [], saves: [], routes: [], failSave: true }
  await render(CloudEditorPage, cloudProps(current))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await change(document.querySelector('#first-place-note'), 'Original draft')
  await click(document.querySelector('.first-place-save'))
  assert.equal(current.places.length, 1)
  assert.ok(document.querySelector('.first-place-screen'))
  assert.equal(document.querySelector('.editor-row'), null)
  await change(document.querySelector('#first-place-note'), 'Latest draft')
  await act(async () => root.render(null))
  await render(CloudEditorPage, cloudProps(current))
  assert.equal(document.querySelector('#first-place-note').value, 'Latest draft')
  globalThis.__start.failSave = false
  await click(document.querySelector('.first-place-save'))
  assert.equal(current.places.length, 1)
  assert.equal(current.places[0].note, 'Latest draft')
  assert.equal(document.querySelector('.editor-place-copy textarea').value, 'Latest draft')
})

test('guest storage failure cannot claim a successful first save and retains the selection for retry', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories)
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await change(document.querySelector('#first-place-note'), 'Still here')
  const prototype = window.Storage.prototype, original = prototype.setItem
  prototype.setItem = function() { throw Error('Storage blocked') }
  try {
    await click(document.querySelector('.first-place-save'))
    assert.ok(document.querySelector('.first-place-screen'))
    assert.equal(document.querySelector('.editor-row'), null)
    assert.equal(document.querySelector('#first-place-note').value, 'Still here')
    assert.equal(loadGuestDraft(draft.id).guide.places.length, 0)
    assert.ok(document.querySelector('[role="alert"]'))
  } finally { prototype.setItem = original }
  await click(document.querySelector('.first-place-save'))
  assert.equal(loadGuestDraft(draft.id).guide.places.length, 1)
  assert.ok(document.querySelector('.editor-row'))
})

test('choosing another result stays inline and discards the old category bias without saving', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories)
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft, 'edit', '?category=eat'))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  await click(document.querySelector('.first-place-selected .text-button'))
  assert.equal(document.activeElement, document.querySelector('.search-box input'))
  assert.equal(document.querySelector('.first-place-selected'), null)
  await click(await waitFor('.search-results button'))
  await click(document.querySelector('.first-place-save'))
  assert.equal(loadGuestDraft(draft.id).guide.places[0].categoryId, 'coffee')
  assert.equal(chip('All').getAttribute('aria-pressed'), 'true')
  assert.equal(document.querySelector('.editor-place-title-row strong').textContent, result.name)
  assert.equal(document.querySelector('.editor-empty-prompt'), null)
  assert.deepEqual(globalThis.__start.routes, [])
})


test('removing the final recommendation returns to a fresh first-place start while preserving the guide note', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories)
  draft.guide.guideNote = 'Keep this guide context'
  draft.guide.places = [{ ...result, id: 'existing', categoryId: 'coffee', note: 'Existing recommendation' }]
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft))
  await click(document.querySelector('.row-menu-wrap > button'))
  await click(document.querySelector('.row-menu .danger'))
  assert.ok(document.querySelector('.first-place-screen'))
  assert.equal(document.querySelector('.first-place-selected'), null)
  assert.equal(document.querySelector('.search-box input').value, '')
  assert.equal(loadGuestDraft(draft.id).guide.guideNote, 'Keep this guide context')
})
