create table if not exists public.user_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  note text,
  updated_at timestamptz not null default now()
);

alter table public.user_prefs enable row level security;

-- Single policy so the logged-in user can fully manage their own row
create policy "Users manage their own prefs"
on public.user_prefs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
