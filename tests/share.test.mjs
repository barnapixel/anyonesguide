import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/share.ts', import.meta.url), 'utf8')
const rewritten = source.replace("../../shared/share-copy.mjs", new URL('../shared/share-copy.mjs', import.meta.url).href)
const javascript = ts.transpileModule(rewritten, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
const { guideShareContent, shareUrl } = await import(`data:text/javascript,${encodeURIComponent(javascript)}`)

test('native sharing names the person and city and includes a friendly sentence', async () => {
  let payload
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { share: async value => { payload = value } } })
  const content = guideShareContent(' Boris ', 'Warsaw', 'en')
  assert.equal(content.title, 'Boris’s Guide to Warsaw')
  assert.equal(content.text, 'Boris’s Guide to Warsaw. Thought you might like it!')
  assert.equal(await shareUrl({ ...content, url: 'https://example.com/boris/warsaw' }), 'shared')
  assert.deepEqual(payload, { text: `${content.text}\n\nhttps://example.com/boris/warsaw` })
})

test('copy fallback includes both the friendly message and URL', async () => {
  let copied
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async value => { copied = value } } } })
  const content = guideShareContent('Boris', 'Warsaw', 'pl')
  assert.equal(await shareUrl({ ...content, url: 'https://example.com/boris/warsaw' }), 'copied')
  assert.equal(copied, 'Warsaw. Poleca Boris. Może Ci się przydać!\n\nhttps://example.com/boris/warsaw')
})

test('cancelled native share does not copy anything', async () => {
  let copied = false
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    share: async () => { throw new DOMException('Cancelled', 'AbortError') },
    clipboard: { writeText: async () => { copied = true } },
  } })
  assert.equal(await shareUrl({ title: 'Guide', url: 'https://example.com' }), 'cancelled')
  assert.equal(copied, false)
})


test('native share and clipboard get identical paragraphs with one URL and no indentation', async () => {
  const { requestShareContent } = await import('../shared/share-copy.mjs')
  for (const locale of ['en', 'pl']) for (const name of ['Boris', '']) {
    const content = requestShareContent(name, 'Kraków', locale)
    const url = 'https://anyones.guide/request/7Kp4nB9xQ2mR'
    let payload, copied
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { share: async value => { payload = value } } })
    assert.equal(await shareUrl({ ...content, url }), 'shared')
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: async value => { copied = value } } } })
    assert.equal(await shareUrl({ ...content, url }), 'copied')
    assert.deepEqual(payload, { text: copied })
    assert.equal(copied.split(url).length, 2)
    assert.ok(copied.endsWith('\n\n'+url))
    assert.doesNotMatch(copied, /^[ \t]+/m)
    assert.doesNotMatch(copied, /—|<a|undefined|null/)
    if (name) assert.ok(copied.includes('\n\nBoris\n\n'))
  }
})
