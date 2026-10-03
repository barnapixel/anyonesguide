import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

// Transpile the small storage module so npm test also works on Node 22.12.
const storageSource = readFileSync(new URL('../src/services/savedGuides.ts', import.meta.url), 'utf8')
const storageJs = ts.transpileModule(storageSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { listSavedGuides, removeSavedGuide, saveGuide, subscribeSavedGuides } =
  await import(`data:text/javascript;base64,${Buffer.from(storageJs).toString('base64')}`)

const key = 'anyones-guide:saved-guides:v1'
const records = new Map()
let writesBlocked = false
const browser = new EventTarget()
Object.defineProperty(browser, 'localStorage', {
  get() {
    if (writesBlocked === 'all') throw new Error('Storage blocked')
    return {
      getItem: name => records.get(name) ?? null,
      setItem(name, value) {
        if (writesBlocked) throw new Error('Quota exceeded')
        records.set(name, value)
      },
    }
  },
})
globalThis.window = browser

const guide = {
  id: 'guide-1', profileSlug: 'writer', slug: 'gdansk', city: 'Gdańsk', country: 'Poland',
  authorName: 'Boris', intro: 'My favourites', places: [{ id: 'place-1' }],
}

test('save, list, and remove a local guide shortcut', () => {
  records.clear()
  writesBlocked = false
  let notifications = 0
  const unsubscribe = subscribeSavedGuides(() => notifications++)
  saveGuide(guide)
  assert.equal(listSavedGuides()[0].guideId, guide.id)
  assert.equal(listSavedGuides()[0].placeCount, 1)
  removeSavedGuide(guide.id)
  assert.deepEqual(listSavedGuides(), [])
  assert.equal(notifications, 2)
  unsubscribe()
})

test('blocked storage cannot prevent reading and failed saves do not claim success', () => {
  records.clear()
  writesBlocked = 'all'
  assert.deepEqual(listSavedGuides(), [])
  writesBlocked = true
  let notifications = 0
  const unsubscribe = subscribeSavedGuides(() => notifications++)
  assert.throws(() => saveGuide(guide), /Quota exceeded/)
  assert.equal(notifications, 0)
  assert.deepEqual(listSavedGuides(), [])
  unsubscribe()
  writesBlocked = false
})

test('malformed local data does not break guide reading', () => {
  records.set(key, '{broken')
  assert.deepEqual(listSavedGuides(), [])
  records.delete(key)
})

test('database event constraint covers every client event', () => {
  const source = readFileSync(new URL('../src/services/analytics.ts', import.meta.url), 'utf8')
  const migration = readFileSync(new URL('../supabase/migrations/0004_saved_guides_analytics.sql', import.meta.url), 'utf8')
  const names = [...source.matchAll(/^  \| '([^']+)'/gm)].map(match => match[1])
  const allowed = migration.match(/app_events_name_check check \(event_name in \(([\s\S]*?)\)\)/)?.[1]
  assert.ok(allowed, 'expected an event name constraint in migration 0004')
  const databaseNames = [...allowed.matchAll(/'([^']+)'/g)].map(match => match[1])
  assert.deepEqual(databaseNames, names)
})
