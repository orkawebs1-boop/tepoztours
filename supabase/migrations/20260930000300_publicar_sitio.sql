-- Publicar: arma el contenido visible del sitio (con las llaves que usa la app,
-- ver src/lib/types.ts → SiteData) y lo guarda como un nuevo snapshot.
-- Se ejecuta con los permisos de quien llama: solo un administrador pasa las políticas.

create or replace function public.publish_site()
returns timestamptz
language plpgsql
security invoker
set search_path = ''
as $$
declare
  snapshot jsonb;
  ts timestamptz := now();
begin
  if not private.is_admin() and current_user not in ('postgres', 'service_role') then
    raise exception 'Solo un administrador puede publicar' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'settings', (select s.data from public.settings s where s.id = 1),
    'tours', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', t.id, 'slug', t.slug, 'name', t.name, 'category', t.category,
        'short', t.short, 'description', t.description, 'price', t.price,
        'durationHours', t.duration_hours, 'difficulty', t.difficulty, 'groupMax', t.group_max,
        'departureTime', t.departure_time, 'meetingPoint', t.meeting_point,
        'scheduleDays', t.schedule_days, 'minAge', t.min_age, 'badge', t.badge,
        'photos', t.photos, 'itinerary', t.itinerary, 'includes', t.includes, 'bring', t.bring,
        'waMessage', t.wa_message, 'tone', t.tone, 'mapX', t.map_x, 'mapY', t.map_y,
        'pinLabel', t.pin_label, 'active', t.active, 'inCarousel', t.in_carousel, 'sortOrder', t.sort_order
      ) order by t.sort_order, t.created_at)
      from public.tours t where t.active
    ), '[]'::jsonb),
    'slides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id, 'tourId', s.tour_id, 'line1', s.line1, 'line2', s.line2,
        'eyebrow', s.eyebrow, 'description', s.description, 'image', s.image,
        'visible', s.visible, 'sortOrder', s.sort_order
      ) order by s.sort_order, s.created_at)
      from public.slides s where s.visible
    ), '[]'::jsonb),
    'gallery', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'image', g.image, 'caption', g.caption, 'tone', g.tone,
        'visible', g.visible, 'sortOrder', g.sort_order
      ) order by g.sort_order, g.created_at)
      from public.gallery_items g where g.visible
    ), '[]'::jsonb),
    'testimonials', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', r.id, 'quote', r.quote, 'name', r.name, 'tour', r.tour, 'tone', r.tone,
        'visible', r.visible, 'sortOrder', r.sort_order
      ) order by r.sort_order, r.created_at)
      from public.testimonials r where r.visible
    ), '[]'::jsonb),
    'guides', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', g.id, 'name', g.name, 'role', g.role, 'tags', g.tags, 'photo', g.photo,
        'tone', g.tone, 'visible', g.visible, 'sortOrder', g.sort_order
      ) order by g.sort_order, g.created_at)
      from public.guides g where g.visible
    ), '[]'::jsonb),
    'faqs', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id, 'q', f.q, 'a', f.a, 'visible', f.visible, 'sortOrder', f.sort_order
      ) order by f.sort_order, f.created_at)
      from public.faqs f where f.visible
    ), '[]'::jsonb),
    'texts', coalesce((select jsonb_object_agg(x.key, x.value) from public.site_texts x), '{}'::jsonb),
    'publishedAt', ts
  ) into snapshot;

  insert into public.site_snapshots (data, published_at) values (snapshot, ts);
  return ts;
end;
$$;

revoke all on function public.publish_site() from public, anon;
grant execute on function public.publish_site() to authenticated;
