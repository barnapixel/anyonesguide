import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
async function load(file) { const source = await readFile(new URL(file,import.meta.url),'utf8'); return import('data:text/javascript,'+encodeURIComponent(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText)) }
const { GuideSaveQueue, getGuideSaveQueue, flushActiveGuideSaves } = await load('../src/services/guideSaves.ts')
const { reorderPlaces, patchPlace } = await load('../src/utils/guideEditing.ts')
const { mapsUrl } = await load('../src/utils/maps.ts')
const { formatDistance } = await load('../src/utils/distance.ts')
const { safeDecode, normalizePath } = await load('../src/utils/routes.ts')
const { createGuestDraft, isGuestDraft, guestSnapshotBytes } = await load('../src/services/guestDrafts.ts')
const storage = () => { const m=new Map(); return { getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k),m } }
const edit = (n,patch={}) => ({kind:'place',linkId:`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`,clientId:String(n),...patch})
const deferred = () => { let resolve; const promise=new Promise(r=>resolve=r);return {promise,resolve} }

test('failed save stays durable and can be recovered in a new queue',async()=>{
 const s=storage(),q=new GuideSaveQueue('a',async()=>{throw Error('offline')},s)
 q.stage(edit(1,{note:'latest'}));await assert.rejects(q.flush());assert.equal(q.getSnapshot().status,'error')
 let sent;const fresh=new GuideSaveQueue('a',async batch=>{sent=batch},s);await fresh.flush();assert.equal(sent[0].note,'latest');assert.equal(fresh.getSnapshot().status,'saved');assert.equal(s.getItem('a'),null)
})
test('a newer revision waits for the in-flight save and survives its acknowledgement',async()=>{
 const d=deferred(),sent=[],q=new GuideSaveQueue('b',async batch=>{sent.push(batch);if(sent.length===1)await d.promise},storage())
 q.stage(edit(1,{note:'older'}));const flushing=q.flush();await Promise.resolve();q.stage(edit(1,{note:'newest'}));assert.equal(sent.length,1);d.resolve();await flushing
 assert.deepEqual(sent.map(b=>b[0].note),['older','newest']);assert.equal(q.getSnapshot().edits.length,0)
})
test('rapid reorder changes in two categories persist together',async()=>{
 let sent;const q=new GuideSaveQueue('c',async batch=>{sent=batch},storage())
 q.stage(edit(1,{sortOrder:1}));q.stage(edit(2,{sortOrder:0}));q.stage(edit(3,{sortOrder:1}));q.stage(edit(4,{sortOrder:0}));await q.flush();assert.deepEqual(sent.map(e=>e.sortOrder),[1,0,1,0])
})
test('removal supersedes the failed note instead of replaying it',async()=>{
 let fail=true,sent;const q=new GuideSaveQueue('d',async batch=>{sent=batch;if(fail)throw Error('offline')},storage());q.stage(edit(1,{note:'text'}));await assert.rejects(q.flush());q.stage(edit(1,{remove:true}));fail=false;await q.flush();assert.deepEqual(sent,[edit(1,{remove:true})])
})
test('blocked storage reports undurable edits but still permits a successful save',async()=>{
 const q=new GuideSaveQueue('e',async()=>{},null);q.stage(edit(1,{note:'retained'}));assert.equal(q.getSnapshot().durable,false);assert.equal(q.getSnapshot().edits[0].note,'retained');await q.flush();assert.equal(q.getSnapshot().status,'saved')
})
test('invalid stored queue shapes are ignored without sending mutations',async()=>{
 const s=storage();s.setItem('f',JSON.stringify([{kind:'place',linkId:'not-a-uuid',clientId:'1',note:7}]));let sent=false;const q=new GuideSaveQueue('f',async()=>{sent=true},s);await q.flush();assert.equal(sent,false)
})
test('reorder preserves other-category slots and moving category appends',()=>{
 const places=[{id:'a',categoryId:'eat',sortOrder:0},{id:'c',categoryId:'coffee',sortOrder:0},{id:'b',categoryId:'eat',sortOrder:1},{id:'d',categoryId:'coffee',sortOrder:1}]
 const next=reorderPlaces(places,'a','b');assert.deepEqual(next.map(p=>p.id),['b','c','a','d']);assert.deepEqual(next.filter(p=>p.categoryId==='eat').map(p=>p.sortOrder),[0,1])
 const moved=patchPlace({places},'a',{categoryId:'coffee'});assert.equal(moved.places.find(p=>p.id==='a').sortOrder,2);assert.equal(places[0].categoryId,'eat')
})
test('Maps uses name/address and coordinates when both are absent; distance is locale-aware',()=>{
 assert.equal(new URL(mapsUrl({name:' Café ',address:' Warsaw ',lat:52,lng:21})).searchParams.get('query'),'Café, Warsaw')
 assert.equal(new URL(mapsUrl({name:'',address:' ',lat:52,lng:21})).searchParams.get('query'),'52,21');assert.equal(formatDistance(1200,'pl'),'1,2 km');assert.equal(formatDistance(1200,'en'),'1.2 km')
})
test('malformed route parameters are contained and historical alias remains valid',()=>{assert.equal(safeDecode('%E0%A4%A'),null);assert.equal(safeDecode('Gda%C5%84sk'),'Gdańsk');assert.equal(normalizePath('/guide/gdansk/'),'/')})
test('Unicode snapshot budget includes jsonb spaces and complete stored shape validation',()=>{
 const draft=createGuestDraft({city:'Warsaw',country:'Poland',lat:52,lng:21},'Ada','', [{id:'eat',label:'Eat',icon:'x',sortOrder:0}]);draft.guide.places=[{id:'1',name:'Café',address:'A',lat:52,lng:21,note:'a,:"\\'.repeat(50),categoryId:'eat'}]
 assert.ok(isGuestDraft(draft));assert.ok(guestSnapshotBytes(draft)>Buffer.byteLength(JSON.stringify(draft)));assert.equal(isGuestDraft({...draft,guide:{...draft.guide,center:{lat:95,lng:21}}}),false);assert.equal(isGuestDraft({...draft,guide:{...draft.guide,places:[{...draft.guide.places[0],note:{bad:true}}]}}),false)
 draft.guide.places=Array.from({length:100},(_,i)=>({...draft.guide.places[0],id:String(i),note:'ą'.repeat(2000)}));assert.ok(isGuestDraft(draft));assert.ok(guestSnapshotBytes(draft)>200000)
})

test('a failed journal for an unavailable closed guide does not trap unrelated navigation',async()=>{
 const user='navigation-test',q=getGuideSaveQueue(user,'deleted-guide',async()=>{throw Error('gone')})
 q.stage(edit(1,{note:'recoverable'}));await assert.rejects(q.flush());await flushActiveGuideSaves(user)
 const release=q.activate();await assert.rejects(flushActiveGuideSaves(user));release();await flushActiveGuideSaves(user);assert.equal(q.getSnapshot().edits[0].note,'recoverable')
})
