/**
 * Genera supabase/seed.sql a partir de src/lib/seed.ts (datos del diseño).
 * Uso: node scripts/gen-seed.ts   (Node 23.6+ ejecuta TypeScript directamente)
 */
import { writeFileSync } from "node:fs";
import { seedData } from "../src/lib/seed.ts";

const q = (v: unknown): string => {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "true" : "false";
  return `'${String(v).replace(/'/g, "''")}'`;
};
const j = (v: unknown): string => (v === null || v === undefined ? "null" : `${q(JSON.stringify(v))}::jsonb`);

const lines: string[] = [
  "-- Datos iniciales del diseño aprobado. Generado por scripts/gen-seed.ts; no editar a mano.",
  "begin;",
];

// Ids estables por tour para poder ligar slides y reservas.
const tourUuid = new Map(seedData.tours.map((t, i) => [t.id, `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`]));

for (const t of seedData.tours) {
  lines.push(
    `insert into public.tours (id, slug, name, category, short, description, price, duration_hours, difficulty, group_max, departure_time, meeting_point, schedule_days, min_age, badge, photos, itinerary, includes, bring, wa_message, tone, map_x, map_y, pin_label, active, in_carousel, sort_order) values (` +
      [
        q(tourUuid.get(t.id)), q(t.slug), j(t.name), q(t.category), j(t.short), j(t.description), q(t.price), q(t.durationHours),
        q(t.difficulty), q(t.groupMax), q(t.departureTime), j(t.meetingPoint), j(t.scheduleDays), q(t.minAge), j(t.badge),
        j(t.photos), j(t.itinerary), j(t.includes), j(t.bring), j(t.waMessage), q(t.tone), q(t.mapX), q(t.mapY), j(t.pinLabel),
        q(t.active), q(t.inCarousel), q(t.sortOrder),
      ].join(", ") +
      ");",
  );
}

for (const s of seedData.slides) {
  lines.push(
    `insert into public.slides (tour_id, line1, line2, eyebrow, description, image, visible, sort_order) values (` +
      [q(tourUuid.get(s.tourId)), j(s.line1), j(s.line2), j(s.eyebrow), j(s.description), q(s.image), q(s.visible), q(s.sortOrder)].join(", ") +
      ");",
  );
}

for (const g of seedData.gallery) {
  lines.push(`insert into public.gallery_items (image, caption, tone, visible, sort_order) values (${[q(g.image), j(g.caption), q(g.tone), q(g.visible), q(g.sortOrder)].join(", ")});`);
}
for (const r of seedData.testimonials) {
  lines.push(`insert into public.testimonials (quote, name, tour, tone, visible, sort_order) values (${[j(r.quote), q(r.name), j(r.tour), q(r.tone), q(r.visible), q(r.sortOrder)].join(", ")});`);
}
for (const g of seedData.guides) {
  lines.push(`insert into public.guides (name, role, tags, photo, tone, visible, sort_order) values (${[q(g.name), j(g.role), j(g.tags), q(g.photo), q(g.tone), q(g.visible), q(g.sortOrder)].join(", ")});`);
}
for (const f of seedData.faqs) {
  lines.push(`insert into public.faqs (q, a, visible, sort_order) values (${[j(f.q), j(f.a), q(f.visible), q(f.sortOrder)].join(", ")});`);
}
lines.push(`insert into public.settings (id, data) values (1, ${j(seedData.settings)});`);

// Reservas de ejemplo del diseño (AdminReservas). Se pueden borrar desde el panel.
const R: [string, string, string, string, string, number, string][] = [
  ["2026-10-03", "7:00", "Laura M.", "777 ••• 1234", "cerro-tepozteco", 2, "confirmada"],
  ["2026-10-04", "10:00", "Grupo Ríos", "55 ••• 8841", "cuevas-volcanicas", 6, "pendiente"],
  ["2026-10-04", "17:00", "Andrés P.", "777 ••• 5520", "temazcal", 2, "confirmada"],
  ["2026-10-05", "5:30", "Sofía y Carlos", "55 ••• 3310", "amanecer", 2, "confirmada"],
  ["2026-10-06", "9:00", "Daniela R.", "222 ••• 7788", "cabalgata", 3, "pendiente"],
  ["2026-10-07", "8:00", "Mario L.", "55 ••• 0192", "venaditos-cascadas", 4, "cancelada"],
  ["2026-10-10", "11:00", "Familia Ortiz", "777 ••• 6403", "recorrido-cultural", 5, "confirmada"],
  ["2026-10-11", "7:00", "Paola V.", "55 ••• 2275", "cerro-tepozteco", 3, "confirmada"],
];
for (const [date, time, client, wa, slug, people, status] of R) {
  const tour = seedData.tours.find((t) => t.slug === slug)!;
  lines.push(
    `insert into public.reservations (date, time, client, whatsapp, tour_id, tour_name, people, total, status, notes) values (` +
      [q(date), q(time), q(client), q(wa), q(tourUuid.get(tour.id)), q(tour.name.es), q(people), q(tour.price * people), q(status), q("Reserva de ejemplo")].join(", ") +
      ");",
  );
}

lines.push("commit;", "");
writeFileSync(new URL("../supabase/seed.sql", import.meta.url), lines.join("\n"), "utf8");
console.log(`seed.sql: ${lines.length} líneas`);
