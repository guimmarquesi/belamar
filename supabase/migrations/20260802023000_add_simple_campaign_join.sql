alter table public.campaigns
add column if not exists is_open boolean not null default false;

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns for select to authenticated
using (is_open or owner_id = (select auth.uid()) or private.is_campaign_member(id));

drop policy if exists characters_select on public.characters;
create policy characters_select on public.characters for select to authenticated
using (
  private.is_campaign_member(campaign_id)
  or exists (
    select 1 from public.campaigns
    where campaigns.id = characters.campaign_id and campaigns.is_open
  )
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
begin
  if (select auth.uid()) is null then
    raise exception 'Faça login antes de entrar na campanha.';
  end if;

  if selected_role not in ('master', 'player') then
    raise exception 'Escolha Mestre ou Jogador.';
  end if;

  if not exists (
    select 1 from public.campaigns
    where id = target_campaign and is_open
  ) then
    raise exception 'Esta campanha não está aberta para entrada.';
  end if;

  if exists (
    select 1 from public.characters
    where id = any(selected_characters)
      and (campaign_id <> target_campaign or (owner_id is not null and owner_id <> (select auth.uid())))
  ) then
    raise exception 'Um dos personagens escolhidos já pertence a outra conta.';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (target_campaign, (select auth.uid()), selected_role)
  on conflict (campaign_id, user_id) do update set role = excluded.role;

  update public.characters
  set owner_id = (select auth.uid()), updated_at = now()
  where campaign_id = target_campaign
    and id = any(selected_characters)
    and (owner_id is null or owner_id = (select auth.uid()));

  return target_campaign;
end;
$$;

revoke all on function public.join_open_campaign(uuid, public.campaign_role, uuid[]) from public;
revoke all on function public.join_open_campaign(uuid, public.campaign_role, uuid[]) from anon;
grant execute on function public.join_open_campaign(uuid, public.campaign_role, uuid[]) to authenticated;

update public.campaigns
set is_open = true
where lower(name) = 'belamar';

insert into public.characters (campaign_id, name, data)
select campaigns.id, seed.name, jsonb_build_object('guilda_id', seed.guilda_id)
from public.campaigns
cross join (values
  ('bandolim', 'Bandolim'),
  ('enoque', 'Enoque'),
  ('huang', 'Huang'),
  ('dread-moore', 'Dread Moore'),
  ('rust', 'Rusty')
) as seed(guilda_id, name)
where lower(campaigns.name) = 'belamar'
  and not exists (
    select 1 from public.characters existing
    where existing.campaign_id = campaigns.id
      and existing.data ->> 'guilda_id' = seed.guilda_id
  );
