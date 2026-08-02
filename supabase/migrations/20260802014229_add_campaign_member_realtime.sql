do $$
begin
  alter publication supabase_realtime add table public.campaign_members;
exception
  when duplicate_object then null;
end $$;
