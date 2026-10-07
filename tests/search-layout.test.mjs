import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

test('text-only first-place results use the full grid width without changing icon results', async () => {
  const css = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
  const dom = new JSDOM(`<style>${css}</style>
    <section class="first-place-body"><div class="search-results"><button><span><strong>Brasserie Dubillot</strong><small>222 Rue Saint-Denis, Paris, France</small></span></button></div>
      <div class="first-place-selected"><div class="first-place-selected-heading"><h2>Brasserie Dubillot</h2><button class="text-button first-place-change">Change</button></div></div>
    </section>
    <section class="add-content"><div class="search-results"><button><span class="result-icon">☕</span><span>Brasserie Dubillot</span></button></div></section>`)
  try {
    const style = selector => dom.window.getComputedStyle(dom.window.document.querySelector(selector))
    assert.equal(style('.first-place-body .search-results button').gridTemplateColumns, 'minmax(0, 1fr)')
    assert.equal(style('.first-place-body .search-results small').whiteSpace, 'normal')
    assert.equal(style('.add-content .search-results button').gridTemplateColumns, '38px 1fr')
    assert.equal(style('.first-place-change').minHeight, '44px')
    assert.equal(style('.first-place-change').flex, '0 0 auto')
  } finally { dom.window.close() }
})
