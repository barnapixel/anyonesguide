-- v0.8.3. Apply once after 0009. UUID links and private retry keys stay valid.
begin;
do $$
begin
  if to_regclass('private.guide_invitations') is null then
    raise exception 'Apply missing migrations through 0009 before 0010.';
  end if;
end;
$$;

-- Nine independent random bytes. Avoid the fixed UUID version/variant bits.
-- Public invitation context only. This code is never a draft recovery key.
create function private.new_invitation_code()
returns text language sql volatile set search_path = '' as $$
  select translate(encode(
    substring(uuid_send(gen_random_uuid()) from 1 for 6) ||
    substring(uuid_send(gen_random_uuid()) from 1 for 3), 'base64'), '+/', '-_')
$$;
revoke all on function private.new_invitation_code() from public,anon,authenticated;

alter table private.guide_invitations add column short_code text;
alter table private.guide_invitations add constraint guide_invitations_short_code_key unique(short_code);
alter table private.guide_invitations add constraint guide_invitations_short_code_format
  check(short_code ~ '^[A-Za-z0-9_-]{12}$');

-- Backfill existing invitations without changing their IDs, names or draft identity.
do $$
declare invitation record;
begin
  for invitation in select id from private.guide_invitations where short_code is null loop
    loop
      begin
        update private.guide_invitations set short_code=private.new_invitation_code() where id=invitation.id;
        exit;
      exception when unique_violation then
        -- A collision is retried, never allowed to resolve to another invitation.
      end;
    end loop;
  end loop;
end;
$$;
alter table private.guide_invitations alter column short_code set not null;
alter table private.guide_invitations alter column short_code set default private.new_invitation_code();

create or replace function public.create_guide_invitation(p_creation_key uuid,p_name text,p_city text,p_locale text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := auth.uid();
  display_name text := trim(coalesce(p_name,''));
  destination text := trim(coalesce(p_city,''));
  invitation private.guide_invitations%rowtype;
  conflicting_constraint text;
begin
  if p_creation_key is null or char_length(display_name)>80 or char_length(destination)>120
    or p_locale is null or p_locale not in ('en','pl') then
    raise exception 'Invalid invitation.' using errcode='22023';
  end if;
  if caller is not null then
    select coalesce((select p.display_name from public.profiles p where p.id=caller and p.onboarding_completed),'') into display_name;
    if char_length(display_name)>80 then raise exception 'Public name is too long.' using errcode='22023'; end if;
  end if;
  select * into invitation from private.guide_invitations where creation_key=p_creation_key;
  if found then
    if invitation.requester_id is distinct from caller then
      raise exception 'Invitation unavailable.' using errcode='42501';
    end if;
    if invitation.city<>destination or invitation.locale<>p_locale then
      raise exception 'Use a new creation key for a new invitation.' using errcode='22023';
    end if;
    return jsonb_build_object('id',invitation.id,'shortCode',invitation.short_code,'name',invitation.requester_name,'city',invitation.city,'locale',invitation.locale);
  end if;
  perform private.check_write_limit('invitation',10,120);
  for attempt in 1..5 loop
    begin
      insert into private.guide_invitations(creation_key,requester_id,requester_name,city,locale)
        values(p_creation_key,caller,display_name,destination,p_locale)
        on conflict(creation_key) do nothing;
      exit;
    exception when unique_violation then
      get stacked diagnostics conflicting_constraint = constraint_name;
      if conflicting_constraint <> 'guide_invitations_short_code_key' or attempt=5 then raise; end if;
    end;
  end loop;
  select * into invitation from private.guide_invitations where creation_key=p_creation_key;
  if invitation.requester_id is distinct from caller or invitation.city<>destination or invitation.locale<>p_locale then
    raise exception 'Invitation unavailable.' using errcode='42501';
  end if;
  return jsonb_build_object('id',invitation.id,'shortCode',invitation.short_code,'name',invitation.requester_name,'city',invitation.city,'locale',invitation.locale);
end;
$$;

create or replace function public.read_guide_invitation(p_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',i.id,'shortCode',i.short_code,'name',i.requester_name,'city',i.city,'locale',i.locale)
  from private.guide_invitations i where i.id=p_id
$$;

create function public.read_guide_invitation_by_code(p_code text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('id',i.id,'shortCode',i.short_code,'name',i.requester_name,'city',i.city,'locale',i.locale)
  from private.guide_invitations i where p_code ~ '^[A-Za-z0-9_-]{12}$' and i.short_code=p_code
$$;
revoke all on function public.create_guide_invitation(uuid,text,text,text),public.read_guide_invitation(uuid),public.read_guide_invitation_by_code(text) from public,anon,authenticated;
grant execute on function public.create_guide_invitation(uuid,text,text,text),public.read_guide_invitation(uuid),public.read_guide_invitation_by_code(text) to anon,authenticated;
notify pgrst,'reload schema';
commit;
