update public.items set legacy_id = gen_random_uuid()::text where legacy_id is null;
update public.npcs set legacy_id = gen_random_uuid()::text where legacy_id is null;
update public.potions set legacy_id = gen_random_uuid()::text where legacy_id is null;
update public.quests set legacy_id = gen_random_uuid()::text where legacy_id is null;
update public.map_markers set legacy_id = gen_random_uuid()::text where legacy_id is null;

alter table public.items alter column legacy_id set default gen_random_uuid()::text;
alter table public.items alter column legacy_id set not null;
alter table public.npcs alter column legacy_id set default gen_random_uuid()::text;
alter table public.npcs alter column legacy_id set not null;
alter table public.potions alter column legacy_id set default gen_random_uuid()::text;
alter table public.potions alter column legacy_id set not null;
alter table public.quests alter column legacy_id set default gen_random_uuid()::text;
alter table public.quests alter column legacy_id set not null;
alter table public.map_markers alter column legacy_id set default gen_random_uuid()::text;
alter table public.map_markers alter column legacy_id set not null;
