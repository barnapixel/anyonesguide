-- Anyone's Guide v0.6.9. Apply once after 0005.
-- Guest guides stay in the browser until sign-in is requested. Only then is a
-- private, seven-day handoff stored. Browser roles can only use the keyed RPCs.

create table if not exists public.guest_guide_drafts (
  id uuid primary key,
  claim_key uuid not null,
  payload jsonb,
  claimed_by uuid references auth.users(id) on delete cascade,
  claimed_guide_id uuid references public.guides(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  constraint guest_guide_payload_size check (payload is null or octet_length(payload::text) <= 200000)
);
create index if not exists guest_guide_expiry_idx on public.guest_guide_drafts(expires_at);
alter table public.guest_guide_drafts enable row level security;
revoke all on public.guest_guide_drafts from public, anon, authenticated;

create or replace function public.validate_guest_guide(p_payload jsonb)
returns void language plpgsql set search_path = '' as $$
declare
  g jsonb := p_payload -> 'guide';
  p jsonb;
begin
  if jsonb_typeof(p_payload) is distinct from 'object'
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
    if jsonb_typeof(p) is distinct from 'object'
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

create or replace function public.save_guest_guide(p_id uuid, p_key uuid, p_payload jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  existing public.guest_guide_drafts%rowtype;
begin
  if p_id is null or p_key is null
    or p_payload ->> 'id' is distinct from p_id::text
    or p_payload ->> 'key' is distinct from p_key::text then
    raise exception 'Invalid draft key.' using errcode = '22023';
  end if;
  perform public.validate_guest_guide(p_payload);
  -- A daily scheduled call to purge_expired_guest_guides is also supported.
  delete from public.guest_guide_drafts where expires_at < now() and claimed_by is null;
  insert into public.guest_guide_drafts(id, claim_key, payload)
    values (p_id, p_key, p_payload) on conflict (id) do nothing;
  select * into existing from public.guest_guide_drafts where id = p_id for update;
  if existing.claim_key <> p_key then
    raise exception 'Draft unavailable.' using errcode = '42501';
  end if;
  if existing.claimed_by is not null then
    -- A stale browser draft may need to sign in again. Never overwrite a
    -- claimed snapshot; only read/claim reveal its guide, to the same account.
    return;
  end if;
  update public.guest_guide_drafts
    set payload = p_payload, expires_at = now() + interval '7 days' where id = p_id;
end;
$$;

create or replace function public.read_guest_guide(p_id uuid, p_key uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  draft public.guest_guide_drafts%rowtype;
begin
  select * into draft from public.guest_guide_drafts
    where id = p_id and claim_key = p_key and (expires_at >= now() or claimed_by = auth.uid());
  if not found then raise exception 'Draft unavailable or expired.' using errcode = '42501'; end if;
  if draft.claimed_by is not null then
    if draft.claimed_by is distinct from auth.uid() or draft.claimed_guide_id is null then
      raise exception 'Draft unavailable.' using errcode = '42501';
    end if;
    return jsonb_build_object('guideId', draft.claimed_guide_id);
  end if;
  return jsonb_build_object('draft', draft.payload);
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
    insert into public.places(provider, provider_place_id, name, subtitle, address, city, lat, lng)
      values (place_provider, external_id, trim(p ->> 'name'), p ->> 'subtitle', coalesce(p ->> 'address', ''), g ->> 'city', (p ->> 'lat')::double precision, (p ->> 'lng')::double precision)
      on conflict (provider, provider_place_id) do nothing returning id into v_place_id;
    if v_place_id is null then select id into v_place_id from public.places where provider = place_provider and provider_place_id = external_id; end if;
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
returns void language sql security definer set search_path = '' as $$
  delete from public.guest_guide_drafts where expires_at < now() and claimed_by is null;
$$;

revoke all on function public.validate_guest_guide(jsonb) from public;
revoke all on function public.save_guest_guide(uuid,uuid,jsonb) from public;
revoke all on function public.read_guest_guide(uuid,uuid) from public;
revoke all on function public.claim_guest_guide(uuid,uuid) from public;
revoke all on function public.purge_expired_guest_guides() from public;
grant execute on function public.save_guest_guide(uuid,uuid,jsonb) to anon, authenticated;
grant execute on function public.read_guest_guide(uuid,uuid) to anon, authenticated;
grant execute on function public.claim_guest_guide(uuid,uuid) to authenticated;

-- Reserve the new app routes when a profile handle is changed.
create or replace function public.update_profile_identity(
  p_display_name text,
  p_slug text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_id uuid := auth.uid();
  current_profile public.profiles%rowtype;
  clean_name text;
  desired_slug text;
  updated_profile public.profiles%rowtype;
begin
  if user_id is null then
    raise exception 'You must be signed in.' using errcode = '42501';
  end if;

  clean_name := trim(coalesce(p_display_name, ''));
  if char_length(clean_name) < 1 then
    raise exception 'Please add the name your friends should see.' using errcode = '22023';
  end if;
  if char_length(clean_name) > 80 then
    raise exception 'Display name must be 80 characters or fewer.' using errcode = '22023';
  end if;

  select * into current_profile from public.profiles where id = user_id;
  if not found then
    raise exception 'Profile not found.' using errcode = 'P0002';
  end if;

  desired_slug := case
    when p_slug is null or trim(p_slug) = '' then current_profile.slug
    else public.normalize_profile_slug(p_slug)
  end;

  if char_length(desired_slug) < 3 or char_length(desired_slug) > 40 then
    raise exception 'Handle must be between 3 and 40 characters.' using errcode = '22023';
  end if;
  if desired_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'Use letters, numbers and single hyphens only.' using errcode = '22023';
  end if;
  if desired_slug = any(array['creator','login','edit','preview','explore','feedback','guide','guides','admin','api','auth','settings','account','about','help','ask','request','respond','finish-request']) then
    raise exception 'That handle is reserved. Please choose another.' using errcode = '22023';
  end if;

  if desired_slug <> current_profile.slug then
    if exists (select 1 from public.profiles p where p.slug = desired_slug and p.id <> user_id)
      or exists (select 1 from public.profile_aliases a where a.slug = desired_slug and a.profile_id <> user_id) then
      raise exception 'That handle is already taken.' using errcode = '23505';
    end if;

    delete from public.profile_aliases where profile_id = user_id and slug = desired_slug;
    insert into public.profile_aliases (slug, profile_id)
    values (current_profile.slug, user_id)
    on conflict (slug) do nothing;
  end if;

  update public.profiles
  set display_name = clean_name,
      slug = desired_slug,
      onboarding_completed = true
  where id = user_id
  returning * into updated_profile;

  return updated_profile;
end;
$$;

revoke all on function public.update_profile_identity(text, text) from public;
grant execute on function public.update_profile_identity(text, text) to authenticated;
