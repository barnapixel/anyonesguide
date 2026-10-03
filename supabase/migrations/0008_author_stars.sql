-- Author recommendations belong to a guide entry, not a global venue.
-- Apply after 0007. Missing flags in older guest snapshots remain unstarred.
begin;
alter table public.guide_places add column is_starred boolean not null default false;

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
    if change ? 'isStarred' and jsonb_typeof(change -> 'isStarred') is distinct from 'boolean' then raise exception 'Invalid star.' using errcode = '22023'; end if;
    if change ? 'note' and jsonb_typeof(change -> 'note') is distinct from 'string' then raise exception 'Invalid note.' using errcode = '22023'; end if;
    if change ? 'categoryId' and (jsonb_typeof(change -> 'categoryId') is distinct from 'string' or not exists(select 1 from public.guide_categories where guide_id = p_guide_id and key = change ->> 'categoryId')) then raise exception 'Invalid category.' using errcode = '22023'; end if;
    if change ? 'sortOrder' and (jsonb_typeof(change -> 'sortOrder') is distinct from 'number' or (change ->> 'sortOrder') !~ '^[0-9]{1,7}$') then raise exception 'Invalid order.' using errcode = '22023'; end if;
    update public.guide_places set is_starred = case when change ? 'isStarred' then (change ->> 'isStarred')::boolean else is_starred end,
      note = case when change ? 'note' then change ->> 'note' else note end,
      category_key = case when change ? 'categoryId' then change ->> 'categoryId' else category_key end,
      sort_order = case when change ? 'sortOrder' then (change ->> 'sortOrder')::integer else sort_order end where id = link.id;
  end loop;
  update public.guides set updated_at = now() where id = p_guide_id;
end;
$$;

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
    if (p ? 'isStarred' and jsonb_typeof(p -> 'isStarred') is distinct from 'boolean')
      or jsonb_typeof(p -> 'name') is distinct from 'string'
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
    insert into public.guide_places(guide_id, place_id, category_key, note, sort_order, is_starred)
      values (v_guide_id, v_place_id, p ->> 'categoryId', coalesce(p ->> 'note', ''), v_sort_order, coalesce((p ->> 'isStarred')::boolean, false))
      on conflict (guide_id, place_id) do nothing;
    v_sort_order := v_sort_order + 1;
  end loop;
  update public.guest_guide_drafts
    set claimed_by = user_id, claimed_guide_id = v_guide_id, payload = null where id = p_id;
  return v_guide_id;
end;
$$;

revoke all on function public.validate_guest_guide(jsonb) from public,anon,authenticated;
revoke all on function public.save_guide_edits(uuid,jsonb),public.claim_guest_guide(uuid,uuid) from public,anon,authenticated;
grant execute on function public.save_guide_edits(uuid,jsonb),public.claim_guest_guide(uuid,uuid) to authenticated;
notify pgrst,'reload schema';
commit;
