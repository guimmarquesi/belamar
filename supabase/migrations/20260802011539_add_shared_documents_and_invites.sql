create table public.campaign_documents (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key (campaign_id, key)
);

create table public.campaign_invites (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  role public.campaign_role not null default 'player' check (role <> 'master'),
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz,
  max_uses integer not null default 10 check (max_uses > 0),
  uses integer not null default 0 check (uses >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index campaign_documents_updated_by_idx on public.campaign_documents(updated_by);
create index campaign_invites_campaign_id_idx on public.campaign_invites(campaign_id);
create index campaign_invites_created_by_idx on public.campaign_invites(created_by);

alter table public.campaign_documents enable row level security;
alter table public.campaign_invites enable row level security;

create policy documents_select on public.campaign_documents for select to authenticated
using (private.is_campaign_member(campaign_id));
create policy documents_insert on public.campaign_documents for insert to authenticated
with check (private.is_campaign_member(campaign_id) and updated_by = (select auth.uid()));
create policy documents_update on public.campaign_documents for update to authenticated
using (private.is_campaign_member(campaign_id))
with check (private.is_campaign_member(campaign_id) and updated_by = (select auth.uid()));
create policy documents_delete on public.campaign_documents for delete to authenticated
using (private.is_campaign_master(campaign_id));

create policy invites_select on public.campaign_invites for select to authenticated
using (private.is_campaign_master(campaign_id));
create policy invites_insert on public.campaign_invites for insert to authenticated
with check (private.is_campaign_master(campaign_id) and created_by = (select auth.uid()) and role <> 'master');
create policy invites_update on public.campaign_invites for update to authenticated
using (private.is_campaign_master(campaign_id))
with check (private.is_campaign_master(campaign_id) and role <> 'master');
create policy invites_delete on public.campaign_invites for delete to authenticated
using (private.is_campaign_master(campaign_id));

create or replace function public.accept_campaign_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  invite_row public.campaign_invites%rowtype;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  select * into invite_row
  from public.campaign_invites
  where token = invite_token
  for update;

  if not found or not invite_row.active then
    raise exception 'invalid invite';
  end if;
  if invite_row.expires_at is not null and invite_row.expires_at <= now() then
    raise exception 'expired invite';
  end if;
  if invite_row.uses >= invite_row.max_uses then
    raise exception 'invite limit reached';
  end if;

  insert into public.campaign_members (campaign_id, user_id, role)
  values (invite_row.campaign_id, current_user_id, invite_row.role)
  on conflict (campaign_id, user_id) do nothing;

  if found then
    update public.campaign_invites
    set uses = uses + 1,
        active = case when uses + 1 >= max_uses then false else active end
    where id = invite_row.id;
  end if;

  return invite_row.campaign_id;
end;
$$;

revoke all on function public.accept_campaign_invite(uuid) from public, anon;
grant execute on function public.accept_campaign_invite(uuid) to authenticated;

grant select, insert, update, delete on public.campaign_documents, public.campaign_invites to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.campaign_documents;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.campaign_members;
exception when duplicate_object then null;
end $$;
