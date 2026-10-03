-- v0.7.0: apply once after 0006. Preserve historical records and identifiers.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table private.write_windows (bucket text not null, window_start timestamptz not null, requests integer not null, primary key(bucket, window_start));
create table private.rate_salt (id boolean primary key default true check(id), salt uuid not null default gen_random_uuid());
insert into private.rate_salt default values;
create or replace function private.check_write_limit(action text, per_source integer, global_limit integer)
returns void language plpgsql security definer set search_path = '' as $$
declare
  stamp timestamptz := date_trunc('minute', clock_timestamp());
  source text := auth.uid()::text;
  count integer;
  bucket_key text;
begin
  if source is null then
    begin source := nullif(trim(split_part(current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for', ',', 1)), '');
    exception when others then source := null; end;
  end if;
  source := coalesce(source, 'anonymous');
  bucket_key := action || ':' || md5(source || stamp::text || (select salt::text from private.rate_salt));
  insert into private.write_windows values(action || ':global', stamp, 1)
    on conflict(bucket, window_start) do update set requests = private.write_windows.requests + 1 returning requests into count;
  if count > global_limit then raise exception 'Please wait and try again.' using errcode = 'P0001'; end if;
  insert into private.write_windows values(bucket_key, stamp, 1)
    on conflict(bucket, window_start) do update set requests = private.write_windows.requests + 1 returning requests into count;
  if count > per_source then raise exception 'Please wait and try again.' using errcode = 'P0001'; end if;
  delete from private.write_windows where window_start < stamp - interval '10 minutes';
end;
$$;

-- Do not publish an OAuth suggestion before the author chooses their public name.
drop policy "profiles are public" on public.profiles;
create policy "approved or own profiles" on public.profiles for select using (onboarding_completed or id = auth.uid());
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,display_name,slug,onboarding_completed)
    values(new.id,'',public.generate_random_profile_slug(),false) on conflict(id) do nothing;
  return new;
end;
$$;
create or replace function public.resolve_public_profile(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',p.id,'display_name',case when p.onboarding_completed then p.display_name else 'A local' end,'slug',p.slug,'onboarding_completed',p.onboarding_completed)
  from public.profiles p where p.slug = p_slug or exists(select 1 from public.profile_aliases a where a.slug = p_slug and a.profile_id = p.id) limit 1
$$;
create or replace function public.is_profile_handle_available(p_slug text)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and not exists(select 1 from public.profiles where slug = p_slug and id <> auth.uid())
    and not exists(select 1 from public.profile_aliases where slug = p_slug and profile_id <> auth.uid())
$$;
drop policy "users create own guides" on public.guides;
create policy "users create own guides" on public.guides for insert with check(auth.uid() = owner_id and exists(select 1 from public.profiles where id = auth.uid() and onboarding_completed));

-- Existing shared rows keep their IDs; all new browser-supplied POIs are scoped.
alter table public.places add column scope_guide_id uuid references public.guides(id) on delete cascade;
alter table public.places drop constraint places_provider_provider_place_id_key;
alter table public.places add constraint places_scope_provider_key unique(scope_guide_id,provider,provider_place_id);
drop policy "places are public" on public.places;
create policy "accessible linked places" on public.places for select using(exists(
  select 1 from public.guide_places gp join public.guides g on g.id = gp.guide_id
  where gp.place_id = places.id and (places.scope_guide_id is null or places.scope_guide_id = g.id)
    and (g.visibility in ('unlisted','public') or g.owner_id = auth.uid())
));
revoke insert,update,delete on public.places,public.guide_places,public.guide_categories from anon,authenticated;
revoke update on public.guides from authenticated;
grant update(visibility) on public.guides to authenticated;
alter table public.guides add constraint guides_content_bounds check(char_length(trim(city)) between 1 and 120 and char_length(country) <= 120 and char_length(intro) <= 1000000 and char_length(guide_note) <= 1000000 and center_lat between -90 and 90 and center_lng between -180 and 180) not valid;
alter table public.places add constraint places_content_bounds check(char_length(trim(name)) between 1 and 300 and char_length(address) <= 1500 and coalesce(char_length(subtitle),0) <= 500 and coalesce(char_length(provider_place_id),0) <= 1000 and lat between -90 and 90 and lng between -180 and 180) not valid;
alter table public.guide_places add constraint guide_places_content_bounds check(char_length(note) <= 1000000 and sort_order between 0 and 1000000) not valid;
alter table public.app_events add constraint app_events_payload_bounds check(octet_length(properties::text) <= 4000 and coalesce(char_length(anonymous_id),0) <= 100) not valid;
alter table public.feedback add constraint feedback_path_bounds check(coalesce(char_length(page_path),0) <= 500) not valid;

create or replace function public.save_guide_edits(p_guide_id uuid, p_changes jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare change jsonb; link public.guide_places%rowtype;
begin
  perform 1 from public.guides where id = p_guide_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Guide unavailable.' using errcode = '42501'; end if;
  perform private.check_write_limit('edit',120,1000);
  if jsonb_typeof(p_changes) is distinct from 'object' or octet_length(p_changes::text) > 2000000
    or jsonb_typeof(p_changes -> 'places') is distinct from 'array' or jsonb_array_length(p_changes -> 'places') > 1000 then
    raise exception 'Invalid edits.' using errcode = '22023'; end if;
  if p_changes ? 'guideNote' then
    if jsonb_typeof(p_changes -> 'guideNote') is distinct from 'string' then raise exception 'Invalid note.' using errcode = '22023'; end if;
    update public.guides set guide_note = p_changes ->> 'guideNote' where id = p_guide_id;
  end if;
  for change in select value from jsonb_array_elements(p_changes -> 'places') loop
    if jsonb_typeof(change) is distinct from 'object' or jsonb_typeof(change -> 'id') is distinct from 'string' then raise exception 'Invalid edit.' using errcode = '22023'; end if;
    select * into link from public.guide_places where id = (change ->> 'id')::uuid;
    if not found then continue; end if; -- Idempotent removal/retry.
    if link.guide_id <> p_guide_id then raise exception 'Guide unavailable.' using errcode = '42501'; end if;
    if change ? 'remove' and jsonb_typeof(change -> 'remove') is distinct from 'boolean' then raise exception 'Invalid removal.' using errcode = '22023'; end if;
    if change ->> 'remove' = 'true' then delete from public.guide_places where id = link.id; continue; end if;
    if change ? 'note' and jsonb_typeof(change -> 'note') is distinct from 'string' then raise exception 'Invalid note.' using errcode = '22023'; end if;
    if change ? 'categoryId' and (jsonb_typeof(change -> 'categoryId') is distinct from 'string' or not exists(select 1 from public.guide_categories where guide_id = p_guide_id and key = change ->> 'categoryId')) then raise exception 'Invalid category.' using errcode = '22023'; end if;
    if change ? 'sortOrder' and (jsonb_typeof(change -> 'sortOrder') is distinct from 'number' or (change ->> 'sortOrder') !~ '^[0-9]{1,7}$') then raise exception 'Invalid order.' using errcode = '22023'; end if;
    update public.guide_places set note = case when change ? 'note' then change ->> 'note' else note end,
      category_key = case when change ? 'categoryId' then change ->> 'categoryId' else category_key end,
      sort_order = case when change ? 'sortOrder' then (change ->> 'sortOrder')::integer else sort_order end where id = link.id;
  end loop;
  update public.guides set updated_at = now() where id = p_guide_id;
end;
$$;
create or replace function public.add_guide_place(p_guide_id uuid, p_place jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare g public.guides%rowtype; p public.places%rowtype; link public.guide_places%rowtype; category text := p_place ->> 'categoryId'; v_provider text := coalesce(p_place ->> 'provider','geoapify'); external_id text := nullif(p_place ->> 'externalId','');
begin
  select * into g from public.guides where id = p_guide_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Guide unavailable.' using errcode = '42501'; end if;
  perform private.check_write_limit('add',60,500);
  if jsonb_typeof(p_place) is distinct from 'object' or octet_length(p_place::text) > 10000
    or jsonb_typeof(p_place -> 'name') is distinct from 'string' or jsonb_typeof(p_place -> 'address') is distinct from 'string'
    or (p_place ? 'subtitle' and jsonb_typeof(p_place -> 'subtitle') not in ('string','null'))
    or (p_place ? 'externalId' and jsonb_typeof(p_place -> 'externalId') not in ('string','null'))
    or (p_place ? 'provider' and jsonb_typeof(p_place -> 'provider') is distinct from 'string')
    or v_provider not in ('geoapify','demo','manual') or jsonb_typeof(p_place -> 'lat') is distinct from 'number' or jsonb_typeof(p_place -> 'lng') is distinct from 'number'
    or not exists(select 1 from public.guide_categories where guide_id = g.id and key = category) then raise exception 'Invalid recommendation.' using errcode = '22023'; end if;
  select gp.* into link from public.guide_places gp join public.places poi on poi.id = gp.place_id where gp.guide_id = g.id and
    ((external_id is not null and poi.provider = v_provider and poi.provider_place_id = external_id) or (poi.name = p_place ->> 'name' and poi.address = p_place ->> 'address')) limit 1;
  if found then select * into p from public.places where id = link.place_id;
  else
    insert into public.places(scope_guide_id,provider,provider_place_id,name,subtitle,address,city,lat,lng)
    values(g.id,v_provider,external_id,trim(p_place ->> 'name'),p_place ->> 'subtitle',p_place ->> 'address',g.city,(p_place ->> 'lat')::double precision,(p_place ->> 'lng')::double precision)
    on conflict(scope_guide_id,provider,provider_place_id) do update set name = excluded.name,subtitle = excluded.subtitle,address = excluded.address,lat = excluded.lat,lng = excluded.lng returning * into p;
    insert into public.guide_places(guide_id,place_id,category_key,sort_order)
      values(g.id,p.id,category,1 + coalesce((select max(sort_order) from public.guide_places where guide_id = g.id and category_key = category),-1)) returning * into link;
    update public.guides set updated_at = now() where id = g.id;
  end if;
  return jsonb_build_object('place',to_jsonb(p),'link',to_jsonb(link));
end;
$$;

create or replace function private.bound_browser_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare size bigint; total bigint;
begin
  if TG_TABLE_NAME = 'guest_guide_drafts' then
    if new.claimed_by is not null then return new; end if;
    perform private.check_write_limit('snapshot',10,120);
    perform pg_advisory_xact_lock(71007001);
    select coalesce(sum(octet_length(payload::text)),0), count(*) into size,total from public.guest_guide_drafts where claimed_by is null and expires_at >= now() and id <> new.id;
    if total >= 1000 or size + octet_length(new.payload::text) > 50000000 then raise exception 'Please try again later.' using errcode = 'P0001'; end if;
  elsif TG_TABLE_NAME = 'feedback' then perform private.check_write_limit('feedback',5,60);
  elsif TG_TABLE_NAME = 'app_events' then perform private.check_write_limit('events',60,600);
  elsif TG_TABLE_NAME = 'profiles' then perform private.check_write_limit('identity',30,300);
  elsif TG_TABLE_NAME = 'guides' then perform private.check_write_limit('guide',20,200);
  end if;
  return new;
end;
$$;
create trigger bound_guest_snapshot before insert or update on public.guest_guide_drafts for each row execute function private.bound_browser_write();
create trigger bound_feedback before insert on public.feedback for each row execute function private.bound_browser_write();
create trigger bound_events before insert on public.app_events for each row execute function private.bound_browser_write();
create trigger bound_identity before update on public.profiles for each row execute function private.bound_browser_write();
create trigger bound_guide before insert on public.guides for each row execute function private.bound_browser_write();

create or replace function public.validate_guest_guide(p_payload jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  g jsonb := p_payload -> 'guide';
  p jsonb;
begin
  if jsonb_typeof(p_payload -> 'requesterName') is distinct from 'string'
    or jsonb_typeof(p_payload -> 'requestedCity') is distinct from 'string'
    or jsonb_typeof(g -> 'city') is distinct from 'string'
    or jsonb_typeof(g -> 'country') is distinct from 'string'
    or jsonb_typeof(g -> 'guideNote') is distinct from 'string'
    or jsonb_typeof(p_payload) is distinct from 'object'
    or octet_length(p_payload::text) > 200000
    or char_length(trim(coalesce(p_payload ->> 'requesterName', ''))) not between 1 and 80
    or char_length(coalesce(p_payload ->> 'requestedCity', '')) > 120
    or jsonb_typeof(g) is distinct from 'object'
    or char_length(trim(coalesce(g ->> 'city', ''))) not between 1 and 120
    or char_length(trim(coalesce(g ->> 'country', ''))) not between 1 and 120
    or char_length(coalesce(g ->> 'guideNote', '')) > 10000
    or jsonb_typeof(g -> 'places') is distinct from 'array' then
    raise exception 'Invalid guide draft.' using errcode = '22023';
  end if;
  if jsonb_array_length(g -> 'places') not between 1 and 100
    or jsonb_typeof(g #> '{center,lat}') is distinct from 'number'
    or jsonb_typeof(g #> '{center,lng}') is distinct from 'number'
    or (g #>> '{center,lat}')::double precision not between -90 and 90
    or (g #>> '{center,lng}')::double precision not between -180 and 180 then
    raise exception 'Invalid destination or place count.' using errcode = '22023';
  end if;
  for p in select value from jsonb_array_elements(g -> 'places') loop
    if jsonb_typeof(p -> 'name') is distinct from 'string'
      or jsonb_typeof(p -> 'address') is distinct from 'string'
      or jsonb_typeof(p -> 'note') is distinct from 'string'
      or (p ? 'subtitle' and jsonb_typeof(p -> 'subtitle') not in ('string','null'))
      or (p ? 'externalId' and jsonb_typeof(p -> 'externalId') not in ('string','null'))
      or (p ? 'provider' and jsonb_typeof(p -> 'provider') is distinct from 'string')
      or jsonb_typeof(p) is distinct from 'object'
      or char_length(trim(coalesce(p ->> 'name', ''))) not between 1 and 300
      or char_length(coalesce(p ->> 'address', '')) > 1500
      or char_length(coalesce(p ->> 'subtitle', '')) > 500
      or char_length(coalesce(p ->> 'note', '')) > 5000
      or char_length(coalesce(p ->> 'externalId', '')) > 1000
      or coalesce(p ->> 'categoryId', '') not in ('eat','coffee','drink','see','shop','other')
      or coalesce(p ->> 'provider', 'geoapify') not in ('geoapify','demo','manual')
      or jsonb_typeof(p -> 'lat') is distinct from 'number'
      or jsonb_typeof(p -> 'lng') is distinct from 'number'
      or (p ->> 'lat')::double precision not between -90 and 90
      or (p ->> 'lng')::double precision not between -180 and 180 then
      raise exception 'Invalid recommendation.' using errcode = '22023';
    end if;
  end loop;
end;
$$;

create or replace function public.claim_guest_guide(p_id uuid, p_key uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  user_id uuid := auth.uid();
  draft public.guest_guide_drafts%rowtype;
  g jsonb;
  p jsonb;
  v_guide_id uuid;
  v_place_id uuid;
  place_provider text;
  external_id text;
  guide_slug text;
  base_slug text;
  suffix integer := 1;
  v_sort_order integer := 0;
begin
  if user_id is null then raise exception 'Sign in first.' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = user_id and onboarding_completed) then
    raise exception 'Choose your public name first.' using errcode = '42501';
  end if;
  select * into draft from public.guest_guide_drafts
    where id = p_id and claim_key = p_key and (expires_at >= now() or claimed_by = user_id) for update;
  if not found then raise exception 'Draft unavailable or expired.' using errcode = '42501'; end if;
  if draft.claimed_by is not null then
    if draft.claimed_by = user_id and draft.claimed_guide_id is not null then return draft.claimed_guide_id; end if;
    raise exception 'Draft unavailable.' using errcode = '42501';
  end if;
  perform private.check_write_limit('claim',30,300);
  perform public.validate_guest_guide(draft.payload);
  g := draft.payload -> 'guide';
  base_slug := left(coalesce(nullif(public.normalize_profile_slug(g ->> 'city'), ''), 'guide'), 40) || '-' || left(p_id::text, 8);
  guide_slug := base_slug;
  while exists (select 1 from public.guides where owner_id = user_id and slug = guide_slug) loop
    suffix := suffix + 1;
    guide_slug := base_slug || '-' || suffix::text;
  end loop;
  -- All guide/place writes and the claim receipt are one transaction. A retry
  -- returns the same guide; an existing city guide is never overwritten.
  insert into public.guides(owner_id, city, country, slug, intro, guide_note, visibility, center_lat, center_lng)
    values (user_id, trim(g ->> 'city'), trim(g ->> 'country'), guide_slug, '', coalesce(g ->> 'guideNote', ''), 'unlisted', (g #>> '{center,lat}')::double precision, (g #>> '{center,lng}')::double precision)
    returning id into v_guide_id;
  for p in select value from jsonb_array_elements(g -> 'places') loop
    v_place_id := null;
    place_provider := coalesce(nullif(p ->> 'provider', ''), 'geoapify');
    external_id := nullif(p ->> 'externalId', '');
    if external_id is null then place_provider := 'manual'; external_id := p_id::text || ':' || v_sort_order::text; end if;
    insert into public.places(scope_guide_id,provider, provider_place_id, name, subtitle, address, city, lat, lng)
      values (v_guide_id, place_provider, external_id, trim(p ->> 'name'), p ->> 'subtitle', coalesce(p ->> 'address', ''), g ->> 'city', (p ->> 'lat')::double precision, (p ->> 'lng')::double precision)
      on conflict (scope_guide_id, provider, provider_place_id) do nothing returning id into v_place_id;
    if v_place_id is null then select id into v_place_id from public.places where scope_guide_id = v_guide_id and provider = place_provider and provider_place_id = external_id; end if;
    insert into public.guide_places(guide_id, place_id, category_key, note, sort_order)
      values (v_guide_id, v_place_id, p ->> 'categoryId', coalesce(p ->> 'note', ''), v_sort_order)
      on conflict (guide_id, place_id) do nothing;
    v_sort_order := v_sort_order + 1;
  end loop;
  update public.guest_guide_drafts
    set claimed_by = user_id, claimed_guide_id = v_guide_id, payload = null where id = p_id;
  return v_guide_id;
end;
$$;

create or replace function public.purge_expired_guest_guides()
returns void language plpgsql security definer set search_path = '' as $$
begin
  delete from public.guest_guide_drafts where expires_at < now() and claimed_by is null;
  delete from private.write_windows where window_start < now() - interval '10 minutes';
end;
$$;
-- Revoke independently granted default browser EXECUTE as well as PUBLIC.
revoke all on function private.check_write_limit(text,integer,integer),private.bound_browser_write() from public,anon,authenticated;
revoke all on function public.set_updated_at(),public.sync_guide_publication_state(),public.handle_new_user(),public.add_default_guide_categories(),public.normalize_profile_slug(text),public.generate_random_profile_slug(),public.validate_guest_guide(jsonb),public.purge_expired_guest_guides() from public,anon,authenticated;
revoke all on function public.resolve_public_profile(text),public.is_profile_handle_available(text),public.save_guide_edits(uuid,jsonb),public.add_guide_place(uuid,jsonb),public.save_guest_guide(uuid,uuid,jsonb),public.read_guest_guide(uuid,uuid),public.claim_guest_guide(uuid,uuid),public.update_profile_identity(text,text) from public,anon,authenticated;
grant execute on function public.resolve_public_profile(text),public.save_guest_guide(uuid,uuid,jsonb),public.read_guest_guide(uuid,uuid) to anon,authenticated;
grant execute on function public.is_profile_handle_available(text),public.save_guide_edits(uuid,jsonb),public.add_guide_place(uuid,jsonb),public.claim_guest_guide(uuid,uuid),public.update_profile_identity(text,text) to authenticated;
grant execute on function public.purge_expired_guest_guides() to service_role;
notify pgrst,'reload schema';
commit;
