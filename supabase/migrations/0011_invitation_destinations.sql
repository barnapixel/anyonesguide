-- v0.8.14. Apply after 0010, before deploying the new request form.
begin;
alter table private.guide_invitations add column destination jsonb;

create function private.valid_invitation_destination(d jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
begin
  if d is null then return true; end if;
  if jsonb_typeof(d) <> 'object' or jsonb_typeof(d->'id') is distinct from 'string'
    or jsonb_typeof(d->'city') is distinct from 'string' or jsonb_typeof(d->'country') is distinct from 'string'
    or jsonb_typeof(d->'lat') is distinct from 'number' or jsonb_typeof(d->'lng') is distinct from 'number' then return false; end if;
  return char_length(d->>'id') between 1 and 1000
    and char_length(trim(d->>'city')) between 1 and 120 and char_length(d->>'city') <= 120
    and char_length(trim(d->>'country')) between 1 and 120 and char_length(d->>'country') <= 120
    and (d->>'lat')::numeric between -90 and 90 and (d->>'lng')::numeric between -180 and 180
    and (not d ? 'sourceCity' or jsonb_typeof(d->'sourceCity')='string' and char_length(d->>'sourceCity')<=120)
    and not exists(select 1 from jsonb_object_keys(d) k where k not in ('id','city','country','lat','lng','sourceCity'));
exception when others then return false;
end;
$$;
revoke all on function private.valid_invitation_destination(jsonb) from public,anon,authenticated;
alter table private.guide_invitations add constraint invitation_destination_valid
  check (private.valid_invitation_destination(destination) and (destination is null or destination->>'city'=city));

create function public.create_guide_invitation_with_destination(p_creation_key uuid,p_name text,p_city text,p_locale text,p_destination jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existing private.guide_invitations%rowtype; result jsonb;
begin
  if p_creation_key is null or p_destination is null or not private.valid_invitation_destination(p_destination)
    or p_destination->>'city' is distinct from trim(coalesce(p_city,'')) then
    raise exception 'Invalid destination.' using errcode='22023';
  end if;
  -- Serialize destination-bearing retries, preserving immutable invitation context.
  perform pg_advisory_xact_lock(hashtextextended(p_creation_key::text,0));
  select * into existing from private.guide_invitations where creation_key=p_creation_key;
  if found and existing.destination is distinct from p_destination then
    raise exception 'Use a new creation key for a new destination.' using errcode='22023';
  end if;
  -- Retain existing account-name rules, quotas, short codes and retry ownership checks.
  result := public.create_guide_invitation(p_creation_key,p_name,p_city,p_locale);
  if existing.id is null then
    update private.guide_invitations set destination=p_destination where creation_key=p_creation_key;
  end if;
  return result || jsonb_build_object('destination',p_destination);
end;
$$;

create or replace function public.read_guide_invitation(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',i.id,'shortCode',i.short_code,'name',i.requester_name,'city',i.city,'locale',i.locale)
    || case when i.destination is null then '{}'::jsonb else jsonb_build_object('destination',i.destination) end
  from private.guide_invitations i where i.id=p_id
$$;
create or replace function public.read_guide_invitation_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',i.id,'shortCode',i.short_code,'name',i.requester_name,'city',i.city,'locale',i.locale)
    || case when i.destination is null then '{}'::jsonb else jsonb_build_object('destination',i.destination) end
  from private.guide_invitations i where p_code ~ '^[A-Za-z0-9_-]{12}$' and i.short_code=p_code
$$;
revoke all on function public.create_guide_invitation_with_destination(uuid,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.create_guide_invitation_with_destination(uuid,text,text,text,jsonb) to anon,authenticated;
notify pgrst,'reload schema';
commit;
