-- v0.8.2. Apply once after 0008, including the 0007 private infrastructure.
-- Invitations are public-by-link context, never draft recovery capabilities.
begin;
do $$
begin
  if to_regprocedure('private.check_write_limit(text,integer,integer)') is null
    or not exists (select 1 from information_schema.columns where table_schema='public' and table_name='guide_places' and column_name='is_starred') then
    raise exception 'Apply missing migrations through 0008 in order before 0009.';
  end if;
end;
$$;

create table private.guide_invitations (
  id uuid primary key default gen_random_uuid(),
  creation_key uuid not null unique,
  requester_id uuid references auth.users(id) on delete cascade,
  requester_name text not null check (char_length(requester_name) <= 80),
  city text not null check (char_length(city) <= 120),
  locale text not null check (locale in ('en','pl')),
  created_at timestamptz not null default now()
);
alter table private.guide_invitations enable row level security;
revoke all on private.guide_invitations from public,anon,authenticated;

create function public.create_guide_invitation(p_creation_key uuid,p_name text,p_city text,p_locale text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  display_name text := trim(coalesce(p_name,''));
  destination text := trim(coalesce(p_city,''));
  invitation private.guide_invitations%rowtype;
begin
  if p_creation_key is null or char_length(display_name)>80 or char_length(destination)>120
    or p_locale is null or p_locale not in ('en','pl') then
    raise exception 'Invalid invitation.' using errcode='22023';
  end if;
  -- Never accept an owner UUID or publish an unapproved OAuth/profile name.
  if caller is not null then
    select coalesce((select p.display_name from public.profiles p where p.id=caller and p.onboarding_completed),'') into display_name;
    if char_length(display_name)>80 then raise exception 'Public name is too long.' using errcode='22023'; end if;
  end if;
  -- A private retry key is distinct from the public invitation ID. Replays
  -- return the original immutable record, even after a profile-name change.
  select * into invitation from private.guide_invitations where creation_key=p_creation_key;
  if found then
    if invitation.requester_id is distinct from caller then
      raise exception 'Invitation unavailable.' using errcode='42501';
    end if;
    if invitation.city<>destination or invitation.locale<>p_locale then
      raise exception 'Use a new creation key for a new invitation.' using errcode='22023';
    end if;
    return jsonb_build_object('id',invitation.id,'name',invitation.requester_name,'city',invitation.city,'locale',invitation.locale);
  end if;
  perform private.check_write_limit('invitation',10,120);
  -- This quota bounds successful creations per minute, not lifetime storage.
  -- It is independent of guide/draft quotas. Retries do not add stored rows.
  insert into private.guide_invitations(creation_key,requester_id,requester_name,city,locale)
    values(p_creation_key,caller,display_name,destination,p_locale)
    on conflict(creation_key) do nothing;
  select * into invitation from private.guide_invitations where creation_key=p_creation_key;
  if invitation.requester_id is distinct from caller or invitation.city<>destination or invitation.locale<>p_locale then
    raise exception 'Invitation unavailable.' using errcode='42501';
  end if;
  return jsonb_build_object('id',invitation.id,'name',invitation.requester_name,'city',invitation.city,'locale',invitation.locale);
end;
$$;

create function public.read_guide_invitation(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',i.id,'name',i.requester_name,'city',i.city,'locale',i.locale)
  from private.guide_invitations i where i.id=p_id
$$;

-- Override both PUBLIC and any project-specific default EXECUTE grants.
revoke all on function public.create_guide_invitation(uuid,text,text,text),public.read_guide_invitation(uuid) from public,anon,authenticated;
grant execute on function public.create_guide_invitation(uuid,text,text,text),public.read_guide_invitation(uuid) to anon,authenticated;
notify pgrst,'reload schema';
commit;
