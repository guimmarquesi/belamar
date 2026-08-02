create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

do $$ begin
  create type public.campaign_role as enum ('master', 'player', 'guest');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.quest_kind as enum ('principal', 'secundaria');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.quest_status as enum ('ativa', 'concluida', 'falhada');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.potion_rarity as enum ('sem', 'comum', 'incomum', 'raro', 'super_raro');
exception when duplicate_object then null; end $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  owner_id uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.campaign_members (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.campaign_role not null default 'player',
  joined_at timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  portrait_url text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bag_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  description text not null default '',
  quantity integer not null default 1 check (quantity >= 0),
  owner_character_id uuid references public.characters(id) on delete set null,
  created_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.campaign_coins (
  campaign_id uuid primary key references public.campaigns(id) on delete cascade,
  gold integer not null default 0,
  silver integer not null default 0,
  bronze integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  legacy_id text,
  name text not null,
  description text,
  rarity text,
  hidden boolean not null default false,
  owner_character_id uuid references public.characters(id) on delete set null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, legacy_id)
);

create table public.npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  legacy_id text,
  name text not null,
  relation text,
  faction text,
  portrait_url text,
  summary text,
  accent text,
  sigil text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, legacy_id)
);

create table public.potions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  legacy_id text,
  name text not null,
  effect text not null default '',
  rarity public.potion_rarity not null default 'sem',
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, legacy_id)
);

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  legacy_id text,
  title text not null,
  kind public.quest_kind not null,
  status public.quest_status not null default 'ativa',
  summary text,
  notes text,
  linked_marker_ids text[] not null default '{}',
  legacy_created_at bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, legacy_id)
);

create table public.map_markers (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  legacy_id text,
  name text not null,
  x numeric not null,
  y numeric not null,
  marker_type text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (campaign_id, legacy_id)
);

create table public.activity_log (
  id bigint generated always as identity primary key,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.is_campaign_member(target_campaign uuid)
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = target_campaign and user_id = auth.uid()
  );
$$;

create or replace function private.is_campaign_master(target_campaign uuid)
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.campaign_members
    where campaign_id = target_campaign
      and user_id = auth.uid()
      and role = 'master'
  );
$$;

revoke all on function private.is_campaign_member(uuid) from public;
revoke all on function private.is_campaign_master(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.is_campaign_member(uuid) to authenticated;
grant execute on function private.is_campaign_master(uuid) to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1), 'Jogador'),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function private.add_owner_as_master()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.campaign_members (campaign_id, user_id, role)
  values (new.id, new.owner_id, 'master')
  on conflict (campaign_id, user_id) do update set role = 'master';
  insert into public.campaign_coins (campaign_id) values (new.id)
  on conflict (campaign_id) do nothing;
  return new;
end;
$$;
revoke all on function private.add_owner_as_master() from public;

create trigger campaign_owner_membership
after insert on public.campaigns
for each row execute function private.add_owner_as_master();

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_members enable row level security;
alter table public.characters enable row level security;
alter table public.bag_items enable row level security;
alter table public.campaign_coins enable row level security;
alter table public.items enable row level security;
alter table public.npcs enable row level security;
alter table public.potions enable row level security;
alter table public.quests enable row level security;
alter table public.map_markers enable row level security;
alter table public.activity_log enable row level security;

create policy profiles_select on public.profiles for select to authenticated
using (id = (select auth.uid()) or exists (
  select 1 from public.campaign_members mine
  join public.campaign_members theirs on theirs.campaign_id = mine.campaign_id
  where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.id
));
create policy profiles_update on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy campaigns_select on public.campaigns for select to authenticated using (private.is_campaign_member(id));
create policy campaigns_insert on public.campaigns for insert to authenticated with check (owner_id = (select auth.uid()));
create policy campaigns_update on public.campaigns for update to authenticated using (private.is_campaign_master(id)) with check (private.is_campaign_master(id));
create policy campaigns_delete on public.campaigns for delete to authenticated using (private.is_campaign_master(id));

create policy members_select on public.campaign_members for select to authenticated using (private.is_campaign_member(campaign_id));
create policy members_insert on public.campaign_members for insert to authenticated with check (private.is_campaign_master(campaign_id));
create policy members_update on public.campaign_members for update to authenticated using (private.is_campaign_master(campaign_id)) with check (private.is_campaign_master(campaign_id));
create policy members_delete on public.campaign_members for delete to authenticated using (private.is_campaign_master(campaign_id));

create policy characters_select on public.characters for select to authenticated using (private.is_campaign_member(campaign_id));
create policy characters_insert on public.characters for insert to authenticated with check (private.is_campaign_master(campaign_id));
create policy characters_update on public.characters for update to authenticated
using (private.is_campaign_master(campaign_id) or owner_id = (select auth.uid()))
with check (private.is_campaign_master(campaign_id) or owner_id = (select auth.uid()));
create policy characters_delete on public.characters for delete to authenticated using (private.is_campaign_master(campaign_id));

create policy bag_select on public.bag_items for select to authenticated using (private.is_campaign_member(campaign_id));
create policy bag_insert on public.bag_items for insert to authenticated with check (private.is_campaign_member(campaign_id));
create policy bag_update on public.bag_items for update to authenticated using (private.is_campaign_member(campaign_id)) with check (private.is_campaign_member(campaign_id));
create policy bag_delete on public.bag_items for delete to authenticated using (private.is_campaign_member(campaign_id));

create policy coins_select on public.campaign_coins for select to authenticated using (private.is_campaign_member(campaign_id));
create policy coins_update on public.campaign_coins for update to authenticated using (private.is_campaign_member(campaign_id)) with check (private.is_campaign_member(campaign_id));

create policy items_select on public.items for select to authenticated using (private.is_campaign_member(campaign_id));
create policy items_insert on public.items for insert to authenticated with check (private.is_campaign_member(campaign_id));
create policy items_update on public.items for update to authenticated using (private.is_campaign_member(campaign_id)) with check (private.is_campaign_member(campaign_id));
create policy items_delete on public.items for delete to authenticated using (private.is_campaign_member(campaign_id));

create policy npcs_select on public.npcs for select to authenticated using (private.is_campaign_member(campaign_id));
create policy npcs_insert on public.npcs for insert to authenticated with check (private.is_campaign_master(campaign_id));
create policy npcs_update on public.npcs for update to authenticated using (private.is_campaign_master(campaign_id)) with check (private.is_campaign_master(campaign_id));
create policy npcs_delete on public.npcs for delete to authenticated using (private.is_campaign_master(campaign_id));

create policy potions_select on public.potions for select to authenticated using (private.is_campaign_member(campaign_id));
create policy potions_insert on public.potions for insert to authenticated with check (private.is_campaign_member(campaign_id));
create policy potions_update on public.potions for update to authenticated using (private.is_campaign_member(campaign_id)) with check (private.is_campaign_member(campaign_id));
create policy potions_delete on public.potions for delete to authenticated using (private.is_campaign_member(campaign_id));

create policy quests_select on public.quests for select to authenticated using (private.is_campaign_member(campaign_id));
create policy quests_insert on public.quests for insert to authenticated with check (private.is_campaign_master(campaign_id));
create policy quests_update on public.quests for update to authenticated using (private.is_campaign_master(campaign_id)) with check (private.is_campaign_master(campaign_id));
create policy quests_delete on public.quests for delete to authenticated using (private.is_campaign_master(campaign_id));

create policy markers_select on public.map_markers for select to authenticated using (private.is_campaign_member(campaign_id));
create policy markers_insert on public.map_markers for insert to authenticated with check (private.is_campaign_master(campaign_id));
create policy markers_update on public.map_markers for update to authenticated using (private.is_campaign_master(campaign_id)) with check (private.is_campaign_master(campaign_id));
create policy markers_delete on public.map_markers for delete to authenticated using (private.is_campaign_master(campaign_id));

create policy activity_select on public.activity_log for select to authenticated using (private.is_campaign_member(campaign_id));
create policy activity_insert on public.activity_log for insert to authenticated with check (private.is_campaign_member(campaign_id) and actor_id = (select auth.uid()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

alter publication supabase_realtime add table public.characters, public.bag_items, public.campaign_coins, public.items, public.npcs, public.potions, public.quests, public.map_markers, public.activity_log;
