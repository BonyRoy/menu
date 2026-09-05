-- Run this in Supabase SQL Editor so /admin can show venue details.
-- Requires the venue column (see add-venue.sql).

alter table public.restaurants
  add column if not exists venue jsonb
  default '{}'::jsonb;

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
  is_online boolean,
  venue jsonb
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
    coalesce(r.is_online, true),
    coalesce(r.venue, '{}'::jsonb)
  from auth.users u
  left join public.restaurants r on r.user_id = u.id
  order by u.created_at desc, r.updated_at desc nulls last;
$$;

grant execute on function public.admin_list_restaurants() to anon, authenticated;
