-- Anyone's Guide v0.3
-- Run this once in Supabase SQL Editor on a fresh project.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  city text not null,
  country text not null,
  slug text not null,
  intro text not null default '',
  is_published boolean not null default true,
  center_lat double precision not null,
  center_lng double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(owner_id, slug)
);

create table if not exists public.guide_categories (
  guide_id uuid not null references public.guides(id) on delete cascade,
  key text not null,
  label text not null,
  icon text not null default '•',
  sort_order integer not null default 0,
  primary key (guide_id, key)
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_place_id text,
  name text not null,
  subtitle text,
  address text not null,
  city text,
  lat double precision not null,
  lng double precision not null,
  provider_data jsonb,
  created_at timestamptz not null default now(),
  unique(provider, provider_place_id)
);

create table if not exists public.guide_places (
  id uuid primary key default gen_random_uuid(),
  guide_id uuid not null references public.guides(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete restrict,
  category_key text not null,
  note text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(guide_id, place_id),
  foreign key (guide_id, category_key) references public.guide_categories(guide_id, key) on update cascade
);

create index if not exists guides_owner_idx on public.guides(owner_id);
create index if not exists guide_places_guide_idx on public.guide_places(guide_id, category_key, sort_order);
create index if not exists places_provider_idx on public.places(provider, provider_place_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists guides_set_updated_at on public.guides;
create trigger guides_set_updated_at
before update on public.guides
for each row execute function public.set_updated_at();

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
  -- Non-personal temporary slug. 0002_private_identity.sql replaces this with the
  -- friendly random-handle system and adds editable aliases.
  candidate_slug := 'guide-' || left(new.id::text, 8);

  insert into public.profiles (id, display_name, slug)
  values (new.id, candidate_name, candidate_slug)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.add_default_guide_categories()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.guide_categories (guide_id, key, label, icon, sort_order) values
    (new.id, 'eat', 'Eat', '🍴', 0),
    (new.id, 'coffee', 'Coffee', '☕', 1),
    (new.id, 'drink', 'Drink', '🍷', 2),
    (new.id, 'see', 'See', '◉', 3),
    (new.id, 'shop', 'Shop', '◫', 4),
    (new.id, 'stay', 'Stay', '⌂', 5),
    (new.id, 'other', 'Other', '•', 6);
  return new;
end;
$$;

drop trigger if exists on_guide_created on public.guides;
create trigger on_guide_created
after insert on public.guides
for each row execute function public.add_default_guide_categories();

alter table public.profiles enable row level security;
alter table public.guides enable row level security;
alter table public.guide_categories enable row level security;
alter table public.places enable row level security;
alter table public.guide_places enable row level security;

-- Profiles are intentionally public so guide URLs can resolve an author's slug/name.
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles for select using (true);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- A guide is readable when published; owners can always read their own drafts.
drop policy if exists "published or owned guides are readable" on public.guides;
create policy "published or owned guides are readable" on public.guides for select using (is_published or auth.uid() = owner_id);
drop policy if exists "users create own guides" on public.guides;
create policy "users create own guides" on public.guides for insert with check (auth.uid() = owner_id);
drop policy if exists "owners update guides" on public.guides;
create policy "owners update guides" on public.guides for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists "owners delete guides" on public.guides;
create policy "owners delete guides" on public.guides for delete using (auth.uid() = owner_id);

-- Category visibility/mutation follows the parent guide.
drop policy if exists "visible guide categories are readable" on public.guide_categories;
create policy "visible guide categories are readable" on public.guide_categories for select using (
  exists (select 1 from public.guides g where g.id = guide_id and (g.is_published or g.owner_id = auth.uid()))
);
drop policy if exists "owners insert categories" on public.guide_categories;
create policy "owners insert categories" on public.guide_categories for insert with check (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
);
drop policy if exists "owners update categories" on public.guide_categories;
create policy "owners update categories" on public.guide_categories for update using (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
) with check (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
);
drop policy if exists "owners delete categories" on public.guide_categories;
create policy "owners delete categories" on public.guide_categories for delete using (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
);

-- Places contain non-personal POI data and are globally readable. Authenticated users may add new places.
drop policy if exists "places are public" on public.places;
create policy "places are public" on public.places for select using (true);
drop policy if exists "authenticated users add places" on public.places;
create policy "authenticated users add places" on public.places for insert to authenticated with check (true);

-- Guide-place relationships inherit guide visibility and ownership.
drop policy if exists "visible guide places are readable" on public.guide_places;
create policy "visible guide places are readable" on public.guide_places for select using (
  exists (select 1 from public.guides g where g.id = guide_id and (g.is_published or g.owner_id = auth.uid()))
);
drop policy if exists "owners insert guide places" on public.guide_places;
create policy "owners insert guide places" on public.guide_places for insert with check (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
);
drop policy if exists "owners update guide places" on public.guide_places;
create policy "owners update guide places" on public.guide_places for update using (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
) with check (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
);
drop policy if exists "owners delete guide places" on public.guide_places;
create policy "owners delete guide places" on public.guide_places for delete using (
  exists (select 1 from public.guides g where g.id = guide_id and g.owner_id = auth.uid())
);

-- Data API grants. RLS still decides which rows each role may access.
grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select on public.guides, public.guide_categories, public.places, public.guide_places to anon, authenticated;
grant insert, update, delete on public.guides, public.guide_categories, public.guide_places to authenticated;
grant insert on public.places to authenticated;
