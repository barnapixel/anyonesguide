import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function loadModule(path, nonce = '') {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const rewritten = source.replace('../../shared/city-names.mjs', new URL('../shared/city-names.mjs', import.meta.url).href).replace("../../shared/share-copy.mjs", new URL('../shared/share-copy.mjs', import.meta.url).href)
  const javascript = ts.transpileModule(rewritten, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText
  return import(`data:text/javascript,${encodeURIComponent(javascript + '\n//' + nonce)}`)
}
const { readInvitation, requestPath, requestShareContent, authReturnUrl, invitationPath, isStoredInvitation } = await loadModule('../src/utils/requestLinks.ts')
const { createGuestDraft, saveGuestDraft, loadGuestDraft, findInvitationDraft, clearGuestDraft, isGuestDraft } = await loadModule('../src/services/guestDrafts.ts')
const destination = { id: 'warsaw', city: 'Warsaw', country: 'Poland', lat: 52.23, lng: 21.01 }
const categories = [{ id: 'eat', label: 'Eat', icon: '🍴', sortOrder: 0 }]

test('request links safely round-trip names, optional city and language', () => {
  const path = requestPath(' Boris & Zoë ', ' Gdańsk ', 'pl')
  assert.deepEqual(readInvitation(path.slice(path.indexOf('?'))), { name: 'Boris & Zoë', city: 'Gdańsk', locale: 'pl' })
  assert.deepEqual(readInvitation('?name=Boris&lang=invalid'), { name: 'Boris', city: '', locale: 'en' })
  assert.equal(readInvitation('?name=' + 'A'.repeat(200)).name.length, 80)
  assert.equal(requestShareContent('Boris', '', 'en').title, 'Boris is asking for your recommendations')
  assert.match(requestShareContent('Boris', 'Warsaw', 'en').text, /in Warsaw/)
})

test('auth return paths stay on this site and support private draft recovery', () => {
  const callback = '/finish-request?draft=123&key=secret'
  assert.equal(authReturnUrl('https://guides.example.com', callback), 'https://guides.example.com' + callback)
  assert.equal(authReturnUrl('https://guides.example.com'), 'https://guides.example.com/creator')
  for (const path of ['https://evil.example/creator', '//evil.example/creator', '/explore', 'javascript:alert(1)']) {
    assert.throws(() => authReturnUrl('https://guides.example.com', path))
  }
})

test('guest drafts are private, empty, separate from the demo and recover on reopening the invitation', () => {
  const data = new Map()
  const storage = { setItem: (key, value) => data.set(key, value), getItem: key => data.get(key) ?? null, removeItem: key => data.delete(key) }
  const draft = createGuestDraft(destination, 'Boris', 'Warsaw', categories)
  assert.notEqual(draft.id, draft.key)
  assert.equal(draft.guide.visibility, 'draft')
  assert.equal(draft.guide.places.length, 0)
  assert.ok(isGuestDraft(draft))
  assert.equal(saveGuestDraft(draft, storage), true)
  assert.equal(loadGuestDraft(draft.id, storage), draft)
  assert.equal(findInvitationDraft('Boris', 'Warsaw', storage), draft)
  assert.equal(data.has('anyones-guide:v0:guide'), false)
  clearGuestDraft(draft.id, storage)
  assert.equal(loadGuestDraft(draft.id, storage), null)
  assert.equal(findInvitationDraft('Boris', 'Warsaw', storage), null)
})

test('blocked storage preserves the draft during the visit and reports the failure', () => {
  const blocked = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
  const draft = createGuestDraft(destination, 'Ada', '', categories)
  assert.equal(saveGuestDraft(draft, blocked), false)
  assert.equal(loadGuestDraft(draft.id, blocked), draft)
  clearGuestDraft(draft.id, blocked)
  assert.equal(loadGuestDraft(draft.id, blocked), null)
})

test('a fresh browser context restores destination, notes and place order from persisted bytes', async () => {
  const data = new Map()
  const storage = { setItem: (key, value) => data.set(key, value), getItem: key => data.get(key) ?? null, removeItem: key => data.delete(key) }
  const draft = createGuestDraft(destination, 'Zoë', 'Warsaw', categories)
  draft.guide.guideNote = 'Stay near the old town.\nTake a long weekend.'
  draft.guide.places = ['second', 'first'].map(id => ({ id, name: id, address: 'Warsaw', categoryId: 'eat', note: `My note for ${id}`, lat: 52.23, lng: 21.01 }))
  saveGuestDraft(draft, storage)
  const fresh = await loadModule('../src/services/guestDrafts.ts', crypto.randomUUID())
  const restored = fresh.findInvitationDraft('Zoë', 'Warsaw', storage)
  assert.notEqual(restored, draft)
  assert.deepEqual(restored, draft)
  assert.deepEqual(restored.guide.places.map(place => place.id), ['second', 'first'])
  clearGuestDraft(draft.id, storage)
})

test('malformed browser drafts never replace a real draft or become a demo guide', () => {
  const id = crypto.randomUUID()
  const storage = { getItem: () => '{broken' }
  assert.equal(loadGuestDraft(id, storage), null)
  const draft = createGuestDraft(destination, 'Boris', '', categories)
  assert.equal(isGuestDraft({ ...draft, guide: { ...draft.guide, places: [null] } }), false)
  assert.equal(isGuestDraft({ ...draft, key: '' }), false)
})

test('stored invitation routes accept only independent UUIDs and anonymous copy has no invented name',()=>{
 const id=crypto.randomUUID();assert.equal(invitationPath(id),'/request/'+id)
 for(const invalid of ['//evil.example','../creator','123','<script>'])assert.throws(()=>invitationPath(invalid))
 assert.equal(isStoredInvitation({id,name:'',city:'Warsaw',locale:'pl'}),true)
 assert.equal(isStoredInvitation({id,name:'x'.repeat(81),city:'Warsaw',locale:'pl'}),false)
 assert.equal(isStoredInvitation({id,name:'',city:'Warsaw',locale:'xx'}),false)
 assert.equal(requestShareContent('Boris','Warsaw','pl').title,'Boris prosi o Twoje rekomendacje')
 assert.equal(requestShareContent('','Warsaw','pl').title,'Podziel się swoimi rekomendacjami')
 assert.doesNotMatch(requestShareContent('','Warsaw','en').text,/undefined|null/)
})

test('matching names and cities never merge stored invitations or a historical invitation draft',()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k)}
 const first=createGuestDraft(destination,'Boris','Warsaw',categories,crypto.randomUUID())
 const second=createGuestDraft(destination,'Boris','Warsaw',categories,crypto.randomUUID())
 const legacy=createGuestDraft(destination,'Boris','Warsaw',categories)
 for(const draft of [first,second,legacy])saveGuestDraft(draft,storage)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage,first.invitationId),first)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage,second.invitationId),second)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage),legacy)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage,crypto.randomUUID()),null)
 clearGuestDraft(first.id,storage)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage,first.invitationId),null)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage,second.invitationId),second)
 assert.equal(findInvitationDraft('Boris','Warsaw',storage),legacy)
})

test('a fresh browser restores anonymous invitation identity and rejects malformed context flags',async()=>{
 const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null,removeItem:k=>data.delete(k)}
 const original=createGuestDraft(destination,'a friend','Warsaw',categories,crypto.randomUUID(),true)
 saveGuestDraft(original,storage)
 const fresh=await loadModule('../src/services/guestDrafts.ts',crypto.randomUUID())
 const restored=fresh.findInvitationDraft('different UI language','Warsaw',storage,original.invitationId)
 assert.deepEqual(restored,original)
 assert.equal(isGuestDraft({...original,invitationId:'wrong'}),false)
 assert.equal(isGuestDraft({...original,requesterAnonymous:'true'}),false)
 clearGuestDraft(original.id,storage)
})


test('short codes create clean paths without replacing the original UUID identity',()=>{
 const id=crypto.randomUUID(),shortCode='7Kp4nB9xQ2mR'
 assert.equal(invitationPath(id,shortCode),'/request/'+shortCode)
 assert.equal(invitationPath(id),'/request/'+id)
 assert.equal(isStoredInvitation({id,shortCode,name:'Boris',city:'Warsaw',locale:'pl'}),true)
 for(const invalid of ['../creator','12345678901','1234567890123','a b456789012','<script>0000']) {
  assert.throws(()=>invitationPath(id,invalid))
  assert.equal(isStoredInvitation({id,shortCode:invalid,name:'B',city:'W',locale:'en'}),false)
 }
})
