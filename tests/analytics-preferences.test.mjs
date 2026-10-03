import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const source = readFileSync(new URL('../src/services/analyticsPreferences.ts', import.meta.url), 'utf8')
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText
const { hasAnalyticsConsent, setAnalyticsConsent } =
  await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`)

const local = new Map()
const session = new Map()
let blocked = false
globalThis.window = {
  localStorage: {
    getItem(key) { if (blocked) throw new Error('blocked'); return local.get(key) ?? null },
    setItem(key, value) { if (blocked) throw new Error('blocked'); local.set(key, value) },
  },
  sessionStorage: { removeItem(key) { session.delete(key) } },
}

test('analytics starts off, requires a saved choice, and stops on withdrawal', () => {
  assert.equal(hasAnalyticsConsent(), false)
  assert.equal(setAnalyticsConsent(true), true)
  assert.equal(hasAnalyticsConsent(), true)
  session.set('anyones-guide:session-id', 'sample-session')
  assert.equal(setAnalyticsConsent(false), true)
  assert.equal(hasAnalyticsConsent(), false)
  assert.equal(session.has('anyones-guide:session-id'), false)
})

test('unavailable browser storage never enables analytics', () => {
  local.clear()
  blocked = true
  assert.equal(setAnalyticsConsent(true), false)
  assert.equal(hasAnalyticsConsent(), false)
  blocked = false
})
