export const LANGS = ["es", "en"] as const;
export type Lang = (typeof LANGS)[number];

/** Texto en los dos idiomas del sitio. */
export type L10n = { es: string; en: string };
/** Lista de textos en los dos idiomas (qué incluye, qué llevar). */
export type L10nList = { es: string[]; en: string[] };

export const CATEGORIES = ["senderismo", "aventura", "cultura", "bienestar"] as const;
export type Category = (typeof CATEGORIES)[number];

export const DIFFICULTIES = ["facil", "moderada", "exigente"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export interface Photo {
  /** URL pública de la imagen; null mientras no se sube la foto real. */
  url: string | null;
  caption: L10n;
  /** Color de respaldo para el espacio de foto. */
  tone: string;
}

export interface ItineraryStep {
  time: string;
  title: L10n;
  detail: L10n;
}

export interface Tour {
  id: string;
  slug: string;
  name: L10n;
  category: Category;
  short: L10n;
  /** Párrafos separados por una línea en blanco. */
  description: L10n;
  price: number;
  durationHours: number;
  difficulty: Difficulty;
  groupMax: number;
  departureTime: string;
  meetingPoint: L10n;
  scheduleDays: L10n;
  minAge: number | null;
  badge: L10n | null;
  /** La primera foto es la portada. */
  photos: Photo[];
  itinerary: ItineraryStep[];
  includes: L10nList;
  bring: L10nList;
  waMessage: L10n;
  tone: string;
  mapX: number;
  mapY: number;
  pinLabel: L10n;
  active: boolean;
  inCarousel: boolean;
  sortOrder: number;
}

export interface Slide {
  id: string;
  tourId: string;
  line1: L10n;
  line2: L10n;
  eyebrow: L10n;
  description: L10n;
  /** Si es null se usa la portada del tour. */
  image: string | null;
  visible: boolean;
  sortOrder: number;
}

export interface GalleryItem {
  id: string;
  image: string | null;
  caption: L10n;
  tone: string;
  visible: boolean;
  sortOrder: number;
}

export interface Testimonial {
  id: string;
  quote: L10n;
  name: string;
  tour: L10n;
  tone: string;
  visible: boolean;
  sortOrder: number;
}

export interface Guide {
  id: string;
  name: string;
  role: L10n;
  tags: L10n[];
  photo: string | null;
  tone: string;
  visible: boolean;
  sortOrder: number;
}

export interface Faq {
  id: string;
  q: L10n;
  a: L10n;
  visible: boolean;
  sortOrder: number;
}

export interface BrandColors {
  forest: string;
  terra: string;
  amber: string;
  sand: string;
  cream: string;
}

export interface Settings {
  name: string;
  slogan: L10n;
  email: string;
  hours: L10n;
  address: L10n;
  /** 10 dígitos, sin lada de país. Vacío mientras no se captura. */
  whatsapp: string;
  waMessage: L10n;
  logoUrl: string | null;
  /** Fotos de la sección «Somos de aquí». */
  aboutPhotos: { main: string | null; secondary: string | null };
  colors: BrandColors;
  social: { facebook: string; instagram: string; tiktok: string };
  showSocial: boolean;
  heroAutoplay: boolean;
  heroInterval: number;
}

/** Todo lo que el sitio público necesita; es lo que se guarda al publicar. */
export interface SiteData {
  settings: Settings;
  tours: Tour[];
  slides: Slide[];
  gallery: GalleryItem[];
  testimonials: Testimonial[];
  guides: Guide[];
  faqs: Faq[];
  /** Textos editables del sitio que reemplazan a los del diccionario. */
  texts: Record<string, L10n>;
  publishedAt: string | null;
}
