import test,{before,after} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'vite'
let server,service,maps,markers,queue
before(async()=>{
 server=await createServer({configFile:false,envDir:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',plugins:[{name:'area-config',enforce:'pre',resolveId(id){if(id==='virtual:area-config')return '\0'+id},load(id){if(id==='\0virtual:area-config')return "export const appConfig={geoapifyApiKey:'fixture'}"},transform(code,id){if(id.endsWith('/src/services/areaRecommendations.ts'))return code.replace("'../config'","'virtual:area-config'")}}]})
 service=await server.ssrLoadModule('/src/services/areaRecommendations.ts');maps=await server.ssrLoadModule('/src/utils/maps.ts');queue=await server.ssrLoadModule('/src/services/guideSaves.ts')
})
after(async()=>server.close())
test('geographic suggestions exclude venue names, city-only results and distant streets',()=>{
 assert.deepEqual(service.areaNames({name:'A business',formatted:'Full address',city:'Gdańsk',suburb:'Oliwa',street:'Opacka',distance:7}),{area:'Oliwa',street:'Opacka'})
 assert.deepEqual(service.areaNames({name:'A business',city:'Gdańsk',suburb:'Gdańsk'}),{area:'',street:''})
 assert.deepEqual(service.areaNames({quarter:'Wrzeszcz',street:'Faraway Street',distance:300}),{area:'Wrzeszcz',street:''})
})
test('map search can reach nearby towns but rejects missing/invalid coordinates',async()=>{
 const original=globalThis.fetch
 try{globalThis.fetch=async()=>({ok:true,json:async()=>({results:[{name:'Sopot',place_id:'town',lat:54.44,lon:18.56},{name:'Invalid',lat:null,lon:null},{name:'Invalid',lat:91,lon:18}]})})
 const results=await service.searchMapLocations('Sopot',{lat:54.35,lng:18.65})
 assert.equal(results.length,1);assert.equal(results[0].name,'Sopot');assert.equal(results[0].lat,54.44)
 }finally{globalThis.fetch=original}
})
test('area directions use exact author coordinates despite a suggested geographic name',()=>{
 const point={lat:54.443321,lng:18.563219},draft={id:crypto.randomUUID(),point,name:'  My corner  ',note:'Words',kind:'area',nameEdited:true,confirmed:true,updatedAt:Date.now()}
 const result=service.areaSearchResult(draft)
 assert.equal(result.name,'My corner');assert.equal(result.provider,'manual');assert.equal(result.id,draft.id)
 assert.equal(new URL(maps.mapsUrl({...result,recommendationKind:'area'})).searchParams.get('query'),'54.443321,18.563219')
 assert.throws(()=>service.areaSearchResult({...draft,confirmed:false}))
})
test('interrupted area metadata saves recover the complete edit and merge later note/star changes',async()=>{
 const entries=new Map(),storage={getItem:k=>entries.get(k)??null,setItem:(k,v)=>entries.set(k,v),removeItem:k=>entries.delete(k)}
 const q=new queue.GuideSaveQueue('area',async()=>{throw Error('offline')},storage),id=crypto.randomUUID()
 q.stage({kind:'place',clientId:'place',linkId:id,name:'Favourite corner',lat:54.4,lng:18.5,recommendationKind:'street'})
 q.stage({kind:'place',clientId:'place',linkId:id,note:'Personal note',isStarred:true})
 await assert.rejects(q.flush())
 let saved;const restored=new queue.GuideSaveQueue('area',async changes=>{saved=changes},storage);await restored.flush()
 assert.deepEqual(saved,[{kind:'place',clientId:'place',linkId:id,name:'Favourite corner',lat:54.4,lng:18.5,recommendationKind:'street',note:'Personal note',isStarred:true}])
 assert.equal(entries.size,0)
})
