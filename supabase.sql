-- ALMARA Gestión: tabla de datos y carpeta privada de fotos de facturas.
-- Pégalo en Supabase > SQL Editor > New query y pulsa Run.
-- Se puede ejecutar varias veces sin error.

create table if not exists public.gestion (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.gestion enable row level security;

drop policy if exists "gestion_select_own" on public.gestion;
drop policy if exists "gestion_insert_own" on public.gestion;
drop policy if exists "gestion_update_own" on public.gestion;
create policy "gestion_select_own" on public.gestion for select using (auth.uid() = user_id);
create policy "gestion_insert_own" on public.gestion for insert with check (auth.uid() = user_id);
create policy "gestion_update_own" on public.gestion for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Fotos de facturas (privadas: cada usuario solo ve su carpeta)
insert into storage.buckets (id, name, public) values ('facturas', 'facturas', false)
on conflict (id) do nothing;

drop policy if exists "facturas_select_own" on storage.objects;
drop policy if exists "facturas_insert_own" on storage.objects;
drop policy if exists "facturas_update_own" on storage.objects;
drop policy if exists "facturas_delete_own" on storage.objects;
create policy "facturas_select_own" on storage.objects for select using (bucket_id = 'facturas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "facturas_insert_own" on storage.objects for insert with check (bucket_id = 'facturas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "facturas_update_own" on storage.objects for update using (bucket_id = 'facturas' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "facturas_delete_own" on storage.objects for delete using (bucket_id = 'facturas' and (storage.foldername(name))[1] = auth.uid()::text);

-- Permisos para que la app pueda leer y guardar (necesario en proyectos nuevos de Supabase)
grant usage on schema public to authenticated;
grant select, insert, update on table public.gestion to authenticated;
notify pgrst, 'reload schema';
