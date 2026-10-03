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
        export async function addPlaceToGuide(guide,result,categoryId){const f=globalThis.__start;f.adds.push({categoryId});if(f.failAdd)throw Error('offline');const place={...result,id:crypto.randomUUID(),guidePlaceId:crypto.randomUUID(),externalId:result.id,categoryId,note:'',sortOrder:0,isStarred:false};f.guide.places.push(place);return place}
        export async function persistGuideEdits(id,edits){const f=globalThis.__start;f.saves.push(edits);if(f.failSave)throw Error('offline')}
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

test('the empty editor has every category, one Eat prompt, encouragement, no note panel and a single primary add action in EN/PL', async () => {
  globalThis.__start = { routes: [] }
  for (const [locale, eat, question, coffee, coffeeQuestion] of [
    ['en', 'Eat', 'Where would you take your friends for dinner?', 'Coffee', 'Where would you meet a friend for coffee?'],
    ['pl', 'Jedzenie', 'Gdzie zabierzesz znajomych na kolację?', 'Kawa', 'Gdzie spotkasz się ze znajomymi na kawę?'],
  ]) {
    await act(async () => root.render(null))
    localStorage.setItem('anyones-guide:locale', locale)
    const current = { ...guide(), guideNote: 'Existing writing stays safe' }
    await render(Editor, { ...editorProps(current), key: locale })
    assert.equal(document.querySelectorAll('.editor-chips button').length, categories.length + 1)
    assert.equal(chip(eat).getAttribute('aria-pressed'), 'true')
    assert.equal(document.querySelector('.editor-empty-question').textContent, question)
    assert.equal(document.querySelector('.editor-guide-note'), null)
    assert.equal(current.guideNote, 'Existing writing stays safe')
    assert.equal(document.querySelector('.editor-body > .creation-hint').textContent, locale === 'en' ? 'Add the first place to start your guide!' : 'Dodaj pierwsze miejsce i zacznij tworzyć przewodnik!')
    assert.equal(document.querySelector('.floating-add'), null)
    assert.equal(document.querySelectorAll('.editor-empty-prompt').length, 1)
    assert.ok([...document.querySelectorAll('.editor-top-actions button')].every(button => button.disabled))
    assert.notEqual(document.activeElement.tagName, 'INPUT')
    await click(chip(coffee))
    assert.equal(document.querySelector('.editor-empty-question').textContent, coffeeQuestion)
    await click(document.querySelector('.editor-empty-prompt button'))
    const url = new URL(globalThis.__start.routes.at(-1), window.location.origin)
    assert.equal(url.searchParams.get('category'), 'coffee')
    assert.equal(url.searchParams.get('return'), 'guide')
    await click(chip(locale === 'en' ? 'All' : 'Wszystkie'))
    await click(document.querySelector('.editor-empty-prompt button'))
    assert.equal(new URL(globalThis.__start.routes.at(-1), window.location.origin).searchParams.get('category'), 'eat')
  }
})

test('a guest adds to the chosen category, returns to the real row with focus, and retains notes/stars on reopening', async () => {
  globalThis.__start = { routes: [] }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories, crypto.randomUUID())
  saveGuestDraft(draft)
  await render(GuestResponsePage, guestProps(draft))
  assert.match(document.querySelector('.request-draft-banner').textContent, /For Boris/)
  await click(document.querySelector('.editor-empty-prompt button'))
  const add = new URL(globalThis.__start.routes.at(-1), window.location.origin)
  await render(GuestResponsePage, guestProps(draft, 'add', add.search))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  const returned = new URL(globalThis.__start.routes.at(-1), window.location.origin)
  assert.equal(returned.pathname, '/respond/' + draft.id)
  assert.equal(returned.searchParams.get('category'), 'eat')
  const saved = loadGuestDraft(draft.id), place = saved.guide.places[0]
  assert.equal(place.categoryId, 'eat') // explicit user intent overrides cafe inference
  assert.equal(returned.searchParams.get('added'), place.id)
  await render(GuestResponsePage, guestProps(draft, 'edit', returned.search))
  assert.equal(document.querySelector('.editor-empty-prompt'), null)
  assert.equal(document.querySelector('.editor-body > .creation-hint'), null)
  assert.equal(document.querySelector('.editor-guide-note').open, false)
  assert.equal(document.querySelector('.editor-place-title-row strong').textContent, result.name)
  assert.equal(document.activeElement, document.querySelector('.editor-place-title-row strong'))
  assert.ok(document.querySelector('.floating-add'))
  await change(document.querySelector('.editor-place-copy textarea'), 'My own recommendation')
  await click(document.querySelector('.author-star-button'))
  await act(async () => root.render(null))
  await render(GuestResponsePage, guestProps(draft))
  const restored = loadGuestDraft(draft.id).guide.places[0]
  assert.equal(restored.note, 'My own recommendation')
  assert.equal(restored.isStarred, true)
  await click(chip('Coffee'))
  assert.ok(document.querySelector('.editor-empty-prompt'))
  assert.equal(document.querySelector('.floating-add'), null)
})

test('cloud creation persists the chosen category before returning and failed adds stay in search', async () => {
  const current = guide()
  globalThis.__start = { guide: current, adds: [], saves: [], routes: [], failAdd: true }
  await render(CloudEditorPage, cloudProps(current))
  await click(document.querySelector('.editor-empty-prompt button'))
  const add = new URL(globalThis.__start.routes.at(-1), window.location.origin)
  await render(CloudEditorPage, cloudProps(current, 'add', add.search))
  await change(document.querySelector('.search-box input'), 'cafe')
  await click(await waitFor('.search-results button'))
  assert.ok(document.querySelector('[role="alert"]'))
  assert.equal(globalThis.__start.routes.length, 1)
  assert.equal(current.places.length, 0)
  globalThis.__start.failAdd = false
  await click(document.querySelector('.search-results button'))
  assert.equal(current.places.length, 1)
  assert.equal(current.places[0].categoryId, 'eat')
  const returned = new URL(globalThis.__start.routes.at(-1), window.location.origin)
  await render(CloudEditorPage, cloudProps(current, 'edit', returned.search))
  assert.ok(document.querySelector('.editor-row'))
  assert.equal(chip('Eat').getAttribute('aria-pressed'), 'true')
  assert.ok([...document.querySelectorAll('.editor-top-actions button')].every(button => !button.disabled))
})

test('the prompt waits for pending owner notes and a failed save keeps the editor and its retry action', async () => {
  const current = { ...guide(), guideNote: 'Existing context', places: [{ ...result, id: 'existing', guidePlaceId: crypto.randomUUID(), categoryId: 'eat', note: '', sortOrder: 0 }] }
  globalThis.__start = { guide: current, adds: [], saves: [], routes: [], failSave: true }
  await render(CloudEditorPage, cloudProps(current, 'edit', '?category=coffee'))
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
  current.categories = [...categories, { id: 'stay', label: 'Stay', icon: 'x', sortOrder: 6 }]
  await render(Editor, { ...editorProps(current), initialCategory: 'stay' })
  assert.match(document.querySelector('.editor-empty-question').textContent, /stay/)
  await act(async () => root.render(null))
  await render(Editor, { ...editorProps(current), initialCategory: 'not-a-category' })
  assert.equal(chip('Eat').getAttribute('aria-pressed'), 'true')
  await act(async () => root.render(null))
  current.places = [{ ...result, id: 'p', categoryId: 'eat', note: '' }]
  await render(PublicGuide, { guide: current, onNavigate() {}, userLocation: null, locationStatus: 'idle', onRequestLocation() {}, trackUsage: false })
  assert.deepEqual([...document.querySelectorAll('.guide-chip-row button')].map(button => button.textContent), ['All', 'Eat'])
})
