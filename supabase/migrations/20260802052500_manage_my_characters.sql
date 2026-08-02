create or replace function public.set_my_characters(target_campaign uuid, selected_characters uuid[] default '{}'::uuid[])
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if (select auth.uid()) is null or not private.is_campaign_member(target_campaign) then
    raise exception 'Entre na campanha antes de vincular personagens.';
  end if;
  if exists (select 1 from public.characters where id = any(selected_characters) and (campaign_id <> target_campaign or (owner_id is not null and owner_id <> (select auth.uid())))) then
    raise exception 'Um dos personagens escolhidos já pertence a outra conta.';
  end if;
  update public.characters set owner_id = null, updated_at = now()
  where campaign_id = target_campaign and owner_id = (select auth.uid());
  update public.characters set owner_id = (select auth.uid()), updated_at = now()
  where campaign_id = target_campaign and id = any(selected_characters) and owner_id is null;
end; $$;
revoke all on function public.set_my_characters(uuid, uuid[]) from public;
revoke all on function public.set_my_characters(uuid, uuid[]) from anon;
grant execute on function public.set_my_characters(uuid, uuid[]) to authenticated;
