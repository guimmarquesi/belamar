alter table public.campaign_members
add column if not exists selected_character_ids uuid[] not null default '{}'::uuid[];

create or replace function private.can_edit_character(target_campaign uuid, target_character uuid)
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.campaign_members
    where campaign_id = target_campaign
      and user_id = (select auth.uid())
      and (
        role = 'master'
        or (role = 'player' and target_character = any(selected_character_ids))
      )
  );
$$;

revoke all on function private.can_edit_character(uuid, uuid) from public;
grant execute on function private.can_edit_character(uuid, uuid) to authenticated;

drop policy if exists characters_update on public.characters;
create policy characters_update
on public.characters
for update
to authenticated
using (
  owner_id = (select auth.uid())
  or private.can_edit_character(campaign_id, id)
)
with check (
  owner_id = (select auth.uid())
  or private.can_edit_character(campaign_id, id)
);

create or replace function public.join_open_campaign(
  target_campaign uuid,
  selected_role public.campaign_role,
  selected_characters uuid[] default '{}'::uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  chosen_characters uuid[] := coalesce(selected_characters, '{}'::uuid[]);
  player_name text;
begin
  if (select auth.uid()) is null then
    raise exception 'Entre como jogador antes de abrir a campanha.';
  end if;

  if selected_role <> 'player' then
    raise exception 'A entrada aberta concede somente o papel de Jogador.';
  end if;

  if not exists (
    select 1 from public.campaigns
    where id = target_campaign and is_open
  ) then
    raise exception 'Esta campanha não está aberta para entrada.';
  end if;

  if cardinality(chosen_characters) <> 1 or exists (
    select 1
    from unnest(chosen_characters) selected_id
    left join public.characters chosen
      on chosen.id = selected_id and chosen.campaign_id = target_campaign
    where chosen.id is null
  ) then
    raise exception 'Escolha um personagem válido desta campanha.';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role, selected_character_ids)
  values (target_campaign, (select auth.uid()), 'player', chosen_characters)
  on conflict (campaign_id, user_id) do update
  set role = case
      when public.campaign_members.role = 'master' then 'master'::public.campaign_role
      else 'player'::public.campaign_role
    end,
    selected_character_ids = excluded.selected_character_ids;

  select name into player_name
  from public.characters
  where id = chosen_characters[1];

  if coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) then
    update public.profiles
    set display_name = coalesce(player_name, 'Jogador')
    where id = (select auth.uid());
  end if;

  return target_campaign;
end;
$$;

revoke all on function public.join_open_campaign(uuid, public.campaign_role, uuid[]) from public;
revoke all on function public.join_open_campaign(uuid, public.campaign_role, uuid[]) from anon;
grant execute on function public.join_open_campaign(uuid, public.campaign_role, uuid[]) to authenticated;

create or replace function public.set_my_characters(
  target_campaign uuid,
  selected_characters uuid[] default '{}'::uuid[]
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  chosen_characters uuid[] := coalesce(selected_characters, '{}'::uuid[]);
  player_name text;
begin
  if (select auth.uid()) is null or not private.is_campaign_member(target_campaign) then
    raise exception 'Entre na campanha antes de vincular personagens.';
  end if;

  if cardinality(chosen_characters) <> 1 or exists (
    select 1
    from unnest(chosen_characters) selected_id
    left join public.characters chosen
      on chosen.id = selected_id and chosen.campaign_id = target_campaign
    where chosen.id is null
  ) then
    raise exception 'Escolha um personagem válido desta campanha.';
  end if;

  update public.campaign_members
  set selected_character_ids = chosen_characters
  where campaign_id = target_campaign and user_id = (select auth.uid());

  select name into player_name
  from public.characters
  where id = chosen_characters[1];

  if coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) then
    update public.profiles
    set display_name = coalesce(player_name, 'Jogador')
    where id = (select auth.uid());
  end if;
end;
$$;

revoke all on function public.set_my_characters(uuid, uuid[]) from public;
revoke all on function public.set_my_characters(uuid, uuid[]) from anon;
grant execute on function public.set_my_characters(uuid, uuid[]) to authenticated;
