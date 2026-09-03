-- Run this in the Supabase SQL Editor so /admin can show every account
-- (with or without menus), emails, toggle online status, and delete any menu.

alter table public.restaurants
  add column if not exists is_online boolean not null default true;

drop policy if exists "Admin can delete any restaurant" on public.restaurants;
create policy "Admin can delete any restaurant"
  on public.restaurants for delete
  using (auth.role() = 'authenticated');

drop policy if exists "Admin can update any restaurant" on public.restaurants;
create policy "Admin can update any restaurant"
  on public.restaurants for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

drop function if exists public.admin_list_restaurants();

create or replace function public.admin_list_restaurants()
returns table (
  id uuid,
  user_id uuid,
  name text,
  phone text,
  logo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  owner_email text,
  is_online boolean
)
language sql
security definer
set search_path = public
as $$
  select
    r.id,
    u.id as user_id,
    r.name,
    r.phone,
    r.logo_url,
    r.created_at,
    r.updated_at,
    u.email::text,
    coalesce(r.is_online, true)
  from auth.users u
  left join public.restaurants r on r.user_id = u.id
  order by u.created_at desc, r.updated_at desc nulls last;
$$;

grant execute on function public.admin_list_restaurants() to anon, authenticated;

drop function if exists public.get_public_menu(uuid);
create or replace function public.get_public_menu(menu_id uuid)
returns setof public.restaurants
language sql
security definer
set search_path = public
as $$
  select r.*
  from public.restaurants r
  where r.id = menu_id
    and coalesce(r.is_online, true) = true
$$;

grant execute on function public.get_public_menu(uuid) to anon, authenticated;

notify pgrst, 'reload schema';
