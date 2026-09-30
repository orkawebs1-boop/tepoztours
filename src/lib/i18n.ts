import type { Category, Difficulty, L10n, Lang } from "./types";
import { LANGS } from "./types";

export const DEFAULT_LANG: Lang = "es";

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

const es = {
  meta: {
    title: "TepozTours · Tours con guías locales en Tepoztlán",
    description:
      "Senderismo, cuevas volcánicas, cabalgata, bici, cultura y temazcal en Tepoztlán, Morelos. Grupos pequeños con guías locales y reservas por WhatsApp.",
  },
  nav: {
    main: "Principal",
    home: "Inicio",
    tours: "Tours",
    explore: "Explorar",
    about: "Nosotros",
    contact: "Contacto",
    homeAria: "TepozTours, inicio",
    search: "Buscar tours",
    searchEmpty: "No encontramos tours con ese nombre.",
    lang: "Idioma",
    otherLang: "Ver la página en inglés",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    skip: "Saltar al contenido",
  },
  common: {
    book: "Reservar",
    bookWa: "Reservar por WhatsApp",
    viewDetails: "Ver detalles",
    from: "Desde",
    mxn: "MXN",
    perPerson: "MXN / persona",
    photo: "Foto",
    portrait: "Retrato",
    waFloat: "Escríbenos por WhatsApp",
    prevTour: "Tour anterior",
    nextTour: "Siguiente tour",
    viewTour: "Ver tour",
    hours: "h",
  },
  trust: {
    label: "Por qué viajar con nosotros",
    t1: "Guías locales",
    d1: "Crecimos en Tepoztlán y conocemos cada sendero, cueva y leyenda.",
    t2: "Grupos pequeños",
    d2: "Salidas de pocas personas, a tu ritmo y con atención cercana.",
    t3: "Atención por WhatsApp",
    d3: "Reserva y resuelve tus dudas en minutos, sin formularios.",
  },
  tours: {
    eyebrow: "{n} experiencias en Tepoztlán",
    title: "Elige tu aventura",
    intro:
      "Senderos, cuevas, caballos, bici y tradición. Todas las salidas son con guía local y se reservan en minutos por WhatsApp.",
    filter: "Filtrar tours por categoría",
    all: "Todos",
    showAll: "Ver los {n} tours",
    empty: "Pronto tendremos tours en esta categoría.",
  },
  explore: {
    eyebrow: "Explorar",
    title: "Explora\nTepoztlán",
    intro: "Elige cómo quieres vivir el valle y mira en el mapa dónde sucede cada tour.",
    introMobile: "Toca una categoría para verla en el mapa.",
    showAll: "Mostrar todos en el mapa",
    mapNote: "Mapa ilustrativo · no a escala",
    mapNoteShort: "Mapa ilustrativo",
    range: "Sierra de Tepoztlán",
    town: "TEPOZTLÁN",
    count1: "1 tour",
    countN: "{n} tours",
  },
  about: {
    eyebrow: "Nosotros",
    title: "Somos de aquí",
    p1: "TepozTours nació de un grupo de guías que crecimos caminando estos cerros. Conocemos los atajos, la temporada de las cascadas y las historias que no vienen en los mapas.",
    p2: "Hoy compartimos ese Tepoztlán con viajeros de todas partes, en grupos pequeños y con respeto por la tierra y las comunidades que nos reciben.",
    missionTitle: "Nuestra misión",
    mission:
      "Que cada visitante conozca Tepoztlán como lo vivimos los locales: con seguridad, calma y respeto por la naturaleza y la cultura del valle.",
    badge: "Hecho en\nTepoztlán",
    photo1: "Foto: guías en el sendero",
    photo2: "Foto: el pueblo",
    guidesTitle: "Equipo de guías",
    guidesIntro: "Personas que conocen cada rincón del valle y te cuidan en todo el recorrido.",
  },
  gallery: {
    eyebrow: "Galería",
    title: "Así se vive",
    follow: "Síguenos en Instagram",
  },
  reviews: {
    eyebrow: "Testimonios",
    title: "Lo que dicen los viajeros",
    stars: "5 de 5 estrellas",
    customer: "[Nombre del cliente]",
  },
  faq: {
    eyebrow: "Preguntas frecuentes",
    title: "¿Tienes dudas?",
    intro: "Si no encuentras tu respuesta aquí, escríbenos y te contestamos en minutos.",
    ask: "Preguntar por WhatsApp",
  },
  contact: {
    eyebrow: "Contacto",
    title: "Hablemos",
    intro: "Cuéntanos qué te gustaría vivir en Tepoztlán y te ayudamos a elegir el tour ideal.",
    whatsapp: "WhatsApp",
    email: "Correo",
    meeting: "Punto de encuentro",
    hours: "Horario",
    write: "Escribir por WhatsApp",
    downtown: "Centro de Tepoztlán",
    directions: "Cómo llegar",
    square: "Zócalo",
    phonePending: "[000 0000]",
    emailPending: "hola@[tudominio].mx",
  },
  footer: {
    blurb: "Tours con guías locales en Tepoztlán, Morelos. Naturaleza, aventura y tradición a tu ritmo.",
    tours: "Tours",
    explore: "Explora",
    follow: "Síguenos",
    gallery: "Galería",
    faq: "Preguntas frecuentes",
    privacy: "Aviso de privacidad",
    rights: "© {year} TepozTours · Tepoztlán, Morelos",
    rightsShort: "© {year} TepozTours",
    nav: "Pie de página",
    town: "Tepoztlán, Morelos",
  },
  detail: {
    crumb: "Ruta de navegación",
    allTours: "Todos los tours",
    photoOf: "Foto {n} de {total}",
    viewPhoto: "Ver foto: {label}",
    prevPhoto: "Foto anterior",
    nextPhoto: "Foto siguiente",
    back: "Volver",
    duration: "Duración",
    difficulty: "Dificultad",
    group: "Grupo",
    upTo: "Hasta {n} personas",
    upToShort: "Hasta {n}",
    departure: "Salida",
    meeting: "Encuentro",
    aboutTour: "Sobre el tour",
    description: "Descripción",
    itinerary: "Itinerario",
    includes: "Qué incluye",
    bring: "Qué llevar",
    perPerson: "MXN por persona",
    departures: "Salidas",
    minAge: "Edad mínima",
    years: "{n} años",
    allAges: "Todas las edades",
    waWillOpen: "Se abrirá WhatsApp con este mensaje:",
    waWillOpenMobile: "Al tocar «Reservar» se abrirá WhatsApp con:",
    noPayments: "Sin pagos en línea. Confirmamos tu lugar y la forma de pago directamente por WhatsApp.",
    noPaymentsShort: "Sin pagos en línea: confirmamos por WhatsApp.",
    keepExploring: "Sigue explorando",
    related: "Tours relacionados",
    seeAll: "Ver los {n} tours",
    browse: "Explorar catálogo",
    durationLong: "{n} horas",
    notFound: "No encontramos este tour.",
  },
  category: {
    senderismo: "Senderismo",
    aventura: "Aventura",
    cultura: "Cultura",
    bienestar: "Bienestar",
  } satisfies Record<Category, string>,
  difficulty: {
    facil: "Fácil",
    moderada: "Moderada",
    exigente: "Exigente",
  } satisfies Record<Difficulty, string>,
};

export type Dictionary = typeof es;

type DeepString<T> = { [K in keyof T]: T[K] extends string ? string : DeepString<T[K]> };

const en: DeepString<Dictionary> = {
  meta: {
    title: "TepozTours · Tours with local guides in Tepoztlán",
    description:
      "Hiking, volcanic caves, horseback rides, biking, culture and temazcal in Tepoztlán, Morelos. Small groups with local guides and WhatsApp booking.",
  },
  nav: {
    main: "Main",
    home: "Home",
    tours: "Tours",
    explore: "Explore",
    about: "About us",
    contact: "Contact",
    homeAria: "TepozTours, home",
    search: "Search tours",
    searchEmpty: "We couldn't find a tour with that name.",
    lang: "Language",
    otherLang: "Ver la página en español",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    skip: "Skip to content",
  },
  common: {
    book: "Book",
    bookWa: "Book on WhatsApp",
    viewDetails: "View details",
    from: "From",
    mxn: "MXN",
    perPerson: "MXN / person",
    photo: "Photo",
    portrait: "Portrait",
    waFloat: "Message us on WhatsApp",
    prevTour: "Previous tour",
    nextTour: "Next tour",
    viewTour: "View tour",
    hours: "h",
  },
  trust: {
    label: "Why travel with us",
    t1: "Local guides",
    d1: "We grew up in Tepoztlán and know every trail, cave and legend.",
    t2: "Small groups",
    d2: "Small departures, at your own pace and with personal attention.",
    t3: "WhatsApp support",
    d3: "Book and get answers in minutes, no forms needed.",
  },
  tours: {
    eyebrow: "{n} experiences in Tepoztlán",
    title: "Choose your adventure",
    intro:
      "Trails, caves, horses, bikes and tradition. Every tour has a local guide and can be booked in minutes on WhatsApp.",
    filter: "Filter tours by category",
    all: "All",
    showAll: "See all {n} tours",
    empty: "Tours in this category are coming soon.",
  },
  explore: {
    eyebrow: "Explore",
    title: "Explore\nTepoztlán",
    intro: "Choose how you want to experience the valley and see on the map where each tour happens.",
    introMobile: "Tap a category to see it on the map.",
    showAll: "Show all on the map",
    mapNote: "Illustrative map · not to scale",
    mapNoteShort: "Illustrative map",
    range: "Tepoztlán Range",
    town: "TEPOZTLÁN",
    count1: "1 tour",
    countN: "{n} tours",
  },
  about: {
    eyebrow: "About us",
    title: "We're from here",
    p1: "TepozTours was born from a group of guides who grew up hiking these hills. We know the shortcuts, the waterfall season and the stories you won't find on any map.",
    p2: "Today we share that Tepoztlán with travelers from everywhere, in small groups and with respect for the land and the communities that welcome us.",
    missionTitle: "Our mission",
    mission:
      "That every visitor gets to know Tepoztlán the way locals live it: safely, calmly and with respect for the valley's nature and culture.",
    badge: "Made in\nTepoztlán",
    photo1: "Photo: guides on the trail",
    photo2: "Photo: the town",
    guidesTitle: "Our guides",
    guidesIntro: "People who know every corner of the valley and look after you the whole way.",
  },
  gallery: {
    eyebrow: "Gallery",
    title: "How it feels",
    follow: "Follow us on Instagram",
  },
  reviews: {
    eyebrow: "Reviews",
    title: "What travelers say",
    stars: "5 out of 5 stars",
    customer: "[Customer name]",
  },
  faq: {
    eyebrow: "FAQ",
    title: "Questions?",
    intro: "If you can't find your answer here, message us and we'll reply in minutes.",
    ask: "Ask on WhatsApp",
  },
  contact: {
    eyebrow: "Contact",
    title: "Let's talk",
    intro: "Tell us what you'd like to experience in Tepoztlán and we'll help you pick the right tour.",
    whatsapp: "WhatsApp",
    email: "Email",
    meeting: "Meeting point",
    hours: "Hours",
    write: "Message us on WhatsApp",
    downtown: "Downtown Tepoztlán",
    directions: "Get directions",
    square: "Main square",
    phonePending: "[000 0000]",
    emailPending: "hello@[yourdomain].mx",
  },
  footer: {
    blurb: "Tours with local guides in Tepoztlán, Morelos. Nature, adventure and tradition at your own pace.",
    tours: "Tours",
    explore: "Explore",
    follow: "Follow us",
    gallery: "Gallery",
    faq: "FAQ",
    privacy: "Privacy notice",
    rights: "© {year} TepozTours · Tepoztlán, Morelos",
    rightsShort: "© {year} TepozTours",
    nav: "Footer",
    town: "Tepoztlán, Morelos",
  },
  detail: {
    crumb: "Breadcrumb",
    allTours: "All tours",
    photoOf: "Photo {n} of {total}",
    viewPhoto: "View photo: {label}",
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
    back: "Back",
    duration: "Duration",
    difficulty: "Difficulty",
    group: "Group",
    upTo: "Up to {n} people",
    upToShort: "Up to {n}",
    departure: "Departure",
    meeting: "Meeting point",
    aboutTour: "About the tour",
    description: "Description",
    itinerary: "Itinerary",
    includes: "What's included",
    bring: "What to bring",
    perPerson: "MXN per person",
    departures: "Departures",
    minAge: "Minimum age",
    years: "{n} years",
    allAges: "All ages",
    waWillOpen: "WhatsApp will open with this message:",
    waWillOpenMobile: "Tapping “Book” opens WhatsApp with:",
    noPayments: "No online payments. We confirm your spot and payment method directly on WhatsApp.",
    noPaymentsShort: "No online payments: we confirm on WhatsApp.",
    keepExploring: "Keep exploring",
    related: "Related tours",
    seeAll: "See all {n} tours",
    browse: "Browse the catalog",
    durationLong: "{n} hours",
    notFound: "We couldn't find this tour.",
  },
  category: {
    senderismo: "Hiking",
    aventura: "Adventure",
    cultura: "Culture",
    bienestar: "Wellness",
  },
  difficulty: {
    facil: "Easy",
    moderada: "Moderate",
    exigente: "Challenging",
  },
};

const dictionaries: Record<Lang, Dictionary> = { es, en: en as Dictionary };

/**
 * Diccionario del idioma con los textos editados en el panel aplicados encima.
 * Las llaves de `texts` usan la ruta del diccionario, por ejemplo "about.title".
 */
export function getDictionary(lang: Lang, texts: Record<string, L10n> = {}): Dictionary {
  const base = dictionaries[lang];
  const keys = Object.keys(texts);
  if (keys.length === 0) return base;
  const copy = structuredClone(base) as Record<string, Record<string, string>>;
  for (const key of keys) {
    const [group, name] = key.split(".");
    const value = texts[key]?.[lang];
    if (group && name && copy[group] && typeof copy[group][name] === "string" && value) {
      copy[group][name] = value;
    }
  }
  return copy as unknown as Dictionary;
}

/** Reemplaza {n}, {total}, etc. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function t(l: L10n | null | undefined, lang: Lang): string {
  if (!l) return "";
  return l[lang] || l.es || "";
}

export const otherLang = (lang: Lang): Lang => (lang === "es" ? "en" : "es");
