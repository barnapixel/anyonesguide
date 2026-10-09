// CSS/DOM regression evidence only. jsdom does not lay out viewports, render
// safe areas/iframes, or correctly cascade !important over iframe inline styles.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { JSDOM } from 'jsdom'
import ts from 'typescript'

const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
const paddingSource = await readFile(new URL('../src/utils/mapPadding.ts', import.meta.url), 'utf8')
const { mapCameraPadding } = await import('data:text/javascript,' + encodeURIComponent(ts.transpileModule(paddingSource, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText))

test('a late public badge reserves its lane and dismissal releases it; the private toolbar leaves layout alone', () => {
  const dom = new JSDOM(`<style>${css}</style><div id="root"><main class="public-shell"><nav class="mode-switch"></nav></main><main class="editor-shell"><button class="floating-add"></button></main><footer class="legal-footer"></footer></div>`)
  try {
    const { document } = dom.window
    const clearance = () => dom.window.getComputedStyle(document.body).getPropertyValue('--netlify-badge-clearance')
    assert.notEqual(clearance(), '104px')
    const privateFrame = document.createElement('iframe'); privateFrame.id = 'nl-hud-frame'; document.body.append(privateFrame)
    assert.notEqual(clearance(), '104px')
    const publicFrame = document.createElement('iframe'); publicFrame.id = 'nl-badge-frame'; document.body.append(publicFrame)
    assert.equal(clearance(), '104px')
    const badgeRule = [...document.styleSheets[0].cssRules].find(rule => rule.selectorText === 'iframe#nl-badge-frame')
    assert.equal(badgeRule.style.getPropertyPriority('inset'), 'important')
    assert.equal(badgeRule.style.getPropertyPriority('z-index'), 'important')
    const layer = Number(badgeRule.style.getPropertyValue('z-index'))
    for (const selector of ['.mode-switch', '.floating-add', '.legal-footer']) assert.ok(layer < Number(dom.window.getComputedStyle(document.querySelector(selector)).zIndex))
    assert.equal(dom.window.getComputedStyle(privateFrame).zIndex, '')
    publicFrame.remove()
    assert.notEqual(clearance(), '104px')
  } finally { dom.window.close() }
})

test('map framing allows for the compact measured toolbar and enabled badge', () => {
  assert.deepEqual(mapCameraPadding(true), { top: 84, right: 34, bottom: 122, left: 34 })
  assert.deepEqual(mapCameraPadding(false), { top: 84, right: 60, bottom: 126, left: 60 })
  assert.deepEqual(mapCameraPadding(true, 104), { top: 84, right: 34, bottom: 226, left: 34 })
  assert.deepEqual(mapCameraPadding(false, 104), { top: 84, right: 60, bottom: 230, left: 60 })
  assert.deepEqual(mapCameraPadding(true, 0, 62.4), { top: 83, right: 34, bottom: 122, left: 34 })
})
