"use client";

import { useCallback, useState } from "react";
import { useAdmin, usePageSave } from "@/components/admin/AdminShell";
import { L10nField, LangTabs, Switch } from "@/components/admin/fields";
import { Icon } from "@/components/icons";
import { slideFromRow, slideToRow } from "@/lib/admin/rows";
import { pickImages, uploadImage } from "@/lib/admin/upload";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Lang, Slide } from "@/lib/types";
import s from "./hero.module.css";

export type HeroTourLite = { id: string; name: string; cover: string | null; tone: string; active: boolean };
export type HeroSettings = { heroAutoplay: boolean; heroInterval: number };
const INTERVALS = [4, 6, 8];

type TourLite = HeroTourLite;

export function HeroClient({ initial }: { initial: { slides: Slide[]; tours: TourLite[]; hero: HeroSettings } }) {
  const { toast, confirm, refreshStatus } = useAdmin();
  const [slides, setSlides] = useState<Slide[]>(initial.slides);
  const [tours, setTours] = useState<TourLite[]>(initial.tours);
  const [hero, setHero] = useState<HeroSettings>(initial.hero);
  const [saved, setSaved] = useState(() => JSON.stringify({ list: initial.slides, h: initial.hero }));
  const [deleted, setDeleted] = useState<string[]>([]);
  const [sel, setSel] = useState(0);
  const [lang, setLang] = useState<Lang>("es");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [sl, tr, st] = await Promise.all([
      sb.from("slides").select("*").order("sort_order").order("created_at"),
      sb.from("tours").select("id, name, photos, tone, active").order("sort_order"),
      sb.from("settings").select("data").eq("id", 1).maybeSingle(),
    ]);
    if (sl.error || tr.error) return toast("err", "No se pudo cargar el carrusel", "Revisa tu conexión y recarga la página.");
    const list = (sl.data ?? []).map(slideFromRow);
    const data = (st.data?.data ?? {}) as Partial<HeroSettings>;
    const h = { heroAutoplay: data.heroAutoplay ?? true, heroInterval: data.heroInterval ?? 6 };
    setSlides(list);
    setHero(h);
    setDeleted([]);
    setSaved(JSON.stringify({ list, h }));
    setTours(
      (tr.data ?? []).map((t: Record<string, unknown>) => ({
        id: String(t.id),
        name: (t.name as { es: string }).es,
        cover: ((t.photos as { url: string | null }[]) ?? []).find((p) => p.url)?.url ?? null,
        tone: String(t.tone),
        active: Boolean(t.active),
      })),
    );
  }, [toast]);

  const list = slides;
  const dirty = (JSON.stringify({ list, h: hero }) !== saved || deleted.length > 0);
  const tourOf = (id: string) => tours.find((t) => t.id === id);

  const save = async (): Promise<boolean> => {
    const bad = list.findIndex((x) => !x.line1.es.trim() || !x.tourId);
    if (bad >= 0) {
      setSel(bad);
      toast("err", "Falta información", !list[bad].tourId ? "Elige el tour vinculado del slide." : "Escribe al menos la línea 1 del título antes de guardar.");
      return false;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const ops = [
      ...deleted.map((id) => sb.from("slides").delete().eq("id", id)),
      ...list.map((x, i) => {
        const row = slideToRow({ ...x, sortOrder: i + 1 });
        return x.id.startsWith("new-") ? sb.from("slides").insert(row) : sb.from("slides").update(row).eq("id", x.id);
      }),
    ];
    const { data: st } = await sb.from("settings").select("data").eq("id", 1).maybeSingle();
    ops.push(sb.from("settings").update({ data: { ...(st?.data ?? {}), ...hero } }).eq("id", 1));
    const res = await Promise.all(ops);
    setBusy(false);
    if (res.some((r) => r.error)) {
      toast("err", "No se pudo guardar el carrusel", "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
      return false;
    }
    await Promise.all([load(), refreshStatus()]);
    toast("ok", "Carrusel guardado", "Toca Publicar para que el cambio se vea en el sitio.");
    return true;
  };

  usePageSave(dirty, save);

  const cur = list[sel];
  const update = (patch: Partial<Slide>) => setSlides(list.map((x, i) => (i === sel ? { ...x, ...patch } : x)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setSlides(next);
    setSel(j);
  };
  const add = () => {
    const t = tours.find((x) => x.active) ?? tours[0];
    const slide: Slide = {
      id: `new-${Date.now()}`,
      tourId: t?.id ?? "",
      line1: { es: "Nuevo", en: "New" },
      line2: { es: "slide", en: "slide" },
      eyebrow: { es: "Tepoztlán, Morelos", en: "Tepoztlán, Morelos" },
      description: { es: "Escribe una descripción corta para este slide.", en: "" },
      image: null,
      visible: false,
      sortOrder: list.length + 1,
    };
    setSlides([...list, slide]);
    setSel(list.length);
    toast("ok", "Slide agregado", "Súbele una imagen, completa los textos y actívalo cuando esté listo.");
  };
  const remove = async (i: number) => {
    const x = list[i];
    const title = `${x.line1.es} ${x.line2.es}`.trim();
    const ok = await confirm({ title: `¿Eliminar el slide «${title}»?`, text: "Dejará de aparecer en el carrusel del inicio. El tour vinculado no se borra." });
    if (!ok) return;
    if (!x.id.startsWith("new-")) setDeleted((d) => [...d, x.id]);
    const next = list.filter((_, j) => j !== i);
    setSlides(next);
    setSel(Math.max(0, Math.min(sel, next.length - 1)));
    toast("ok", "Slide eliminado", `«${title}» se quitará del carrusel al guardar.`);
  };
  const changeImage = async () => {
    const [file] = await pickImages(false);
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file, "slides");
      update({ image: url });
      toast("ok", "Imagen lista", "La nueva foto ya se ve en la vista previa. Guarda para conservarla.");
    } catch {
      toast("err", "No se pudo subir la imagen", "Usa JPG, PNG o WebP de menos de 8 MB.");
    } finally {
      setUploading(false);
    }
  };

  const img = (x: Slide) => x.image || tourOf(x.tourId)?.cover || null;
  const tone = (x?: Slide) => (x ? tourOf(x.tourId)?.tone ?? "#8C8272" : "#8C8272");
  const next3 = [1, 2, 3].map((k) => (list.length ? list[(sel + k) % list.length] : undefined));

  return (
    <div className={s.layout}>
      <div className={s.left}>
        <section className={`ad-card ${s.auto}`}>
          <div className={s.autoL}>
            <Switch on={hero.heroAutoplay} onChange={(v) => setHero({ ...hero, heroAutoplay: v })} label="Cambio automático" />
            <span className={s.autoTxt}>
              <strong>Cambio automático</strong>
              <span>Transición: la tarjeta se expande y se vuelve el fondo</span>
            </span>
          </div>
          <div role="group" aria-label="Segundos entre slides" className={s.ints}>
            {INTERVALS.map((v) => (
              <button
                key={v}
                type="button"
                className={`${s.int} ${hero.heroInterval === v ? s.intOn : ""}`}
                aria-pressed={hero.heroInterval === v}
                onClick={() => setHero({ ...hero, heroInterval: v })}
              >
                {v} s
              </button>
            ))}
          </div>
        </section>

        <section className={`ad-card ${s.listCard}`}>
          <div className={s.listHead}>
            <div>
              <h2 className="tt-d">Slides · {list.length}</h2>
              <p>Se muestran en este orden en el inicio. Usa las flechas para ordenar.</p>
            </div>
            <button type="button" className="ad-btn ad-btn-amber" onClick={add}>
              <Icon name="plus" />
              Agregar slide
            </button>
          </div>
          <div className={s.rows}>
            {list.map((x, i) => {
              const t = tourOf(x.tourId);
              const title = `${x.line1.es} ${x.line2.es}`.trim();
              const cover = img(x);
              return (
                <div key={x.id} className={`${s.row} ${i === sel ? s.isSel : ""} ${x.visible && t?.active !== false ? "" : s.isHidden}`}>
                  <span className={s.grip} aria-hidden="true">
                    <Icon name="drag" />
                  </span>
                  <button type="button" className={s.pick} onClick={() => setSel(i)} aria-label={`Editar slide ${i + 1}: ${title}`}>
                    <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
                    <span className={`tt-ph ${s.thumb}`} style={{ backgroundColor: tone(x) }}>
                      {cover && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="tt-img" src={cover} alt="" loading="lazy" />
                      )}
                    </span>
                    <span className={s.name}>
                      <strong>{title || "Sin título"}</strong>
                      <span>
                        {t?.name ?? "Elige un tour"}
                        {t && !t.active ? " · tour en pausa" : ""}
                      </span>
                    </span>
                  </button>
                  <Switch
                    on={x.visible}
                    onChange={(v) => {
                      setSlides(list.map((y, j) => (j === i ? { ...y, visible: v } : y)));
                      toast("ok", v ? "Slide visible" : "Slide oculto", v ? `«${t?.name ?? title}» vuelve a aparecer en el carrusel al guardar.` : `«${t?.name ?? title}» ya no aparecerá en el carrusel al guardar.`);
                    }}
                    label={`Mostrar slide ${i + 1}`}
                  />
                  <span className={s.acts}>
                    <button type="button" className="ad-ibtn" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir slide ${i + 1}`}>
                      <Icon name="chevUp" />
                    </button>
                    <button type="button" className="ad-ibtn" onClick={() => move(i, 1)} disabled={i === list.length - 1} aria-label={`Bajar slide ${i + 1}`}>
                      <Icon name="chevDown" />
                    </button>
                    <button type="button" className="ad-ibtn is-danger" onClick={() => remove(i)} aria-label={`Eliminar slide ${i + 1}`}>
                      <Icon name="trash" />
                    </button>
                  </span>
                </div>
              );
            })}
            {!list.length && (
              <div className="ad-empty">
                <span className="ad-empty-ico">
                  <Icon name="layers" />
                </span>
                <span className="ad-empty-txt">
                  <strong>El carrusel está vacío</strong>
                  <span>Agrega un slide para que el inicio muestre tus tours.</span>
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {cur ? (
        <section className={`ad-card ${s.editor}`}>
          <div className={s.edHead}>
            <div>
              <span className={s.kicker}>Editando slide {String(sel + 1).padStart(2, "0")}</span>
              <h2 className="tt-d">{tourOf(cur.tourId)?.name ?? "Elige un tour"}</h2>
            </div>
            <span className={`ad-badge ${cur.visible ? "ad-b-ok" : "ad-b-off"}`}>{cur.visible ? "Visible" : "Oculto"}</span>
          </div>

          <div className={`tt-ph ${s.preview}`} style={{ backgroundColor: tone(cur) }}>
            {img(cur) && (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="tt-img" src={img(cur)!} alt="" />
            )}
            <div className={s.pvScrim} />
            <div className={s.pvTxt}>
              <span className={s.pvEb}>
                <span />
                {cur.eyebrow[lang] || cur.eyebrow.es}
              </span>
              <span className={`tt-d ${s.pvTitle}`}>
                {cur.line1[lang] || cur.line1.es}
                <br />
                {cur.line2[lang] || cur.line2.es}
              </span>
              <span className={s.pvDesc}>{cur.description[lang] || cur.description.es}</span>
            </div>
            <div className={s.minis}>
              {next3.map((x, k) =>
                x ? (
                  <span key={k} className={`tt-ph ${s.mini}`} style={{ backgroundColor: tone(x) }}>
                    {img(x) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="tt-img" src={img(x)!} alt="" loading="lazy" />
                    )}
                  </span>
                ) : null,
              )}
            </div>
            <span className={s.pvTag}>Vista previa</span>
            <span className={s.pvActions}>
              {cur.image && (
                <button type="button" className="ad-edit" onClick={() => update({ image: null })}>
                  <Icon name="refresh" />
                  Usar portada del tour
                </button>
              )}
              <button type="button" className="ad-edit" onClick={changeImage} disabled={uploading}>
                <Icon name="image" />
                {uploading ? "Subiendo…" : "Cambiar imagen"}
              </button>
            </span>
          </div>

          <LangTabs lang={lang} onChange={setLang} />

          <div className={s.fields}>
            <L10nField label="Título · línea 1" value={cur.line1} lang={lang} onChange={(v) => update({ line1: v })} required />
            <L10nField label="Título · línea 2" value={cur.line2} lang={lang} onChange={(v) => update({ line2: v })} />
            <L10nField label="Etiqueta" value={cur.eyebrow} lang={lang} onChange={(v) => update({ eyebrow: v })} help="Se muestra después de la categoría, p. ej. «Senderismo · Tepoztlán»." />
            <div>
              <label className="ad-label" htmlFor="hs-tour">
                Tour vinculado
              </label>
              <select id="hs-tour" className="ad-input" value={cur.tourId} onChange={(e) => update({ tourId: e.target.value })}>
                <option value="">Elige un tour</option>
                {tours.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                    {t.active ? "" : " (en pausa)"}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.full}>
              <L10nField
                label="Descripción"
                value={cur.description}
                lang={lang}
                onChange={(v) => update({ description: v })}
                multiline
                rows={3}
                help="Los botones «Reservar» y «Ver detalles» usan el WhatsApp y la página del tour vinculado."
              />
            </div>
          </div>

          <div className={s.edFoot}>
            <button type="button" className="ad-btn ad-btn-plain" style={{ color: "var(--danger)" }} onClick={() => remove(sel)}>
              <Icon name="trash" />
              Eliminar slide
            </button>
            <button type="button" className="ad-btn ad-btn-forest" onClick={save} disabled={busy || !dirty}>
              <Icon name="check" />
              {busy ? "Guardando…" : "Guardar carrusel"}
            </button>
          </div>
        </section>
      ) : (
        <section className={`ad-card ${s.editor}`}>
          <p style={{ margin: 0, color: "var(--muted)" }}>Agrega un slide para empezar.</p>
        </section>
      )}
    </div>
  );
}
