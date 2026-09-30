"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAdmin, usePageSave } from "./AdminShell";
import { ChipList, FormCard, L10nField, LangTabs, MoneyField, SwitchRow, TextField } from "./fields";
import { BrandIcon, Icon } from "../icons";
import { MapArt } from "../site/Explore";
import { TourCard } from "../site/TourCard";
import { tourToRow } from "@/lib/admin/rows";
import { pickImages, uploadImage } from "@/lib/admin/upload";
import { durShort, priceTxt, waLink } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";
import { CATEGORIES, DIFFICULTIES, type Lang, type Tour } from "@/lib/types";
import s from "./TourForm.module.css";

const CAT: Record<Tour["category"], string> = { senderismo: "Senderismo", aventura: "Aventura", cultura: "Cultura", bienestar: "Bienestar" };
const DIFF: Record<Tour["difficulty"], string> = { facil: "Fácil", moderada: "Moderada", exigente: "Exigente" };
const TONES = ["#2E5A4C", "#4E6540", "#3F5C5E", "#3D3632", "#8F6E42", "#B8703A", "#9C4A2F", "#7A4634"];
const empty = { es: "", en: "" };

export function blankTour(sortOrder: number): Tour {
  return {
    id: "",
    slug: "",
    name: { ...empty },
    category: "senderismo",
    short: { ...empty },
    description: { ...empty },
    price: 0,
    durationHours: 3,
    difficulty: "moderada",
    groupMax: 10,
    departureTime: "8:00 a.m.",
    meetingPoint: { es: "Centro de Tepoztlán", en: "Downtown Tepoztlán" },
    scheduleDays: { es: "Todos los días", en: "Every day" },
    minAge: null,
    badge: null,
    photos: [],
    itinerary: [],
    includes: { es: [], en: [] },
    bring: { es: [], en: [] },
    waMessage: { ...empty },
    tone: TONES[sortOrder % TONES.length],
    mapX: 320,
    mapY: 450,
    pinLabel: { ...empty },
    active: true,
    inCarousel: false,
    sortOrder,
  };
}

export function slugify(v: string) {
  return v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

type Errors = Partial<Record<"name" | "price" | "photos" | "slug" | "duration", string>>;

export function TourForm({ initial, isNew }: { initial: Tour; isNew: boolean }) {
  const router = useRouter();
  const { toast, refreshStatus, refreshCounts } = useAdmin();
  const [tour, setTour] = useState<Tour>(initial);
  const [saved, setSaved] = useState(JSON.stringify(initial));
  const [lang, setLang] = useState<Lang>("es");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [whatsapp, setWhatsapp] = useState("");
  const [slugTouched, setSlugTouched] = useState(!isNew);

  const dirty = JSON.stringify(tour) !== saved;
  const set = <K extends keyof Tour>(k: K, v: Tour[K]) => setTour((t) => ({ ...t, [k]: v }));

  useEffect(() => {
    (async () => {
      const { data } = await supabaseBrowser().from("settings").select("data").eq("id", 1).maybeSingle();
      setWhatsapp((data?.data as { whatsapp?: string } | undefined)?.whatsapp ?? "");
    })();
  }, []);

  const validate = (full: boolean): Errors => {
    const e: Errors = {};
    if (!tour.name.es.trim()) e.name = "Escribe el nombre del tour.";
    if (!tour.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(tour.slug)) e.slug = "Usa solo minúsculas, números y guiones.";
    if (!(tour.price > 0)) e.price = "Escribe un precio mayor a 0.";
    if (full) {
      if (!tour.photos.some((p) => p.url)) e.photos = "Sube al menos una foto. La primera será la portada.";
      if (!(tour.durationHours > 0)) e.duration = "Escribe la duración en horas.";
    }
    return e;
  };

  const save = async (asDraft: boolean): Promise<boolean> => {
    const e = validate(!asDraft);
    setErrors(e);
    if (Object.keys(e).length) {
      toast("err", "Revisa los campos marcados", Object.values(e)[0] ?? "");
      return false;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const next: Tour = { ...tour, active: asDraft ? false : tour.active };
    // La base exige al menos un espacio de foto; en borradores sin fotos se guarda uno vacío.
    const row = tourToRow({ ...next, photos: next.photos.length ? next.photos : [{ url: null, caption: { ...empty }, tone: next.tone }] });
    let id = next.id;
    if (isNew || !id) {
      const { data, error } = await sb.from("tours").insert(row).select("id").single();
      if (error) {
        setBusy(false);
        toast("err", "No se pudo guardar", error.code === "23505" ? "Ya existe un tour con esa dirección (slug). Cámbiala en «Detalles del sitio»." : "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
        return false;
      }
      id = String(data.id);
    } else {
      const { error } = await sb.from("tours").update(row).eq("id", id);
      if (error) {
        setBusy(false);
        toast("err", "No se pudo guardar", error.code === "23505" ? "Ya existe un tour con esa dirección (slug)." : "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
        return false;
      }
    }
    // «Mostrar en el carrusel»: si no tiene slide, se crea uno con los textos del tour.
    if (next.inCarousel) {
      const { count } = await sb.from("slides").select("id", { count: "exact", head: true }).eq("tour_id", id);
      if (!count) {
        const { data: last } = await sb.from("slides").select("sort_order").order("sort_order", { ascending: false }).limit(1).maybeSingle();
        await sb.from("slides").insert({
          tour_id: id,
          line1: next.name,
          line2: { ...empty },
          eyebrow: { es: "Tepoztlán, Morelos", en: "Tepoztlán, Morelos" },
          description: next.short,
          visible: true,
          sort_order: Number(last?.sort_order ?? 0) + 1,
        });
      }
    }
    const final = { ...next, id };
    setTour(final);
    setSaved(JSON.stringify(final));
    setBusy(false);
    await Promise.all([refreshStatus(), refreshCounts()]);
    toast(
      "ok",
      asDraft ? "Borrador guardado" : "Tour guardado",
      asDraft ? "El tour quedó en pausa. Actívalo cuando esté listo." : "Toca Publicar para que el cambio se vea en el sitio.",
    );
    if (isNew) router.replace(`/admin/tours/${id}`);
    return true;
  };

  usePageSave(dirty, () => save(false));

  /* ---------- Fotos ---------- */
  const addPhotos = async (replaceIndex?: number) => {
    const files = await pickImages(replaceIndex === undefined);
    if (!files.length) return;
    setUploading((n) => n + files.length);
    const folder = `tours/${tour.slug || "nuevo"}`;
    for (const file of files) {
      try {
        const url = await uploadImage(file, folder);
        setTour((t) => {
          const photos = [...t.photos];
          if (replaceIndex !== undefined && photos[replaceIndex]) photos[replaceIndex] = { ...photos[replaceIndex], url };
          else photos.push({ url, caption: { ...empty }, tone: t.tone });
          return { ...t, photos };
        });
        setErrors((e) => ({ ...e, photos: undefined }));
      } catch {
        toast("err", "No se pudo subir la foto", "Usa JPG, PNG o WebP de menos de 8 MB e inténtalo de nuevo.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const movePhoto = (i: number, to: number) =>
    setTour((t) => {
      const photos = [...t.photos];
      const [p] = photos.splice(i, 1);
      photos.splice(to, 0, p);
      return { ...t, photos };
    });

  /* ---------- Vista previa ---------- */
  const dict = useMemo(() => getDictionary(lang), [lang]);
  const preview = {
    id: tour.id,
    slug: tour.slug,
    href: "#",
    num: "01",
    name: tour.name[lang] || tour.name.es || "Nuevo tour",
    category: tour.category,
    catLabel: dict.category[tour.category],
    short: tour.short[lang] || tour.short.es || "Escribe una descripción corta.",
    price: tour.price,
    priceTxt: priceTxt(tour.price || 0),
    dur: durShort(tour.durationHours || 0),
    diff: dict.difficulty[tour.difficulty],
    wa: "#",
    cover: tour.photos.find((p) => p.url)?.url ?? null,
    tone: tour.tone,
    pinLabel: "",
    mapX: 0,
    mapY: 0,
  };
  const message = tour.waMessage[lang] || tour.waMessage.es;
  const testLink = waLink(whatsapp, message);

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <Link href="/admin/tours" className={s.back}>
            <Icon name="chevLeft" size={17} />
            Todos los tours
          </Link>
          <h2 className="tt-d">{tour.name.es || "Nuevo tour"}</h2>
        </div>
        <div className={s.headActions}>
          <Link className="ad-btn ad-btn-plain" href="/admin/tours">
            Cancelar
          </Link>
          <button type="button" className="ad-btn ad-btn-ghost" onClick={() => save(true)} disabled={busy}>
            Guardar borrador
          </button>
          <button type="button" className={`ad-btn ad-btn-amber ${s.saveBtn}`} onClick={() => save(false)} disabled={busy || uploading > 0}>
            <Icon name="check" />
            {busy ? "Guardando…" : "Guardar tour"}
          </button>
        </div>
      </div>

      <LangTabs lang={lang} onChange={setLang} />

      <div className={s.layout}>
        <div className={s.main}>
          <FormCard n={1} title="Información básica">
            <div className={s.grid2}>
              <L10nField
                label="Nombre del tour"
                value={tour.name}
                lang={lang}
                // El slug sigue al nombre mientras no se edite a mano.
                onChange={(v) => setTour((t) => ({ ...t, name: v, slug: slugTouched ? t.slug : slugify(v.es) }))} error={lang === "es" ? errors.name : undefined} required />
              <div>
                <label className="ad-label" htmlFor="tf-cat">
                  Categoría
                </label>
                <select id="tf-cat" className="ad-input" value={tour.category} onChange={(e) => set("category", e.target.value as Tour["category"])}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CAT[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <L10nField label="Descripción corta" value={tour.short} lang={lang} onChange={(v) => set("short", v)} max={90} help="Aparece en la tarjeta del tour." />
            <L10nField
              label="Descripción completa"
              value={tour.description}
              lang={lang}
              onChange={(v) => set("description", v)}
              multiline
              rows={6}
              help="Deja una línea en blanco entre párrafos."
            />
          </FormCard>

          <FormCard n={2} title="Precio y logística">
            <div className={s.grid3}>
              <MoneyField label="Precio por persona" value={tour.price} onChange={(v) => set("price", v)} error={errors.price} />
              <TextField
                label="Duración (horas)"
                type="number"
                inputMode="decimal"
                value={String(tour.durationHours || "")}
                onChange={(v) => set("durationHours", Number(v))}
                error={errors.duration}
                style={{ height: 50 }}
              />
              <div>
                <span className="ad-label">Dificultad</span>
                <div className={`ad-seg ${s.diffSeg}`} role="group" aria-label="Dificultad">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} type="button" className={`ad-seg-b ${tour.difficulty === d ? "is-on" : ""}`} aria-pressed={tour.difficulty === d} onClick={() => set("difficulty", d)}>
                      {DIFF[d]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className={s.grid3}>
              <TextField label="Grupo máximo (personas)" type="number" inputMode="numeric" value={String(tour.groupMax || "")} onChange={(v) => set("groupMax", Math.max(1, Number(v) || 1))} />
              <TextField label="Hora de salida" value={tour.departureTime} onChange={(v) => set("departureTime", v)} placeholder="8:00 a.m." />
              <L10nField label="Punto de encuentro" value={tour.meetingPoint} lang={lang} onChange={(v) => set("meetingPoint", v)} />
            </div>
          </FormCard>

          <FormCard n={3} title="Fotos" aside={<span className={s.aside}>{tour.photos.filter((p) => p.url).length} fotos · la primera es la portada</span>}>
            <div className={s.photos}>
              {tour.photos.map((p, i) => (
                <div key={`${p.url ?? "vacía"}-${i}`} className={s.photoCol}>
                  <div className={`tt-ph ${s.photo}`} style={{ backgroundColor: p.tone }}>
                    {p.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="tt-img" src={p.url} alt={p.caption.es || `Foto ${i + 1}`} />
                    ) : (
                      <button type="button" className={s.fill} onClick={() => addPhotos(i)}>
                        <Icon name="upload" />
                        Subir foto
                      </button>
                    )}
                    {i === 0 && <span className={s.coverBadge}>Portada</span>}
                    <span className={s.photoActs}>
                      {i > 0 && (
                        <button type="button" className={s.mini} onClick={() => movePhoto(i, 0)} aria-label="Usar como portada" title="Usar como portada">
                          <Icon name="image" />
                        </button>
                      )}
                      {p.url && (
                        <button type="button" className={s.mini} onClick={() => addPhotos(i)} aria-label="Cambiar foto" title="Cambiar foto">
                          <Icon name="refresh" />
                        </button>
                      )}
                      <button
                        type="button"
                        className={s.mini}
                        onClick={() => set("photos", tour.photos.filter((_, j) => j !== i))}
                        aria-label="Quitar foto"
                        title="Quitar foto"
                      >
                        <Icon name="trash" />
                      </button>
                    </span>
                  </div>
                  <input
                    className={`ad-input ${s.caption}`}
                    placeholder={lang === "es" ? "Pie de foto" : p.caption.es || "Caption"}
                    aria-label={`Pie de la foto ${i + 1} (${lang.toUpperCase()})`}
                    value={p.caption[lang]}
                    onChange={(e) =>
                      set(
                        "photos",
                        tour.photos.map((x, j) => (j === i ? { ...x, caption: { ...x.caption, [lang]: e.target.value } } : x)),
                      )
                    }
                  />
                </div>
              ))}
              <button type="button" className={s.drop} onClick={() => addPhotos()} disabled={uploading > 0}>
                <Icon name="upload" />
                {uploading ? `Subiendo ${uploading}…` : "Subir fotos"}
              </button>
            </div>
            {errors.photos ? (
              <span className="ad-err">
                <Icon name="info" />
                {errors.photos}
              </span>
            ) : (
              <p className="ad-help">JPG o WebP de al menos 1600 px de ancho. Puedes elegir varias a la vez; se optimizan al subirlas.</p>
            )}
          </FormCard>

          <FormCard n={4} title="Itinerario">
            {tour.itinerary.length > 0 && (
              <div className={`${s.step} ${s.stepHead}`}>
                <span />
                <span>Hora</span>
                <span>Paso</span>
                <span>Detalle</span>
                <span />
              </div>
            )}
            <div className={s.steps}>
              {tour.itinerary.map((st, i) => {
                const upd = (patch: Partial<typeof st>) => set("itinerary", tour.itinerary.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                return (
                  <div key={i} className={s.step}>
                    <span className={s.stepN}>{i + 1}</span>
                    <input className="ad-input" value={st.time} onChange={(e) => upd({ time: e.target.value })} aria-label={`Hora del paso ${i + 1}`} placeholder="8:00" />
                    <input
                      className="ad-input"
                      value={st.title[lang]}
                      placeholder={lang === "en" ? st.title.es : ""}
                      onChange={(e) => upd({ title: { ...st.title, [lang]: e.target.value } })}
                      aria-label={`Nombre del paso ${i + 1} (${lang.toUpperCase()})`}
                    />
                    <input
                      className="ad-input"
                      value={st.detail[lang]}
                      placeholder={lang === "en" ? st.detail.es : ""}
                      onChange={(e) => upd({ detail: { ...st.detail, [lang]: e.target.value } })}
                      aria-label={`Detalle del paso ${i + 1} (${lang.toUpperCase()})`}
                    />
                    <button type="button" className="ad-ibtn is-danger" onClick={() => set("itinerary", tour.itinerary.filter((_, j) => j !== i))} aria-label={`Quitar paso ${i + 1}`}>
                      <Icon name="trash" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              className="ad-btn ad-btn-ghost"
              style={{ alignSelf: "flex-start" }}
              onClick={() => set("itinerary", [...tour.itinerary, { time: "", title: { ...empty }, detail: { ...empty } }])}
            >
              <Icon name="plus" />
              Agregar paso
            </button>
          </FormCard>

          <FormCard n={5} title="Qué incluye y qué llevar">
            <div className={s.grid2} style={{ gap: 24 }}>
              <ChipList
                label={`Qué incluye (${lang.toUpperCase()})`}
                items={tour.includes[lang]}
                onChange={(items) => set("includes", { ...tour.includes, [lang]: items })}
                placeholder={lang === "es" ? "Ej. Café de olla" : "E.g. Café de olla"}
              />
              <ChipList
                label={`Qué llevar (${lang.toUpperCase()})`}
                items={tour.bring[lang]}
                onChange={(items) => set("bring", { ...tour.bring, [lang]: items })}
                placeholder={lang === "es" ? "Ej. Lámpara de mano" : "E.g. Flashlight"}
              />
            </div>
          </FormCard>

          <FormCard n={6} title="Mensaje de WhatsApp">
            <L10nField
              label="Texto que se enviará al tocar «Reservar»"
              value={tour.waMessage}
              lang={lang}
              onChange={(v) => set("waMessage", v)}
              multiline
              rows={3}
              placeholder={lang === "es" ? `¡Hola TepozTours! Quiero reservar el tour ${tour.name.es || "…"}.` : undefined}
            />
            <div className={s.waRow}>
              <span style={{ color: "#1DAA52", display: "flex" }}>
                <BrandIcon name="whatsapp" />
              </span>
              <span className={s.waUrl}>{testLink.replace("https://", "")}</span>
              <a className="ad-btn ad-btn-ghost" href={testLink} target="_blank" rel="noopener" style={{ height: 38 }}>
                Probar enlace
              </a>
            </div>
            <p className="ad-help">
              {whatsapp ? `Se envía al número +52 ${whatsapp} (de Ajustes).` : "Aún no hay número de WhatsApp en Ajustes: el enlace abre WhatsApp sin destinatario."} Cada tour puede
              tener su propio mensaje.
            </p>
          </FormCard>

          <FormCard n={7} title="Detalles del sitio">
            <div className={s.grid2}>
              <L10nField label="Etiqueta destacada" value={tour.badge ?? empty} lang={lang} onChange={(v) => set("badge", v)} help="Ej. «Temporada de lluvias». Aparece junto a la categoría en el detalle." />
              <L10nField label="Días de salida" value={tour.scheduleDays} lang={lang} onChange={(v) => set("scheduleDays", v)} />
            </div>
            <div className={s.grid3}>
              <TextField
                label="Edad mínima"
                type="number"
                inputMode="numeric"
                value={tour.minAge === null ? "" : String(tour.minAge)}
                onChange={(v) => set("minAge", v === "" ? null : Math.max(0, Number(v)))}
                help="Vacío = todas las edades."
              />
              <TextField
                label="Dirección de la página"
                value={tour.slug}
                onChange={(v) => {
                  setSlugTouched(true);
                  set("slug", slugify(v));
                }}
                error={errors.slug}
                help={`/es/tours/${tour.slug || "…"}`}
              />
              <div>
                <span className="ad-label">Color de respaldo</span>
                <div className={s.tones} role="group" aria-label="Color de respaldo">
                  {TONES.map((c) => (
                    <button key={c} type="button" className={`${s.tone} ${tour.tone === c ? s.toneOn : ""}`} style={{ backgroundColor: c }} aria-label={c} aria-pressed={tour.tone === c} onClick={() => set("tone", c)} />
                  ))}
                </div>
              </div>
            </div>
            <div className={s.mapRow}>
              <div>
                <L10nField label="Nombre en el mapa" value={tour.pinLabel} lang={lang} onChange={(v) => set("pinLabel", v)} help="Toca el mapa para mover el pin del tour." />
              </div>
              <div
                className={s.map}
                role="button"
                tabIndex={0}
                aria-label="Ubicación del tour en el mapa ilustrado"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTour((t) => ({
                    ...t,
                    mapX: Math.round(((e.clientX - r.left) / r.width) * 640),
                    mapY: Math.round(((e.clientY - r.top) / r.height) * 820),
                  }));
                }}
              >
                <MapArt dict={dict} />
                <span className={s.pin} style={{ left: `${(tour.mapX / 640) * 100}%`, top: `${(tour.mapY / 820) * 100}%` }} />
              </div>
            </div>
          </FormCard>
        </div>

        <aside className={s.side}>
          <span className={s.sideLabel}>Vista previa de la tarjeta · {lang.toUpperCase()}</span>
          <TourCard
            preview
            tour={preview}
            labels={{ from: dict.common.from, perPerson: dict.common.perPerson, viewDetails: dict.common.viewDetails, book: dict.common.book, photo: dict.common.photo }}
          />
          <section className={`ad-card ${s.switches}`}>
            <SwitchRow title="Tour activo" help={tour.active ? "Visible en el sitio al publicar" : "En pausa: no aparece en el sitio"} on={tour.active} onChange={(v) => set("active", v)} />
            <SwitchRow title="Mostrar en el carrusel" help="Agrega un slide en el hero" on={tour.inCarousel} onChange={(v) => set("inCarousel", v)} />
          </section>
          <section className={`ad-card ${s.bubbleCard}`}>
            <strong>Así llegará el mensaje</strong>
            <div className={s.bubble}>{message || "Escribe el mensaje de WhatsApp de este tour."}</div>
          </section>
        </aside>
      </div>
    </div>
  );
}
