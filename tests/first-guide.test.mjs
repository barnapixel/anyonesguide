// Actual creator component with a completed profile and mocked service boundary.
// No provider login, API request or live account is used.
import test from 'node:test'
import assert from 'node:assert/strict'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import React,{act} from 'react'

test('creating a city guide opens the familiar empty editor, while existing guides still open the editor',async()=>{
 const dom=new JSDOM('<div id="app"></div>',{url:'http://localhost/'})
 for(const key of ['window','document','HTMLElement','Element','Event','MutationObserver','localStorage'])globalThis[key]=dom.window[key]
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:dom.window.navigator});globalThis.IS_REACT_ACT_ENVIRONMENT=true
 const {createRoot}=await import('react-dom/client'),root=createRoot(document.getElementById('app'))
 const server=await createServer({envDir:false,server:{middlewareMode:true,hmr:false,ws:false},appType:'custom',plugins:[{
  name:'first-guide-service-fixtures',enforce:'pre',
  resolveId(id){if(id.startsWith('virtual:guide-fixture-'))return '\0'+id},
  load(id){
   if(id==='\0virtual:guide-fixture-repository')return `export async function getMyProfile(){return {id:'owner',displayName:'Ada',slug:'ada',onboardingComplete:true}};export async function listMyGuides(){return [{id:'old',city:'Paris',country:'France',slug:'paris',visibility:'unlisted',placeCount:2}]};export async function createGuide(){return {id:'new',city:'Gdańsk'}};`
   if(id==='\0virtual:guide-fixture-config')return `export const appConfig={geoapifyEnabled:true};`
   if(id==='\0virtual:guide-fixture-search')return `export function useSearch(query,enabled){return {results:enabled&&query.length>=2?[{id:'gdansk',city:'Gdańsk',country:'Poland',lat:54,lng:18}]:[],loading:false,failed:false}};`
  },
  transform(source,id){if(!id.endsWith('/src/components/CloudCreatorHome.tsx'))return;return source
   .replace("'../services/guideRepository'","'virtual:guide-fixture-repository'")
   .replace("'../config'","'virtual:guide-fixture-config'")
   .replace("'../hooks/useSearch'","'virtual:guide-fixture-search'")},
 }]})
 try{
  const {I18nProvider}=await server.ssrLoadModule('/src/i18n.tsx')
  const {CloudCreatorHome}=await server.ssrLoadModule('/src/components/CloudCreatorHome.tsx')
  const routes=[]
  await act(async()=>root.render(React.createElement(I18nProvider,null,React.createElement(CloudCreatorHome,{userId:'owner',onNavigate:p=>routes.push(p),onSignOut:async()=>{}}))))
  assert.ok(document.querySelector('.guide-card-main'));assert.equal(document.querySelector('.creator-request-entry'),null)
  await act(async()=>document.querySelector('.guide-card-main').click());assert.deepEqual(routes,['/edit/old'])
  await act(async()=>document.querySelector('.creator-actions button').click())
  const input=document.querySelector('.search-box input')
  await act(async()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'gd');input.dispatchEvent(new window.Event('input',{bubbles:true}))})
  await act(async()=>document.querySelector('.destination-results button').click())
  assert.deepEqual(routes,['/edit/old','/edit/new'])
 }finally{await act(async()=>root.unmount());await server.close();dom.window.close()}
})
