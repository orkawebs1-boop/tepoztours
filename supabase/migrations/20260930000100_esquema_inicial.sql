-- TepozTours · esquema inicial
-- Los textos bilingües se guardan como jsonb {"es": "...", "en": "..."}.
-- El panel edita estas tablas (borrador). Al publicar se guarda un snapshot
-- en site_snapshots, que es lo único que lee el sitio público.

-- ---------------------------------------------------------------------------
-- Administradores
-- ---------------------------------------------------------------------------
create table public.admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
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

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Contenido del sitio (borrador)
-- ---------------------------------------------------------------------------
create table public.tours (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null check (coalesce(name ->> 'es', '') <> ''),
  category text not null check (category in ('senderismo', 'aventura', 'cultura', 'bienestar')),
  short jsonb not null default '{"es":"","en":""}',
  description jsonb not null default '{"es":"","en":""}',
  price integer not null check (price > 0),
  duration_hours numeric(4, 1) not null check (duration_hours > 0),
  difficulty text not null check (difficulty in ('facil', 'moderada', 'exigente')),
  group_max integer not null default 10 check (group_max > 0),
  departure_time text not null default '',
  meeting_point jsonb not null default '{"es":"","en":""}',
  schedule_days jsonb not null default '{"es":"","en":""}',
  min_age integer check (min_age is null or min_age >= 0),
  badge jsonb,
  photos jsonb not null default '[]' check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) >= 1),
  itinerary jsonb not null default '[]' check (jsonb_typeof(itinerary) = 'array'),
  includes jsonb not null default '{"es":[],"en":[]}',
  bring jsonb not null default '{"es":[],"en":[]}',
  wa_message jsonb not null default '{"es":"","en":""}',
  tone text not null default '#4E6540',
  map_x integer not null default 320,
  map_y integer not null default 450,
  pin_label jsonb not null default '{"es":"","en":""}',
  active boolean not null default true,
  in_carousel boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.slides (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tours (id) on delete cascade,
  line1 jsonb not null default '{"es":"","en":""}',
  line2 jsonb not null default '{"es":"","en":""}',
  eyebrow jsonb not null default '{"es":"","en":""}',
  description jsonb not null default '{"es":"","en":""}',
  image text,
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index slides_tour_id_idx on public.slides (tour_id);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  image text,
  caption jsonb not null default '{"es":"","en":""}',
  tone text not null default '#4E6540',
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote jsonb not null default '{"es":"","en":""}',
  name text not null default '',
  tour jsonb not null default '{"es":"","en":""}',
  tone text not null default '#CDB891',
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.guides (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role jsonb not null default '{"es":"","en":""}',
  tags jsonb not null default '[]' check (jsonb_typeof(tags) = 'array'),
  photo text,
  tone text not null default '#4E6540',
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  q jsonb not null default '{"es":"","en":""}',
  a jsonb not null default '{"es":"","en":""}',
  visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Textos editables del sitio: la llave es la ruta del diccionario, p. ej. "about.title".
create table public.site_texts (
  key text primary key check (key ~ '^[a-zA-Z]+\.[a-zA-Z0-9]+$'),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- Ajustes de la agencia: una sola fila.
create table public.settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Publicación
-- ---------------------------------------------------------------------------
create table public.site_snapshots (
  id bigint generated always as identity primary key,
  data jsonb not null,
  published_at timestamptz not null default now(),
  published_by text default (auth.jwt() ->> 'email')
);
create index site_snapshots_published_at_idx on public.site_snapshots (published_at desc);

-- Marca de la última edición del borrador, para el indicador «Guardado sin publicar».
create table public.site_state (
  id smallint primary key default 1 check (id = 1),
  draft_changed_at timestamptz not null default now()
);
insert into public.site_state (id) values (1);

create or replace function public.touch_draft()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.site_state set draft_changed_at = now() where id = 1;
  return null;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['tours', 'slides', 'gallery_items', 'testimonials', 'guides', 'faqs', 'site_texts', 'settings'] loop
    execute format('create trigger %I_touch_draft after insert or update or delete on public.%I for each statement execute function public.touch_draft()', t, t);
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

-- Conserva solo los últimos 30 snapshots.
create or replace function public.prune_snapshots()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.site_snapshots
  where id not in (select id from public.site_snapshots order by published_at desc limit 30);
  return null;
end;
$$;
create trigger site_snapshots_prune after insert on public.site_snapshots
for each statement execute function public.prune_snapshots();

-- ---------------------------------------------------------------------------
-- Reservas (registro manual, no forma parte de la publicación)
-- ---------------------------------------------------------------------------
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time text not null default '',
  client text not null check (btrim(client) <> ''),
  whatsapp text not null default '',
  tour_id uuid references public.tours (id) on delete set null,
  -- Se guarda el nombre para conservar el registro aunque el tour se elimine.
  tour_name text not null default '',
  people integer not null default 1 check (people > 0),
  total integer not null default 0 check (total >= 0),
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmada', 'cancelada')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reservations_date_idx on public.reservations (date);
create index reservations_tour_id_idx on public.reservations (tour_id);
create trigger reservations_updated_at before update on public.reservations
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Seguridad (RLS)
-- ---------------------------------------------------------------------------
alter table public.admins enable row level security;
alter table public.tours enable row level security;
alter table public.slides enable row level security;
alter table public.gallery_items enable row level security;
alter table public.testimonials enable row level security;
alter table public.guides enable row level security;
alter table public.faqs enable row level security;
alter table public.site_texts enable row level security;
alter table public.settings enable row level security;
alter table public.site_snapshots enable row level security;
alter table public.site_state enable row level security;
alter table public.reservations enable row level security;

-- Un administrador puede ver la lista de administradores (solo lectura desde la app).
create policy "admins: lectura para administradores" on public.admins
  for select to authenticated using (public.is_admin());

-- Contenido: solo administradores.
do $$
declare t text;
begin
  foreach t in array array['tours', 'slides', 'gallery_items', 'testimonials', 'guides', 'faqs', 'site_texts', 'settings', 'reservations'] loop
    execute format('create policy "%s: administradores" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t, t);
  end loop;
end $$;

-- Snapshots: el público lee; solo administradores publican.
create policy "site_snapshots: lectura pública" on public.site_snapshots
  for select to anon, authenticated using (true);
create policy "site_snapshots: publicar" on public.site_snapshots
  for insert to authenticated with check (public.is_admin());

create policy "site_state: lectura para administradores" on public.site_state
  for select to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Fotos (Storage)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 8388608, array['image/webp', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/avif'])
on conflict (id) do nothing;

create policy "media: subir (administradores)" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
create policy "media: actualizar (administradores)" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.is_admin());
create policy "media: borrar (administradores)" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.is_admin());
