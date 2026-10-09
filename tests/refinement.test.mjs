import test from 'node:test'
import assert from 'node:assert/strict'
import ts from 'typescript'
import { readFile } from 'node:fs/promises'
async function load(file) { const source = (await readFile(new URL(file,import.meta.url),'utf8')).replace('../../shared/city-names.mjs',new URL('../shared/city-names.mjs',import.meta.url).href); return import('data:text/javascript,'+encodeURIComponent(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText)) }
const { GuideSaveQueue, getGuideSaveQueue, flushActiveGuideSaves } = await load('../src/services/guideSaves.ts')
const { reorderPlaces, patchPlace } = await load('../src/utils/guideEditing.ts')
const { compactPlaceLocation, placeStreet } = await load('../src/utils/placeLocation.ts')
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

// Exact known suffixes can be condensed. Unrecognised geography and semantic
// subtitles stay verbatim; stored data remains available to the place sheet.
test('place rows shorten reliable city suffixes without guessing international addresses', () => {
 const cases = [
  ['Koszykowa 1, 00-564 Warsaw, Poland', 'Warsaw', 'Poland', 'Koszykowa 1'],
  ['222 Rue Saint-Denis, 75002 Paris, France', 'Paris', 'France', '222 Rue Saint-Denis'],
  ['Pierogi · Śródmieście', 'Warsaw', 'Poland', 'Pierogi · Śródmieście'],
  ['1 Main Street, Cambridge, MA 02138, United States', 'Cambridge', 'United States', '1 Main Street, Cambridge, MA 02138, United States'],
  ['東京都新宿区西新宿2丁目', 'Tokyo', 'Japan', '東京都新宿区西新宿2丁目'],
  ['Museum of Warsaw', 'Warsaw', 'Poland', 'Museum of Warsaw'],
  ['High Street, Oxford, United Kingdom', 'London', 'United Kingdom', 'High Street, Oxford, United Kingdom'],
 ]
 for (const [subtitle,city,country,expected] of cases) {
  const place = { name: 'Regina', subtitle, address: subtitle }
  assert.equal(compactPlaceLocation(place, city, country), expected)
  assert.equal(place.address, subtitle)
 }
 const streets = [
  ['Koszykowa 1, 00-564 Warsaw, Poland','Koszykowa 1'],
  ['Regina, Koszykowa 1, Śródmieście, 00-564 Warsaw, Poland','Koszykowa 1'],
  ['1 Main Street, Cambridge, MA 02138, United States','1 Main Street'],
  ['222 Rue Saint-Denis, 75002 Paris, France','222 Rue Saint-Denis'],
  ['High Street, Oxford, United Kingdom','High Street'],
  ['Pierogi · Śródmieście',''],['Warsaw',''],['00-564 Warsaw, Poland',''],
  ['東京都新宿区西新宿2丁目',''],['Cambridge MA 02138',''],
 ]
 for(const [address,expected] of streets) assert.equal(placeStreet({name:'Regina',address},'Warsaw','Poland'),expected)
 assert.equal(compactPlaceLocation({name:'Regina',subtitle:'00-564 Warsaw, Poland',address:'Regina, Koszykowa 1, 00-564 Warsaw, Poland'},'Warsaw','Poland'),'Koszykowa 1')
 const gdanskFormats=[
  ['Szeroka 16, 80-835 Gdansk, Polska','Szeroka 16'],
  ['3 Maja 7 A, Gdansk, Poland','3 Maja 7 A'],
  ['10 Lutego 12/14/16, Śródmieście, Gdańsk, Polska','10 Lutego 12/14/16'],
  ['Dywizjonu 303 3, Gdańsk, Polska','Dywizjonu 303 3'],
  ['Świętojańska 12–14, 80-840 Gdańsk, Poland','Świętojańska 12–14'],
  ['Długa 5 lok. 2, 80-827 Gdansk, Poland','Długa 5'],
  ['REGINA, Chmielna 10, Gdansk, Polska','Chmielna 10'],
  ['Provider venue name, Tkacka 7/8, Gdansk, Polska','Tkacka 7/8'],
  ['Lisia Grobla 7, Gdańsk, Pomorskie, Poland','Lisia Grobla 7'],
  ['ul. Długa, Gdańsk, Polska','ul. Długa'],
  ['Gdańsk 80-831, Polska',''],['80-831 Gdansk, Poland',''],['District 5, Gdansk',''],
 ]
 for(const [address,expected] of gdanskFormats){
  const place={name:'Regina',address}
  assert.equal(placeStreet(place,'Gdańsk','Poland'),expected,address);assert.equal(place.address,address)
 }
 assert.equal(placeStreet({name:'Cafe',address:'80-001 Gdansk, Poland',subtitle:'3 Maja 7 A'},'Gdańsk','Poland'),'3 Maja 7 A')
 // Exact saved values supplied in the user's place-detail screenshots.
 const savedAddresses=[
  ['Masło Maślane','Masło Maślane, Garncarska, 80-894 Gdansk, Poland','Garncarska'],
  ['100cznia','100cznia, Księdza Jerzego Popiełuszki 5, 80-863 Gdańsk, Poland','Księdza Jerzego Popiełuszki 5'],
  ['Muzeum II Wojny Światowej 02','Muzeum II Wojny Światowej 02, Wałowa, 80-882 Gdańsk, Poland','Wałowa'],
  ['Cafe','Garncarska, 80-894 Gdansk, Poland','Garncarska'],
  ['Cafe','Cafe, Garncarska, Śródmieście, 80-894 Gdańsk, Poland','Garncarska'],
  ['Cafe','Provider name, Wałowa, 80-882 Gdańsk, Poland','Wałowa'],
  ['Cafe','Cafe, Śródmieście, 80-894 Gdańsk, Poland',''],
  ['Cafe','Cafe, Old Town, 80-894 Gdańsk, Poland',''],
  ['Cafe','Cafe, Gdansk, 80-894 Gdańsk, Poland',''],
  ['Cafe','Garncarska',''],
  ['Cafe','Cafe, Garncarska, 80-894 Warsaw, Poland',''],
 ]
 for(const [name,address,expected] of savedAddresses){
  const place={name,address};assert.equal(placeStreet(place,'Gdańsk','Poland'),expected,address);assert.equal(place.address,address)
 }
})
