import Link from "next/link";
import { Icon } from "@/components/icons";
import { reservationFromRow, type Reservation } from "@/lib/admin/rows";
import { supabaseServer } from "@/lib/supabase/server";
import s from "./resumen.module.css";

const TZ = "America/Mexico_City";
const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const DAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const STATUS: Record<Reservation["status"], [string, string]> = {
  pendiente: ["Pendiente", "ad-b-warn"],
  confirmada: ["Confirmada", "ad-b-ok"],
  cancelada: ["Cancelada", "ad-b-bad"],
};

const money = (n: number) => "$" + Math.round(n).toLocaleString("es-MX");

/** Fecha de hoy en Tepoztlán, como "AAAA-MM-DD". */
function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function longToday() {
  const f = new Intl.DateTimeFormat("es-MX", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" }).format(new Date());
  return f.charAt(0).toUpperCase() + f.slice(1);
}

export default async function ResumenPage() {
  const sb = await supabaseServer();
  const [{ data: resRows }, { data: tourRows }] = await Promise.all([
    sb.from("reservations").select("*").order("date", { ascending: false }),
    sb.from("tours").select("id, name, active").order("sort_order"),
  ]);
  const reservations = (resRows ?? []).map(reservationFromRow);
  const tours = (tourRows ?? []) as { id: string; name: { es: string }; active: boolean }[];

  const today = todayISO();
  const [y, m] = today.split("-").map(Number);
  const monthKey = today.slice(0, 7);
  const prevKey = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const inMonth = (r: Reservation, key: string) => r.date.startsWith(key) && r.status !== "cancelada";

  const monthRes = reservations.filter((r) => inMonth(r, monthKey));
  const prevRes = reservations.filter((r) => inMonth(r, prevKey));
  const people = monthRes.reduce((a, r) => a + r.people, 0);
  const confirmedTotal = monthRes.filter((r) => r.status === "confirmada").reduce((a, r) => a + r.total, 0);
  const active = tours.filter((t) => t.active);
  const paused = tours.filter((t) => !t.active);
  const diff = monthRes.length - prevRes.length;

  const recent = [...reservations].sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1)).slice(0, 7);

  const byTour = new Map<string, number>();
  monthRes.forEach((r) => byTour.set(r.tourName, (byTour.get(r.tourName) ?? 0) + 1));
  const bars = [...byTour.entries()].sort((a, b) => b[1] - a[1]);
  const maxBar = Math.max(1, ...bars.map((b) => b[1]));

  const upcoming = reservations
    .filter((r) => r.date >= today && r.status !== "cancelada")
    .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date < b.date ? -1 : 1))
    .slice(0, 4);

  const fmtDate = (d: string) => {
    const [, mm, dd] = d.split("-").map(Number);
    return `${dd} ${MES[mm - 1]}`;
  };
  const weekday = (d: string) => DAYS[new Date(`${d}T12:00:00`).getDay()];

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div>
          <h2 className="tt-d">Hola, equipo</h2>
          <p>
            {longToday()} · Así va {MONTHS[m - 1]} en TepozTours.
          </p>
        </div>
        <div className={s.headActions}>
          <Link className="ad-btn ad-btn-ghost" href="/admin/reservas">
            <Icon name="calendar" />
            Registrar reserva
          </Link>
          <Link className="ad-btn ad-btn-amber" href="/admin/tours/nuevo">
            <Icon name="plus" />
            Agregar tour
          </Link>
        </div>
      </div>

      <div className={s.kpis}>
        <Kpi icon="calendar" label={`Reservas en ${MONTHS[m - 1]}`} value={String(monthRes.length)}>
          {diff === 0 ? `Igual que en ${MONTHS[(m + 10) % 12]}` : `${Math.abs(diff)} ${diff > 0 ? "más" : "menos"} que en ${MONTHS[(m + 10) % 12]}`}
        </Kpi>
        <Kpi icon="group" label="Personas atendidas" value={String(people)}>
          {monthRes.length ? `${(people / monthRes.length).toFixed(1)} personas por reserva` : "Aún sin reservas este mes"}
        </Kpi>
        <Kpi
          icon="mountain"
          label="Tours activos"
          value={
            <>
              {active.length}
              <span className={s.kpiOf}> / {tours.length}</span>
            </>
          }
        >
          {paused.length ? `${paused.map((t) => t.name.es).join(", ")} ${paused.length === 1 ? "está pausado" : "están pausados"}` : "Todos visibles en el sitio"}
        </Kpi>
        <Kpi icon="money" label="Ingresos estimados" value={money(confirmedTotal)}>
          MXN · reservas confirmadas
        </Kpi>
      </div>

      <div className={s.grid}>
        <section className={`ad-card ${s.recent}`}>
          <div className={s.cardHead}>
            <h3 className="ad-h3">Reservas recientes</h3>
            <Link href="/admin/reservas" className={s.link}>
              Ver todas
            </Link>
          </div>
          {recent.length ? (
            <div className="ad-table-wrap">
              <table className="ad-table">
                <thead>
                  <tr>
                    <th className="ad-th">Cliente</th>
                    <th className="ad-th">Tour</th>
                    <th className="ad-th">Fecha</th>
                    <th className="ad-th" style={{ textAlign: "right" }}>
                      Pers.
                    </th>
                    <th className="ad-th" style={{ textAlign: "right" }}>
                      Total
                    </th>
                    <th className="ad-th">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id}>
                      <td className="ad-td" style={{ fontWeight: 700, height: 56 }}>
                        {r.client}
                      </td>
                      <td className="ad-td" style={{ height: 56 }}>
                        {r.tourName}
                      </td>
                      <td className="ad-td" style={{ color: "var(--muted)", height: 56 }}>
                        {fmtDate(r.date)}
                      </td>
                      <td className="ad-td" style={{ textAlign: "right", height: 56 }}>
                        {r.people}
                      </td>
                      <td className="ad-td" style={{ textAlign: "right", fontWeight: 700, height: 56 }}>
                        {money(r.total)}
                      </td>
                      <td className="ad-td" style={{ height: 56 }}>
                        <span className={`ad-badge ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Aún no hay reservas" text="Registra la primera cuando confirmes por WhatsApp." />
          )}
        </section>

        <div className={s.side}>
          <section className={`ad-card ${s.bars}`}>
            <div className={s.cardHead} style={{ padding: 0, marginBottom: 16 }}>
              <h3 className="ad-h3">Reservas por tour</h3>
              <span className={s.muted}>{MONTHS[m - 1].charAt(0).toUpperCase() + MONTHS[m - 1].slice(1)}</span>
            </div>
            {bars.length ? (
              <div role="img" aria-label={`Reservas por tour en ${MONTHS[m - 1]}`} className={s.barList}>
                {bars.map(([name, v]) => (
                  <div key={name} className={s.barRow}>
                    <span className={s.barName}>{name}</span>
                    <span className={s.barTrack}>
                      <span className={s.bar} style={{ width: `${(v / maxBar) * 100}%` }} />
                    </span>
                    <span className={s.barV}>{v}</span>
                    <span className={s.tip}>
                      {name} · {v} {v === 1 ? "reserva" : "reservas"} ({Math.round((v / monthRes.length) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={s.muted}>Todavía no hay reservas este mes.</p>
            )}
          </section>
          <section className={`ad-card ${s.upcoming}`}>
            <h3 className="ad-h3" style={{ marginBottom: 14 }}>
              Próximas salidas
            </h3>
            {upcoming.length ? (
              <div className={s.upList}>
                {upcoming.map((u) => (
                  <div key={u.id} className={s.up}>
                    <span className={s.upDate}>
                      <span>{weekday(u.date)}</span>
                      <span className="tt-d">{Number(u.date.slice(8))}</span>
                    </span>
                    <span className={s.upTxt}>
                      <strong>{u.tourName}</strong>
                      <span>
                        {u.time || "Hora por confirmar"} · {u.people} {u.people === 1 ? "persona" : "personas"} · {u.client}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className={s.muted}>No hay salidas próximas registradas.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon, label, value, children }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; value: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className={`ad-card ${s.kpi}`}>
      <span className={s.kpiK}>
        <span className={s.kpiIco}>
          <Icon name={icon} />
        </span>
        {label}
      </span>
      <span className={s.kpiV}>{value}</span>
      <span className={s.kpiS}>{children}</span>
    </div>
  );
}

function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="ad-empty" style={{ margin: "0 12px 12px" }}>
      <span className="ad-empty-ico">
        <Icon name="calendar" />
      </span>
      <span className="ad-empty-txt">
        <strong>{title}</strong>
        <span>{text}</span>
      </span>
      <Link className="ad-btn ad-btn-amber" href="/admin/reservas" style={{ height: 40 }}>
        Nueva reserva
      </Link>
    </div>
  );
}
