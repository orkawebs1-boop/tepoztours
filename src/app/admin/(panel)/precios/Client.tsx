"use client";

import { useCallback, useState } from "react";
import { useAdmin, usePageSave } from "@/components/admin/AdminShell";
import { Icon } from "@/components/icons";
import { supabaseBrowser } from "@/lib/supabase/client";
import s from "./precios.module.css";

export type PriceRow = { id: string; name: string; category: string; price: number; tone: string; active: boolean; cover: string | null };
const CAT: Record<string, string> = { senderismo: "Senderismo", aventura: "Aventura", cultura: "Cultura", bienestar: "Bienestar" };

type Row = PriceRow;

export function PreciosClient({ initial }: { initial: Row[] }) {
  const { toast, refreshStatus } = useAdmin();
  const [rows, setRows] = useState<Row[]>(initial);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [pct, setPct] = useState(10);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabaseBrowser().from("tours").select("id, name, category, price, tone, active, photos").order("sort_order").order("created_at");
    if (error) return toast("err", "No se pudieron cargar los precios", "Revisa tu conexión y recarga la página.");
    setRows(
      (data ?? []).map((t: Record<string, unknown>) => ({
        id: String(t.id),
        name: (t.name as { es: string }).es,
        category: String(t.category),
        price: Number(t.price),
        tone: String(t.tone),
        active: Boolean(t.active),
        cover: ((t.photos as { url: string | null }[]) ?? []).find((p) => p.url)?.url ?? null,
      })),
    );
  }, [toast]);

  const state = (r: Row) => {
    const has = r.id in edits;
    const raw = has ? edits[r.id] : String(r.price);
    const bad = has && (raw.trim() === "" || !(Number(raw) > 0));
    const v = Number(raw);
    const changed = has && !bad && v !== r.price;
    return { raw, bad, changed, v };
  };

  const list = rows;
  const changed = list.filter((r) => state(r).changed).length;
  const bad = list.filter((r) => state(r).bad).length;
  const dirty = changed > 0 || bad > 0;

  const save = async (): Promise<boolean> => {
    if (bad) {
      toast("err", "No se pudo guardar", bad === 1 ? "Hay 1 precio vacío o en cero. Corrígelo e inténtalo de nuevo." : `Hay ${bad} precios vacíos o en cero. Corrígelos e inténtalo de nuevo.`);
      return false;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const updates = list.filter((r) => state(r).changed).map((r) => sb.from("tours").update({ price: Math.round(state(r).v) }).eq("id", r.id));
    const results = await Promise.all(updates);
    setBusy(false);
    if (results.some((x) => x.error)) {
      toast("err", "No se pudieron guardar todos los precios", "Revisa tu conexión e inténtalo de nuevo. Tus cambios siguen aquí.");
      return false;
    }
    const n = updates.length;
    setEdits({});
    await Promise.all([load(), refreshStatus()]);
    toast("ok", "Precios guardados", `${n} ${n === 1 ? "precio actualizado" : "precios actualizados"}. Toca Publicar para verlos en el sitio.`);
    return true;
  };

  usePageSave(dirty, save);

  const applyPct = () => {
    const next: Record<string, string> = {};
    list.forEach((r) => (next[r.id] = String(Math.max(10, Math.round((r.price * (1 + pct / 100)) / 10) * 10))));
    setEdits(next);
    toast("ok", "Ajuste aplicado", `${pct >= 0 ? "Subimos" : "Bajamos"} ${Math.abs(pct)}% a todos los tours, redondeado a $10. Revisa y guarda.`);
  };

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h2 className="tt-d">Todos los precios</h2>
          <p>Escribe el nuevo precio por persona. Los cambios se guardan juntos.</p>
        </div>
        <div className={`ad-card ${s.bulk}`}>
          <span className={s.bulkLabel}>Ajustar todos</span>
          <button type="button" className={s.step} onClick={() => setPct((p) => Math.max(p - 5, -50))} aria-label="Menos porcentaje">
            <Icon name="minus" />
          </button>
          <span className={`tt-d ${s.pct}`} aria-live="polite">
            {pct > 0 ? "+" : ""}
            {pct}%
          </span>
          <button type="button" className={s.step} onClick={() => setPct((p) => Math.min(p + 5, 50))} aria-label="Más porcentaje">
            <Icon name="plus" />
          </button>
          <button type="button" className="ad-btn ad-btn-forest" onClick={applyPct} disabled={pct === 0}>
            Aplicar
          </button>
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
                <th className="ad-th">Categoría</th>
                <th className="ad-th">Precio actual</th>
                <th className="ad-th">Nuevo precio</th>
                <th className="ad-th">Cambio</th>
                <th className="ad-th">Estado</th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const st = state(r);
                let diff = "Sin cambio";
                let dCls = s.same;
                if (st.changed) {
                  const d = st.v - r.price;
                  const p = Math.round((d / r.price) * 100);
                  diff = `${d > 0 ? `▲ +$${d}` : `▼ −$${Math.abs(d)}`} (${p > 0 ? "+" : ""}${p}%)`;
                  dCls = d > 0 ? s.up : s.down;
                }
                if (st.bad) diff = "—";
                return (
                  <tr key={r.id} className={st.bad ? s.isBad : st.changed ? s.isChanged : ""}>
                    <td className="ad-td" style={{ paddingLeft: 16, height: 70 }}>
                      <span className={s.tourCell}>
                        <span className={`tt-ph ${s.thumb}`} style={{ backgroundColor: r.tone }}>
                          {r.cover && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img className="tt-img" src={r.cover} alt="" loading="lazy" />
                          )}
                        </span>
                        <span className={s.name}>{r.name}</span>
                      </span>
                    </td>
                    <td className="ad-td" style={{ color: "var(--muted)" }}>
                      {CAT[r.category]}
                    </td>
                    <td className="ad-td">
                      <span className={s.cur}>${r.price.toLocaleString("es-MX")}</span>
                    </td>
                    <td className="ad-td">
                      <label className={`${s.input} ${st.bad ? s.inBad : ""}`}>
                        <span>$</span>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          inputMode="numeric"
                          value={st.raw}
                          aria-label={`Nuevo precio de ${r.name}`}
                          aria-invalid={st.bad || undefined}
                          onChange={(e) => setEdits((ed) => ({ ...ed, [r.id]: e.target.value }))}
                        />
                      </label>
                      {st.bad && <span className={s.err}>Escribe un precio mayor a 0</span>}
                    </td>
                    <td className="ad-td">
                      <span className={`${s.diff} ${dCls}`}>{diff}</span>
                    </td>
                    <td className="ad-td">
                      <span className={`ad-badge ${r.active ? "ad-b-ok" : "ad-b-off"}`}>{r.active ? "Activo" : "Pausado"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {dirty && (
        <div className="ad-pending" role="region" aria-label="Cambios pendientes">
          <span className="ad-pending-t">
            {changed} {changed === 1 ? "precio modificado" : "precios modificados"}
            {bad ? ` · ${bad} por revisar` : ""}
          </span>
          <span style={{ display: "flex", gap: 10 }}>
            <button type="button" className="ad-btn ad-btn-light" onClick={() => setEdits({})}>
              Descartar
            </button>
            <button type="button" className="ad-btn ad-btn-amber" onClick={save} disabled={busy}>
              <Icon name="check" />
              {busy ? "Guardando…" : "Guardar precios"}
            </button>
          </span>
        </div>
      )}
    </div>
  );
}
