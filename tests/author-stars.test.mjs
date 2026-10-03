import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { JSDOM } from 'jsdom'
import { guideShareContent, guideShareUrl, requestShareContent, guideDescription } from '../shared/share-copy.mjs'

async function load(file) {
  const source = await readFile(new URL(file, import.meta.url), 'utf8')
  return import('data:text/javascript,' + encodeURIComponent(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText))
}
const { orderCategoryPlaces, patchPlace, reorderPlaces } = await load('../src/utils/guideEditing.ts')
const { GuideSaveQueue } = await load('../src/services/guideSaves.ts')
const { createGuestDraft, isGuestDraft, loadGuestDraft } = await load('../src/services/guestDrafts.ts')
const { createPlaceMarkerElement } = await load('../src/utils/mapMarkers.ts')
const storage = () => { const entries = new Map(); return { getItem: k => entries.get(k) ?? null, setItem: (k,v) => entries.set(k,v), removeItem: k => entries.delete(k) } }
const place = (id, sortOrder, isStarred = false, categoryId = 'eat') => ({ id, sortOrder, isStarred, categoryId })
const orderedIds = places => orderCategoryPlaces(places).map(p => p.id)
const linkId = '00000000-0000-4000-8000-000000000001'

test('star priority is stable, allows multiple picks and retains the underlying author order', () => {
  const places = [place('c',2,true), place('a',0), place('b',1,true), place('d',3)]
  assert.deepEqual(orderedIds(places), ['b','c','a','d'])
  assert.deepEqual(places.map(p => p.id), ['c','a','b','d'])
  const unstarred = patchPlace({ places },'b',{ isStarred:false })
  assert.deepEqual(orderedIds(unstarred.places), ['c','a','b','d'])
  assert.equal(unstarred.places.find(p => p.id === 'b').sortOrder,1)
  assert.deepEqual(orderedIds([{id:'old-a'}, {id:'old-b'}]), ['old-a','old-b'])
})
test('reordering stays within a category and priority group without changing stars', () => {
  const places = [place('a',0),place('x',0,false,'coffee'),place('b',1,true),place('c',2),place('d',3,true)]
  assert.equal(reorderPlaces(places,'a','b'),places)
  assert.equal(reorderPlaces(places,'a','x'),places)
  const next = reorderPlaces(places,'d','b')
  assert.deepEqual(orderedIds(next.filter(p => p.categoryId === 'eat')),['d','b','a','c'])
  assert.equal(next[1],places[1])
  assert.deepEqual(next.filter(p => p.isStarred).map(p => p.id).sort(),['b','d'])
  const moved = patchPlace({places:next},'d',{categoryId:'coffee'})
  assert.equal(moved.places.find(p => p.id === 'd').isStarred,true)
  assert.equal(moved.places.find(p => p.id === 'd').sortOrder,1)
})
test('a failed star save recovers with notes, including a later unstar revision', async () => {
  const s=storage(), first=new GuideSaveQueue('star-journal',async()=>{throw Error('offline')},s)
  first.stage({kind:'place',linkId,clientId:'one',isStarred:true})
  first.stage({kind:'place',linkId,clientId:'one',note:'My own words.'})
  await assert.rejects(first.flush())
  const batches=[]; let release
  const wait = new Promise(r => release=r)
  const recovered=new GuideSaveQueue('star-journal',async batch=>{batches.push(batch);if(batches.length===1)await wait},s)
  const flush=recovered.flush();await Promise.resolve()
  recovered.stage({kind:'place',linkId,clientId:'one',isStarred:false})
  release();await flush
  assert.equal(batches[0][0].isStarred,true)
  assert.equal(batches[0][0].note,'My own words.')
  assert.equal(batches[1][0].isStarred,false)
  assert.equal(s.getItem('star-journal'),null)
})
test('malformed journal stars are not replayed', async () => {
  const s=storage();s.setItem('bad-star',JSON.stringify([{kind:'place',linkId,clientId:'one',isStarred:'true'}]))
  let sent=false;const queue=new GuideSaveQueue('bad-star',async()=>{sent=true},s)
  await queue.flush();assert.equal(sent,false)
})
test('guest stars survive a stored reload; old drafts remain valid and malformed flags fail', () => {
  const draft=createGuestDraft({city:'Warsaw',country:'Poland',lat:52,lng:21},'Ada','',[])
  const recommendation={id:'one',name:'Café',address:'Street',note:'My note — keep my punctuation.',lat:52,lng:21,categoryId:'coffee',sortOrder:3,isStarred:true}
  draft.guide.places=[recommendation]
  const s=storage();s.setItem('anyones-guide:request-draft:'+draft.id,JSON.stringify(draft))
  const recovered=loadGuestDraft(draft.id,s)
  assert.equal(recovered.guide.places[0].isStarred,true)
  assert.equal(recovered.guide.places[0].note,recommendation.note)
  delete recommendation.isStarred;assert.equal(isGuestDraft(draft),true)
  recommendation.isStarred='true';assert.equal(isGuestDraft(draft),false)
})
test('map markers retain their category icon, accessible star label and selection action without injecting names', () => {
  const dom=new JSDOM();globalThis.document=dom.window.document
  try {
    const p={name:'<img src=x onerror=alert(1)>',categoryId:'coffee',isStarred:true}
    let selected;const marker=createPlaceMarkerElement(p,true,value=>selected=value,'Especially recommended')
    assert.equal(marker.querySelectorAll('svg').length,2)
    assert.equal(marker.querySelector('img'),null)
    assert.ok(marker.classList.contains('starred'));assert.ok(marker.classList.contains('selected'))
    assert.equal(marker.getAttribute('aria-label'),p.name+'. Especially recommended')
    marker.click();assert.equal(selected,p)
    const normal=createPlaceMarkerElement({...p,isStarred:false,categoryId:'__proto__'},false,()=>{},'Especially recommended')
    assert.equal(normal.querySelector('.map-author-star'),null)
    assert.equal(normal.querySelectorAll('svg').length,1)
    assert.equal(normal.getAttribute('aria-label'),p.name)
  } finally { delete globalThis.document;dom.window.close() }
})
test('owner and reader messages are personal in EN/PL, and guide links retain aliases plus language', () => {
  for(const locale of ['en','pl']) {
    const owner=guideShareContent('Ada','Gdańsk',locale,'owner'),reader=guideShareContent('Ada','Gdańsk',locale)
    assert.notEqual(owner.text,reader.text)
    for(const value of [owner,reader,requestShareContent('Ada','Gdańsk',locale)]) assert.equal(JSON.stringify(value).includes('\u2014'),false)
    const url=new URL(guideShareUrl('https://guides.example','/old-handle/gdansk',locale))
    assert.equal(url.pathname,'/old-handle/gdansk');assert.equal(url.searchParams.get('lang'),locale)
  }
  assert.throws(()=>guideShareUrl('https://guides.example','https://another.example/a/b','en'))
  assert.equal(guideDescription('Ada','Gdańsk','en','My personal note — keep it!'),'My personal note — keep it!')
})
