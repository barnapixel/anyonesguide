import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import guidePreview, { config, renderGuidePreview, renderRequestPreview } from '../netlify/edge-functions/guide-preview.mjs'

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8')
const request = new Request('https://guides.example.com/boris/warsaw')

function setup(guideIsVisible = true) {
  globalThis.Netlify = { env: { get: name => ({
    VITE_SUPABASE_URL: 'https://database.example.com',
    VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test',
  })[name] } }
  const calls = []
  globalThis.fetch = async (input, init) => {
    const url = new URL(input)
    calls.push({ table: url.pathname.split('/').at(-1), query: url.searchParams, headers: init.headers })
    const rows = url.pathname.endsWith('/resolve_public_profile')
      ? { id: '123', display_name: 'Boris & Friends' }
      : url.pathname.endsWith('/guides') && guideIsVisible
        ? [{ city: 'Warsaw <3' }]
        : []
    return Response.json(rows)
  }
  let nextCalls = 0
  const context = { next: async () => {
    nextCalls++
    return new Response(html, { headers: { 'content-type': 'text/html', etag: 'old' } })
  } }
  return { calls, context, nextCalls: () => nextCalls }
}

test('link preview has escaped guide-specific metadata and only uses a public key', async () => {
  assert.equal(config.header, undefined)
  const { calls, context, nextCalls } = setup()
  const response = await guidePreview(request, context)
  const body = await response.text()
  assert.match(body, /<title>Boris &amp; Friends’s Guide to Warsaw &lt;3\. Anyone’s Guide<\/title>/)
  assert.match(body, /property="og:title" content="Boris &amp; Friends’s Guide to Warsaw &lt;3"/)
  assert.match(body, /property="og:description" content="Places in Warsaw &lt;3, recommended by Boris &amp; Friends\."/)
  assert.match(body, /property="og:url" content="https:\/\/guides.example.com\/boris\/warsaw"/)
  assert.match(body, /name="twitter:title" content="Boris &amp; Friends’s Guide to Warsaw &lt;3"/)
  assert.equal(response.headers.get('etag'), null)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal(nextCalls(), 1)
  assert.deepEqual(calls.map(call => call.table), ['resolve_public_profile', 'guides'])
  assert.equal(calls[1].query.get('visibility'), 'in.(unlisted,public)')
  assert.equal(calls[0].headers.apikey, 'sb_publishable_test')
  assert.equal(calls[0].headers.Authorization, undefined)
})

test('draft guides and non-guide paths get ordinary app HTML', async () => {
  const { context, nextCalls } = setup(false)
  assert.equal(await guidePreview(request, context), undefined)
  assert.equal(await guidePreview(new Request('https://guides.example.com/preview/private'), context), undefined)
  assert.equal(nextCalls(), 0)
})

test('an old profile handle resolves through its alias', async () => {
  const { context } = setup()
  const regularFetch = globalThis.fetch
  globalThis.fetch = async (input, init) => {
    const url = new URL(input)
    if (url.pathname.endsWith('/resolve_public_profile')) { assert.equal(JSON.parse(init.body).p_slug, 'boris'); return Response.json({ id: '123', display_name: 'Boris & Friends' }) }
    return regularFetch(input, init)
  }
  const response = await guidePreview(request, context)
  assert.match(await response.text(), /Boris &amp; Friends’s Guide to Warsaw &lt;3/)
})

test('request links have personalized, escaped previews without a database lookup', async () => {
  const { calls, context } = setup()
  const url = new URL('https://guides.example.com/request')
  url.search = new URLSearchParams({ name: 'Boris & <Friends>', city: 'Gdańsk', lang: 'en' }).toString()
  const response = await guidePreview(new Request(url), context)
  const body = await response.text()
  assert.match(body, /Boris &amp; &lt;Friends&gt; is asking for your recommendations/)
  assert.match(body, /Destination: Gdańsk/)
  assert.match(body, /Share a few places you love\. Every tip helps!/)
  assert.equal(calls.length, 0)
  const polish = await guidePreview(new Request('https://guides.example.com/request?name=Boris&lang=pl'), context)
  assert.match(await polish.text(), /Boris prosi o Twoje rekomendacje/)
})

test('private guest editor and auth recovery links do not receive public metadata', async () => {
  const { context, calls } = setup()
  assert.equal(await guidePreview(new Request('https://guides.example.com/respond/123'), context), undefined)
  assert.equal(await guidePreview(new Request('https://guides.example.com/finish-request?draft=123&key=private'), context), undefined)
  assert.equal(calls.length, 0)
})

test('Polish guide links use the same personal title and safely escaped author-written description',async()=>{
 const { context }=setup();const regularFetch=globalThis.fetch
 globalThis.fetch=async(input,init)=>new URL(input).pathname.endsWith('/guides')
  ? Response.json([{city:'Gdańsk',guide_note:'My words — keep them. <script> & "quoted"',intro:'Legacy intro'}])
  : regularFetch(input,init)
 const response=await guidePreview(new Request('https://guides.example.com/old-handle/gdansk?lang=pl'),context)
 const body=await response.text()
 assert.match(body,/content="Gdańsk\. Poleca Boris &amp; Friends"/)
 assert.match(body,/My words — keep them\. &lt;script&gt; &amp; &quot;quoted&quot;/)
 assert.doesNotMatch(body,/<script> &/)
 assert.match(body,/old-handle\/gdansk\?lang=pl/)
})

test('crawler substitutions treat dollar replacement sequences in author writing as literal text',()=>{
 const note="My tip: $& $' $` <script>"
 const preview=renderGuidePreview(html,{author:'Ada $&',city:'Warsaw',note,url:'https://guides.example/ada/warsaw'})
 assert.ok(preview.includes('content="My tip: $&amp; $&#39; $` &lt;script&gt;"'))
 assert.ok(preview.includes('<title>Ada $&amp;’s Guide to Warsaw. Anyone’s Guide</title>'))
 const request=renderRequestPreview(html,{name:'Ada $&',city:'Warsaw',locale:'en',url:'https://guides.example/request'})
 assert.ok(request.includes('<title>Ada $&amp; is asking for your recommendations. Anyone’s Guide</title>'))
})

test('stored invitation previews use record identity and language, escape text and discard spoofed query fields',async()=>{
 const {context}=setup(),id=crypto.randomUUID();let calls=[]
 globalThis.fetch=async(input,init)=>{calls.push({url:new URL(input),init});return Response.json({id,name:'Boris & <Friends>',city:'Warsaw <3',locale:'pl'})}
 const response=await guidePreview(new Request(`https://guides.example.com/request/${id}?name=Forged&lang=en&city=Wrong`),context)
 const body=await response.text()
 assert.match(body,/Boris &amp; &lt;Friends&gt; prosi o Twoje rekomendacje/)
 assert.match(body,/Kierunek: Warsaw &lt;3/)
 assert.doesNotMatch(body,/Forged|Wrong|requester_id|creation_key/)
 assert.ok(body.includes(`content="https://guides.example.com/request/${id}"`))
 assert.equal(calls.length,1);assert.equal(calls[0].url.pathname,'/rest/v1/rpc/read_guide_invitation')
 assert.deepEqual(JSON.parse(calls[0].init.body),{p_id:id})
 assert.equal(calls[0].init.headers.apikey,'sb_publishable_test');assert.equal(calls[0].init.headers.Authorization,undefined)
 assert.equal(response.headers.get('cache-control'),'no-store')
})

test('anonymous stored invitation previews stay useful in both languages without implying an account identity',async()=>{
 const {context}=setup(),id=crypto.randomUUID()
 for(const [locale,title] of [['en','Share your recommendations'],['pl','Podziel się swoimi rekomendacjami']]){
  globalThis.fetch=async()=>Response.json({id,name:'',city:'Warsaw',locale})
  const response=await guidePreview(new Request(`https://guides.example.com/request/${id}`),context)
  assert.ok((await response.text()).includes(`<title>${title}. Anyone’s Guide</title>`))
 }
})

test('missing, failed and malformed invitation lookups fall back without leaking into guide profile resolution',async()=>{
 const {context,nextCalls}=setup(),id=crypto.randomUUID();let calls=0
 for(const response of [Response.json(null),Response.json({id,name:'N',city:'Warsaw',locale:'xx'}),new Response('',{status:503})]){
  globalThis.fetch=async()=>{calls++;return response}
  assert.equal(await guidePreview(new Request(`https://guides.example.com/request/${id}`),context),undefined)
 }
 assert.equal(await guidePreview(new Request('https://guides.example.com/request/not-an-id?name=Forged'),context),undefined)
 assert.equal(calls,3);assert.equal(nextCalls(),0)
})


test('short invitations have personal, localized image cards at the exact shared URL',async()=>{
 const {context}=setup(),id=crypto.randomUUID(),shortCode='7Kp4nB9xQ2mR'
 let lookup
 globalThis.fetch=async(input,init)=>{lookup={url:new URL(input),payload:JSON.parse(init.body)};return Response.json({id,shortCode,name:'Boris',city:'Kraków',locale:'pl'})}
 for(const agent of ['WhatsApp/2.0','facebookexternalhit/1.1','Unknown future messenger','Mozilla/5.0']) {
  const response=await guidePreview(new Request(`https://guides.example.com/request/${shortCode}?name=Wrong&lang=en`,{headers:{'user-agent':agent}}),context)
  const body=await response.text()
  assert.match(body,/<html lang="pl"/)
  assert.match(body,/Boris prosi o Twoje rekomendacje/)
  assert.ok(body.includes(`property="og:url" content="https://guides.example.com/request/${shortCode}"`))
  assert.ok(body.includes('property="og:image" content="https://guides.example.com/social/request-pl-v083.png"'))
  assert.match(body,/property="og:image:width" content="1200"/)
  assert.match(body,/property="og:image:height" content="630"/)
  assert.match(body,/property="og:locale" content="pl_PL"/)
  assert.match(body,/name="twitter:card" content="summary_large_image"/)
  assert.doesNotMatch(body,/Wrong|creation_key|requester_id/)
  assert.equal(lookup.url.pathname,'/rest/v1/rpc/read_guide_invitation_by_code')
  assert.deepEqual(lookup.payload,{p_code:shortCode})
 }
})

test('short preview lookups reject mismatched codes and malformed UUIDs without fallback profile reads',async()=>{
 const {context,nextCalls}=setup(),shortCode='7Kp4nB9xQ2mR'
 for(const result of [{id:crypto.randomUUID(),shortCode:'WrongCode123',name:'B',city:'W',locale:'en'},{id:'not-a-uuid',shortCode,name:'B',city:'W',locale:'en'},null]) {
  globalThis.fetch=async()=>Response.json(result)
  assert.equal(await guidePreview(new Request('https://guides.example.com/request/'+shortCode),context),undefined)
 }
 assert.equal(nextCalls(),0)
})

test('guide and homepage cards include absolute raster images without exposing private routes',async()=>{
 const {context}=setup()
 const guide=await guidePreview(new Request('https://guides.example.com/boris/warsaw?lang=pl'),context)
 assert.match(await guide.text(),/https:\/\/guides.example.com\/social\/guide-pl-v083.png/)
 const home=await guidePreview(new Request('https://guides.example.com/'),context)
 assert.match(await home.text(),/https:\/\/guides.example.com\/social\/guide-en-v083.png/)
 assert.equal(await guidePreview(new Request('https://guides.example.com/respond/private'),context),undefined)
 const notHtml={next:async()=>new Response('asset',{headers:{'content-type':'image/png'}})}
 assert.equal(await (await guidePreview(new Request('https://guides.example.com/'),notHtml)).text(),'asset')
})
