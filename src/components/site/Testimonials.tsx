import type { Dictionary } from "@/lib/i18n";
import type { HomeData } from "@/lib/site";
import { Star } from "../icons";
import s from "./Testimonials.module.css";
import { ed } from "@/lib/edit";

export function Testimonials({ dict, items }: { dict: Dictionary; items: HomeData["testimonials"] }) {
  if (!items.length) return null;
  return (
    <section id="testimonios" className={`tt-section ${s.section}`}>
      <div className={`tt-wrap ${s.inner}`}>
        <div className="tt-eyebrow">{dict.reviews.eyebrow}</div>
        <h2 className={`tt-d ${s.title}`} {...ed("text:reviews.title")}>
          {dict.reviews.title}
        </h2>
        <div className={s.grid}>
          {items.map((r) => (
            <figure key={r.id} className={s.card}>
              <div className={s.stars} role="img" aria-label={dict.reviews.stars}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className={s.star} />
                ))}
              </div>
              <blockquote className={s.quote} {...ed(`rev:${r.id}`)}>
                “{r.quote}”
              </blockquote>
              <figcaption className={s.cap}>
                <span className={s.avatar} style={{ backgroundColor: r.tone }} aria-hidden="true">
                  {r.name ? r.name.trim().charAt(0).toUpperCase() : ""}
                </span>
                <span className={s.who}>
                  <strong>{r.name || dict.reviews.customer}</strong>
                  <span>{r.tour}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
