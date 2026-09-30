-- Las funciones SECURITY DEFINER no deben quedar expuestas en la API pública.

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

-- Políticas con la función privada
drop policy "admins: lectura para administradores" on public.admins;
create policy "admins: lectura para administradores" on public.admins
  for select to authenticated using (private.is_admin());

do $$
declare t text;
begin
  foreach t in array array['tours', 'slides', 'gallery_items', 'testimonials', 'guides', 'faqs', 'site_texts', 'settings', 'reservations'] loop
    execute format('drop policy "%s: administradores" on public.%I', t, t);
    execute format('create policy "%s: administradores" on public.%I for all to authenticated using (private.is_admin()) with check (private.is_admin())', t, t);
  end loop;
end $$;

drop policy "site_snapshots: publicar" on public.site_snapshots;
create policy "site_snapshots: publicar" on public.site_snapshots
  for insert to authenticated with check (private.is_admin());

drop policy "site_state: lectura para administradores" on public.site_state;
create policy "site_state: lectura para administradores" on public.site_state
  for select to authenticated using (private.is_admin());

drop policy "media: subir (administradores)" on storage.objects;
drop policy "media: actualizar (administradores)" on storage.objects;
drop policy "media: borrar (administradores)" on storage.objects;
create policy "media: subir (administradores)" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and private.is_admin());
create policy "media: actualizar (administradores)" on storage.objects
  for update to authenticated using (bucket_id = 'media' and private.is_admin());
create policy "media: borrar (administradores)" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and private.is_admin());

drop function public.is_admin();

-- Las funciones de trigger no se llaman directamente.
revoke execute on function public.touch_draft() from public, anon, authenticated;
revoke execute on function public.prune_snapshots() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
