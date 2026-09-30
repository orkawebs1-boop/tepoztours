"use client";

import { useState } from "react";
import { fmt, type Dictionary } from "@/lib/i18n";
import type { TourView } from "@/lib/site";
import { CATEGORIES, type Category } from "@/lib/types";
import { TourCard } from "./TourCard";
import s from "./ToursSection.module.css";
import { ed } from "@/lib/edit";

type Filter = "all" | Category;

export function ToursSection({ tours, dict }: { tours: TourView[]; dict: Dictionary }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [all, setAll] = useState(false);
  const shown = filter === "all" ? tours : tours.filter((x) => x.category === filter);
  const chips: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: dict.tours.all, count: tours.length },
    ...CATEGORIES.map((c) => ({ id: c, label: dict.category[c], count: tours.filter((x) => x.category === c).length })),
  ];
  const labels = {
    from: dict.common.from,
    perPerson: dict.common.perPerson,
    viewDetails: dict.common.viewDetails,
    book: dict.common.book,
    photo: dict.common.photo,
  };

  return (
    <section id="tours" className={`tt-section ${s.section}`}>
      <div className="tt-wrap">
        <div className={s.head}>
          <div className={s.headMain}>
            <div className="tt-eyebrow">{fmt(dict.tours.eyebrow, { n: tours.length })}</div>
            <h2 className={`tt-d ${s.title}`} {...ed("text:tours.title")}>
              {dict.tours.title}
            </h2>
          </div>
          <p className={s.intro} {...ed("text:tours.intro")}>
            {dict.tours.intro}
          </p>
        </div>

        <div role="group" aria-label={dict.tours.filter} className={s.chips}>
          {chips.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`${s.chip} ${filter === c.id ? s.isOn : ""}`}
              aria-pressed={filter === c.id}
              onClick={() => {
                setFilter(c.id);
                setAll(false);
              }}
            >
              {c.label}
              <span className={s.chipN}>{c.count}</span>
            </button>
          ))}
        </div>

        <div key={filter} className={`${s.grid} ${all ? "" : s.limited}`}>
          {shown.map((tour, i) => (
            <TourCard key={tour.id} tour={tour} labels={labels} style={{ animationDelay: `${Math.min(i, 7) * 0.04}s` }} />
          ))}
          {shown.length === 0 && <p className={s.empty}>{dict.tours.empty}</p>}
        </div>

        {!all && shown.length > 3 && (
          <button type="button" className={`tt-btn tt-btn-ghost ${s.more}`} onClick={() => setAll(true)}>
            {fmt(dict.tours.showAll, { n: shown.length })}
          </button>
        )}
      </div>
    </section>
  );
}
