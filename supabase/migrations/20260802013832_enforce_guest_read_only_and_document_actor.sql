create or replace function private.can_edit_campaign(target_campaign uuid)
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.campaign_members
    where campaign_id = target_campaign
      and user_id = auth.uid()
      and role in ('master', 'player')
  );
$$;
revoke all on function private.can_edit_campaign(uuid) from public;
grant execute on function private.can_edit_campaign(uuid) to authenticated;

create or replace function private.set_document_updated_by()
returns trigger
language plpgsql security invoker
set search_path = public, auth
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.set_document_updated_by() from public;

drop trigger if exists campaign_documents_set_actor on public.campaign_documents;
create trigger campaign_documents_set_actor
before insert or update on public.campaign_documents
for each row execute function private.set_document_updated_by();

alter policy bag_insert on public.bag_items with check (private.can_edit_campaign(campaign_id));
alter policy bag_update on public.bag_items using (private.can_edit_campaign(campaign_id)) with check (private.can_edit_campaign(campaign_id));
alter policy bag_delete on public.bag_items using (private.can_edit_campaign(campaign_id));

alter policy coins_update on public.campaign_coins using (private.can_edit_campaign(campaign_id)) with check (private.can_edit_campaign(campaign_id));

alter policy items_insert on public.items with check (private.can_edit_campaign(campaign_id));
alter policy items_update on public.items using (private.can_edit_campaign(campaign_id)) with check (private.can_edit_campaign(campaign_id));
alter policy items_delete on public.items using (private.can_edit_campaign(campaign_id));

alter policy potions_insert on public.potions with check (private.can_edit_campaign(campaign_id));
alter policy potions_update on public.potions using (private.can_edit_campaign(campaign_id)) with check (private.can_edit_campaign(campaign_id));
alter policy potions_delete on public.potions using (private.can_edit_campaign(campaign_id));

alter policy documents_insert on public.campaign_documents with check (private.can_edit_campaign(campaign_id));
alter policy documents_update on public.campaign_documents using (private.can_edit_campaign(campaign_id)) with check (private.can_edit_campaign(campaign_id));

alter policy activity_insert on public.activity_log with check (private.can_edit_campaign(campaign_id) and actor_id = (select auth.uid()));
