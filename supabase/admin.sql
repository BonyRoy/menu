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

create or replace function public.prevent_owner_reenable_menu()
returns trigger
language plpgsql
as $$
begin
  if old.is_online is distinct from true
     and new.is_online is true
     and current_setting('app.allow_admin_online', true) is distinct from 'on'
  then
    raise exception 'Only admin can put a menu back online';
  end if;
  return new;
end;
$$;

drop trigger if exists restaurants_prevent_reenable on public.restaurants;
create trigger restaurants_prevent_reenable
  before update of is_online on public.restaurants
  for each row
  execute function public.prevent_owner_reenable_menu();

drop function if exists public.admin_set_menu_online(uuid, boolean);
create or replace function public.admin_set_menu_online(menu_id uuid, next_online boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.allow_admin_online', 'on', true);
  update public.restaurants
  set is_online = next_online
  where id = menu_id;
end;
$$;

grant execute on function public.admin_set_menu_online(uuid, boolean) to anon, authenticated;

drop function if exists public.admin_delete_account(uuid);
create or replace function public.admin_delete_account(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.restaurants where user_id = target_user_id;
  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_delete_account(uuid) to anon, authenticated;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_credentials (
  id uuid primary key default gen_random_uuid(),
  login_id text unique not null,
  password_hash text not null,
  updated_at timestamptz default now()
);

alter table public.admin_credentials enable row level security;
revoke all on table public.admin_credentials from anon, authenticated;

insert into public.admin_credentials (login_id, password_hash)
select '8369877891', extensions.crypt('Isha@090404', extensions.gen_salt('bf'))
where not exists (select 1 from public.admin_credentials);

create or replace function public.admin_login(p_login_id text, p_password text)
returns boolean
language sql
security definer
set search_path = public, extensions
as $$
  select exists (
    select 1
    from public.admin_credentials
    where login_id = p_login_id
      and password_hash = extensions.crypt(p_password, password_hash)
  );
$$;

create or replace function public.admin_get_login_id()
returns text
language sql
security definer
set search_path = public
as $$
  select login_id from public.admin_credentials limit 1;
$$;

create or replace function public.admin_update_credentials(
  p_current_password text,
  p_new_login_id text,
  p_new_password text
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  current_row public.admin_credentials%rowtype;
begin
  select * into current_row from public.admin_credentials limit 1;
  if not found then
    raise exception 'Admin credentials are not set';
  end if;

  if current_row.password_hash is distinct from extensions.crypt(p_current_password, current_row.password_hash) then
    raise exception 'Current password is incorrect';
  end if;

  if length(trim(p_new_login_id)) = 0 then
    raise exception 'Admin ID cannot be empty';
  end if;

  update public.admin_credentials
  set
    login_id = trim(p_new_login_id),
    password_hash = case
      when p_new_password is null or length(p_new_password) = 0 then password_hash
      else extensions.crypt(p_new_password, extensions.gen_salt('bf'))
    end,
    updated_at = now()
  where id = current_row.id;
end;
$$;

grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_get_login_id() to anon, authenticated;
grant execute on function public.admin_update_credentials(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
