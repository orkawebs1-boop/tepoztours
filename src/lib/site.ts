import { cache } from "react";
import { fmt, getDictionary, t, type Dictionary } from "./i18n";
import { durShort, formatHours, numLabel, priceTxt, tourHref, waLink } from "./format";
import { seedData } from "./seed";
import type { Category, Lang, SiteData, Tour } from "./types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Lee el último snapshot publicado desde Supabase. Si todavía no hay
 * ninguno (o la base no responde) se usan los datos del diseño.
 */
export const getSiteData = cache(async (): Promise<SiteData> => {
  if (!SUPABASE_URL || !SUPABASE_KEY) return seedData;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_snapshots?select=data,published_at&order=published_at.desc&limit=1`,
      {
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        cache: "no-store",
      },
    );
    if (!res.ok) return seedData;
    const rows = (await res.json()) as { data: SiteData; published_at: string }[];
    if (!rows.length || !rows[0].data) return seedData;
    return { ...seedData, ...rows[0].data, publishedAt: rows[0].published_at };
  } catch {
    return seedData;
  }
});

export interface TourView {
  id: string;
  slug: string;
  href: string;
  num: string;
  name: string;
  category: Category;
  catLabel: string;
  short: string;
  price: number;
  priceTxt: string;
  dur: string;
  diff: string;
  wa: string;
  cover: string | null;
  tone: string;
  pinLabel: string;
  mapX: number;
  mapY: number;
}

export interface SlideView {
  key: string;
  tourId: string;
  num: string;
  name: string;
  cat: string;
  eyebrow: string;
  line1: string;
  line2: string;
  description: string;
  dur: string;
  diff: string;
  priceTxt: string;
  wa: string;
  href: string;
  image: string | null;
  tone: string;
}

export function activeTours(data: SiteData): Tour[] {
  return data.tours.filter((x) => x.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function tourView(tour: Tour, index: number, lang: Lang, data: SiteData, dict: Dictionary): TourView {
  return {
    id: tour.id,
    slug: tour.slug,
    href: tourHref(lang, tour.slug),
    num: numLabel(index),
    name: t(tour.name, lang),
    category: tour.category,
    catLabel: dict.category[tour.category],
    short: t(tour.short, lang),
    price: tour.price,
    priceTxt: priceTxt(tour.price),
    dur: durShort(tour.durationHours),
    diff: dict.difficulty[tour.difficulty],
    wa: waLink(data.settings.whatsapp, t(tour.waMessage, lang)),
    cover: tour.photos[0]?.url ?? null,
    tone: tour.tone,
    pinLabel: t(tour.pinLabel, lang),
    mapX: tour.mapX,
    mapY: tour.mapY,
  };
}

/** Todo lo que el inicio necesita, ya traducido. */
export function buildHome(data: SiteData, lang: Lang) {
  const dict = getDictionary(lang, data.texts);
  const tours = activeTours(data);
  const views = tours.map((tour, i) => tourView(tour, i, lang, data, dict));
  const byId = new Map(views.map((v) => [v.id, v]));

  const slides: SlideView[] = data.slides
    .filter((s) => s.visible && byId.has(s.tourId) && tours.find((x) => x.id === s.tourId)?.inCarousel)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((s, i) => {
      const v = byId.get(s.tourId)!;
      return {
        key: s.id,
        tourId: s.tourId,
        num: numLabel(i),
        name: v.name,
        cat: v.catLabel,
        eyebrow: t(s.eyebrow, lang),
        line1: t(s.line1, lang) || v.name,
        line2: t(s.line2, lang),
        description: t(s.description, lang),
        dur: v.dur,
        diff: v.diff,
        priceTxt: v.priceTxt,
        wa: v.wa,
        href: v.href,
        image: s.image || v.cover,
        tone: v.tone,
      };
    });

  const sortVisible = <T extends { visible: boolean; sortOrder: number }>(list: T[]) =>
    list.filter((x) => x.visible).sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    dict,
    tours: views,
    slides,
    gallery: sortVisible(data.gallery).map((g) => ({ id: g.id, image: g.image, caption: t(g.caption, lang), tone: g.tone })),
    testimonials: sortVisible(data.testimonials).map((r) => ({
      id: r.id,
      quote: t(r.quote, lang),
      name: r.name,
      tour: t(r.tour, lang),
      tone: r.tone,
    })),
    guides: sortVisible(data.guides).map((g) => ({
      id: g.id,
      name: g.name,
      role: t(g.role, lang),
      tags: g.tags.map((x) => t(x, lang)).filter(Boolean),
      photo: g.photo,
      tone: g.tone,
    })),
    faqs: sortVisible(data.faqs).map((f) => ({ id: f.id, q: t(f.q, lang), a: t(f.a, lang) })),
  };
}

export type HomeData = ReturnType<typeof buildHome>;

/** Todo lo que el detalle de un tour necesita, ya traducido. Null si no existe o está pausado. */
export function buildDetail(data: SiteData, lang: Lang, slug: string) {
  const dict = getDictionary(lang, data.texts);
  const tours = activeTours(data);
  const index = tours.findIndex((x) => x.slug === slug);
  if (index < 0) return null;
  const tour = tours[index];
  const view = tourView(tour, index, lang, data, dict);

  // Relacionados: primero los de la misma categoría, luego el resto en orden.
  const others = tours.filter((x) => x.id !== tour.id);
  const related = [...others.filter((x) => x.category === tour.category), ...others.filter((x) => x.category !== tour.category)]
    .slice(0, 3)
    .map((x) => tourView(x, tours.indexOf(x), lang, data, dict));

  return {
    dict,
    tour: view,
    totalTours: tours.length,
    badge: t(tour.badge, lang),
    description: t(tour.description, lang)
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    photos: tour.photos.map((p) => ({ url: p.url, caption: t(p.caption, lang), tone: p.tone })),
    durationLong: fmt(dict.detail.durationLong, { n: formatHours(tour.durationHours) }),
    groupLong: fmt(dict.detail.upTo, { n: tour.groupMax }),
    groupShort: fmt(dict.detail.upToShort, { n: tour.groupMax }),
    departureTime: tour.departureTime,
    meetingPoint: t(tour.meetingPoint, lang),
    scheduleDays: t(tour.scheduleDays, lang),
    minAge: tour.minAge ? fmt(dict.detail.years, { n: tour.minAge }) : dict.detail.allAges,
    itinerary: tour.itinerary.map((st) => ({ time: st.time, title: t(st.title, lang), detail: t(st.detail, lang) })),
    includes: tour.includes[lang].length ? tour.includes[lang] : tour.includes.es,
    bring: tour.bring[lang].length ? tour.bring[lang] : tour.bring.es,
    waMessage: t(tour.waMessage, lang),
    related,
  };
}

export type DetailData = NonNullable<ReturnType<typeof buildDetail>>;

/** Datos de contacto y enlaces que comparten todas las páginas. */
export function buildChrome(data: SiteData, lang: Lang) {
  const s = data.settings;
  return {
    name: s.name,
    logoUrl: s.logoUrl,
    whatsapp: s.whatsapp,
    waGeneral: waLink(s.whatsapp, t(s.waMessage, lang)),
    email: s.email,
    hours: t(s.hours, lang),
    address: t(s.address, lang),
    social: s.showSocial ? s.social : null,
    tours: activeTours(data).map((x) => ({ slug: x.slug, name: t(x.name, lang), href: tourHref(lang, x.slug) })),
  };
}

export type ChromeData = ReturnType<typeof buildChrome>;
