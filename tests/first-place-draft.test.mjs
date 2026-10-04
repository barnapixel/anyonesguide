import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/firstPlaceDraft.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
let moduleId = 0
const fresh = () => import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}#${++moduleId}`)
const records = new Map()
let blocked = false
Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() {
  if (blocked === 'all') throw Error('Blocked')
  return { getItem: key => records.get(key) ?? null, setItem(key,value) { if (blocked) throw Error('Quota'); records.set(key,value) }, removeItem(key) { if (blocked) throw Error('Blocked'); records.delete(key) } }
} })
const draft = () => ({ query: 'café', selected: { id: 'poi', name: 'Café', address: 'Street', lat: 52, lng: 21, provider: 'geoapify' }, note: 'My words — exactly as written.', updatedAt: Date.now() })

test('a fresh context recovers selection and exact author writing from device bytes, scoped by account and guide', async () => {
  records.clear(); blocked = false
  const writer = await fresh(), value = draft()
  assert.equal(writer.saveFirstPlaceDraft('owner:a:g', value), true)
  const reader = await fresh()
  assert.deepEqual(reader.loadFirstPlaceDraft('owner:a:g'), value)
  assert.equal(reader.loadFirstPlaceDraft('owner:b:g'), null)
  assert.equal(reader.loadFirstPlaceDraft('owner:a:another'), null)
  assert.equal(reader.loadFirstPlaceDraft('guest:g'), null)
})

test('blocked storage retains the selection during the visit while reporting that it is not durable', async () => {
  records.clear(); blocked = 'all'
  const api = await fresh(), value = draft()
  assert.equal(api.saveFirstPlaceDraft('guest:g', value), false)
  assert.deepEqual(api.loadFirstPlaceDraft('guest:g'), value)
  assert.equal((await fresh()).loadFirstPlaceDraft('guest:g'), null)
  blocked = false
})

test('damaged, expired, future, oversized or invalid place checkpoints cannot restore a fake selection', async () => {
  blocked = false
  for (const value of [null, {}, { ...draft(), updatedAt: Date.now() - 7*24*60*60*1000 - 1 }, { ...draft(), updatedAt: Date.now()+120000 }, { ...draft(), note: 'x'.repeat(5001) }, { ...draft(), selected: { ...draft().selected, lat: 91 } }, { ...draft(), selected: { ...draft().selected, provider: 'unknown' } }]) {
    records.set('anyones-guide:first-place:v1:guest:g', JSON.stringify(value))
    assert.equal((await fresh()).loadFirstPlaceDraft('guest:g'), null)
  }
  records.set('anyones-guide:first-place:v1:guest:g', '{broken')
  assert.equal((await fresh()).loadFirstPlaceDraft('guest:g'), null)
})

test('successful-save cleanup clears only this draft and survives a blocked removal during the visit', async () => {
  records.clear(); blocked = false
  const api = await fresh(), value = draft()
  api.saveFirstPlaceDraft('guest:a', value); api.saveFirstPlaceDraft('guest:b', value)
  api.clearFirstPlaceDraft('guest:a')
  assert.equal((await fresh()).loadFirstPlaceDraft('guest:a'), null)
  assert.deepEqual((await fresh()).loadFirstPlaceDraft('guest:b'), value)
  blocked = true
  api.clearFirstPlaceDraft('guest:b')
  assert.equal(api.loadFirstPlaceDraft('guest:b'), null)
  blocked = false
})
