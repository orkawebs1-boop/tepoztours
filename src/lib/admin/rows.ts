/**
 * Conversión entre filas de Supabase (snake_case) y el modelo de la app (camelCase).
 */
import type { Faq, GalleryItem, Guide, L10n, Settings, Slide, Testimonial, Tour } from "../types";

type Row = Record<string, unknown>;

const l = (v: unknown): L10n => {
  const o = (v ?? {}) as Partial<L10n>;
  return { es: o.es ?? "", en: o.en ?? "" };
};

export function tourFromRow(r: Row): Tour {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: l(r.name),
    category: r.category as Tour["category"],
    short: l(r.short),
    description: l(r.description),
    price: Number(r.price),
    durationHours: Number(r.duration_hours),
    difficulty: r.difficulty as Tour["difficulty"],
    groupMax: Number(r.group_max),
    departureTime: String(r.departure_time ?? ""),
    meetingPoint: l(r.meeting_point),
    scheduleDays: l(r.schedule_days),
    minAge: r.min_age === null || r.min_age === undefined ? null : Number(r.min_age),
    badge: r.badge ? l(r.badge) : null,
    photos: (r.photos as Tour["photos"]) ?? [],
    itinerary: (r.itinerary as Tour["itinerary"]) ?? [],
    includes: (r.includes as Tour["includes"]) ?? { es: [], en: [] },
    bring: (r.bring as Tour["bring"]) ?? { es: [], en: [] },
    waMessage: l(r.wa_message),
    tone: String(r.tone ?? "#4E6540"),
    mapX: Number(r.map_x ?? 320),
    mapY: Number(r.map_y ?? 450),
    pinLabel: l(r.pin_label),
    active: Boolean(r.active),
    inCarousel: Boolean(r.in_carousel),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function tourToRow(t: Tour): Row {
  return {
    slug: t.slug,
    name: t.name,
    category: t.category,
    short: t.short,
    description: t.description,
    price: Math.round(t.price),
    duration_hours: t.durationHours,
    difficulty: t.difficulty,
    group_max: t.groupMax,
    departure_time: t.departureTime,
    meeting_point: t.meetingPoint,
    schedule_days: t.scheduleDays,
    min_age: t.minAge,
    badge: t.badge && (t.badge.es || t.badge.en) ? t.badge : null,
    photos: t.photos,
    itinerary: t.itinerary,
    includes: t.includes,
    bring: t.bring,
    wa_message: t.waMessage,
    tone: t.tone,
    map_x: t.mapX,
    map_y: t.mapY,
    pin_label: t.pinLabel,
    active: t.active,
    in_carousel: t.inCarousel,
    sort_order: t.sortOrder,
  };
}

export function slideFromRow(r: Row): Slide {
  return {
    id: String(r.id),
    tourId: String(r.tour_id),
    line1: l(r.line1),
    line2: l(r.line2),
    eyebrow: l(r.eyebrow),
    description: l(r.description),
    image: (r.image as string | null) ?? null,
    visible: Boolean(r.visible),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function slideToRow(s: Slide): Row {
  return {
    tour_id: s.tourId,
    line1: s.line1,
    line2: s.line2,
    eyebrow: s.eyebrow,
    description: s.description,
    image: s.image,
    visible: s.visible,
    sort_order: s.sortOrder,
  };
}

export function galleryFromRow(r: Row): GalleryItem {
  return {
    id: String(r.id),
    image: (r.image as string | null) ?? null,
    caption: l(r.caption),
    tone: String(r.tone ?? "#4E6540"),
    visible: Boolean(r.visible),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function testimonialFromRow(r: Row): Testimonial {
  return {
    id: String(r.id),
    quote: l(r.quote),
    name: String(r.name ?? ""),
    tour: l(r.tour),
    tone: String(r.tone ?? "#CDB891"),
    visible: Boolean(r.visible),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function guideFromRow(r: Row): Guide {
  return {
    id: String(r.id),
    name: String(r.name ?? ""),
    role: l(r.role),
    tags: ((r.tags as L10n[]) ?? []).map(l),
    photo: (r.photo as string | null) ?? null,
    tone: String(r.tone ?? "#4E6540"),
    visible: Boolean(r.visible),
    sortOrder: Number(r.sort_order ?? 0),
  };
}

export function faqFromRow(r: Row): Faq {
  return { id: String(r.id), q: l(r.q), a: l(r.a), visible: Boolean(r.visible), sortOrder: Number(r.sort_order ?? 0) };
}

export function settingsFromRow(r: Row | null, fallback: Settings): Settings {
  const d = (r?.data ?? {}) as Partial<Settings>;
  return {
    ...fallback,
    ...d,
    colors: { ...fallback.colors, ...(d.colors ?? {}) },
    social: { ...fallback.social, ...(d.social ?? {}) },
    aboutPhotos: { ...fallback.aboutPhotos, ...(d.aboutPhotos ?? {}) },
  };
}

export interface Reservation {
  id: string;
  date: string;
  time: string;
  client: string;
  whatsapp: string;
  tourId: string | null;
  tourName: string;
  people: number;
  total: number;
  status: "pendiente" | "confirmada" | "cancelada";
  notes: string;
  createdAt: string;
}

export function reservationFromRow(r: Row): Reservation {
  return {
    id: String(r.id),
    date: String(r.date),
    time: String(r.time ?? ""),
    client: String(r.client ?? ""),
    whatsapp: String(r.whatsapp ?? ""),
    tourId: (r.tour_id as string | null) ?? null,
    tourName: String(r.tour_name ?? ""),
    people: Number(r.people ?? 1),
    total: Number(r.total ?? 0),
    status: r.status as Reservation["status"],
    notes: String(r.notes ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}
