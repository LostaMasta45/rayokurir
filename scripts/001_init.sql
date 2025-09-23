-- Enable required extensions (safe if already enabled)
create extension if not exists pgcrypto;

-- Profiles table linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('ADMIN','KURIR')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Policies: user can CRUD own profile
create policy if not exists "Profiles: select own"
on public.profiles for select
using (id = auth.uid());

create policy if not exists "Profiles: update own"
on public.profiles for update
using (id = auth.uid());

-- Contacts table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  whatsapp text not null,
  address text not null,
  tags text[] not null default '{}',
  notes text,
  created_at timestamptz not null default now(),
  last_contacted timestamptz
);

create index if not exists contacts_user_idx on public.contacts(user_id);
create unique index if not exists contacts_unique_per_user
  on public.contacts(user_id, lower(name), regexp_replace(whatsapp, '\D', '', 'g'));

alter table public.contacts enable row level security;

-- Policies: each user can manage only their own contacts
create policy if not exists "Contacts: select own"
on public.contacts for select
using (user_id = auth.uid());

create policy if not exists "Contacts: insert own"
on public.contacts for insert
with check (user_id = auth.uid());

create policy if not exists "Contacts: update own"
on public.contacts for update
using (user_id = auth.uid());

create policy if not exists "Contacts: delete own"
on public.contacts for delete
using (user_id = auth.uid());
