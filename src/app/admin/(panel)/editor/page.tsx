"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAdmin, usePageSave } from "@/components/admin/AdminShell";
import type { EditorMessage } from "@/components/admin/EditOverlay";
import { L10nField, LangTabs, TextField } from "@/components/admin/fields";
import { Icon } from "@/components/icons";
import { pickImages, uploadImage } from "@/lib/admin/upload";
import type { EditKind } from "@/lib/edit";
import { priceTxt } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { L10n, Lang, Photo } from "@/lib/types";
import s from "./editor.module.css";

type Device = "desktop" | "tablet" | "mobile";
const DEVICES: Record<Device, { w: number; h: number; label: string; icon: "desktop" | "tablet" | "phone" }> = {
  desktop: { w: 1440, h: 900, label: "Escritorio", icon: "desktop" },
  tablet: { w: 768, h: 1024, label: "Tablet", icon: "tablet" },
  mobile: { w: 390, h: 844, label: "Móvil", icon: "phone" },
};

const emptyL = (): L10n => ({ es: "", en: "" });

/** Lo que se está editando de cada destino; se guarda todo junto con «Guardar». */
type Draft =
  | { type: "text"; key: string; value: L10n }
  | { type: "slide"; id: string; line1: L10n; line2: L10n; eyebrow: L10n; description: L10n }
  | { type: "slideimg"; id: string; image: string | null; tourCover: string | null }
  | { type: "tour"; id: string; name: L10n; short: L10n }
  | { type: "price"; id: string; price: number; name: string }
  | { type: "tourimg"; id: string; photos: Photo[]; name: string }
  | { type: "gal"; id: string; image: string | null; caption: L10n }
  | { type: "guide"; id: string; name: string; role: L10n; photo: string | null }
  | { type: "rev"; id: string; quote: L10n; name: string; tour: L10n }
  | { type: "faq"; id: string; q: L10n; a: L10n }
  | { type: "about"; which: "main" | "secondary"; url: string | null }
  | { type: "settings"; email: string; whatsapp: string; hours: L10n; address: L10n };

const TITLES: Record<Draft["type"], string> = {
  text: "Texto",
  slide: "Slide del carrusel",
  slideimg: "Imagen del carrusel",
  tour: "Tour",
  price: "Precio",
  tourimg: "Portada del tour",
  gal: "Foto de la galería",
  guide: "Guía",
  rev: "Testimonio",
  faq: "Pregunta frecuente",
  about: "Foto de «Somos de aquí»",
  settings: "Datos de contacto",
};

const TEXT_NAMES: Record<string, string> = {
  "trust.t1": "Confianza · título 1",
  "trust.d1": "Confianza · texto 1",
  "trust.t2": "Confianza · título 2",
  "trust.d2": "Confianza · texto 2",
  "trust.t3": "Confianza · título 3",
  "trust.d3": "Confianza · texto 3",
  "tours.title": "Tours · título",
  "tours.intro": "Tours · introducción",
  "explore.title": "Explorar · título",
  "explore.intro": "Explorar · introducción",
  "explore.introMobile": "Explorar · introducción en móvil",
  "about.title": "Nosotros · título",
  "about.p1": "Nosotros · párrafo 1",
  "about.p2": "Nosotros · párrafo 2",
  "about.missionTitle": "Misión · título",
  "about.mission": "Misión · texto",
  "about.guidesTitle": "Equipo · título",
  "about.guidesIntro": "Equipo · introducción",
  "gallery.title": "Galería · título",
  "reviews.title": "Testimonios · título",
  "faq.title": "Preguntas · título",
  "faq.intro": "Preguntas · introducción",
  "contact.title": "Contacto · título",
  "contact.intro": "Contacto · introducción",
  "footer.blurb": "Pie de página · descripción",
};

function dictValue(key: string, lang: Lang): string {
  const [g, n] = key.split(".");
  const d = getDictionary(lang) as unknown as Record<string, Record<string, string>>;
  return d[g]?.[n] ?? "";
}

export default function EditorPage() {
  const { toast, refreshStatus } = useAdmin();
  const [device, setDevice] = useState<Device>("desktop");
  const [lang, setLang] = useState<Lang>("es");
  const [formLang, setFormLang] = useState<Lang>("es");
  const [reloadKey, setReloadKey] = useState(0);
  const [target, setTarget] = useState<{ id: string; kind: EditKind } | null>(null);
  const [pending, setPending] = useState<Record<string, Draft>>({});
  const [draft, setDraft] = useState<Draft | null>(null);
  const [loadingTarget, setLoadingTarget] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scale, setScale] = useState(1);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef(pending);
  useEffect(() => {
    pendingRef.current = pending;
  }, [pending]);

  const dev = DEVICES[device];

  // Escala del iframe para que quepa en el área disponible.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const pad = device === "desktop" ? 0 : 48;
      const sc = Math.min((el.clientWidth - pad) / dev.w, (el.clientHeight - pad) / dev.h, 1);
      setScale(sc > 0 ? sc : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [device, dev.w, dev.h]);

  const post = useCallback((msg: Omit<Extract<EditorMessage, { type: "patch" }>, "source"> | Omit<Extract<EditorMessage, { type: "select" }>, "source">) => {
    frameRef.current?.contentWindow?.postMessage({ source: "tt-panel", ...msg }, window.location.origin);
  }, []);

  /* ---------- Cargar el destino elegido en el iframe ---------- */
  const open = useCallback(
    async (id: string, kind: EditKind) => {
      setTarget({ id, kind });
      const saved = pendingRef.current[id];
      if (saved) {
        setDraft(saved);
        return;
      }
      setLoadingTarget(true);
      const sb = supabaseBrowser();
      const cut = id.indexOf(":");
      const type = cut < 0 ? id : id.slice(0, cut);
      const rest = cut < 0 ? "" : id.slice(cut + 1);
      let d: Draft | null = null;
      try {
        if (type === "text") {
          const { data } = await sb.from("site_texts").select("value").eq("key", rest).maybeSingle();
          d = { type: "text", key: rest, value: (data?.value as L10n) ?? { es: dictValue(rest, "es"), en: dictValue(rest, "en") } };
        } else if (type === "slide" || type === "slideimg") {
          const { data } = await sb.from("slides").select("*, tours(photos)").eq("id", rest).maybeSingle();
          if (data) {
            if (type === "slide") d = { type, id: rest, line1: data.line1, line2: data.line2, eyebrow: data.eyebrow, description: data.description };
            else {
              const photos = ((data.tours as { photos?: Photo[] } | null)?.photos ?? []) as Photo[];
              d = { type, id: rest, image: data.image, tourCover: photos.find((p) => p.url)?.url ?? null };
            }
          }
        } else if (type === "tour" || type === "price" || type === "tourimg") {
          const { data } = await sb.from("tours").select("name, short, price, photos").eq("id", rest).maybeSingle();
          if (data) {
            if (type === "tour") d = { type, id: rest, name: data.name, short: data.short };
            else if (type === "price") d = { type, id: rest, price: data.price, name: data.name.es };
            else d = { type, id: rest, photos: data.photos, name: data.name.es };
          }
        } else if (type === "gal") {
          const { data } = await sb.from("gallery_items").select("image, caption").eq("id", rest).maybeSingle();
          if (data) d = { type, id: rest, image: data.image, caption: data.caption };
        } else if (type === "guide") {
          const { data } = await sb.from("guides").select("name, role, photo").eq("id", rest).maybeSingle();
          if (data) d = { type, id: rest, name: data.name, role: data.role, photo: data.photo };
        } else if (type === "rev") {
          const { data } = await sb.from("testimonials").select("quote, name, tour").eq("id", rest).maybeSingle();
          if (data) d = { type, id: rest, quote: data.quote, name: data.name, tour: data.tour };
        } else if (type === "faq") {
          const { data } = await sb.from("faqs").select("q, a").eq("id", rest).maybeSingle();
          if (data) d = { type, id: rest, q: data.q, a: data.a };
        } else if (type === "about" || type === "settings") {
          const { data } = await sb.from("settings").select("data").eq("id", 1).maybeSingle();
          const st = (data?.data ?? {}) as { aboutPhotos?: Record<string, string | null>; email?: string; whatsapp?: string; hours?: L10n; address?: L10n };
          if (type === "about") d = { type, which: rest as "main" | "secondary", url: st.aboutPhotos?.[rest] ?? null };
          else d = { type, email: st.email ?? "", whatsapp: st.whatsapp ?? "", hours: st.hours ?? emptyL(), address: st.address ?? emptyL() };
        }
      } finally {
        setLoadingTarget(false);
      }
      if (!d) {
        toast("err", "No se pudo abrir", "Ese elemento ya no existe. Recarga la vista previa.");
        return;
      }
      setDraft(d);
    },
    [toast],
  );

  /* ---------- Cambios en vivo ---------- */
  const livePatch = useCallback(
    (id: string, d: Draft) => {
    const t = (v: L10n) => v[lang] || v.es;
    switch (d.type) {
      case "text":
        post({ type: "patch", target: id, kind: "text", value: t(d.value) });
        break;
      case "slide":
        (["line1", "line2", "eyebrow", "description"] as const).forEach((p) => post({ type: "patch", target: id, kind: "text", part: p, value: t(d[p]) }));
        break;
      case "slideimg":
        if (d.image || d.tourCover) post({ type: "patch", target: id, kind: "image", value: (d.image || d.tourCover)! });
        break;
      case "tour":
        post({ type: "patch", target: id, kind: "text", value: t(d.name) });
        break;
      case "price":
        post({ type: "patch", target: id, kind: "price", value: priceTxt(d.price || 0) });
        break;
      case "tourimg":
        if (d.photos[0]?.url) post({ type: "patch", target: id, kind: "image", value: d.photos[0].url });
        break;
      case "gal":
      case "guide":
        if (d.type === "gal" ? d.image : d.photo) post({ type: "patch", target: id, kind: "image", value: (d.type === "gal" ? d.image : d.photo)! });
        break;
      case "about":
        if (d.url) post({ type: "patch", target: id, kind: "image", value: d.url });
        break;
      default:
        break;
    }
  },
    [lang, post],
  );

  // Mensajes desde la vista previa.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.source !== "tt-preview") return;
      if (e.data.type === "edit") open(e.data.target, e.data.kind);
      if (e.data.type === "ready") {
        // Reaplica los cambios pendientes tras recargar la vista previa.
        Object.entries(pendingRef.current).forEach(([id, d]) => livePatch(id, d));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [open, livePatch]);

  const change = (next: Draft) => {
    if (!target) return;
    setDraft(next);
    setPending((p) => ({ ...p, [target.id]: next }));
    livePatch(target.id, next);
  };

  const upload = async (folder: string, apply: (url: string) => Draft) => {
    const [file] = await pickImages(false);
    if (!file) return;
    try {
      const url = await uploadImage(file, folder);
      change(apply(url));
      toast("ok", "Imagen lista", "Ya se ve en la vista previa. Toca Guardar para conservarla.");
    } catch {
      toast("err", "No se pudo subir la imagen", "Usa JPG, PNG o WebP de menos de 8 MB.");
    }
  };

  /* ---------- Guardar todo ---------- */
  const saveAll = async (): Promise<boolean> => {
    const entries = Object.values(pendingRef.current);
    const badPrice = entries.find((d) => d.type === "price" && !(d.price > 0));
    if (badPrice) {
      toast("err", "Revisa el precio", "Escribe un precio mayor a 0.");
      return false;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    let failed = false;
    for (const d of entries) {
      let res: { error: unknown } = { error: null };
      if (d.type === "text") res = await sb.from("site_texts").upsert({ key: d.key, value: d.value });
      else if (d.type === "slide") res = await sb.from("slides").update({ line1: d.line1, line2: d.line2, eyebrow: d.eyebrow, description: d.description }).eq("id", d.id);
      else if (d.type === "slideimg") res = await sb.from("slides").update({ image: d.image }).eq("id", d.id);
      else if (d.type === "tour") res = await sb.from("tours").update({ name: d.name, short: d.short }).eq("id", d.id);
      else if (d.type === "price") res = await sb.from("tours").update({ price: Math.round(d.price) }).eq("id", d.id);
      else if (d.type === "tourimg") res = await sb.from("tours").update({ photos: d.photos }).eq("id", d.id);
      else if (d.type === "gal") res = await sb.from("gallery_items").update({ image: d.image, caption: d.caption }).eq("id", d.id);
      else if (d.type === "guide") res = await sb.from("guides").update({ name: d.name, role: d.role, photo: d.photo }).eq("id", d.id);
      else if (d.type === "rev") res = await sb.from("testimonials").update({ quote: d.quote, name: d.name, tour: d.tour }).eq("id", d.id);
      else if (d.type === "faq") res = await sb.from("faqs").update({ q: d.q, a: d.a }).eq("id", d.id);
      else if (d.type === "about" || d.type === "settings") {
        const { data } = await sb.from("settings").select("data").eq("id", 1).maybeSingle();
        const cur = (data?.data ?? {}) as Record<string, unknown>;
        const next =
          d.type === "about"
            ? { ...cur, aboutPhotos: { ...((cur.aboutPhotos as object) ?? {}), [d.which]: d.url } }
            : { ...cur, email: d.email, whatsapp: d.whatsapp.replace(/\D/g, ""), hours: d.hours, address: d.address };
        res = await sb.from("settings").update({ data: next }).eq("id", 1);
      }
      if (res.error) failed = true;
    }
    setBusy(false);
    if (failed) {
      toast("err", "Algunos cambios no se guardaron", "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
      return false;
    }
    setPending({});
    setReloadKey((k) => k + 1);
    await refreshStatus();
    toast("ok", "Cambios guardados", "Aún no se ven en el sitio. Toca Publicar cuando estés listo.");
    return true;
  };

  const count = Object.keys(pending).length;
  usePageSave(count > 0, saveAll);

  const title = draft && target ? (draft.type === "text" ? TEXT_NAMES[draft.key] ?? "Texto" : TITLES[draft.type]) : "Nada seleccionado";

  return (
    <div className={s.layout}>
      <div className={s.left}>
        <div className={`ad-card ${s.bar}`}>
          <div className={s.barL}>
            <span className={s.pageLabel}>Página: Inicio</span>
            <div className="ad-lang-tabs" role="group" aria-label="Idioma de la vista previa">
              {(["es", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  className={lang === l ? "is-on" : ""}
                  aria-pressed={lang === l}
                  onClick={() => {
                    setLang(l);
                    setFormLang(l);
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <span className={s.tip}>
              <span className={s.dash} />
              Toca un botón negro para editar esa parte
            </span>
          </div>
          <div className="ad-seg" role="group" aria-label="Tamaño de la vista previa">
            {(Object.keys(DEVICES) as Device[]).map((k) => (
              <button key={k} type="button" className={`ad-seg-b ${device === k ? "is-on" : ""}`} aria-pressed={device === k} onClick={() => setDevice(k)}>
                <Icon name={DEVICES[k].icon} />
                {DEVICES[k].label}
              </button>
            ))}
          </div>
        </div>

        <div className={s.canvas} ref={stageRef}>
          <div
            className={`${s.frame} ${device !== "desktop" ? s.device : ""}`}
            style={{ width: dev.w * scale + (device !== "desktop" ? 20 : 0), height: dev.h * scale + (device !== "desktop" ? 20 : 0) }}
          >
            <iframe
              key={`${lang}-${reloadKey}`}
              ref={frameRef}
              title="Vista previa del sitio"
              src={`/admin/vista/${lang}`}
              style={{ width: dev.w, height: dev.h, transform: `scale(${scale})` }}
            />
          </div>
        </div>
      </div>

      <aside className={`ad-card ${s.inspector}`}>
        <div className={s.inspHead}>
          <span className={s.kicker}>Editando</span>
          <h2 className="tt-d">{title}</h2>
          {target && <span className={s.where}>{target.id.startsWith("text:") ? "Texto del sitio" : "Contenido del panel"}</span>}
        </div>
        <div className={s.inspBody}>
          {target && draft && <LangTabs lang={formLang} onChange={setFormLang} label="Idioma" />}
          <Inspector target={target} draft={draft} loadingTarget={loadingTarget} formLang={formLang} change={change} upload={upload} />
        </div>
        <div className={s.inspFoot}>
          <span className={s.count}>{count ? `${count} ${count === 1 ? "cambio sin guardar" : "cambios sin guardar"}` : "Sin cambios pendientes"}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {count > 0 && (
              <button
                type="button"
                className="ad-btn ad-btn-plain"
                onClick={() => {
                  setPending({});
                  setDraft(null);
                  setTarget(null);
                  setReloadKey((k) => k + 1);
                }}
              >
                Descartar
              </button>
            )}
            <button type="button" className="ad-btn ad-btn-forest" onClick={saveAll} disabled={busy || count === 0}>
              <Icon name="check" />
              {busy ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Inspector ---------- */
function Inspector({
  target,
  draft,
  loadingTarget,
  formLang,
  change,
  upload,
}: {
  target: { id: string; kind: EditKind } | null;
  draft: Draft | null;
  loadingTarget: boolean;
  formLang: Lang;
  change: (d: Draft) => void;
  upload: (folder: string, apply: (url: string) => Draft) => void;
}) {

    if (!target) {
      return (
        <div className={s.hint}>
          <Icon name="edit" size={28} />
          <strong>Elige qué editar</strong>
          <span>Toca un botón negro en la vista previa: «Editar texto», «Cambiar imagen» o «Editar precio». El cambio se ve en vivo.</span>
        </div>
      );
    }
    if (loadingTarget || !draft) return <div className="ad-skel" style={{ height: 240 }} />;
    const d = draft;
    const L = (label: string, value: L10n, on: (v: L10n) => void, multiline = false) => (
      <L10nField label={label} value={value} lang={formLang} onChange={on} multiline={multiline} rows={4} />
    );
    const imageBlock = (url: string | null, onUpload: () => void, help: string, extra?: React.ReactNode) => (
      <>
        <div className={`tt-ph ${s.imgPrev}`}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="tt-img" src={url} alt="" />
          ) : (
            <span className={s.noImg}>
              <Icon name="image" />
              Sin foto todavía
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="ad-btn ad-btn-amber" style={{ flexGrow: 1 }} onClick={onUpload}>
            <Icon name="upload" />
            Subir imagen
          </button>
          {extra}
        </div>
        <p className="ad-help">{help}</p>
      </>
    );
    switch (d.type) {
      case "text":
        return (
          <>
            {L("Texto", d.value, (v) => change({ ...d, value: v }), (d.value.es || "").length > 60)}
            <button type="button" className="ad-btn ad-btn-plain" style={{ alignSelf: "flex-start" }} onClick={() => change({ ...d, value: { es: dictValue(d.key, "es"), en: dictValue(d.key, "en") } })}>
              <Icon name="refresh" />
              Volver al texto original
            </button>
          </>
        );
      case "slide":
        return (
          <>
            {L("Título · línea 1", d.line1, (v) => change({ ...d, line1: v }))}
            {L("Título · línea 2", d.line2, (v) => change({ ...d, line2: v }))}
            {L("Etiqueta superior", d.eyebrow, (v) => change({ ...d, eyebrow: v }))}
            {L("Descripción", d.description, (v) => change({ ...d, description: v }), true)}
            <p className="ad-help">Se muestra en mayúsculas. Usa líneas cortas para que se lea bien en móvil.</p>
            <Link href="/admin/hero" className="ad-btn ad-btn-ghost">
              Ordenar y ocultar slides
            </Link>
          </>
        );
      case "slideimg":
        return imageBlock(
          d.image || d.tourCover,
          () => upload("slides", (url) => ({ ...d, image: url })),
          d.image ? "Este slide usa una imagen propia." : "Este slide usa la portada del tour vinculado.",
          d.image ? (
            <button type="button" className="ad-btn ad-btn-ghost" onClick={() => change({ ...d, image: null })}>
              Usar portada
            </button>
          ) : undefined,
        );
      case "tour":
        return (
          <>
            {L("Nombre del tour", d.name, (v) => change({ ...d, name: v }))}
            {L("Descripción corta", d.short, (v) => change({ ...d, short: v }))}
            <Link href={`/admin/tours/${d.id}`} className="ad-btn ad-btn-ghost">
              Abrir el tour completo
            </Link>
          </>
        );
      case "price":
        return (
          <>
            <div>
              <label className="ad-label" htmlFor="ed-price">
                Precio por persona · {d.name}
              </label>
              <div className={`ad-money ${d.price > 0 ? "" : "is-bad"}`}>
                <span className="ad-money-s">$</span>
                <input id="ed-price" type="number" min={0} step={10} value={d.price || ""} onChange={(e) => change({ ...d, price: Number(e.target.value) })} />
                <span>MXN</span>
              </div>
              {!(d.price > 0) && (
                <span className="ad-err">
                  <Icon name="info" />
                  Escribe un precio mayor a 0.
                </span>
              )}
            </div>
            <Link href="/admin/precios" className="ad-btn ad-btn-ghost">
              Ver todos los precios
            </Link>
          </>
        );
      case "tourimg":
        return imageBlock(
          d.photos[0]?.url ?? null,
          () =>
            upload(`tours/${d.id}`, (url) => {
              const photos = d.photos.length ? d.photos.map((p, i) => (i === 0 ? { ...p, url } : p)) : [{ url, caption: emptyL(), tone: "#4E6540" }];
              return { ...d, photos };
            }),
          `Portada de «${d.name}». Se usa en la tarjeta, el carrusel y el detalle.`,
          <Link href={`/admin/tours/${d.id}`} className="ad-btn ad-btn-ghost">
            Todas las fotos
          </Link>,
        );
      case "gal":
        return (
          <>
            {imageBlock(d.image, () => upload("galeria", (url) => ({ ...d, image: url })), "Foto de la galería «Así se vive».")}
            {L("Pie de foto", d.caption, (v) => change({ ...d, caption: v }))}
          </>
        );
      case "guide":
        return (
          <>
            {imageBlock(d.photo, () => upload("equipo", (url) => ({ ...d, photo: url })), "Retrato del guía.")}
            <TextField label="Nombre" value={d.name} onChange={(v) => change({ ...d, name: v })} />
            {L("Especialidad", d.role, (v) => change({ ...d, role: v }))}
          </>
        );
      case "rev":
        return (
          <>
            {L("Reseña", d.quote, (v) => change({ ...d, quote: v }), true)}
            <TextField label="Nombre del cliente" value={d.name} onChange={(v) => change({ ...d, name: v })} help="Pide permiso antes de publicar su nombre." />
            {L("Tour", d.tour, (v) => change({ ...d, tour: v }))}
          </>
        );
      case "faq":
        return (
          <>
            {L("Pregunta", d.q, (v) => change({ ...d, q: v }))}
            {L("Respuesta", d.a, (v) => change({ ...d, a: v }), true)}
          </>
        );
      case "about":
        return imageBlock(d.url, () => upload("nosotros", (url) => ({ ...d, url })), d.which === "main" ? "Foto grande: guías en el sendero." : "Foto pequeña: el pueblo.");
      case "settings":
        return (
          <>
            <TextField label="WhatsApp (10 dígitos)" value={d.whatsapp} inputMode="numeric" onChange={(v) => change({ ...d, whatsapp: v })} />
            <TextField label="Correo" type="email" value={d.email} onChange={(v) => change({ ...d, email: v })} />
            {L("Punto de encuentro", d.address, (v) => change({ ...d, address: v }))}
            {L("Horario", d.hours, (v) => change({ ...d, hours: v }))}
            <Link href="/admin/ajustes" className="ad-btn ad-btn-ghost">
              Todos los ajustes
            </Link>
          </>
        );
    }
}
