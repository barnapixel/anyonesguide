-- Apply once after 0004. Keep any existing Stay places and their category.
alter table public.guides add column if not exists guide_note text not null default '';

update public.guide_categories
set icon = case key
  when 'drink' then '🍺'
  when 'see' then '🏛️'
  when 'shop' then '🛒'
  else icon
end
where key in ('drink', 'see', 'shop');

delete from public.guide_categories as category
where category.key = 'stay'
  and not exists (
    select 1 from public.guide_places as place
    where place.guide_id = category.guide_id and place.category_key = 'stay'
  );

create or replace function public.add_default_guide_categories()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.guide_categories (guide_id, key, label, icon, sort_order) values
    (new.id, 'eat', 'Eat', '🍴', 0),
    (new.id, 'coffee', 'Coffee', '☕', 1),
    (new.id, 'drink', 'Drink', '🍺', 2),
    (new.id, 'see', 'See', '🏛️', 3),
    (new.id, 'shop', 'Shop', '🛒', 4),
    (new.id, 'other', 'Other', '•', 5);
  return new;
end;
$$;
