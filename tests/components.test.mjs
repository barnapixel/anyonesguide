// DOM interaction tests exercise actual React components. jsdom cannot certify
// viewport geometry or native browser inertness; those remain browser checks.
import test,{before,after,afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import React,{act} from 'react'
let server,dom,root,createRoot,I18nProvider,Editor,PlaceSheet,ProfileIdentity,AddPlaces,PublicGuide,Home,Login,PageError,App,AuthProvider,GuestResponsePage,patchPlace,mapControls
const guide={id:'test',ownerId:'owner',city:'Warsaw',country:'Poland',slug:'warsaw',authorName:'Ada',title:'Warsaw',intro:'',guideNote:'',center:{lat:52,lng:21},categories:[{id:'eat',label:'Eat',icon:'x',sortOrder:0}],places:[{id:'one',name:'Venue',address:'Street',lat:52,lng:21,categoryId:'eat',note:'Long note '.repeat(500)}],visibility:'unlisted',isPublished:true,updatedAt:new Date().toISOString()}
const noOp=()=>{}
const editorProps={guide,onNavigate:noOp,onUpdatePlace:noOp,onUpdateGuideNote:noOp,onRemovePlace:noOp,onMovePlace:noOp,onReorderPlace:noOp,backPath:'/creator',previewPath:'/preview/test',publicPath:'/ada/warsaw',addPath:'/edit/test/add'}
const render=async element=>{await act(async()=>root.render(React.createElement(I18nProvider,null,element)))}
const click=async element=>{await act(async()=>{element.click()})}
before(async()=>{
 dom=new JSDOM('<button id="opener">Open</button><div id="root"><div id="app"></div></div>',{url:'http://localhost/'})
 for(const key of ['window','document','HTMLElement','HTMLDialogElement','Element','Event','KeyboardEvent','MutationObserver','localStorage'])globalThis[key]=dom.window[key]
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:dom.window.navigator});globalThis.IS_REACT_ACT_ENVIRONMENT=true
 window.scrollTo=()=>{}
 window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){}})
 window.HTMLElement.prototype.getClientRects=function(){return this.hidden?[]:[{width:100,height:40}]}
 window.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
 window.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
 ;({createRoot}=await import('react-dom/client'));root=createRoot(document.getElementById('app'))
 server=await createServer({envDir:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',plugins:[{
  name:'dom-test-configuration',enforce:'pre',
  resolveId(id){if(id==='virtual:dom-test-map')return '\0dom-test-map';if(id==='virtual:dom-test-config')return '\0'+id},
  load(id){if(id==='\0dom-test-map')return `export * from '/tests/helpers/maplibre.mjs';`;if(id==='\0virtual:dom-test-config')return `export const appConfig={cloudEnabled:false,geoapifyEnabled:false,geoapifyApiKey:'',supabaseUrl:'',supabasePublishableKey:'',privacyOperator:'',privacyEmail:''};`},
  transform(source,id){if(id.includes('/src/')&&(/\.(tsx|ts)$/.test(id)))return source.replaceAll(/(['"])maplibre-gl\1/g,"'virtual:dom-test-map'").replaceAll(/(['"])(?:\.\.\/|\.\/)config\1/g,"'virtual:dom-test-config'")},
 }]})
 ;({controls:mapControls}=await server.ssrLoadModule('/tests/helpers/maplibre.mjs'))
 ;({Home}=await server.ssrLoadModule('/src/components/Home.tsx'));({Login}=await server.ssrLoadModule('/src/components/Login.tsx'));({PageError}=await server.ssrLoadModule('/src/components/PageError.tsx'));({default:App}=await server.ssrLoadModule('/src/App.tsx'));({AuthProvider}=await server.ssrLoadModule('/src/hooks/useAuth.tsx'));;({I18nProvider}=await server.ssrLoadModule('/src/i18n.tsx'));({Editor}=await server.ssrLoadModule('/src/components/Editor.tsx'));({PlaceSheet}=await server.ssrLoadModule('/src/components/PlaceSheet.tsx'));({ProfileIdentity}=await server.ssrLoadModule('/src/components/ProfileIdentity.tsx'));({AddPlaces}=await server.ssrLoadModule('/src/components/AddPlaces.tsx'));({PublicGuide}=await server.ssrLoadModule('/src/components/PublicGuide.tsx'))
 ;({GuestResponsePage}=await server.ssrLoadModule('/src/components/GuestResponsePage.tsx'));({patchPlace}=await server.ssrLoadModule('/src/utils/guideEditing.ts'))
})
afterEach(async()=>{await act(async()=>root.render(null));localStorage.clear();mapControls.fail=false})
after(async()=>{await act(async()=>root.unmount());await server.close();dom.window.close()})
test('Editor waits for all saves before Preview and keeps the task open after failure',async()=>{
 let navigate=[],resolve;let pending=new Promise(r=>resolve=r)
 await render(React.createElement(Editor,{...editorProps,onNavigate:p=>navigate.push(p),onFlushGuideNote:()=>pending}))
 await click(document.querySelector('.editor-top-actions button'));assert.deepEqual(navigate,[]);await act(async()=>resolve());assert.deepEqual(navigate,['/preview/test'])
 await render(React.createElement(Editor,{...editorProps,onNavigate:p=>navigate.push(p),onFlushGuideNote:async()=>{throw Error('offline')},guideNoteSaveStatus:'error'}))
 await click(document.querySelector('.editor-top-actions button'));assert.deepEqual(navigate,['/preview/test']);assert.ok(document.querySelector('.save-feedback [role="alert"]'));assert.ok(document.querySelector('.save-feedback button'))
})
test('guest completion follows the one-place rule in the editor and public preview',async()=>{
 const empty={...guide,places:[]};localStorage.setItem('anyones-guide:language','pl')
 await render(React.createElement(Editor,{...editorProps,guide:empty,guestMode:true,shareLabel:'Gotowe'}));assert.ok(document.querySelector('.first-place-screen'));assert.equal(document.querySelector('.editor-top-actions'),null);assert.equal(document.querySelector('.first-place-save'),null)
 await render(React.createElement(PublicGuide,{guide:empty,userLocation:null,locationStatus:'idle',onRequestLocation:noOp,onNavigate:noOp,topActionPath:'/finish',topActionLabel:'Gotowe',finishAction:true,trackUsage:false}));assert.equal(document.querySelector('.finish-action').disabled,true);assert.equal(document.querySelector('.finish-action span').textContent,'Gotowe')
})
test('place detail moves focus, traps Tab, handles cancellation and restores its opener',async()=>{
 const opener=document.getElementById('opener');opener.focus()
 await render(React.createElement(PlaceSheet,{place:guide.places[0],userLocation:null,onClose:()=>root.render(null)}))
 const dialog=document.querySelector('dialog'),close=document.querySelector('.sheet-close'),maps=document.querySelector('dialog a');assert.equal(dialog.getAttribute('aria-labelledby'),'place-sheet-title');assert.equal(document.activeElement,close)
 maps.focus();await act(async()=>maps.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));assert.equal(document.activeElement,close)
 await act(async()=>dialog.dispatchEvent(new window.Event('cancel',{bubbles:true,cancelable:true})));assert.equal(document.querySelector('dialog'),null);assert.equal(document.activeElement,opener)
})
test('mandatory onboarding stays a page while optional profile settings use a labelled dialog',async()=>{
 const profile={id:'owner',displayName:'',slug:'calm-map-123',onboardingComplete:false}
 await render(React.createElement(ProfileIdentity,{profile,onSaved:noOp}));assert.equal(document.querySelector('dialog'),null);assert.ok(document.querySelector('.profile-onboarding-shell'))
 await render(React.createElement(ProfileIdentity,{profile:{...profile,onboardingComplete:true,displayName:'Ada'},dismissible:true,onSaved:noOp,onClose:noOp}));assert.equal(document.querySelector('dialog').getAttribute('aria-labelledby'),'profile-title')
})
test('leaving AddPlaces waits for pending edits and failure leaves Retry available',async()=>{
 let navigated=false
 await render(React.createElement(AddPlaces,{guide,onNavigate:()=>{navigated=true},backPath:'/edit/test',onAddSearchResult:async()=>guide.places[0],onUpdatePlace:noOp,onFlush:async()=>{throw Error('offline')},saveStatus:'error'}))
 await click(document.querySelector('.add-topbar button'));assert.equal(navigated,false);assert.ok(document.querySelector('.save-feedback button'));assert.ok(document.querySelector('input[aria-label]'))
})

test('Home request action and text-only Add place retain their navigation',async()=>{
 let routes=[]
 await render(React.createElement(Home,{onNavigate:p=>routes.push(p),signedIn:false}))
 await click(document.querySelector('.home-entry.request'));assert.deepEqual(routes,['/ask'])
 await render(React.createElement(Editor,{...editorProps,onNavigate:p=>routes.push(p)}))
 const add=document.querySelector('.floating-add');assert.equal(add.querySelector('svg'),null);assert.equal(add.textContent.trim(),'Add place')
 await click(add);assert.deepEqual(routes,['/ask','/edit/test/add?return=guide'])
})
test('email field remains labelled and submits a trimmed address',async()=>{
 let received=[]
 await render(React.createElement(Login,{onBack:noOp,onGoogle:async()=>{},onMagicLink:async email=>received.push(email)}))
 const input=document.querySelector('#sign-in-email');assert.equal(document.querySelector('label').htmlFor,input.id);assert.equal(document.querySelector('.auth-email svg'),null)
 await act(async()=>{
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,' ada@example.com ')
  input.dispatchEvent(new window.Event('input',{bubbles:true}))
 })
 await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))
 assert.deepEqual(received,['ada@example.com']);assert.ok(document.querySelector('[role="status"]'))
})
test('full-page errors offer just a working Home action in EN and PL',async()=>{
 let routes=[]
 for(const [lang,label] of [['en','Go to home'],['pl','Wróć na stronę główną']]){
  await act(async()=>root.render(null));localStorage.setItem('anyones-guide:locale',lang)
  await render(React.createElement(PageError,{onNavigate:p=>routes.push(p)}))
  assert.equal(document.querySelectorAll('main button').length,1);assert.equal(document.querySelector('main button').textContent,label)
  await click(document.querySelector('main button'))
 }
 assert.deepEqual(routes,['/','/'])
 await render(React.createElement(PageError,{}));assert.equal(document.querySelector('main a').getAttribute('href'),'/');assert.equal(document.querySelector('main button'),null)
})
test('the actual Saved Guides route opens without cloud credentials and removes a local shortcut',async()=>{
 const savedKey='anyones-guide:saved-guides:v1'
 localStorage.setItem(savedKey,JSON.stringify([{guideId:'saved-one',profileSlug:'ada',guideSlug:'warsaw',city:'Warsaw',country:'Poland',authorName:'Ada',placeCount:1,intro:'',savedAt:new Date().toISOString()}]))
 window.history.replaceState({},'','/saved')
 await render(React.createElement(AuthProvider,null,React.createElement(App)))
 // Route chunks resolve asynchronously in Vite's actual SSR module runner.
 for(let i=0;i<20&&!document.querySelector('.saved-guide-main');i++)await act(async()=>{await new Promise(r=>setTimeout(r,20))})
 assert.ok(document.querySelector('.saved-shell'));assert.match(document.querySelector('.saved-guide-main').textContent,/Warsaw/)
 await click(document.querySelector('.saved-guide-remove'));assert.equal(document.querySelector('.saved-guide-main'),null);assert.ok(document.querySelector('.saved-empty'));assert.deepEqual(JSON.parse(localStorage.getItem(savedKey)),[])
 window.history.replaceState({},'','/')
})

test('Editor stars move a recommendation to the top and retain keyboard focus when toggled',async()=>{
 const places=[{...guide.places[0],id:'first',name:'First',sortOrder:0},{...guide.places[0],id:'pick',name:'Pick',sortOrder:1}]
 function Harness(){const [current,setCurrent]=React.useState({...guide,places});return React.createElement(Editor,{...editorProps,guide:current,onUpdatePlace:(id,patch)=>setCurrent(g=>patchPlace(g,id,patch))})}
 await render(React.createElement(Harness))
 const star=document.querySelector('[data-place-id="pick"] .author-star-button')
 star.focus();await click(star)
 assert.deepEqual([...document.querySelectorAll('.editor-row')].map(row=>row.dataset.placeId),['pick','first'])
 assert.equal(star.getAttribute('aria-pressed'),'true');assert.equal(document.activeElement,star)
 await click(star)
 assert.deepEqual([...document.querySelectorAll('.editor-row')].map(row=>row.dataset.placeId),['first','pick'])
 assert.equal(star.getAttribute('aria-pressed'),'false');assert.equal(document.activeElement,star)
})
test('readers see an author pick first, a single legend and the same meaning in place details',async()=>{
 const places=[{...guide.places[0],name:'Ordinary',note:'',sortOrder:0},{...guide.places[0],id:'pick',name:'Pick',note:'My own note — untouched.',sortOrder:1,isStarred:true}]
 const props={guide:{...guide,places},userLocation:null,locationStatus:'idle',onRequestLocation:noOp,onNavigate:noOp,trackUsage:false}
 await render(React.createElement(PublicGuide,props))
 assert.equal(document.querySelectorAll('.author-picks-key').length,1)
 assert.equal(document.querySelector('.author-picks-key .copy-emote').getAttribute('aria-hidden'),'true')
 assert.equal(document.querySelector('.place-title').textContent,'Pick')
 await click(document.querySelector('.place-row'))
 assert.equal(document.querySelector('.sheet-author-pick').textContent,'One of the author’s top picks')
 assert.equal(document.querySelector('.sheet-note').textContent,'“'+places[1].note+'”')
 await render(React.createElement(PublicGuide,{...props,guide:{...guide,id:'different',places:[places[0]]}}))
 assert.equal(document.querySelector('.author-picks-key'),null)
})
test('guided adding teaches one task, offers optional stars and waits for saving before Preview or Finish',async()=>{
 let routes=[],release;const pending=new Promise(r=>release=r)
 function Harness(){const [current,setCurrent]=React.useState({...guide,places:[]});return React.createElement(AddPlaces,{guide:current,guidedStart:true,previewPath:'/preview/test',finishPath:'/finish',backPath:'/edit/test',onNavigate:p=>routes.push(p),onFlush:()=>pending,onUpdatePlace:(id,patch)=>setCurrent(g=>patchPlace(g,id,patch)),onAddSearchResult:async result=>{const p={...guide.places[0],id:result.id,name:result.name,note:'',isStarred:false};setCurrent(g=>({...g,places:[...g.places,p]}));return p}})}
 await render(React.createElement(Harness))
 assert.match(document.querySelector('.creation-hint').textContent,/Start with a place/)
 assert.equal(document.querySelector('.search-hint'),null)
 const input=document.querySelector('.search-box input')
 await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'mandu');input.dispatchEvent(new window.Event('input',{bubbles:true}))})
 for(let i=0;i<50&&!document.querySelector('.search-results button');i++)await act(async()=>{await new Promise(r=>setTimeout(r,20))})
 assert.ok(document.querySelector('.search-results button'))
 await click(document.querySelector('.search-results button'))
 assert.match(document.querySelector('.creation-hint').textContent,/One place is enough/)
 assert.ok(document.querySelector('.recent-title-row .author-star-button'))
 await click(document.querySelector('.recent-title-row .author-star-button'))
 assert.equal(document.querySelector('.recent-title-row button').getAttribute('aria-pressed'),'true')
 await click(document.querySelector('.creation-actions .secondary-button'));assert.deepEqual(routes,[])
 await act(async()=>release());assert.deepEqual(routes,['/preview/test'])
 await click(document.querySelector('.creation-actions .primary-button'));assert.deepEqual(routes,['/preview/test','/finish'])
 await render(React.createElement(AddPlaces,{guide,onNavigate:noOp,backPath:'/edit/test',onAddSearchResult:async()=>guide.places[0],onUpdatePlace:noOp}))
 assert.equal(document.querySelector('.creation-hint'),null);assert.ok(document.querySelector('.search-hint'))
})
test('a guest pick is stored immediately and reaches the real preview and one-place completion action',async()=>{
 const id=crypto.randomUUID(),key=crypto.randomUUID(),path='/respond/'+id
 localStorage.setItem('anyones-guide:request-draft:'+id,JSON.stringify({id,key,requesterName:'Ada',requestedCity:'Warsaw',guide:{...guide,id,places:[{...guide.places[0],note:'Personal words'}]}}))
 const routes=[],props={draftId:id,mode:'edit',onNavigate:p=>routes.push(p),userLocation:null,locationStatus:'idle',onRequestLocation:noOp}
 await render(React.createElement(GuestResponsePage,props))
 await click(document.querySelector('.author-star-button'))
 assert.equal(JSON.parse(localStorage.getItem('anyones-guide:request-draft:'+id)).guide.places[0].isStarred,true)
 await click(document.querySelector('.editor-top-actions button'));assert.deepEqual(routes,[path+'/preview'])
 await render(React.createElement(GuestResponsePage,{...props,mode:'preview'}))
 assert.ok(document.querySelector('.author-pick-icon'));assert.equal(document.querySelector('.finish-action').disabled,false)
 await click(document.querySelector('.finish-action'));assert.deepEqual(routes,[path+'/preview',path+'/finish'])
})


const readerProps = current => ({guide:current,userLocation:{lat:52,lng:21},locationStatus:'ready',onRequestLocation:noOp,onNavigate:noOp,trackUsage:false})
const waitForMap = async () => {
 for(let i=0;i<30&&!document.querySelector('.map-canvas canvas');i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10))})
 assert.ok(document.querySelector('.map-canvas canvas'))
}
test('reader preview reuses its map and preserves categories, expanded note, focus and reading position on return',async()=>{
 const current={...guide,guideNote:'Exact author words.',categories:[...guide.categories,{id:'coffee',label:'Coffee',sortOrder:1}],places:[...guide.places,{...guide.places[0],id:'two',categoryId:'coffee'}]}
 await render(React.createElement(PublicGuide,readerProps(current)));await waitForMap()
 const map=mapControls.instances.at(-1),count=mapControls.instances.length
 assert.equal(document.querySelector('.guide-hero h1').nextElementSibling.className,'guide-note-card')
 assert.equal(document.querySelector('.guide-map-section').nextElementSibling.className,'guide-filters')
 assert.equal(document.querySelector('.mode-switch'),null);assert.equal(map.dragPan.active,false)
 assert.equal(document.querySelector('.place-count'),null)
 assert.ok(map.calls.some(([kind])=>kind==='fit'))
 assert.ok(map.calls.filter(([kind])=>kind==='fit').every(([,options])=>options.padding===undefined))
 assert.ok([...document.querySelectorAll('.map-pin')].every(button=>button.disabled&&button.tabIndex===-1))
 await click(document.querySelector('.guide-note-card summary'))
 await click(document.querySelectorAll('.guide-filters .chip')[2]);assert.equal(document.querySelectorAll('.place-row').length,1)
 const opener=document.querySelector('.map-preview-open');opener.focus()
 const scrolls=[];window.scrollTo=options=>scrolls.push(options.top);Object.defineProperty(window,'scrollY',{configurable:true,value:345})
 await click(opener)
 assert.equal(mapControls.instances.length,count);assert.equal(map.dragPan.active,true)
 assert.equal(document.querySelector('.map-toolbar .chip.active').textContent,'Coffee')
 assert.ok(document.querySelector('.map-back'));assert.equal(document.querySelector('.guide-list').hidden,true)
 await click(document.querySelector('.map-pin'))
 await act(async()=>document.querySelector('dialog').dispatchEvent(new window.Event('cancel',{cancelable:true})))
 assert.ok(document.querySelector('.map-back'))
 await act(async()=>window.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape'})))
 assert.equal(document.querySelector('.map-back'),null);assert.equal(mapControls.instances.length,count);assert.equal(map.dragPan.active,false)
 assert.equal(document.querySelector('.guide-note-card').open,true);assert.equal(document.querySelector('.guide-filters .chip.active').textContent,'Coffee')
 assert.equal(document.activeElement,document.querySelector('.map-preview-open'));assert.equal(scrolls.at(-1),345)
 window.scrollTo=noOp
})
test('the reader map shortcut appears only after the preview leaves above the viewport',async()=>{
 await render(React.createElement(PublicGuide,readerProps(guide)));await waitForMap()
 const preview=document.querySelector('.guide-map-section')
 preview.getBoundingClientRect=()=>({bottom:900});await act(async()=>window.dispatchEvent(new window.Event('scroll')))
 assert.equal(document.querySelector('.map-shortcut'),null)
 preview.getBoundingClientRect=()=>({bottom:20});await act(async()=>window.dispatchEvent(new window.Event('scroll')))
 assert.equal(document.querySelector('.map-shortcut'),null)
 preview.getBoundingClientRect=()=>({bottom:-1});await act(async()=>window.dispatchEvent(new window.Event('scroll')))
 assert.ok(document.querySelector('.map-shortcut'));await click(document.querySelector('.map-shortcut'));assert.ok(document.querySelector('.map-back'))
})
test('unsupported WebGL leaves the guide readable and the map closable in EN and PL',async()=>{
 mapControls.fail=true
 for(const locale of ['en','pl']) {
  await act(async()=>root.render(null));localStorage.setItem('anyones-guide:locale',locale)
  await render(React.createElement(PublicGuide,readerProps(guide)))
  for(let i=0;i<30&&!document.querySelector('.map-error');i++)await act(async()=>{await new Promise(resolve=>setTimeout(resolve,10))})
  assert.ok(document.querySelector('.map-error'));assert.ok(document.querySelector('.place-row'))
  assert.equal(document.querySelector('.map-preview-cue').textContent.trim(),locale==='en'?'Explore map':'Zobacz na mapie')
  await click(document.querySelector('.map-preview-open'));await click(document.querySelector('.map-back'));assert.equal(document.querySelector('.guide-list').hidden,false)
 }
})
