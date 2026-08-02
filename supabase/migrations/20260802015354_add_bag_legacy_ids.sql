alter table public.bag_items add column legacy_id text;
update public.bag_items set legacy_id = id::text where legacy_id is null;
alter table public.bag_items alter column legacy_id set default gen_random_uuid()::text;
alter table public.bag_items alter column legacy_id set not null;
alter table public.bag_items add constraint bag_items_campaign_id_legacy_id_key unique (campaign_id, legacy_id);
