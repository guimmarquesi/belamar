drop policy if exists npcs_insert on public.npcs;
drop policy if exists npcs_update on public.npcs;
drop policy if exists npcs_delete on public.npcs;

create policy npcs_insert
on public.npcs
for insert
to authenticated
with check (private.can_edit_campaign(campaign_id));

create policy npcs_update
on public.npcs
for update
to authenticated
using (private.can_edit_campaign(campaign_id))
with check (private.can_edit_campaign(campaign_id));

create policy npcs_delete
on public.npcs
for delete
to authenticated
using (private.can_edit_campaign(campaign_id));
