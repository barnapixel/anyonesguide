// Actual React flows; only auth, API, configuration and destination search are
// replaced. No live account, deployment or browser geometry is asserted.
import test,{before,after,afterEach} from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import React,{act} from 'react'
let dom,server,root,I18nProvider,AskForGuide,RequestInvitation,FinishRequestPage,createGuestDraft,saveGuestDraft,findInvitationDraft,loadGuestDraft
const destination={id:'warsaw',city:'Warsaw',country:'Poland',lat:52,lng:21}
const categories=[{id:'eat',label:'Eat',icon:'x',sortOrder:0}]
const fixtures=()=>({auth:{user:null,loading:false,signInWithGoogle:async()=>{},sendMagicLink:async()=>{}},profile:{id:'owner',displayName:'Boris',onboardingComplete:true},createCalls:[],readCalls:[],records:new Map(),shares:[],routes:[],prepareCalls:[],claimCalls:[],guide:null})
const render=async element=>act(async()=>root.render(React.createElement(I18nProvider,null,element)))
const click=async node=>act(async()=>node.click())
const change=async(input,value)=>act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,value);input.dispatchEvent(new window.Event('input',{bubbles:true}))})
const shareLink=payload=>payload.text.split('\n').at(-1)
const props=()=>({onNavigate:path=>globalThis.__invite.routes.push(path)})
before(async()=>{
 dom=new JSDOM('<div id="app"></div>',{url:'https://guides.example/'})
 for(const key of ['window','document','HTMLElement','Element','Event','MutationObserver','localStorage'])globalThis[key]=dom.window[key]
 globalThis.IS_REACT_ACT_ENVIRONMENT=true
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{userAgent:'jsdom',language:'en-GB',share:async payload=>globalThis.__invite.shares.push(payload)}})
 const {createRoot}=await import('react-dom/client');root=createRoot(document.getElementById('app'))
 server=await createServer({envDir:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',plugins:[{
  name:'invitation-boundaries',enforce:'pre',resolveId(id){if(id.startsWith('virtual:invite-'))return '\0'+id},
  load(id){
   if(id==='\0virtual:invite-auth')return `export const useAuth=()=>globalThis.__invite.auth;`
   if(id==='\0virtual:invite-config')return `export const appConfig={cloudEnabled:true,geoapifyEnabled:true};`
   if(id==='\0virtual:invite-search')return `export function useSearch(query){return {results:query.length>=2?[${JSON.stringify(destination)}]:[],loading:false,failed:false}};`
   if(id==='\0virtual:invite-guides')return `export async function getMyProfile(){return globalThis.__invite.profile};export async function getGuideById(){return globalThis.__invite.guide};`
   if(id==='\0virtual:invite-repository')return `
    export async function createInvitation(key,name,city,locale){const f=globalThis.__invite;f.createCalls.push({key,name,city,locale});if(f.createFailure){f.createFailure=false;throw Error('offline')};if(!f.records.has(key))f.records.set(key,{id:crypto.randomUUID(),shortCode:crypto.randomUUID().replaceAll('-','').slice(0,12),name:f.auth.user?f.profile.displayName:name.trim(),city:city.trim(),locale});return f.records.get(key)}
    export async function readStoredInvitation(id){const f=globalThis.__invite;f.readCalls.push(id);if(f.readFailure)throw Error('offline');return (f.stored?.id===id || f.stored?.shortCode===id)?f.stored:null}
    export async function prepareGuestDraft(draft){globalThis.__invite.prepareCalls.push(draft)}
    export async function claimGuestDraft(id,key){globalThis.__invite.claimCalls.push({id,key});return globalThis.__invite.guide.id}
    export async function recoverGuestDraft(){return {draft:globalThis.__invite.recovered,guideId:null}}
   `
  },
  transform(source,id){if(!['AskForGuide','RequestInvitation','FinishRequestPage','DestinationPicker'].some(name=>id.endsWith('/src/components/'+name+'.tsx')))return;return source
   .replaceAll("'../hooks/useAuth'","'virtual:invite-auth'")
   .replaceAll("'../config'","'virtual:invite-config'")
   .replaceAll("'../hooks/useSearch'","'virtual:invite-search'")
   .replaceAll("'../services/guideRepository'","'virtual:invite-guides'")
   .replaceAll("'../services/requestRepository'","'virtual:invite-repository'")},
 }]})
 ;({I18nProvider}=await server.ssrLoadModule('/src/i18n.tsx'));({AskForGuide}=await server.ssrLoadModule('/src/components/AskForGuide.tsx'));({RequestInvitation}=await server.ssrLoadModule('/src/components/RequestInvitation.tsx'));({FinishRequestPage}=await server.ssrLoadModule('/src/components/FinishRequestPage.tsx'))
 ;({createGuestDraft,saveGuestDraft,findInvitationDraft,loadGuestDraft}=await server.ssrLoadModule('/src/services/guestDrafts.ts'))
})
afterEach(async()=>{await act(async()=>root.render(null));localStorage.clear();globalThis.__invite=fixtures()})
after(async()=>{await act(async()=>root.unmount());await server.close();dom.window.close();delete globalThis.__invite})

test('anonymous sharing retries one creation key, reuses the link after cancellation and preview, and changes identity with form details',async()=>{
 const f=globalThis.__invite=fixtures();f.createFailure=true
 await render(React.createElement(AskForGuide,props()))
 assert.equal(document.querySelector('#request-name').required,false)
 await change(document.querySelector('#request-city'),'Warsaw')
 await click(document.querySelector('button[type="submit"]'))
 assert.ok(document.querySelector('[role="alert"]'));assert.equal(f.shares.length,0)
 await click(document.querySelector('button[type="submit"]'))
 assert.equal(f.createCalls.length,2);assert.equal(f.createCalls[0].key,f.createCalls[1].key)
 assert.match(shareLink(f.shares[0]),/\/request\/[A-Za-z0-9_-]{12}$/);assert.equal(new URL(shareLink(f.shares[0])).search,'')
 assert.match(f.shares[0].text,/^Hey! Got any favourite spots in Warsaw\?/)
 const original=shareLink(f.shares[0])
 navigator.share=async()=>{throw new DOMException('Cancelled','AbortError')}
 await click(document.querySelector('button[type="submit"]'));assert.equal(f.createCalls.length,2)
 await click(document.querySelector('.request-form .text-button'));assert.equal('https://guides.example'+f.routes[0],original)
 navigator.share=async payload=>globalThis.__invite.shares.push(payload)
 await change(document.querySelector('#request-city'),'Paris')
 await click(document.querySelector('button[type="submit"]'))
 assert.equal(f.createCalls.length,3);assert.notEqual(f.createCalls[2].key,f.createCalls[1].key);assert.notEqual(shareLink(f.shares[1]),original)
})

test('signed-in asking shows the approved name and uses the authoritative creation response',async()=>{
 const f=globalThis.__invite=fixtures();f.auth.user={id:'owner'}
 localStorage.setItem('anyones-guide:locale','pl')
 await render(React.createElement(AskForGuide,props()))
 assert.equal(document.querySelector('#request-name').value,'Boris');assert.equal(document.querySelector('#request-name').readOnly,true)
 await click(document.querySelector('button[type="submit"]'))
 assert.equal(document.querySelector('.request-share-preview').textContent,'Boris prosi o Twoje rekomendacje');assert.match(f.shares[0].text,/\n\nBoris\n\n/)
 assert.equal(f.createCalls[0].locale,'pl');assert.equal(new URL(shareLink(f.shares[0])).search,'')
})

test('stored invitations ignore URL overrides, resume only their own draft and retain later language changes',async()=>{
 const f=globalThis.__invite=fixtures(),id=crypto.randomUUID()
 f.stored={id,name:'Boris',city:'Warsaw',locale:'pl'}
 const previous=createGuestDraft(destination,'Boris','Warsaw',categories,crypto.randomUUID());saveGuestDraft(previous)
 await render(React.createElement(RequestInvitation,{...props(),invitationId:id,search:'?name=Wrong&city=Paris&lang=en'}))
 assert.equal(document.querySelector('h1').textContent,'Boris prosi o Twoje rekomendacje')
 assert.equal(document.querySelector('.request-city-hint').textContent,'Kierunek: Warsaw')
 assert.equal(document.querySelector('.request-resume'),null)
 await click(document.querySelector('.destination-results button'))
 const draftId=f.routes[0].match(/\/respond\/([^/]+)/)[1]
 const current=loadGuestDraft(draftId);assert.equal(current.invitationId,id);assert.notEqual(current.id,previous.id)
 await render(React.createElement(RequestInvitation,{...props(),invitationId:id,search:''}))
 assert.ok(document.querySelector('.request-resume'))
 await click([...document.querySelectorAll('.language-toggle button')].find(button=>button.textContent==='EN'))
 assert.equal(document.querySelector('h1').textContent,'Boris is asking for your recommendations')
 assert.equal(findInvitationDraft('Boris','Warsaw',undefined,id).id,current.id)
})

test('legacy invitations still start and resume their historical drafts; missing stored invitations have Home only',async()=>{
 const f=globalThis.__invite=fixtures()
 const legacy=createGuestDraft(destination,'Boris','Warsaw',categories);saveGuestDraft(legacy)
 await render(React.createElement(RequestInvitation,{...props(),search:'?name=Boris&city=Warsaw&lang=pl'}))
 assert.equal(document.querySelector('h1').textContent,'Boris prosi o Twoje rekomendacje');assert.ok(document.querySelector('.request-resume'))
 await click(document.querySelector('.request-resume button'));assert.equal(f.routes[0],'/respond/'+legacy.id)
 await render(React.createElement(RequestInvitation,{...props(),invitationId:crypto.randomUUID(),search:'?name=Forged'}))
 assert.equal(document.querySelectorAll('main button').length,1)
 await click(document.querySelector('main button'));assert.equal(f.routes.at(-1),'/')
 f.readFailure=true
 await render(React.createElement(RequestInvitation,{...props(),invitationId:crypto.randomUUID(),search:''}))
 assert.equal(document.querySelectorAll('main button').length,1);assert.match(document.querySelector('h1').textContent,/Nie udało się otworzyć/)
})

test('anonymous invitation response keeps its context through magic-link preparation without putting a fake name in the return URL',async()=>{
 const f=globalThis.__invite=fixtures(),draft=createGuestDraft(destination,'a friend','Warsaw',categories,crypto.randomUUID(),true)
 draft.guide.places=[{id:'p',name:'Café',address:'Street',categoryId:'eat',note:'My note',lat:52,lng:21}];saveGuestDraft(draft)
 let returnPath;f.auth.sendMagicLink=async(email,path)=>{returnPath=path}
 localStorage.setItem('anyones-guide:locale','pl')
 await render(React.createElement(FinishRequestPage,{...props(),draftId:draft.id,search:''}))
 assert.equal(document.querySelector('h1').textContent,'Zachowaj przewodnik i udostępnij go znajomemu.')
 await change(document.querySelector('#sign-in-email'),'author@example.com')
 await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})))
 const params=new URL(returnPath,'https://guides.example').searchParams
 assert.equal(params.get('anonymous'),'1');assert.equal(params.has('name'),false);assert.equal(params.get('lang'),'pl')
 assert.equal(f.prepareCalls[0].invitationId,draft.invitationId);assert.equal(f.prepareCalls[0].requesterAnonymous,true)
})

test('publishing an anonymous response clears only that draft, shares the public guide and keeps anonymous copy after publication',async()=>{
 const f=globalThis.__invite=fixtures();f.auth.user={id:'owner'}
 const draft=createGuestDraft(destination,'a friend','Warsaw',categories,crypto.randomUUID(),true)
 draft.guide.places=[{id:'p',name:'Café',address:'Street',categoryId:'eat',note:'My own words',lat:52,lng:21,isStarred:true}];saveGuestDraft(draft)
 f.guide={...draft.guide,id:'saved-guide',ownerId:'owner',profileSlug:'boris',slug:'warsaw',authorName:'Boris',visibility:'unlisted'}
 await render(React.createElement(FinishRequestPage,{...props(),draftId:draft.id,search:''}))
 await click(document.querySelector('.request-card .primary-button'))
 assert.equal(loadGuestDraft(draft.id),null);assert.equal(f.claimCalls[0].key,draft.key)
 const path=new URL(f.routes[0],'https://guides.example');assert.equal(path.searchParams.get('anonymous'),'1');assert.equal(path.searchParams.has('name'),false)
 await render(React.createElement(FinishRequestPage,{...props(),search:path.search}))
 await click(document.querySelector('.request-card .primary-button'))
 assert.equal(f.shares[0].text,'Here are my favourite spots in Warsaw. Enjoy!\n\nhttps://guides.example/boris/warsaw?lang=en')
 assert.doesNotMatch(JSON.stringify(f.shares),new RegExp(draft.key+'|'+draft.invitationId))
})

test('an account change during creation discards the stale share response',async()=>{
 const f=globalThis.__invite=fixtures();let release
 f.auth.user={id:'owner'}
 await render(React.createElement(AskForGuide,props()))
 // Exercise the real generation guard by keeping the async API creation open.
 const pending=new Promise(resolve=>{release=resolve})
 const originalGet=f.records.get.bind(f.records)
 f.records.get=()=>pending
 await click(document.querySelector('button[type="submit"]'))
 await act(async()=>{await Promise.resolve();f.auth.user={id:'different-owner'};root.render(React.createElement(I18nProvider,null,React.createElement(AskForGuide,props())))})
 await act(async()=>release({id:crypto.randomUUID(),name:'Old account',city:'Warsaw',locale:'en'}))
 assert.equal(f.shares.length,0)
 f.records.get=originalGet
})


test('short and UUID links resume one draft and a short code never becomes a recovery key',async()=>{
 const f=globalThis.__invite=fixtures(),id=crypto.randomUUID(),shortCode='7Kp4nB9xQ2mR'
 f.stored={id,shortCode,name:'Boris',city:'Warsaw',locale:'en'}
 await render(React.createElement(RequestInvitation,{...props(),invitationId:shortCode,search:'?name=Forged&lang=pl'}))
 assert.equal(document.querySelector('h1').textContent,'Boris is asking for your recommendations')
 await click(document.querySelector('.destination-results button'))
 const draftId=f.routes[0].match(/\/respond\/([^/]+)/)[1],draft=loadGuestDraft(draftId)
 assert.equal(draft.invitationId,id);assert.notEqual(draft.key,shortCode)
 await render(React.createElement(RequestInvitation,{...props(),invitationId:id,search:''}))
 assert.ok(document.querySelector('.request-resume'))
 await click(document.querySelector('.request-resume button'))
 assert.equal(f.routes.at(-1),'/respond/'+draftId)
})
