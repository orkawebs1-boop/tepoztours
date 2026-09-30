"use client";

import { useCallback, useState } from "react";
import { useAdmin, usePageSave } from "@/components/admin/AdminShell";
import { L10nField, LangTabs, Switch, TextField } from "@/components/admin/fields";
import { Icon, Star } from "@/components/icons";
import { faqFromRow, galleryFromRow, guideFromRow, testimonialFromRow } from "@/lib/admin/rows";
import { pickImages, uploadImage } from "@/lib/admin/upload";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Faq, GalleryItem, Guide, L10n, Lang, Testimonial } from "@/lib/types";
import s from "./contenido.module.css";

type Tab = "gal" | "rev" | "team" | "faq";
type Item = { id: string; visible: boolean; sortOrder: number };
const TONES = ["#5E6B45", "#B8703A", "#3F5C5E", "#9C4A2F", "#4E6540", "#7A4634", "#8F6E42", "#2E5A4C"];
const empty = (): L10n => ({ es: "", en: "" });

const TABLE: Record<Tab, string> = { gal: "gallery_items", rev: "testimonials", team: "guides", faq: "faqs" };
const META: Record<Tab, { label: string; add: string; hint: string; noun: string }> = {
  gal: { label: "Galería", add: "Subir fotos", hint: "Las fotos se muestran en este orden en la galería del inicio. Las ocultas no se ven en el sitio.", noun: "Foto" },
  rev: { label: "Testimonios", add: "Agregar testimonio", hint: "Usa solo reseñas reales con permiso del cliente. Los textos actuales son de ejemplo.", noun: "Testimonio" },
  team: { label: "Equipo de guías", add: "Agregar guía", hint: "Aparecen en la sección Nosotros. Ordénalos como quieras que se vean.", noun: "Guía" },
  faq: { label: "Preguntas", add: "Agregar pregunta", hint: "Preguntas frecuentes del inicio, en el orden en que aparecen.", noun: "Pregunta" },
};

function toRow(tab: Tab, x: Item, i: number): Record<string, unknown> {
  const base = { visible: x.visible, sort_order: i + 1 };
  if (tab === "gal") {
    const g = x as GalleryItem;
    return { ...base, image: g.image, caption: g.caption, tone: g.tone };
  }
  if (tab === "rev") {
    const r = x as Testimonial;
    return { ...base, quote: r.quote, name: r.name, tour: r.tour, tone: r.tone };
  }
  if (tab === "team") {
    const g = x as Guide;
    return { ...base, name: g.name, role: g.role, tags: g.tags, photo: g.photo, tone: g.tone };
  }
  const f = x as Faq;
  return { ...base, q: f.q, a: f.a };
}

export type Lists = { gal: GalleryItem[]; rev: Testimonial[]; team: Guide[]; faq: Faq[] };

type AboutPhotos = { main: string | null; secondary: string | null };

export function ContenidoClient({ initial }: { initial: { lists: Lists; about: AboutPhotos } }) {
  const { toast, confirm, refreshStatus } = useAdmin();
  const [tab, setTab] = useState<Tab>("gal");
  const [lists, setLists] = useState<Lists>(initial.lists);
  const [about, setAbout] = useState<AboutPhotos>(initial.about);
  const [saved, setSaved] = useState(() => JSON.stringify({ next: initial.lists, ab: initial.about }));
  const [deleted, setDeleted] = useState<{ tab: Tab; id: string }[]>([]);
  const [editing, setEditing] = useState<{ tab: Tab; id: string } | null>(null);
  const [lang, setLang] = useState<Lang>("es");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(0);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const q = (t: string) => sb.from(t).select("*").order("sort_order").order("created_at");
    const [g, r, t, f, st] = await Promise.all([q("gallery_items"), q("testimonials"), q("guides"), q("faqs"), sb.from("settings").select("data").eq("id", 1).maybeSingle()]);
    if (g.error || r.error || t.error || f.error) return toast("err", "No se pudo cargar el contenido", "Revisa tu conexión y recarga la página.");
    const next: Lists = {
      gal: (g.data ?? []).map(galleryFromRow),
      rev: (r.data ?? []).map(testimonialFromRow),
      team: (t.data ?? []).map(guideFromRow),
      faq: (f.data ?? []).map(faqFromRow),
    };
    const ab = ((st.data?.data as { aboutPhotos?: AboutPhotos })?.aboutPhotos ?? { main: null, secondary: null }) as AboutPhotos;
    setLists(next);
    setAbout(ab);
    setDeleted([]);
    setSaved(JSON.stringify({ next, ab }));
  }, [toast]);

  const dirty = (JSON.stringify({ next: lists, ab: about }) !== saved || deleted.length > 0);

  const save = async (): Promise<boolean> => {
    const badGuide = lists.team.find((g) => !g.name.trim());
    if (badGuide) {
      setTab("team");
      setEditing({ tab: "team", id: badGuide.id });
      toast("err", "Falta el nombre", "Escribe el nombre del guía antes de guardar.");
      return false;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const ops = deleted.map((d) => sb.from(TABLE[d.tab]).delete().eq("id", d.id));
    (Object.keys(TABLE) as Tab[]).forEach((t) => {
      (lists[t] as Item[]).forEach((x, i) => {
        const row = toRow(t, x, i);
        ops.push(x.id.startsWith("new-") ? sb.from(TABLE[t]).insert(row) : sb.from(TABLE[t]).update(row).eq("id", x.id));
      });
    });
    const { data: st } = await sb.from("settings").select("data").eq("id", 1).maybeSingle();
    ops.push(sb.from("settings").update({ data: { ...(st?.data ?? {}), aboutPhotos: about } }).eq("id", 1));
    const res = await Promise.all(ops);
    setBusy(false);
    if (res.some((x) => x.error)) {
      toast("err", "No se pudo guardar", "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
      return false;
    }
    await Promise.all([load(), refreshStatus()]);
    toast("ok", "Contenido guardado", "Toca Publicar para que el cambio se vea en el sitio.");
    return true;
  };

  usePageSave(dirty, save);

  const setList = <T extends Tab>(t: T, arr: Lists[T]) => setLists({ ...lists, [t]: arr });
  const list = lists[tab] as Item[];
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(tab, next as Lists[typeof tab]);
  };
  const toggle = (i: number) => {
    const x = list[i];
    setList(tab, list.map((y, j) => (j === i ? { ...y, visible: !y.visible } : y)) as Lists[typeof tab]);
    toast("ok", `${META[tab].noun} ${x.visible ? "oculto" : "visible"}`, x.visible ? "Ya no aparecerá en el sitio, pero no se borró." : "Volverá a aparecer en el sitio.");
  };
  const remove = async (i: number) => {
    const x = list[i] as Item & { caption?: L10n; name?: string; q?: L10n };
    const name = x.caption?.es || x.name || x.q?.es || "este testimonio";
    const ok = await confirm({ title: `¿Eliminar «${name}»?`, text: "Se quitará del sitio y del panel al guardar. Si solo quieres esconderlo, usa el botón de ocultar." });
    if (!ok) return;
    if (!x.id.startsWith("new-")) setDeleted((d) => [...d, { tab, id: x.id }]);
    setList(tab, list.filter((_, j) => j !== i) as Lists[typeof tab]);
    toast("ok", "Eliminado", `«${name}» se quitará al guardar.`);
  };

  const add = async () => {
    const id = `new-${Date.now()}`;
    const tone = TONES[list.length % TONES.length];
    if (tab === "gal") {
      const files = await pickImages(true);
      if (!files.length) return;
      setUploading(files.length);
      const added: GalleryItem[] = [];
      for (const [k, file] of files.entries()) {
        try {
          const url = await uploadImage(file, "galeria");
          added.push({ id: `${id}-${k}`, image: url, caption: empty(), tone, visible: true, sortOrder: 0 });
        } catch {
          toast("err", "No se pudo subir una foto", "Usa JPG, PNG o WebP de menos de 8 MB.");
        } finally {
          setUploading((n) => n - 1);
        }
      }
      if (added.length) {
        setLists((l) => ({ ...l, gal: [...l.gal, ...added] }));
        toast("ok", added.length === 1 ? "Foto agregada" : `${added.length} fotos agregadas`, "Se agregaron al final de la galería. Escribe su pie de foto y guarda.");
      }
      return;
    }
    if (tab === "rev") {
      setList("rev", [...lists.rev, { id, quote: { es: "", en: "" }, name: "", tour: empty(), tone: "#CDB891", visible: false, sortOrder: 0 }]);
    } else if (tab === "team") {
      setList("team", [...lists.team, { id, name: "", role: empty(), tags: [], photo: null, tone, visible: false, sortOrder: 0 }]);
    } else {
      setList("faq", [...lists.faq, { id, q: empty(), a: empty(), visible: false, sortOrder: 0 }]);
    }
    setEditing({ tab, id });
  };

  const uploadFor = async (apply: (url: string) => void, folder: string) => {
    const [file] = await pickImages(false);
    if (!file) return;
    setUploading(1);
    try {
      apply(await uploadImage(file, folder));
    } catch {
      toast("err", "No se pudo subir la foto", "Usa JPG, PNG o WebP de menos de 8 MB.");
    } finally {
      setUploading(0);
    }
  };

  const editItem = editing ? (lists[editing.tab] as Item[]).find((x) => x.id === editing.id) : undefined;
  const patchEditing = (patch: Record<string, unknown>) => {
    if (!editing) return;
    setList(editing.tab, (lists[editing.tab] as Item[]).map((x) => (x.id === editing.id ? { ...x, ...patch } : x)) as Lists[typeof editing.tab]);
  };

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div className={s.tabs} role="tablist" aria-label="Tipo de contenido">
          {(Object.keys(META) as Tab[]).map((t) => (
            <button key={t} type="button" role="tab" aria-selected={tab === t} className={`${s.tab} ${tab === t ? s.tabOn : ""}`} onClick={() => setTab(t)}>
              {META[t].label}
              <span className={s.tabN}>{lists[t].length}</span>
            </button>
          ))}
        </div>
        <button type="button" className={`ad-btn ad-btn-amber ${s.addBtn}`} onClick={add} disabled={uploading > 0}>
          <Icon name={tab === "gal" ? "upload" : "plus"} />
          {uploading ? `Subiendo ${uploading}…` : META[tab].add}
        </button>
      </div>
      <p className={s.hint}>{META[tab].hint}</p>

      {tab === "gal" && (
        <div className={s.photoGrid}>
          {lists.gal.map((g, i) => (
            <div key={g.id} className={`tt-ph ${s.photo} ${g.visible ? "" : s.hidden}`} style={{ backgroundColor: g.tone }}>
              {g.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="tt-img" src={g.image} alt={g.caption.es} loading="lazy" />
              )}
              <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
              {!g.visible && <span className={s.hid}>Oculta</span>}
              <span className={s.acts}>
                <button type="button" className={s.mini} onClick={() => toggle(i)} aria-label={g.visible ? "Ocultar foto" : "Mostrar foto"} title={g.visible ? "Ocultar" : "Mostrar"}>
                  <Icon name={g.visible ? "eyeOff" : "eye"} />
                </button>
                <button type="button" className={s.mini} onClick={() => setEditing({ tab: "gal", id: g.id })} aria-label="Editar pie de foto" title="Editar">
                  <Icon name="edit" />
                </button>
                <button type="button" className={s.mini} onClick={() => remove(i)} aria-label="Eliminar foto" title="Eliminar">
                  <Icon name="trash" />
                </button>
              </span>
              <span className={s.cap}>
                <button type="button" className={s.mini} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Mover antes">
                  <Icon name="chevLeft" />
                </button>
                <span>{g.caption.es || (g.image ? "Sin pie de foto" : "Espacio para foto")}</span>
                <button type="button" className={s.mini} onClick={() => move(i, 1)} disabled={i === lists.gal.length - 1} aria-label="Mover después">
                  <Icon name="chevRight" />
                </button>
              </span>
            </div>
          ))}
          <button type="button" className={s.drop} onClick={add} disabled={uploading > 0}>
            <Icon name="upload" />
            {uploading ? `Subiendo ${uploading}…` : "Elegir fotos"}
          </button>
        </div>
      )}

      {tab === "rev" && (
        <div className={s.stack}>
          {lists.rev.map((r, i) => (
            <div key={r.id} className={`ad-card ${s.rev} ${r.visible ? "" : s.hidden}`}>
              <span className={s.grip} aria-hidden="true">
                <Icon name="drag" />
              </span>
              <div className={s.revBody}>
                <span className={s.revTop}>
                  <span className={s.stars} aria-label="5 estrellas">
                    {[0, 1, 2, 3, 4].map((k) => (
                      <Star key={k} className={s.star} />
                    ))}
                  </span>
                  {!r.name && <span className={s.demo}>Ejemplo · falta nombre</span>}
                </span>
                <span className={s.quote}>“{r.quote.es || "Escribe aquí la reseña del cliente."}”</span>
                <span className={s.who}>
                  <strong>{r.name || "[Nombre del cliente]"}</strong> · {r.tour.es || "Elige un tour"}
                </span>
              </div>
              <Switch on={r.visible} onChange={() => toggle(i)} label="Mostrar testimonio" />
              <RowActions i={i} n={lists.rev.length} onMove={move} onEdit={() => setEditing({ tab: "rev", id: r.id })} onDelete={() => remove(i)} />
            </div>
          ))}
          {!lists.rev.length && <EmptyBlock text="Aún no hay testimonios." />}
        </div>
      )}

      {tab === "team" && (
        <>
          <div className={s.teamGrid}>
            {lists.team.map((g, i) => (
              <div key={g.id} className={`ad-card ${s.guide} ${g.visible ? "" : s.hidden}`}>
                <div className={`tt-ph ${s.guidePhoto} ${s.gBody}`} style={{ backgroundColor: g.tone }}>
                  {g.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="tt-img" src={g.photo} alt={g.name} loading="lazy" />
                  )}
                  <span className={s.num}>{String(i + 1).padStart(2, "0")}</span>
                  {!g.visible && <span className={s.hid}>Oculto</span>}
                  <span className={s.acts}>
                    <button
                      type="button"
                      className={s.mini}
                      onClick={() =>
                        uploadFor(
                          (url) => setLists((l) => ({ ...l, team: l.team.map((x) => (x.id === g.id ? { ...x, photo: url } : x)) })),
                          "equipo",
                        )
                      }
                      aria-label={`Cambiar retrato de ${g.name}`}
                      title="Cambiar retrato"
                    >
                      <Icon name="image" />
                    </button>
                  </span>
                </div>
                <div className={`${s.gText} ${s.gBody}`}>
                  <strong className="tt-d">{g.name || "Nuevo guía"}</strong>
                  <span>{g.role.es || "Especialidad"}</span>
                </div>
                <div className={s.gFoot}>
                  <Switch on={g.visible} onChange={() => toggle(i)} label={`Mostrar a ${g.name}`} />
                  <RowActions i={i} n={lists.team.length} horizontal onMove={move} onEdit={() => setEditing({ tab: "team", id: g.id })} onDelete={() => remove(i)} />
                </div>
              </div>
            ))}
          </div>
          <section className={`ad-card ${s.about}`}>
            <div>
              <h3 className="ad-h3">Fotos de «Somos de aquí»</h3>
              <p className="ad-help">La foto grande y la pequeña de la sección Nosotros.</p>
            </div>
            <div className={s.aboutGrid}>
              {(["main", "secondary"] as const).map((k) => (
                <div key={k} className={`tt-ph ${s.aboutPhoto}`} style={{ backgroundColor: k === "main" ? "#4E6540" : "#B4532A" }}>
                  {about[k] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="tt-img" src={about[k]!} alt="" />
                  )}
                  <span className={s.cap} style={{ justifyContent: "flex-start" }}>
                    <span>{k === "main" ? "Guías en el sendero" : "El pueblo"}</span>
                  </span>
                  <span className={s.acts}>
                    <button type="button" className={s.mini} onClick={() => uploadFor((url) => setAbout((a) => ({ ...a, [k]: url })), "nosotros")} aria-label="Cambiar foto" title="Cambiar foto">
                      <Icon name="image" />
                    </button>
                    {about[k] && (
                      <button type="button" className={s.mini} onClick={() => setAbout((a) => ({ ...a, [k]: null }))} aria-label="Quitar foto" title="Quitar foto">
                        <Icon name="trash" />
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {tab === "faq" && (
        <div className={s.stack}>
          {lists.faq.map((f, i) => (
            <div key={f.id} className={`ad-card ${s.rev} ${f.visible ? "" : s.hidden}`}>
              <span className={s.grip} aria-hidden="true">
                <Icon name="drag" />
              </span>
              <div className={s.revBody}>
                <strong className={s.q}>{f.q.es || "Nueva pregunta"}</strong>
                <span className={s.who}>{f.a.es || "Escribe la respuesta."}</span>
              </div>
              <Switch on={f.visible} onChange={() => toggle(i)} label="Mostrar pregunta" />
              <RowActions i={i} n={lists.faq.length} onMove={move} onEdit={() => setEditing({ tab: "faq", id: f.id })} onDelete={() => remove(i)} />
            </div>
          ))}
          {!lists.faq.length && <EmptyBlock text="Aún no hay preguntas frecuentes." />}
        </div>
      )}

      {dirty && (
        <div className="ad-pending" role="region" aria-label="Cambios pendientes">
          <span className="ad-pending-t">Tienes cambios sin guardar</span>
          <span style={{ display: "flex", gap: 10 }}>
            <button type="button" className="ad-btn ad-btn-light" onClick={load}>
              Descartar
            </button>
            <button type="button" className="ad-btn ad-btn-amber" onClick={save} disabled={busy}>
              <Icon name="check" />
              {busy ? "Guardando…" : "Guardar cambios"}
            </button>
          </span>
        </div>
      )}

      {editing && editItem && (
        <>
          <div className="ad-drawer-scrim" onClick={() => setEditing(null)} />
          <aside className="ad-drawer" role="dialog" aria-modal="true" aria-label={`Editar ${META[editing.tab].noun.toLowerCase()}`}>
            <div className="ad-drawer-head">
              <div>
                <span className="ad-crumb">{META[editing.tab].label}</span>
                <h3 className="ad-h3" style={{ marginTop: 4 }}>
                  Editar {META[editing.tab].noun.toLowerCase()}
                </h3>
              </div>
              <button type="button" className="ad-ibtn" onClick={() => setEditing(null)} aria-label="Cerrar">
                <Icon name="close" />
              </button>
            </div>
            <div className="ad-drawer-body">
              <LangTabs lang={lang} onChange={setLang} />
              {editing.tab === "gal" && (
                <>
                  <div className={`tt-ph ${s.drawerPhoto}`} style={{ backgroundColor: (editItem as GalleryItem).tone }}>
                    {(editItem as GalleryItem).image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className="tt-img" src={(editItem as GalleryItem).image!} alt="" />
                    )}
                    <button type="button" className="ad-edit" style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }} onClick={() => uploadFor((url) => patchEditing({ image: url }), "galeria")}>
                      <Icon name="image" />
                      Cambiar imagen
                    </button>
                  </div>
                  <L10nField label="Pie de foto" value={(editItem as GalleryItem).caption} lang={lang} onChange={(v) => patchEditing({ caption: v })} />
                </>
              )}
              {editing.tab === "rev" && (
                <>
                  <L10nField label="Reseña" value={(editItem as Testimonial).quote} lang={lang} onChange={(v) => patchEditing({ quote: v })} multiline rows={5} />
                  <TextField label="Nombre del cliente" value={(editItem as Testimonial).name} onChange={(v) => patchEditing({ name: v })} help="Pide permiso antes de publicar su nombre." />
                  <L10nField label="Tour" value={(editItem as Testimonial).tour} lang={lang} onChange={(v) => patchEditing({ tour: v })} placeholder={lang === "es" ? "Tour Cerro Tepozteco" : undefined} />
                </>
              )}
              {editing.tab === "team" && (
                <>
                  <TextField label="Nombre" value={(editItem as Guide).name} onChange={(v) => patchEditing({ name: v })} />
                  <L10nField label="Especialidad" value={(editItem as Guide).role} lang={lang} onChange={(v) => patchEditing({ role: v })} />
                  {[0, 1].map((k) => {
                    const g = editItem as Guide;
                    const tags = [g.tags[0] ?? empty(), g.tags[1] ?? empty()];
                    return (
                      <L10nField
                        key={k}
                        label={`Etiqueta ${k + 1}`}
                        value={tags[k]}
                        lang={lang}
                        onChange={(v) => {
                          const next = [...tags];
                          next[k] = v;
                          patchEditing({ tags: next.filter((x) => x.es || x.en) });
                        }}
                      />
                    );
                  })}
                </>
              )}
              {editing.tab === "faq" && (
                <>
                  <L10nField label="Pregunta" value={(editItem as Faq).q} lang={lang} onChange={(v) => patchEditing({ q: v })} />
                  <L10nField label="Respuesta" value={(editItem as Faq).a} lang={lang} onChange={(v) => patchEditing({ a: v })} multiline rows={5} />
                </>
              )}
            </div>
            <div className="ad-drawer-foot">
              <button type="button" className="ad-btn ad-btn-forest" onClick={() => setEditing(null)}>
                Listo
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

function RowActions({
  i,
  n,
  horizontal = false,
  onMove,
  onEdit,
  onDelete,
}: {
  i: number;
  n: number;
  horizontal?: boolean;
  onMove: (i: number, d: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <span className={s.rowActs}>
      <button type="button" className="ad-ibtn" onClick={() => onMove(i, -1)} disabled={i === 0} aria-label={horizontal ? "Mover antes" : "Subir"}>
        <Icon name={horizontal ? "chevLeft" : "chevUp"} />
      </button>
      <button type="button" className="ad-ibtn" onClick={() => onMove(i, 1)} disabled={i === n - 1} aria-label={horizontal ? "Mover después" : "Bajar"}>
        <Icon name={horizontal ? "chevRight" : "chevDown"} />
      </button>
      <button type="button" className="ad-ibtn" onClick={onEdit} aria-label="Editar">
        <Icon name="edit" />
      </button>
      <button type="button" className="ad-ibtn is-danger" onClick={onDelete} aria-label="Eliminar">
        <Icon name="trash" />
      </button>
    </span>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="ad-empty">
      <span className="ad-empty-ico">
        <Icon name="plus" />
      </span>
      <span className="ad-empty-txt">
        <strong>{text}</strong>
        <span>Usa el botón de arriba para agregar el primero.</span>
      </span>
    </div>
  );
}
