-- Anyone's Guide v0.5.1
-- Privacy-safe public identities + handle aliases.
-- Run this after 0001_initial.sql. It is additive and preserves existing guide data.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.profile_aliases (
  slug text primary key,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists profile_aliases_profile_idx on public.profile_aliases(profile_id);

alter table public.profile_aliases enable row level security;

drop policy if exists "profile aliases are public" on public.profile_aliases;
create policy "profile aliases are public"
on public.profile_aliases for select
using (true);

grant select on public.profile_aliases to anon, authenticated;

create or replace function public.normalize_profile_slug(value text)
returns text
language sql
immutable
set search_path = ''
as $$
  select trim(both '-' from lower(regexp_replace(coalesce(value, ''), '[^a-zA-Z0-9]+', '-', 'g')))
$$;

create or replace function public.generate_random_profile_slug()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  adjectives text[] := array[
    'amber','bright','calm','clear','gentle','golden','green','little','lucky','mellow',
    'quiet','roaming','silver','soft','sunny','warm','wild','young','open','kind'
  ];
  nouns text[] := array[
    'atlas','cedar','cove','fern','field','harbor','lantern','maple','meadow','path',
    'pine','river','sparrow','stone','trail','willow','window','compass','corner','postcard'
  ];
  candidate text;
  i integer;
begin
  for i in 1..80 loop
    candidate := adjectives[1 + floor(random() * array_length(adjectives, 1))::int]
      || '-' || nouns[1 + floor(random() * array_length(nouns, 1))::int]
      || '-' || lpad(floor(random() * 1000)::int::text, 3, '0');

    if not exists (select 1 from public.profiles p where p.slug = candidate)
      and not exists (select 1 from public.profile_aliases a where a.slug = candidate) then
      return candidate;
    end if;
  end loop;

  loop
    candidate := 'guide-' || left(gen_random_uuid()::text, 8);
    exit when not exists (select 1 from public.profiles p where p.slug = candidate)
      and not exists (select 1 from public.profile_aliases a where a.slug = candidate);
  end loop;

  return candidate;
end;
$$;

-- v0.5 and earlier could also leave an email-prefix fallback in display_name for magic-link
-- users. Preserve a real OAuth name when one exists; otherwise clear the fallback so it cannot
-- leak through an already-published guide before the user completes onboarding.
update public.profiles p
set display_name = coalesce(
  nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
  ''
)
from auth.users u
where u.id = p.id;

-- v0.5 and earlier generated slugs from a user's name/email. Replace those once here
-- with non-personal handles. We intentionally do not retain the old generated slug as an
-- alias because the purpose of this migration is to stop exposing that derived identifier.
do $$
declare
  profile_row record;
begin
  for profile_row in select id from public.profiles loop
    update public.profiles
    set slug = public.generate_random_profile_slug(),
        onboarding_completed = false
    where id = profile_row.id;
  end loop;
end;
$$;

-- Future auth users get a random, non-personal handle from day one. Google-provided names
-- may prefill the private onboarding form, but email addresses never become public identity.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  candidate_name text;
  candidate_slug text;
begin
  candidate_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
    ''
  );
  candidate_slug := public.generate_random_profile_slug();

  insert into public.profiles (id, display_name, slug, onboarding_completed)
  values (new.id, candidate_name, candidate_slug, false)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Atomic profile save. Changing a handle keeps the previous non-sensitive handle working
-- as an alias, so already-shared guide links do not break.
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
  if desired_slug = any(array['creator','login','edit','guide','guides','admin','api','auth','settings','account','about','help']) then
    raise exception 'That handle is reserved. Please choose another.' using errcode = '22023';
  end if;

  if desired_slug <> current_profile.slug then
    if exists (select 1 from public.profiles p where p.slug = desired_slug and p.id <> user_id)
      or exists (select 1 from public.profile_aliases a where a.slug = desired_slug and a.profile_id <> user_id) then
      raise exception 'That handle is already taken.' using errcode = '23505';
    end if;

    -- Reclaiming one of your own old handles is allowed.
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

-- Force profile mutations through update_profile_identity so aliases and validation remain atomic.
revoke update on public.profiles from authenticated;
revoke all on function public.normalize_profile_slug(text) from public;
revoke all on function public.generate_random_profile_slug() from public;
revoke all on function public.update_profile_identity(text, text) from public;
grant execute on function public.update_profile_identity(text, text) to authenticated;
