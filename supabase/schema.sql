-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

-- Restaurants table
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  tagline text,
  phone text not null,
  address text,
  currency text default 'INR',
  logo_url text,
  hero_image_url text,
  menu_data jsonb not null default '{}'::jsonb,
  theme jsonb default '{"id":"classic-chilli"}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists restaurants_user_id_idx on public.restaurants(user_id);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists restaurants_updated_at on public.restaurants;
create trigger restaurants_updated_at
  before update on public.restaurants
  for each row execute function public.handle_updated_at();

-- Row Level Security
alter table public.restaurants enable row level security;

-- Table privileges (required in addition to RLS)
grant usage on schema public to anon, authenticated;
grant select on table public.restaurants to anon, authenticated;
grant insert, update, delete on table public.restaurants to authenticated;

drop policy if exists "Public can view restaurants" on public.restaurants;
create policy "Public can view restaurants"
  on public.restaurants for select
  using (true);

drop policy if exists "Users can insert own restaurants" on public.restaurants;
create policy "Users can insert own restaurants"
  on public.restaurants for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own restaurants" on public.restaurants;
create policy "Users can update own restaurants"
  on public.restaurants for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own restaurants" on public.restaurants;
create policy "Users can delete own restaurants"
  on public.restaurants for delete
  using (auth.uid() = user_id);

-- Storage bucket for logos & hero images
insert into storage.buckets (id, name, public)
values ('restaurant-assets', 'restaurant-assets', true)
on conflict (id) do nothing;

drop policy if exists "Public read restaurant assets" on storage.objects;
create policy "Public read restaurant assets"
  on storage.objects for select
  using (bucket_id = 'restaurant-assets');

drop policy if exists "Authenticated users upload own assets" on storage.objects;
create policy "Authenticated users upload own assets"
  on storage.objects for insert
  with check (
    bucket_id = 'restaurant-assets'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users update own assets" on storage.objects;
create policy "Users update own assets"
  on storage.objects for update
  using (
    bucket_id = 'restaurant-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users delete own assets" on storage.objects;
create policy "Users delete own assets"
  on storage.objects for delete
  using (
    bucket_id = 'restaurant-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
