import test, { before, beforeEach, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
const db=new PGlite(),a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',c='00000000-0000-4000-8000-000000000003'
let ga,gb
const q=(sql,args=[])=>db.query(sql,args)
async function role(name,uid,fn){await db.exec(`set role ${name}`);await q("select set_config('request.jwt.claim.sub',$1,false)",[uid??'']);try{return await fn()}finally{await db.exec('reset role');await q("select set_config('request.jwt.claim.sub','',false)")}}
const rpc=(name,...args)=>q(`select public.${name}(${args.map((_,i)=>'$'+(i+1)).join(',')}) as result`,args).then(r=>r.rows[0].result)
const poi=(id='poi',category='eat')=>({provider:'geoapify',externalId:id,name:'Café',address:'Warsaw',lat:52.23,lng:21.01,categoryId:category})
const draft=()=>({id:crypto.randomUUID(),key:crypto.randomUUID(),requesterName:'Ada',requestedCity:'Warsaw',guide:{city:'Warsaw',country:'Poland',guideNote:'Weekend',center:{lat:52.23,lng:21.01},places:[{...poi(),note:'Favourite'}]}})
let preserved=false, shortUpgradePreserved=false
before(async()=>{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;alter default privileges in schema public grant execute on functions to anon,authenticated;`)
 const files=(await readdir(new URL('../supabase/migrations/',import.meta.url))).filter(f=>f.endsWith('.sql')).sort()
 for(const file of files){
  if(file.startsWith('0007')){
   await q("insert into auth.users(id) values($1)",[a]);await q("update public.profiles set display_name='Approved',onboarding_completed=true where id=$1",[a])
   await q("insert into public.guides(owner_id,city,country,slug,intro,guide_note,center_lat,center_lng) values($1,'Legacy','Poland','legacy','Intro','Guide note',52,21)",[a]);const gid=(await q('select id from public.guides')).rows[0].id
   await q("insert into public.guide_categories values($1,'stay','Stay','x',5)",[gid]);await q("insert into public.places(provider,name,address,lat,lng) values('manual','Legacy Hotel','A',52,21)");await q("insert into public.guide_places(guide_id,place_id,category_key,note,sort_order) select $1,id,'stay','Keep',7 from public.places",[gid]);await q("insert into public.profile_aliases values('old-handle',$1,now())",[a])
   const old=(await q('select row_to_json(g) as g from public.guides g')).rows
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
   assert.deepEqual((await q('select row_to_json(g) as g from public.guides g')).rows,old);preserved=true
   assert.equal((await q("select note,sort_order from public.guide_places where category_key='stay'")).rows[0].note,'Keep')
  }else if(file.startsWith('0008')){
   const oldGuides=(await q('select row_to_json(g) as g from public.guides g')).rows
   const oldLinks=(await q('select row_to_json(l) as l from public.guide_places l')).rows
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
   assert.deepEqual((await q('select row_to_json(g) as g from public.guides g')).rows,oldGuides)
   assert.deepEqual((await q("select to_jsonb(l)-'is_starred' as l from public.guide_places l")).rows,oldLinks)
   assert.equal((await q('select is_starred from public.guide_places')).rows[0].is_starred,false)
  }else if(file.startsWith('0009')){
   const previous=await q("select jsonb_build_object('guides',(select jsonb_agg(to_jsonb(g)) from public.guides g),'links',(select jsonb_agg(to_jsonb(l)) from public.guide_places l),'profiles',(select jsonb_agg(to_jsonb(p)) from public.profiles p),'aliases',(select jsonb_agg(to_jsonb(a)) from public.profile_aliases a)) as data")
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
   assert.deepEqual(await q("select jsonb_build_object('guides',(select jsonb_agg(to_jsonb(g)) from public.guides g),'links',(select jsonb_agg(to_jsonb(l)) from public.guide_places l),'profiles',(select jsonb_agg(to_jsonb(p)) from public.profiles p),'aliases',(select jsonb_agg(to_jsonb(a)) from public.profile_aliases a)) as data"),previous)
  }else if(file.startsWith('0010')){
   const legacy=await rpc('create_guide_invitation',crypto.randomUUID(),'Legacy Friend','Gdańsk','pl')
   const beforeRows=(await q('select to_jsonb(i) as row from private.guide_invitations i order by id')).rows
   const beforeGuides=(await q('select to_jsonb(g) as row from public.guides g order by id')).rows
   await db.exec(await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8'))
   assert.deepEqual((await q("select to_jsonb(i)-'short_code' as row from private.guide_invitations i order by id")).rows,beforeRows)
   assert.deepEqual((await q('select to_jsonb(g) as row from public.guides g order by id')).rows,beforeGuides)
   const updated=await role('anon',null,()=>rpc('read_guide_invitation',legacy.id))
   assert.match(updated.shortCode,/^[A-Za-z0-9_-]{12}$/)
   assert.deepEqual({...updated,shortCode:undefined},{...legacy,shortCode:undefined})
   assert.deepEqual(await role('anon',null,()=>rpc('read_guide_invitation_by_code',updated.shortCode)),updated)
   shortUpgradePreserved=true
  }else await db.exec((await readFile(new URL('../supabase/migrations/'+file,import.meta.url),'utf8')).replace('create extension if not exists pgcrypto;',''))
 }
})
beforeEach(async()=>{
 await db.exec('truncate auth.users,public.places,public.app_events,public.feedback,private.write_windows,private.guide_invitations cascade')
 for(const id of [a,b,c]) await q('insert into auth.users(id,raw_user_meta_data) values($1,$2)',[id,{full_name:'Private OAuth Name'}])
 await q("update public.profiles set display_name='Author',onboarding_completed=true where id in ($1,$2)",[a,b]);ga=(await q("insert into public.guides(owner_id,city,country,slug,center_lat,center_lng) values($1,'Warsaw','Poland','warsaw',52,21) returning id",[a])).rows[0].id;gb=(await q("insert into public.guides(owner_id,city,country,slug,center_lat,center_lng) values($1,'Paris','France','paris',48,2) returning id",[b])).rows[0].id
})
after(()=>db.close())
test('additive upgrade preserves approved identities, notes, aliases and legacy Stay',async()=>{assert.ok(preserved)})
test('anonymous reads hide incomplete identity and alias resolution redacts its name',async()=>{
 const slug=(await q('select slug from public.profiles where id=$1',[c])).rows[0].slug
 await q("insert into public.profile_aliases values('legacy-alias',$1,now())",[c])
 await role('anon',null,async()=>{assert.equal((await q('select * from public.profiles where id=$1',[c])).rows.length,0);assert.equal((await rpc('resolve_public_profile','legacy-alias')).display_name,'A local');assert.equal((await rpc('resolve_public_profile',slug)).display_name,'A local')})
 await role('authenticated',c,async()=>{assert.equal((await q('select display_name from public.profiles where id=$1',[c])).rows[0].display_name,'');await assert.rejects(q("insert into public.guides(owner_id,city,country,slug,center_lat,center_lng) values($1,'X','Y','x',0,0)",[c]))})
})
test('visibility matrix protects Draft and hides removed POIs',async()=>{
 const added=await role('authenticated',a,()=>rpc('add_guide_place',ga,poi()))
 await role('anon',null,async()=>{assert.equal((await q('select id from public.places where id=$1',[added.place.id])).rows.length,1)})
 await q("update public.guides set visibility='draft' where id=$1",[ga]);await role('anon',null,async()=>{assert.equal((await q('select id from public.guides where id=$1',[ga])).rows.length,0);assert.equal((await q('select id from public.places where id=$1',[added.place.id])).rows.length,0)})
 await role('authenticated',a,async()=>{assert.equal((await q('select id from public.guides where id=$1',[ga])).rows.length,1);await rpc('save_guide_edits',ga,{places:[{id:added.link.id,remove:true}]})});await role('authenticated',a,async()=>assert.equal((await q('select id from public.places where id=$1',[added.place.id])).rows.length,0))
})
test('new provider records are isolated between guides and browser direct writes are denied',async()=>{
 const pa=await role('authenticated',a,()=>rpc('add_guide_place',ga,poi()));const pb=await role('authenticated',b,()=>rpc('add_guide_place',gb,{...poi(),name:'Correct venue'}));assert.notEqual(pa.place.id,pb.place.id);assert.equal(pb.place.name,'Correct venue')
 await role('authenticated',b,async()=>{await assert.rejects(q("insert into public.places(provider,name,address,lat,lng) values('geoapify','Poison','A',0,0)"));await assert.rejects(rpc('add_guide_place',ga,poi('another')));await assert.rejects(q('update public.guide_places set note=$1 where id=$2',['Bad',pa.link.id]))})
 await role('authenticated',a,()=>q('delete from public.guides where id=$1',[ga]));assert.equal((await q('select id from public.places where id=$1',[pa.place.id])).rows.length,0)
})
test('batch notes and ordering commit atomically; mixed owners roll back all changes',async()=>{
 const pa=await role('authenticated',a,()=>rpc('add_guide_place',ga,poi()));const pb=await role('authenticated',b,()=>rpc('add_guide_place',gb,poi()))
 await role('authenticated',a,async()=>{await rpc('save_guide_edits',ga,{guideNote:'Latest',places:[{id:pa.link.id,note:'Latest note',categoryId:'coffee',sortOrder:2}]});await assert.rejects(rpc('save_guide_edits',ga,{guideNote:'Should roll back',places:[{id:pa.link.id,note:'Bad'},{id:pb.link.id,note:'Bad'}]}))})
 assert.equal((await q('select guide_note from public.guides where id=$1',[ga])).rows[0].guide_note,'Latest');assert.equal((await q('select note,category_key,sort_order from public.guide_places where id=$1',[pa.link.id])).rows[0].note,'Latest note')
})
test('effective function grants override project default browser EXECUTE privileges',async()=>{
 for(const signature of ['public.purge_expired_guest_guides()','public.validate_guest_guide(jsonb)','public.generate_random_profile_slug()','public.handle_new_user()']) for(const user of ['anon','authenticated']) assert.equal((await q('select has_function_privilege($1,$2,$3) as permitted',[user,signature,'execute'])).rows[0].permitted,false)
 assert.equal((await q("select has_function_privilege('anon','public.claim_guest_guide(uuid,uuid)','execute') as permitted")).rows[0].permitted,false)
 assert.equal((await q("select has_function_privilege('service_role','public.purge_expired_guest_guides()','execute') as permitted")).rows[0].permitted,true)
})
test('keyed handoff supports retry without overwriting a city or resurrecting deleted guides',async()=>{
 const d=draft();await role('anon',null,()=>rpc('save_guest_guide',d.id,d.key,d));await role('anon',null,()=>assert.rejects(rpc('read_guest_guide',d.id,crypto.randomUUID())))
 const gid=await role('authenticated',a,()=>rpc('claim_guest_guide',d.id,d.key));assert.notEqual(gid,ga);assert.equal(await role('authenticated',a,()=>rpc('claim_guest_guide',d.id,d.key)),gid);assert.equal((await q('select payload from public.guest_guide_drafts where id=$1',[d.id])).rows[0].payload,null)
 await role('authenticated',b,()=>assert.rejects(rpc('claim_guest_guide',d.id,d.key)));await q('delete from public.guides where id=$1',[gid]);await role('authenticated',a,()=>assert.rejects(rpc('claim_guest_guide',d.id,d.key)));await q('delete from auth.users where id=$1',[a]);assert.equal((await q('select id from public.guest_guide_drafts where id=$1',[d.id])).rows.length,0)
})
test('expired snapshots deny access and invalid claim rolls back guide and receipt',async()=>{
 const d=draft();await role('anon',null,()=>rpc('save_guest_guide',d.id,d.key,d));await q("update public.guest_guide_drafts set expires_at=now()-interval '1 day' where id=$1",[d.id]);await role('anon',null,()=>assert.rejects(rpc('read_guest_guide',d.id,d.key)));await role('authenticated',a,()=>assert.rejects(rpc('claim_guest_guide',d.id,d.key)))
 await q('delete from public.guest_guide_drafts');const invalid=draft();invalid.guide.places[0].categoryId='stay';await q('insert into public.guest_guide_drafts(id,claim_key,payload) values($1,$2,$3)',[invalid.id,invalid.key,invalid]);await role('authenticated',a,()=>assert.rejects(rpc('claim_guest_guide',invalid.id,invalid.key)));assert.equal((await q('select id from public.guides where owner_id=$1',[a])).rows.length,1);assert.equal((await q('select claimed_by from public.guest_guide_drafts where id=$1',[invalid.id])).rows[0].claimed_by,null)
})
test('anonymous feedback is bounded and snapshots enforce aggregate capacity',async()=>{
 await role('anon',null,async()=>{for(let i=0;i<5;i++) await q("insert into public.feedback(message) values('Helpful feedback')");await assert.rejects(q("insert into public.feedback(message) values('Too many')"))})
 const d=draft();await q("insert into public.guest_guide_drafts(id,claim_key,payload) select gen_random_uuid(),gen_random_uuid(),jsonb_build_object('padding',repeat('x',199900)) from generate_series(1,10)")
 // Capacity test uses existing rows inserted before disabling the row trigger as an administrator fixture.
 await db.exec('alter table public.guest_guide_drafts disable trigger bound_guest_snapshot');await q("insert into public.guest_guide_drafts(id,claim_key,payload) select gen_random_uuid(),gen_random_uuid(),'{}'::jsonb from generate_series(1,990)");await db.exec('alter table public.guest_guide_drafts enable trigger bound_guest_snapshot');await role('anon',null,()=>assert.rejects(rpc('save_guest_guide',d.id,d.key,d)))
})
test('object-valued text and malformed coordinates are rejected at SQL boundaries',async()=>{
 const d=draft();d.guide.places[0].note={bad:true};await role('anon',null,()=>assert.rejects(rpc('save_guest_guide',d.id,d.key,d)));await role('authenticated',a,async()=>{await assert.rejects(rpc('add_guide_place',ga,{...poi(),lat:91}));await assert.rejects(rpc('add_guide_place',ga,{...poi(),name:{bad:true}}))});assert.equal((await q('select id from public.guide_places')).rows.length,0)
})

test('guide stars default off, are owner-only and stay isolated to their guide entries',async()=>{
 const pa=await role('authenticated',a,()=>rpc('add_guide_place',ga,poi()))
 const pb=await role('authenticated',b,()=>rpc('add_guide_place',gb,poi()))
 assert.equal(pa.link.is_starred,false)
 await role('authenticated',a,()=>rpc('save_guide_edits',ga,{places:[{id:pa.link.id,isStarred:true}]}))
 await role('authenticated',b,()=>assert.rejects(rpc('save_guide_edits',ga,{places:[{id:pa.link.id,isStarred:false}]})))
 await role('anon',null,async()=>{
  assert.equal((await q('select is_starred from public.guide_places where id=$1',[pa.link.id])).rows[0].is_starred,true)
  await assert.rejects(rpc('save_guide_edits',ga,{places:[{id:pa.link.id,isStarred:false}]}))
 })
 assert.equal((await q('select is_starred from public.guide_places where id=$1',[pb.link.id])).rows[0].is_starred,false)
})
test('star batches reject malformed flags atomically; legacy edits preserve picks and allow multiple',async()=>{
 const p1=await role('authenticated',a,()=>rpc('add_guide_place',ga,poi('one')))
 const p2=await role('authenticated',a,()=>rpc('add_guide_place',ga,poi('two')))
 await role('authenticated',a,async()=>{
  await rpc('save_guide_edits',ga,{places:[{id:p1.link.id,isStarred:true},{id:p2.link.id,isStarred:true}]})
  await assert.rejects(rpc('save_guide_edits',ga,{guideNote:'Rollback',places:[{id:p1.link.id,isStarred:false},{id:p2.link.id,isStarred:'true'}]}))
  await rpc('save_guide_edits',ga,{places:[{id:p1.link.id,note:'My note',categoryId:'coffee',sortOrder:7}]})
 })
 assert.equal((await q('select guide_note from public.guides where id=$1',[ga])).rows[0].guide_note,'')
 assert.deepEqual((await q('select is_starred,note,category_key,sort_order from public.guide_places where id=$1',[p1.link.id])).rows[0],{is_starred:true,note:'My note',category_key:'coffee',sort_order:7})
 assert.equal((await q('select is_starred from public.guide_places where id=$1',[p2.link.id])).rows[0].is_starred,true)
})
test('guest publication retains stars and legacy absence, rejects invalid flags and keeps retry receipts',async()=>{
 const d=draft();d.guide.places[0].isStarred=true
 d.guide.places.push({...poi('second'),note:'Second'})
 await role('anon',null,()=>rpc('save_guest_guide',d.id,d.key,d))
 const gid=await role('authenticated',a,()=>rpc('claim_guest_guide',d.id,d.key))
 assert.deepEqual((await q('select is_starred from public.guide_places where guide_id=$1 order by sort_order',[gid])).rows.map(p=>p.is_starred),[true,false])
 assert.equal(await role('authenticated',a,()=>rpc('claim_guest_guide',d.id,d.key)),gid)
 const invalid=draft();invalid.guide.places[0].isStarred='true'
 await role('anon',null,()=>assert.rejects(rpc('save_guest_guide',invalid.id,invalid.key,invalid)))
 assert.equal((await q('select count(*)::int as count from public.guide_places where guide_id=$1',[gid])).rows[0].count,2)
})

test('invitation lookups expose only link context and cannot list or mutate private records',async()=>{
 const invitation=await role('anon',null,()=>rpc('create_guide_invitation',crypto.randomUUID(),'Boris','Warsaw','pl'))
 assert.deepEqual(Object.keys(invitation).sort(),['city','id','locale','name','shortCode'])
 await role('anon',null,async()=>{
  assert.deepEqual(await rpc('read_guide_invitation',invitation.id),invitation)
  assert.equal(await rpc('read_guide_invitation',crypto.randomUUID()),null)
  await assert.rejects(q('select * from private.guide_invitations'))
  await assert.rejects(q("update private.guide_invitations set requester_name='Forged'"))
 })
 await role('authenticated',b,async()=>{assert.deepEqual(await rpc('read_guide_invitation',invitation.id),invitation);await assert.rejects(q('select * from private.guide_invitations'))})
 assert.equal((await q("select relrowsecurity from pg_class where oid='private.guide_invitations'::regclass")).rows[0].relrowsecurity,true)
})

test('signed-in invitations bind the authenticated account, snapshot approved names and redact incomplete profiles',async()=>{
 await q("update public.profiles set display_name='Boris' where id=$1",[a])
 const key=crypto.randomUUID()
 const invitation=await role('authenticated',a,()=>rpc('create_guide_invitation',key,'Spoofed','Warsaw','pl'))
 assert.equal(invitation.name,'Boris')
 assert.equal((await q('select requester_id from private.guide_invitations where id=$1',[invitation.id])).rows[0].requester_id,a)
 await q("update public.profiles set display_name='New name' where id=$1",[a])
 assert.deepEqual(await role('authenticated',a,()=>rpc('create_guide_invitation',key,'New name','Warsaw','pl')),invitation)
 assert.deepEqual(await role('anon',null,()=>rpc('read_guide_invitation',invitation.id)),invitation)
 await q("update public.profiles set display_name='Legacy private name' where id=$1",[c])
 const incomplete=await role('authenticated',c,()=>rpc('create_guide_invitation',crypto.randomUUID(),'OAuth suggestion','Warsaw','en'))
 assert.equal(incomplete.name,'')
 await q('delete from auth.users where id=$1',[a])
 assert.equal(await role('anon',null,()=>rpc('read_guide_invitation',invitation.id)),null)
})

test('creation retry keys remain private and owner-bound; distinct requests get distinct server IDs',async()=>{
 const key=crypto.randomUUID()
 const first=await role('anon',null,()=>rpc('create_guide_invitation',key,'Boris','Warsaw','pl'))
 assert.notEqual(first.id,key)
 const again=await role('anon',null,()=>rpc('create_guide_invitation',key,'Changed input','Warsaw','pl'))
 assert.deepEqual(first,again)
 const second=await role('anon',null,()=>rpc('create_guide_invitation',crypto.randomUUID(),'Boris','Warsaw','pl'))
 assert.notEqual(first.id,second.id)
 await role('authenticated',a,()=>assert.rejects(rpc('create_guide_invitation',key,'Boris','Warsaw','pl')))
 await role('anon',null,()=>assert.rejects(rpc('create_guide_invitation',key,'Boris','Paris','pl')))
 const privateKey=(await q('select creation_key from private.guide_invitations where id=$1',[first.id])).rows[0].creation_key
 assert.equal(await role('anon',null,()=>rpc('read_guide_invitation',privateKey)),null)
 assert.equal((await q('select count(*)::int as count from private.guide_invitations')).rows[0].count,2)
})

test('anonymous invitation bounds and rate limits reject excess without breaking retries',async()=>{
 const key=crypto.randomUUID()
 const blank=await role('anon',null,()=>rpc('create_guide_invitation',key,'','','en'))
 assert.equal(blank.name,'');assert.equal(blank.city,'')
 await role('anon',null,async()=>{
  for(const args of [[crypto.randomUUID(),'N'.repeat(81),'','en'],[crypto.randomUUID(),'','C'.repeat(121),'en'],[crypto.randomUUID(),'','','xx'],[null,'','','en']])await assert.rejects(rpc('create_guide_invitation',...args))
  for(let i=1;i<10;i++)await rpc('create_guide_invitation',crypto.randomUUID(),'','','en')
  await assert.rejects(rpc('create_guide_invitation',crypto.randomUUID(),'','','en'))
  assert.deepEqual(await rpc('create_guide_invitation',key,'','','en'),blank)
 })
 assert.equal((await q('select count(*)::int as count from private.guide_invitations')).rows[0].count,10)
})

test('one invitation supports independent guest publications and never reveals draft recovery keys',async()=>{
 const invitation=await role('anon',null,()=>rpc('create_guide_invitation',crypto.randomUUID(),'','Warsaw','pl'))
 const first=draft(),second=draft()
 for(const d of [first,second]){
  d.invitationId=invitation.id;d.requesterAnonymous=true;d.guide.places[0].isStarred=true
  await role('anon',null,()=>rpc('save_guest_guide',d.id,d.key,d))
  const recovered=await role('anon',null,()=>rpc('read_guest_guide',d.id,d.key))
  assert.equal(recovered.draft.invitationId,invitation.id);assert.equal(recovered.draft.requesterAnonymous,true)
  await role('anon',null,()=>assert.rejects(rpc('read_guest_guide',d.id,invitation.id)))
 }
 const g1=await role('authenticated',a,()=>rpc('claim_guest_guide',first.id,first.key))
 const g2=await role('authenticated',b,()=>rpc('claim_guest_guide',second.id,second.key))
 assert.notEqual(g1,g2)
 assert.deepEqual(await role('anon',null,()=>rpc('read_guide_invitation',invitation.id)),invitation)
 assert.equal((await q('select is_starred from public.guide_places where guide_id=$1',[g1])).rows[0].is_starred,true)
})

test('the invitation global cap rolls back excess creations across sources',async()=>{
 await q("insert into private.write_windows values('invitation:global',date_trunc('minute',clock_timestamp()),120)")
 await role('authenticated',a,()=>assert.rejects(rpc('create_guide_invitation',crypto.randomUUID(),'','Warsaw','en')))
 assert.equal((await q('select count(*)::int as count from private.guide_invitations')).rows[0].count,0)
})


test('short invitation codes resolve the original records, remain immutable on retries and keep internal helpers private',async()=>{
 const key=crypto.randomUUID(),invitation=await role('anon',null,()=>rpc('create_guide_invitation',key,'Boris','Warsaw','pl'))
 assert.match(invitation.shortCode,/^[A-Za-z0-9_-]{12}$/)
 for(const browserRole of ['anon','authenticated']) await role(browserRole,browserRole==='anon'?null:b,async()=>{
  assert.deepEqual(await rpc('read_guide_invitation_by_code',invitation.shortCode),invitation)
  assert.deepEqual(await rpc('read_guide_invitation',invitation.id),invitation)
  for(const wrong of ['invalid',null,'../creator',invitation.id,'ZZZZZZZZZZZZ']) assert.equal(await rpc('read_guide_invitation_by_code',wrong),null)
  await assert.rejects(q('select private.new_invitation_code()'))
 })
 assert.deepEqual(await role('anon',null,()=>rpc('create_guide_invitation',key,'Changed','Warsaw','pl')),invitation)
 await assert.rejects(q('update private.guide_invitations set short_code=$1',[invitation.shortCode+'x']))
 const account=await role('authenticated',a,()=>rpc('create_guide_invitation',crypto.randomUUID(),'Spoofed','Warsaw','en'))
 await q('delete from auth.users where id=$1',[a])
 assert.equal(await role('anon',null,()=>rpc('read_guide_invitation_by_code',account.shortCode)),null)
})

test('a generated-code collision retries safely without changing the existing invitation',async()=>{
 const first=await role('anon',null,()=>rpc('create_guide_invitation',crypto.randomUUID(),'First','Warsaw','en'))
 const original=(await q("select pg_get_functiondef('private.new_invitation_code()'::regprocedure) as source")).rows[0].source
 try {
  await db.exec(`create sequence private.test_code_attempt;create or replace function private.new_invitation_code() returns text language sql volatile set search_path='' as $$select case when nextval('private.test_code_attempt')=1 then '${first.shortCode}' else 'UniqueCode12' end$$;`)
  const second=await role('anon',null,()=>rpc('create_guide_invitation',crypto.randomUUID(),'Second','Paris','pl'))
  assert.equal(second.shortCode,'UniqueCode12');assert.notEqual(second.id,first.id)
  assert.deepEqual(await role('anon',null,()=>rpc('read_guide_invitation_by_code',first.shortCode)),first)
  assert.equal((await q('select count(*)::int as count from private.guide_invitations')).rows[0].count,2)
 } finally {await db.exec(original);await db.exec('drop sequence private.test_code_attempt')}
})

test('0010 backfills pre-existing invitations and preserves their UUID context and guides',()=>assert.equal(shortUpgradePreserved,true))
