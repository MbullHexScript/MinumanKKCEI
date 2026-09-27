-- Jalankan sekali di SQL Editor proyek Supabase milikmu.
-- Tidak memerlukan service_role key di aplikasi.

create table if not exists public.recipes (
  user_id uuid not null references auth.users(id) on delete cascade,
  id uuid not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  constraint recipe_data_object check (jsonb_typeof(data) = 'object'),
  constraint recipe_data_id check (data ? 'id' and data->>'id' = id::text),
  constraint recipe_data_name check (data ? 'name' and jsonb_typeof(data->'name') = 'string' and length(trim(data->>'name')) between 1 and 100),
  constraint recipe_data_size check (octet_length(data::text) <= 1000000)
);

alter table public.recipes enable row level security;
revoke all on table public.recipes from anon;
grant select, insert, update, delete on table public.recipes to authenticated;

drop policy if exists "Read own recipes" on public.recipes;
create policy "Read own recipes" on public.recipes for select to authenticated
  using ((select auth.uid()) = user_id);
drop policy if exists "Insert own recipes" on public.recipes;
create policy "Insert own recipes" on public.recipes for insert to authenticated
  with check ((select auth.uid()) = user_id);
drop policy if exists "Update own recipes" on public.recipes;
create policy "Update own recipes" on public.recipes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Delete own recipes" on public.recipes;
create policy "Delete own recipes" on public.recipes for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.set_recipe_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_updated_at on public.recipes;
create trigger recipes_updated_at before update on public.recipes
  for each row execute function public.set_recipe_updated_at();
