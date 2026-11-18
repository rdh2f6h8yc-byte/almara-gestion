-- ALMARA Gestión: tabla para sincronizar los datos en Supabase.
-- Pégalo en Supabase > SQL Editor > New query y pulsa Run.
-- Puedes usar el mismo proyecto que la app ALMARA.

create table if not exists public.gestion (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.gestion enable row level security;

-- Cada usuario solo ve y modifica sus propios datos
create policy "gestion_select_own" on public.gestion
  for select using (auth.uid() = user_id);
create policy "gestion_insert_own" on public.gestion
  for insert with check (auth.uid() = user_id);
create policy "gestion_update_own" on public.gestion
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
