-- Enable extensions often available on Supabase
create extension if not exists pgcrypto;

-- PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  role text not null default 'ADMIN' check (role in ('ADMIN','KURIR')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Profiles RLS: users can see and manage their own profile
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- CONTACTS TABLE
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- Generated helpers for upsert uniqueness
  name_lower text generated always as (lower(name)) stored,
  whatsapp text not null,
  normalized_whatsapp text generated always as (regexp_replace(whatsapp, '[^0-9]', '', 'g')) stored,
  address text not null,
  tags text[] not null default '{}',
  notes text null,
  created_at timestamptz not null default now(),
  last_contacted timestamptz null
);

-- Uniqueness per-user on logical identity (name + whatsapp digits)
create unique index if not exists contacts_unique_identity
on public.contacts (user_id, name_lower, normalized_whatsapp);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_created_at_idx on public.contacts (created_at);

alter table public.contacts enable row level security;

-- Contacts RLS: each user only accesses their rows
create policy "contacts_select_own"
on public.contacts
for select
to authenticated
using (user_id = auth.uid());

create policy "contacts_insert_own"
on public.contacts
for insert
to authenticated
with check (user_id = auth.uid());

create policy "contacts_update_own"
on public.contacts
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "contacts_delete_own"
on public.contacts
for delete
to authenticated
using (user_id = auth.uid());
