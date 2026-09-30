import "server-only";
import { supabaseServer } from "../supabase/server";
import { seedData } from "../seed";
import type { Settings, SiteData } from "../types";
import {
  faqFromRow,
  galleryFromRow,
  guideFromRow,
  reservationFromRow,
  settingsFromRow,
  slideFromRow,
  testimonialFromRow,
  tourFromRow,
} from "./rows";

/** Lecturas iniciales del panel, hechas en el servidor con la sesión del administrador. */

type Row = Record<string, unknown>;
const coverOf = (photos: unknown) => ((photos as { url: string | null }[]) ?? []).find((p) => p.url)?.url ?? null;
const nameEs = (name: unknown) => (name as { es: string })?.es ?? "";

export async function loadTours() {
  const sb = await supabaseServer();
  const { data } = await sb.from("tours").select("*").order("sort_order").order("created_at");
  return (data ?? []).map(tourFromRow);
}

export async function loadPriceRows() {
  const sb = await supabaseServer();
  const { data } = await sb.from("tours").select("id, name, category, price, tone, active, photos").order("sort_order").order("created_at");
  return (data ?? []).map((t: Row) => ({
    id: String(t.id),
    name: nameEs(t.name),
    category: String(t.category),
    price: Number(t.price),
    tone: String(t.tone),
    active: Boolean(t.active),
    cover: coverOf(t.photos),
  }));
}

export async function loadSettings(): Promise<Settings> {
  const sb = await supabaseServer();
  const { data } = await sb.from("settings").select("data").eq("id", 1).maybeSingle();
  return settingsFromRow(data, seedData.settings);
}

export async function loadHero() {
  const sb = await supabaseServer();
  const [sl, tr, settings] = await Promise.all([
    sb.from("slides").select("*").order("sort_order").order("created_at"),
    sb.from("tours").select("id, name, photos, tone, active").order("sort_order"),
    loadSettings(),
  ]);
  return {
    slides: (sl.data ?? []).map(slideFromRow),
    tours: (tr.data ?? []).map((t: Row) => ({
      id: String(t.id),
      name: nameEs(t.name),
      cover: coverOf(t.photos),
      tone: String(t.tone),
      active: Boolean(t.active),
    })),
    hero: { heroAutoplay: settings.heroAutoplay, heroInterval: settings.heroInterval },
  };
}

export async function loadContenido() {
  const sb = await supabaseServer();
  const q = (t: string) => sb.from(t).select("*").order("sort_order").order("created_at");
  const [g, r, t, f, settings] = await Promise.all([q("gallery_items"), q("testimonials"), q("guides"), q("faqs"), loadSettings()]);
  return {
    lists: {
      gal: (g.data ?? []).map(galleryFromRow),
      rev: (r.data ?? []).map(testimonialFromRow),
      team: (t.data ?? []).map(guideFromRow),
      faq: (f.data ?? []).map(faqFromRow),
    },
    about: settings.aboutPhotos,
  };
}

export async function loadReservas() {
  const sb = await supabaseServer();
  const [r, t] = await Promise.all([
    sb.from("reservations").select("*").order("date").order("time"),
    sb.from("tours").select("id, name, price").order("sort_order"),
  ]);
  return {
    rows: (r.data ?? []).map(reservationFromRow),
    tours: (t.data ?? []).map((x: Row) => ({ id: String(x.id), name: nameEs(x.name), price: Number(x.price) })),
  };
}

/** Contenido del borrador con la misma forma que un snapshot publicado (para la vista previa del editor). */
export async function loadDraftSite(): Promise<SiteData> {
  const sb = await supabaseServer();
  const q = (t: string) => sb.from(t).select("*").order("sort_order").order("created_at");
  const [tours, slides, gal, rev, guides, faqs, texts, settings] = await Promise.all([
    q("tours"),
    q("slides"),
    q("gallery_items"),
    q("testimonials"),
    q("guides"),
    q("faqs"),
    sb.from("site_texts").select("key, value"),
    loadSettings(),
  ]);
  return {
    settings,
    tours: (tours.data ?? []).map(tourFromRow).filter((t) => t.active),
    slides: (slides.data ?? []).map(slideFromRow).filter((x) => x.visible),
    gallery: (gal.data ?? []).map(galleryFromRow).filter((x) => x.visible),
    testimonials: (rev.data ?? []).map(testimonialFromRow).filter((x) => x.visible),
    guides: (guides.data ?? []).map(guideFromRow).filter((x) => x.visible),
    faqs: (faqs.data ?? []).map(faqFromRow).filter((x) => x.visible),
    texts: Object.fromEntries((texts.data ?? []).map((r: Row) => [String(r.key), r.value as { es: string; en: string }])),
    publishedAt: null,
  };
}
