"use client";

import { useCallback, useState } from "react";
import { useAdmin, usePageSave } from "@/components/admin/AdminShell";
import { Icon } from "@/components/icons";
import { reservationFromRow, type Reservation } from "@/lib/admin/rows";
import { supabaseBrowser } from "@/lib/supabase/client";
import s from "./reservas.module.css";

export type ResTourLite = { id: string; name: string; price: number };
type Status = Reservation["status"];
const ST: Record<Status, [string, string]> = {
  pendiente: ["Pendiente", "ad-b-warn"],
  confirmada: ["Confirmada", "ad-b-ok"],
  cancelada: ["Cancelada", "ad-b-bad"],
};
const NEXT: Record<Status, Status> = { pendiente: "confirmada", confirmada: "cancelada", cancelada: "pendiente" };
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const money = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

type Form = { id: string | null; client: string; whatsapp: string; tourId: string; date: string; time: string; people: number; total: number; totalTouched: boolean; status: Status; notes: string };

type TourLite = ResTourLite;

export function ReservasClient({ initial }: { initial: { rows: Reservation[]; tours: TourLite[] } }) {
  const { toast, confirm, refreshCounts } = useAdmin();
  const [rows, setRows] = useState<Reservation[]>(initial.rows);
  const [tours, setTours] = useState<TourLite[]>(initial.tours);
  const [q, setQ] = useState("");
  const [flt, setFlt] = useState<"all" | Status>("all");
  const [month, setMonth] = useState(() => todayISO().slice(0, 7));
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);

  const blank = useCallback(
    (t?: TourLite): Form => ({
      id: null,
      client: "",
      whatsapp: "",
      tourId: t?.id ?? "",
      date: todayISO(),
      time: "08:00",
      people: 2,
      total: (t?.price ?? 0) * 2,
      totalTouched: false,
      status: "pendiente",
      notes: "",
    }),
    [],
  );
  const [form, setForm] = useState<Form>(() => blank(initial.tours[0]));

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const [r, t] = await Promise.all([sb.from("reservations").select("*").order("date").order("time"), sb.from("tours").select("id, name, price").order("sort_order")]);
    if (r.error || t.error) return toast("err", "No se pudieron cargar las reservas", "Revisa tu conexión y recarga la página.");
    setRows((r.data ?? []).map(reservationFromRow));
    const ts = (t.data ?? []).map((x: Record<string, unknown>) => ({ id: String(x.id), name: (x.name as { es: string }).es, price: Number(x.price) }));
    setTours(ts);
  }, [toast]);

  const tourOf = (id: string) => tours.find((t) => t.id === id);
  const patch = (p: Partial<Form>) =>
    setForm((f) => {
      const next = { ...f, ...p };
      if (!next.totalTouched && (p.tourId !== undefined || p.people !== undefined)) next.total = (tourOf(next.tourId)?.price ?? 0) * next.people;
      return next;
    });

  const formDirty = form.client.trim() !== "" || form.notes.trim() !== "" || form.whatsapp.trim() !== "";

  const saveRes = async (): Promise<boolean> => {
    if (!form.client.trim()) {
      setTried(true);
      toast("err", "Falta el nombre", "Escribe el nombre del cliente para guardar la reserva.");
      return false;
    }
    if (!form.tourId) {
      toast("err", "Falta el tour", "Elige el tour de la reserva.");
      return false;
    }
    setBusy(true);
    const row = {
      date: form.date,
      time: form.time,
      client: form.client.trim(),
      whatsapp: form.whatsapp.trim(),
      tour_id: form.tourId,
      tour_name: tourOf(form.tourId)?.name ?? "",
      people: form.people,
      total: Math.max(0, Math.round(form.total)),
      status: form.status,
      notes: form.notes.trim(),
    };
    const sb = supabaseBrowser();
    const { error } = form.id ? await sb.from("reservations").update(row).eq("id", form.id) : await sb.from("reservations").insert(row);
    setBusy(false);
    if (error) {
      toast("err", "No se pudo guardar la reserva", "Revisa tu conexión e inténtalo de nuevo. Los datos siguen en el formulario.");
      return false;
    }
    const [y, m, d] = form.date.split("-").map(Number);
    toast("ok", form.id ? "Reserva actualizada" : "Reserva guardada", `${row.client} · ${row.tour_name} · ${d} ${MES[m - 1]}.`);
    setMonth(`${y}-${String(m).padStart(2, "0")}`);
    setForm(blank(tours[0]));
    setTried(false);
    await Promise.all([load(), refreshCounts()]);
    return true;
  };

  usePageSave(formDirty, saveRes);

  const cycle = async (r: Reservation) => {
    const next = NEXT[r.status];
    const { error } = await supabaseBrowser().from("reservations").update({ status: next }).eq("id", r.id);
    if (error) return toast("err", "No se pudo cambiar el estado", "Inténtalo de nuevo en unos segundos.");
    setRows((list) => list.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
    refreshCounts();
    toast("ok", "Estado actualizado", `La reserva de ${r.client} ahora está ${ST[next][0].toLowerCase()}.`);
  };

  const remove = async (r: Reservation) => {
    const ok = await confirm({
      title: `¿Eliminar la reserva de ${r.client}?`,
      text: "Se borrará del registro. Si solo se canceló, mejor cambia su estado a «Cancelada».",
    });
    if (!ok) return;
    const { error } = await supabaseBrowser().from("reservations").delete().eq("id", r.id);
    if (error) return toast("err", "No se pudo eliminar", "Inténtalo de nuevo en unos segundos.");
    setRows((list) => list.filter((x) => x.id !== r.id));
    refreshCounts();
    toast("ok", "Reserva eliminada", `Se quitó la reserva de ${r.client}.`);
  };

  const edit = (r: Reservation) =>
    setForm({
      id: r.id,
      client: r.client,
      whatsapp: r.whatsapp,
      tourId: r.tourId ?? tours.find((t) => t.name === r.tourName)?.id ?? "",
      date: r.date,
      time: r.time,
      people: r.people,
      total: r.total,
      totalTouched: true,
      status: r.status,
      notes: r.notes,
    });

  const all = rows;
  const inMonth = all.filter((r) => r.date.startsWith(month));
  const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const shown = inMonth.filter((r) => (flt === "all" || r.status === flt) && (norm(r.client).includes(norm(q)) || norm(r.tourName).includes(norm(q))));
  const count = (st: Status) => inMonth.filter((r) => r.status === st).length;
  const [y, m] = month.split("-").map(Number);
  const shiftMonth = (d: number) => {
    const dt = new Date(y, m - 1 + d, 1);
    setMonth(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  };
  const fmtDate = (d: string) => {
    const [, mm, dd] = d.split("-").map(Number);
    return `${dd} ${MES[mm - 1]}`;
  };

  return (
    <div className={s.layout}>
      <section className={`ad-card ${s.form}`}>
        <div>
          <h2 className="tt-d">{form.id ? "Editar reserva" : "Nueva reserva"}</h2>
          <p>{form.id ? "Corrige los datos y guarda." : "Regístrala cuando confirmes por WhatsApp."}</p>
        </div>
        <div>
          <label className="ad-label" htmlFor="rv-name">
            Nombre del cliente
          </label>
          <input
            id="rv-name"
            className={`ad-input ${tried && !form.client.trim() ? "is-bad" : ""}`}
            placeholder="Ej. Laura Méndez"
            value={form.client}
            aria-invalid={tried && !form.client.trim() ? true : undefined}
            onChange={(e) => patch({ client: e.target.value })}
          />
          {tried && !form.client.trim() && (
            <span className="ad-err">
              <Icon name="info" />
              Escribe el nombre del cliente.
            </span>
          )}
        </div>
        <div className={s.g2}>
          <div>
            <label className="ad-label" htmlFor="rv-tel">
              WhatsApp
            </label>
            <input id="rv-tel" className="ad-input" placeholder="777 000 0000" inputMode="tel" value={form.whatsapp} onChange={(e) => patch({ whatsapp: e.target.value })} />
          </div>
          <div>
            <label className="ad-label" htmlFor="rv-tour">
              Tour
            </label>
            <select id="rv-tour" className="ad-input" value={form.tourId} onChange={(e) => patch({ tourId: e.target.value })}>
              {tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={s.g2}>
          <div>
            <label className="ad-label" htmlFor="rv-date">
              Fecha
            </label>
            <input id="rv-date" className="ad-input" type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
          </div>
          <div>
            <label className="ad-label" htmlFor="rv-time">
              Hora
            </label>
            <input id="rv-time" className="ad-input" type="time" value={form.time} onChange={(e) => patch({ time: e.target.value })} />
          </div>
        </div>
        <div className={s.g2}>
          <div>
            <span className="ad-label">Personas</span>
            <div className={s.num}>
              <button type="button" onClick={() => patch({ people: Math.max(1, form.people - 1) })} aria-label="Menos personas">
                <Icon name="minus" />
              </button>
              <span aria-live="polite">{form.people}</span>
              <button type="button" onClick={() => patch({ people: Math.min(60, form.people + 1) })} aria-label="Más personas">
                <Icon name="plus" />
              </button>
            </div>
          </div>
          <div>
            <label className="ad-label" htmlFor="rv-total">
              Total
            </label>
            <div className={`${s.num} ${s.total}`}>
              <span className={s.cur}>$</span>
              <input
                id="rv-total"
                type="number"
                min={0}
                inputMode="numeric"
                value={form.total}
                onChange={(e) => setForm((f) => ({ ...f, total: Number(e.target.value) || 0, totalTouched: true }))}
              />
              <span className={s.mxn}>MXN</span>
            </div>
          </div>
        </div>
        <div>
          <span className="ad-label">Estado</span>
          <div className={`ad-seg ${s.seg}`} role="group" aria-label="Estado de la reserva">
            {(Object.keys(ST) as Status[]).map((st) => (
              <button key={st} type="button" className={`ad-seg-b ${s.st} ${form.status === st ? "is-on" : ""}`} aria-pressed={form.status === st} onClick={() => patch({ status: st })}>
                {ST[st][0]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="ad-label" htmlFor="rv-notes">
            Notas
          </label>
          <textarea id="rv-notes" className="ad-input" rows={2} placeholder="Ej. Llegan en auto, uno es vegetariano" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} />
        </div>
        <button type="button" className={`ad-btn ad-btn-amber ${s.saveBtn}`} onClick={saveRes} disabled={busy}>
          <Icon name="check" />
          {busy ? "Guardando…" : form.id ? "Guardar cambios" : "Guardar reserva"}
        </button>
        {form.id && (
          <button type="button" className="ad-btn ad-btn-plain" onClick={() => setForm(blank(tours[0]))}>
            Cancelar edición
          </button>
        )}
      </section>

      <section className={`ad-card ${s.list}`}>
        <div className={s.listHead}>
          <div className={s.monthNav}>
            <button type="button" className="ad-ibtn" onClick={() => shiftMonth(-1)} aria-label="Mes anterior">
              <Icon name="chevLeft" />
            </button>
            <h2 className="tt-d">
              {MONTHS[m - 1]} {y}
            </h2>
            <button type="button" className="ad-ibtn" onClick={() => shiftMonth(1)} aria-label="Mes siguiente">
              <Icon name="chevRight" />
            </button>
          </div>
          <label className={s.search}>
            <Icon name="search" size={18} />
            <input type="search" placeholder="Buscar cliente o tour" aria-label="Buscar reservas" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
        </div>
        <div className={s.filters}>
          <div className={`ad-seg ${s.seg}`} role="group" aria-label="Filtrar por estado">
            {(
              [
                ["all", `Todas · ${inMonth.length}`],
                ["pendiente", `Pendientes · ${count("pendiente")}`],
                ["confirmada", `Confirmadas · ${count("confirmada")}`],
                ["cancelada", `Canceladas · ${count("cancelada")}`],
              ] as const
            ).map(([k, label]) => (
              <button key={k} type="button" className={`ad-seg-b ${flt === k ? "is-on" : ""}`} aria-pressed={flt === k} onClick={() => setFlt(k)}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="ad-table-wrap">
            <table className="ad-table">
              <thead>
                <tr>
                  <th className="ad-th">Fecha</th>
                  <th className="ad-th">Cliente</th>
                  <th className="ad-th">Tour</th>
                  <th className="ad-th" style={{ textAlign: "right" }}>
                    Pers.
                  </th>
                  <th className="ad-th" style={{ textAlign: "right" }}>
                    Total
                  </th>
                  <th className="ad-th">Estado</th>
                  <th className="ad-th">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className={`${s.row} ${form.id === r.id ? s.editing : ""}`}>
                    <td className="ad-td" style={{ height: 58 }}>
                      <span className={s.two}>
                        <strong>{fmtDate(r.date)}</strong>
                        <span>{r.time}</span>
                      </span>
                    </td>
                    <td className="ad-td">
                      <span className={s.two}>
                        <button type="button" className={s.nameBtn} onClick={() => edit(r)} title="Editar reserva">
                          {r.client}
                        </button>
                        <span>{r.whatsapp || "—"}</span>
                      </span>
                    </td>
                    <td className="ad-td">{r.tourName}</td>
                    <td className="ad-td" style={{ textAlign: "right" }}>
                      {r.people}
                    </td>
                    <td className="ad-td" style={{ textAlign: "right", fontWeight: 700 }}>
                      {money(r.total)}
                    </td>
                    <td className="ad-td">
                      <button type="button" className={`ad-badge ${ST[r.status][1]}`} onClick={() => cycle(r)} aria-label={`Cambiar estado de la reserva de ${r.client}: ${ST[r.status][0]}`}>
                        {ST[r.status][0]}
                      </button>
                    </td>
                    <td className="ad-td" style={{ textAlign: "right" }}>
                      <span className={s.acts}>
                        <button type="button" className="ad-ibtn" onClick={() => edit(r)} aria-label={`Editar reserva de ${r.client}`}>
                          <Icon name="edit" />
                        </button>
                        <button type="button" className="ad-ibtn is-danger" onClick={() => remove(r)} aria-label={`Eliminar reserva de ${r.client}`}>
                          <Icon name="trash" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        {shown.length === 0 && (
          <div className={s.empty}>
            {inMonth.length ? (
              "No hay reservas con ese filtro."
            ) : (
              <div className="ad-empty" style={{ textAlign: "left" }}>
                <span className="ad-empty-ico">
                  <Icon name="calendar" />
                </span>
                <span className="ad-empty-txt">
                  <strong>Aún no hay reservas este mes</strong>
                  <span>Registra la primera cuando confirmes por WhatsApp.</span>
                </span>
              </div>
            )}
          </div>
        )}
        <div className={s.foot}>
          <span>
            {shown.length} de {inMonth.length} reservas
          </span>
          <span>
            <strong>{money(inMonth.filter((r) => r.status === "confirmada").reduce((a, r) => a + r.total, 0))}</strong> MXN confirmados · toca el estado para cambiarlo
          </span>
        </div>
      </section>
    </div>
  );
}
