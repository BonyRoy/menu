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

-- Used by the admin editor for the images and raw menu JSON.
drop function if exists public.admin_update_restaurant(uuid, text, text, jsonb);
create or replace function public.admin_update_restaurant(
  p_restaurant_id uuid,
  p_logo_url text,
  p_hero_image_url text,
  p_menu_data jsonb,
  p_restaurant_data jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.restaurants
  set
    logo_url = p_logo_url,
    hero_image_url = p_hero_image_url,
    menu_data = p_menu_data,
    name = coalesce(p_restaurant_data->>'name', name),
    tagline = p_restaurant_data->>'tagline',
    phone = coalesce(p_restaurant_data->>'phone', phone),
    address = p_restaurant_data->>'address',
    currency = coalesce(p_restaurant_data->>'currency', currency),
    theme = coalesce(p_restaurant_data->'theme', theme),
    venue = coalesce(p_restaurant_data->'venue', venue),
    is_online = coalesce((p_restaurant_data->>'is_online')::boolean, is_online)
  where id = p_restaurant_id;

  if not found then
    raise exception 'Restaurant not found';
  end if;
end;
$$;

grant execute on function public.admin_update_restaurant(uuid, text, text, jsonb, jsonb) to anon, authenticated;

-- Creates a blank menu for an existing account. The admin UI redirects to the
-- editor afterwards so the restaurant details, images, and menu can be added.
drop function if exists public.admin_create_restaurant(uuid, text, text);
create or replace function public.admin_create_restaurant(
  p_user_id uuid,
  p_name text,
  p_phone text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_restaurant_id uuid;
begin
  if not exists (select 1 from auth.users where id = p_user_id) then
    raise exception 'Account not found';
  end if;

  if length(trim(coalesce(p_name, ''))) = 0 then
    raise exception 'Restaurant name is required';
  end if;

  if length(trim(coalesce(p_phone, ''))) = 0 then
    raise exception 'Phone is required';
  end if;

  insert into public.restaurants (user_id, name, phone, menu_data, theme, venue, is_online)
  values (
    p_user_id,
    trim(p_name),
    trim(p_phone),
    '{}'::jsonb,
    '{"id":"classic-chilli"}'::jsonb,
    '{}'::jsonb,
    true
  )
  returning id into new_restaurant_id;

  return new_restaurant_id;
end;
$$;

grant execute on function public.admin_create_restaurant(uuid, text, text) to anon, authenticated;

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

-- Short-lived bearer tokens used only by the admin image-upload Edge Function.
-- The browser never receives the Supabase service-role key.
create table if not exists public.admin_upload_sessions (
  token uuid primary key default extensions.gen_random_uuid(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- `create table if not exists` does not repair an earlier version of this
-- table, so set the default explicitly for existing installations too.
alter table public.admin_upload_sessions
  alter column token set default extensions.gen_random_uuid();

alter table public.admin_upload_sessions enable row level security;
revoke all on table public.admin_upload_sessions from anon, authenticated;
-- The Edge Function uses the server-only service role to validate tokens.
-- Browser roles remain unable to read or write this table.
grant select, insert, delete on table public.admin_upload_sessions to service_role;
-- The upload function confirms the target restaurant belongs to the supplied
-- owner before issuing a signed Storage upload URL.
grant select on table public.restaurants to service_role;

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

create or replace function public.admin_create_upload_session(
  p_login_id text,
  p_password text
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  upload_token uuid;
begin
  if not exists (
    select 1
    from public.admin_credentials
    where login_id = trim(p_login_id)
      and password_hash = extensions.crypt(p_password, password_hash)
  ) then
    raise exception 'Invalid admin credentials';
  end if;

  delete from public.admin_upload_sessions where expires_at < now();

  insert into public.admin_upload_sessions (token, expires_at)
  values (extensions.gen_random_uuid(), now() + interval '2 hours')
  returning token into upload_token;

  return upload_token;
end;
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
grant execute on function public.admin_create_upload_session(text, text) to anon, authenticated;
grant execute on function public.admin_get_login_id() to anon, authenticated;
grant execute on function public.admin_update_credentials(text, text, text) to anon, authenticated;

notify pgrst, 'reload schema';
