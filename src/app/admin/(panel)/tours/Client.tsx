"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import { Icon } from "@/components/icons";
import { tourFromRow, tourToRow } from "@/lib/admin/rows";
import { durShort, priceTxt } from "@/lib/format";
import { supabaseBrowser } from "@/lib/supabase/client";
import type { Tour } from "@/lib/types";
import s from "./tours.module.css";

const CAT: Record<Tour["category"], string> = { senderismo: "Senderismo", aventura: "Aventura", cultura: "Cultura", bienestar: "Bienestar" };
const DIFF: Record<Tour["difficulty"], [string, number]> = { facil: ["Fácil", 1], moderada: ["Moderada", 2], exigente: ["Exigente", 3] };

/** Slug único para la copia de un tour. */
const copySlug = (slug: string) => `${slug}-copia-${Date.now().toString(36).slice(-4)}`;

export function ToursClient({ initial }: { initial: Tour[] }) {
  const { toast, confirm, refreshStatus, refreshCounts } = useAdmin();
  const [tours, setTours] = useState<Tour[]>(initial);
  const [q, setQ] = useState("");
  const [f, setF] = useState<"all" | "on" | "off">("all");

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from("tours").select("*").order("sort_order").order("created_at");
    if (error) {
      toast("err", "No se pudieron cargar los tours", "Revisa tu conexión y recarga la página.");
      return;
    }
    setTours((data ?? []).map(tourFromRow));
  }, [toast]);

  const after = async () => {
    await Promise.all([load(), refreshStatus(), refreshCounts()]);
  };

  const toggle = async (t: Tour) => {
    const { error } = await supabaseBrowser().from("tours").update({ active: !t.active }).eq("id", t.id);
    if (error) return toast("err", "No se pudo cambiar el estado", "Inténtalo de nuevo en unos segundos.");
    await after();
    toast(
      "ok",
      t.active ? "Tour pausado" : "Tour activado",
      t.active ? `«${t.name.es}» dejará de mostrarse en el sitio al publicar.` : `«${t.name.es}» volverá a mostrarse en el sitio al publicar.`,
    );
  };

  const duplicate = async (t: Tour) => {
    const sb = supabaseBrowser();
    const copy: Tour = {
      ...t,
      name: { es: `${t.name.es} (copia)`, en: t.name.en ? `${t.name.en} (copy)` : "" },
      slug: copySlug(t.slug),
      active: false,
      sortOrder: t.sortOrder + 1,
    };
    const { error } = await sb.from("tours").insert(tourToRow(copy));
    if (error) return toast("err", "No se pudo duplicar", "Inténtalo de nuevo en unos segundos.");
    await after();
    toast("ok", "Tour duplicado", `Se creó «${copy.name.es}» en pausa. Edítalo antes de activarlo.`);
  };

  const remove = async (t: Tour) => {
    const ok = await confirm({
      title: `¿Eliminar «${t.name.es}»?`,
      text: "Se quitará del sitio y del catálogo al publicar. Las reservas que ya registraste no se borran. Esta acción no se puede deshacer.",
    });
    if (!ok) return;
    const { error } = await supabaseBrowser().from("tours").delete().eq("id", t.id);
    if (error) return toast("err", "No se pudo eliminar", "Inténtalo de nuevo en unos segundos.");
    await after();
    toast("ok", "Tour eliminado", `«${t.name.es}» se quitó del catálogo.`);
  };

  const active = tours.filter((t) => t.active).length;
  const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const shown = tours.filter((t) => (f === "all" || (f === "on" ? t.active : !t.active)) && norm(t.name.es).includes(norm(q)));

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h2 className="tt-d">Catálogo de tours</h2>
          <p>
            {tours.length} tours · {active} activos · {tours.length - active} en pausa
          </p>
        </div>
        <Link className={`ad-btn ad-btn-amber ${s.add}`} href="/admin/tours/nuevo">
          <Icon name="plus" size={20} />
          Agregar tour
        </Link>
      </div>

      <div className={s.tools}>
        <label className={s.search}>
          <Icon name="search" />
          <input type="search" placeholder="Buscar por nombre" aria-label="Buscar tours" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <div className="ad-seg" role="group" aria-label="Filtrar por estado">
          {(
            [
              ["all", `Todos · ${tours.length}`],
              ["on", `Activos · ${active}`],
              ["off", `Pausados · ${tours.length - active}`],
            ] as const
          ).map(([k, label]) => (
            <button key={k} type="button" className={`ad-seg-b ${f === k ? "is-on" : ""}`} aria-pressed={f === k} onClick={() => setF(k)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className={`ad-card ${s.card}`}>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead>
              <tr>
                <th className="ad-th" style={{ paddingLeft: 16 }}>
                  Tour
                </th>
                <th className="ad-th">Precio</th>
                <th className="ad-th">Duración</th>
                <th className="ad-th">Dificultad</th>
                <th className="ad-th">Estado</th>
                <th className="ad-th" style={{ textAlign: "right", paddingRight: 16 }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => {
                const [diff, lvl] = DIFF[t.difficulty];
                const cover = t.photos[0]?.url;
                return (
                  <tr key={t.id} className={`${s.row} ${t.active ? "" : s.paused}`}>
                    <td className="ad-td" style={{ paddingLeft: 16 }}>
                      <span className={s.tourCell}>
                        <span className={`tt-ph ${s.thumb}`} style={{ backgroundColor: t.tone }}>
                          {cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="tt-img" src={cover} alt="" loading="lazy" />
                          )}
                        </span>
                        <span className={s.nameCol}>
                          <Link href={`/admin/tours/${t.id}`} className={s.name}>
                            {t.name.es}
                          </Link>
                          <span className={s.cat}>{CAT[t.category]}</span>
                        </span>
                      </span>
                    </td>
                    <td className="ad-td">
                      <span className={s.price}>{priceTxt(t.price)}</span> <span className={s.mxn}>MXN</span>
                    </td>
                    <td className="ad-td">{durShort(t.durationHours)}</td>
                    <td className="ad-td">
                      <span className={s.diff} aria-label={diff}>
                        {[1, 2, 3].map((n) => (
                          <i key={n} className={n <= lvl ? s.on : ""} />
                        ))}
                        <span>{diff}</span>
                      </span>
                    </td>
                    <td className="ad-td">
                      <span className={`ad-badge ${t.active ? "ad-b-ok" : "ad-b-off"}`}>{t.active ? "Activo" : "Pausado"}</span>
                    </td>
                    <td className="ad-td" style={{ paddingRight: 16 }}>
                      <span className={s.actions}>
                        <Link className="ad-ibtn" href={`/admin/tours/${t.id}`} aria-label={`Editar ${t.name.es}`} title="Editar">
                          <Icon name="edit" />
                        </Link>
                        <button type="button" className="ad-ibtn" onClick={() => duplicate(t)} aria-label={`Duplicar ${t.name.es}`} title="Duplicar">
                          <Icon name="copy" />
                        </button>
                        <button
                          type="button"
                          className="ad-ibtn"
                          onClick={() => toggle(t)}
                          aria-label={t.active ? `Pausar ${t.name.es}` : `Activar ${t.name.es}`}
                          title={t.active ? "Pausar" : "Activar"}
                        >
                          <Icon name={t.active ? "pause" : "play"} />
                        </button>
                        <button type="button" className="ad-ibtn is-danger" onClick={() => remove(t)} aria-label={`Eliminar ${t.name.es}`} title="Eliminar">
                          <Icon name="trash" />
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {shown.length === 0 && (
          <div className={s.none}>{tours.length ? "No hay tours que coincidan con tu búsqueda." : "Todavía no hay tours. Agrega el primero."}</div>
        )}
        <div className={s.foot}>
          <span>
            Mostrando {shown.length} de {tours.length} tours
          </span>
          <span>Los tours pausados no aparecen en el sitio ni en el carrusel.</span>
        </div>
      </section>
    </div>
  );
}
