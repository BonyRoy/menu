-- Run this in Supabase SQL Editor if restaurants table already exists

alter table public.restaurants
  add column if not exists venue jsonb
  default '{}'::jsonb;
